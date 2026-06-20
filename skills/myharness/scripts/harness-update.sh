#!/usr/bin/env bash
# 빌드된 하네스(생성 산출물)를 팩토리 정본으로 동기화 — 사용자 수정 보존(해시 감지 + propose).
# 관리 대상 v1(생성 하네스에 실제 번들되는 것만): references/dev-rules.md · references/tdd-doctrine.md
#   · scripts/check-review-tools.sh · scripts/build-scorecard.sh
#   (run-policy-audit.sh·harness-update.sh는 팩토리 전용 — 생성 하네스 비번들 → 관리 제외.)
#   (에이전트/스킬 본문은 사용자 소유 — 주입 1줄만 절차로 갱신. external-review-loop 스킬은 재생성 경로.)
#   사용자 추가 정책은 *.local.* 파일로 분리 권장 — 관리 대상에서 제외(절대 안 건드림).
#
# 분류(생성 당시 sha = manifest 기준):
#   SAME          현재 == 정본            → 갱신 불필요
#   UPDATABLE     현재 == manifest != 정본 → 사용자 미수정 + 정본 변경 → 자동 갱신 안전
#   USER-MODIFIED 현재 != manifest         → 사용자 수정함 → diff 제시, 승인 필요(자동 X)
#   UNKNOWN       manifest 없음            → 기준선 없음 → diff 제시, 승인 필요(보수)
#   NEW           정본에 있으나 타겟에 없음 → 신규 교리 → 추가 대상
#
# 사용:
#   harness-update.sh manifest <skill_dir> <factory_dir>   # 생성 시: 관리파일 sha 기록(.harness-manifest.json)
#   harness-update.sh plan     <skill_dir> <factory_dir>   # propose: 파일별 분류 + diff (변경 없음)
#   harness-update.sh apply    <skill_dir> <factory_dir> [--approve rel1,rel2]
#       UPDATABLE/NEW=자동 적용 / USER-MODIFIED·UNKNOWN=--approve 든 것만 적용 / 적용 후 manifest 갱신
#   skill_dir   = 생성된 하네스의 스킬 루트(예: <타겟>/.claude/skills/<harness>)
#   factory_dir = 팩토리 정본 루트(예: skills/myharness 또는 설치된 플러그인 경로)
# 종료코드: 0=정상(plan은 변경유무와 무관 0). 인자/경로 오류=2.
set -uo pipefail

CMD="${1:-}"; SKILL_DIR="${2:-}"; FACTORY="${3:-}"
[ -n "$CMD" ] && [ -n "$SKILL_DIR" ] && [ -n "$FACTORY" ] || {
  echo "사용: harness-update.sh <manifest|plan|apply> <skill_dir> <factory_dir> [--approve a,b]" >&2; exit 2; }
[ -d "$SKILL_DIR" ] || { echo "오류: skill_dir 없음 — $SKILL_DIR" >&2; exit 2; }
[ -d "$FACTORY" ]   || { echo "오류: factory_dir 없음 — $FACTORY" >&2; exit 2; }
MANIFEST="$SKILL_DIR/.harness-manifest.json"

sha() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | cut -d' ' -f1
        else shasum -a 256 "$1" | cut -d' ' -f1; fi; }

# 관리 대상 화이트리스트(상대경로) — 생성 하네스에 번들되는 것만.
MANAGED_RELS="references/dev-rules.md references/tdd-doctrine.md scripts/check-review-tools.sh scripts/build-scorecard.sh"

# 관리 파일 상대경로 열거(skill_dir에 존재하는 것). .local.* 제외.
list_managed() {
  local d="$1" rel
  for rel in $MANAGED_RELS; do
    [ -f "$d/$rel" ] || continue
    case "$rel" in *.local.*) continue ;; esac
    printf '%s\n' "$rel"
  done
}
# 정본에만 있고 타겟에 없는 관리 파일(NEW 후보) 상대경로.
list_factory_new() {
  local rel
  for rel in $MANAGED_RELS; do
    [ -f "$FACTORY/$rel" ] || continue
    [ -f "$SKILL_DIR/$rel" ] || printf '%s\n' "$rel"
  done
}
# manifest에서 rel의 기록 sha 조회(jq 필요). 없으면 빈 문자열.
manifest_sha() {
  local rel="$1"
  [ -f "$MANIFEST" ] || { echo ""; return; }
  command -v jq >/dev/null 2>&1 || { echo ""; return; }
  jq -r --arg k "$rel" '.files[$k] // ""' "$MANIFEST" 2>/dev/null || echo ""
}
# rel의 분류 출력(stdout 한 단어).
classify() {
  local rel="$1" now fac base
  [ -f "$SKILL_DIR/$rel" ] || { echo "NEW"; return; }
  [ -f "$FACTORY/$rel" ]   || { echo "FACTORY-MISSING"; return; }
  now="$(sha "$SKILL_DIR/$rel")"; fac="$(sha "$FACTORY/$rel")"; base="$(manifest_sha "$rel")"
  if [ "$now" = "$fac" ]; then echo "SAME"
  elif [ -z "$base" ]; then echo "UNKNOWN"
  elif [ "$now" = "$base" ]; then echo "UPDATABLE"
  else echo "USER-MODIFIED"; fi
}

case "$CMD" in
  manifest)
    if ! command -v jq >/dev/null 2>&1; then
      echo "오류: manifest 생성엔 jq 필요(미설치)." >&2; exit 2; fi
    fac_ver="$(jq -r '.version // "unknown"' "$FACTORY/../../.claude-plugin/plugin.json" 2>/dev/null || echo unknown)"
    tmp="$(mktemp)"; printf '{"schema_version":"1","factory_version":"%s","files":{' "$fac_ver" > "$tmp"
    first=1
    while IFS= read -r rel; do
      [ -n "$rel" ] || continue
      [ $first -eq 1 ] && first=0 || printf ',' >> "$tmp"
      printf '"%s":"%s"' "$rel" "$(sha "$SKILL_DIR/$rel")" >> "$tmp"
    done < <(list_managed "$SKILL_DIR")
    printf '}}\n' >> "$tmp"
    if command -v jq >/dev/null 2>&1; then jq . "$tmp" > "$MANIFEST" 2>/dev/null || mv "$tmp" "$MANIFEST"; else mv "$tmp" "$MANIFEST"; fi
    rm -f "$tmp"
    echo "manifest → $MANIFEST ($(list_managed "$SKILL_DIR" | grep -c . ) 파일)"
    ;;

  plan)
    [ -f "$MANIFEST" ] || echo "주의: manifest 없음 → 모든 변경 파일을 USER-MODIFIED/UNKNOWN(보수)로 취급, 승인 필요." >&2
    command -v jq >/dev/null 2>&1 || echo "주의: jq 없음 → 사용자 수정 판정 불가 → 보수 모드(승인 필요)." >&2
    n_same=0 n_auto=0 n_ask=0
    { list_managed "$SKILL_DIR"; list_factory_new; } | sort -u | while IFS= read -r rel; do
      [ -n "$rel" ] || continue
      st="$(classify "$rel")"
      case "$st" in
        SAME)           echo "  [SAME]          $rel" ;;
        UPDATABLE|NEW)  echo "  [$st] $rel  → 자동 적용 가능"
                        if [ -f "$SKILL_DIR/$rel" ] && [ -f "$FACTORY/$rel" ]; then
                          diff -u "$SKILL_DIR/$rel" "$FACTORY/$rel" 2>/dev/null | sed -n '1,12p' | sed 's/^/      /'
                        fi ;;
        USER-MODIFIED|UNKNOWN)
                        echo "  [$st] $rel  → 승인 필요(--approve $rel)"
                        diff -u "$SKILL_DIR/$rel" "$FACTORY/$rel" 2>/dev/null | sed -n '1,20p' | sed 's/^/      /' ;;
        FACTORY-MISSING) echo "  [FACTORY-MISSING] $rel  (정본에 없음 — 사용자 전용/구파일)" ;;
      esac
    done
    echo "── plan 끝. 적용: harness-update.sh apply $SKILL_DIR $FACTORY [--approve <USER-MODIFIED 목록>]"
    ;;

  apply)
    approve=""
    if [ "${4:-}" = "--approve" ]; then approve=",${5:-},"; fi
    applied=0; skipped=0
    { list_managed "$SKILL_DIR"; list_factory_new; } | sort -u | while IFS= read -r rel; do
      [ -n "$rel" ] || continue
      st="$(classify "$rel")"
      case "$st" in
        SAME|FACTORY-MISSING) : ;;
        UPDATABLE|NEW)
          mkdir -p "$(dirname "$SKILL_DIR/$rel")"; cp "$FACTORY/$rel" "$SKILL_DIR/$rel"
          echo "  적용(자동) [$st] $rel" ;;
        USER-MODIFIED|UNKNOWN)
          if [ -n "$approve" ] && case "$approve" in *",$rel,"*) true;; *) false;; esac; then
            cp "$FACTORY/$rel" "$SKILL_DIR/$rel"; echo "  적용(승인) [$st] $rel"
          else
            echo "  보류 [$st] $rel  (승인 안 됨 — 사용자 수정 보존)"
          fi ;;
      esac
    done
    # manifest 재생성(새 기준선) — jq 있을 때만.
    if command -v jq >/dev/null 2>&1; then
      "$0" manifest "$SKILL_DIR" "$FACTORY" >/dev/null 2>&1 && echo "  manifest 갱신됨"
    else
      echo "  주의: jq 없음 → manifest 미갱신(다음 plan이 보수 모드)." >&2
    fi
    ;;

  *) echo "오류: 알 수 없는 명령 '$CMD' (manifest|plan|apply)" >&2; exit 2 ;;
esac
exit 0
