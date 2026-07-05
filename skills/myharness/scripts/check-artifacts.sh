#!/usr/bin/env bash
# 영속 산출물 기록 검증 — 결과서가 docs/{project}/working_history/ 에 실제로 남았는지 확인한다.
# 버그: 영속물(결과서)이 gitignored _workspace 에 방치되어 cleanup/재실행 시 소멸·감사 이력 0.
# 강제: 단계 마감 게이트(권장: git pre-commit hook)에서 호출 — missing 이면 커밋 차단(런타임 강제).
#   프롬프트/체크리스트 강제는 오케스트레이터가 스킵·할루시할 수 있어 무력(외부감사). hook 이 물리 차단.
# 티어: T0/Tμ = 문서 불요(PASS). T1/T2 = 결과서 1장 + `## 다음 단계 참조` 블록 필수.
# 사용: bash check-artifacts.sh <docs_dir> [tier]    # tier ∈ t0|tmu|t1|t2 (기본 t1)
# 출력 끝줄:  ARTIFACTS: ok | missing:<사유>   (항상 exit 0 — 상태는 끝줄로만, 파이프라인 중단 방지)
# 종료코드: 항상 0. hook 은 끝줄 ARTIFACTS: 를 파싱해 차단 여부 결정(set -e 파이프 안전).
set -uo pipefail

docs_dir="${1:-}"
tier="${2:-t1}"

if [ -z "$docs_dir" ]; then
  echo "usage: check-artifacts.sh <docs_dir> [t0|tmu|t1|t2]" >&2
  echo "ARTIFACTS: missing:no-docs-dir-arg"
  exit 0
fi

# T0/Tμ = 영속 결과서 불요(slim — trivial/마이크로 작업엔 마찰 0).
case "$tier" in
  t0|T0|tmu|Tmu|tμ)
    echo "ARTIFACTS: ok"   # tier=$tier → 문서 불요
    exit 0 ;;
esac

wh="$docs_dir/working_history"

# 1) working_history 디렉토리 + 결과서(.md) 최소 1개 존재?
if [ ! -d "$wh" ]; then
  echo "ARTIFACTS: missing:no-working_history-dir($wh)"
  exit 0
fi
# 최신 결과서(파일명 시각순 마지막). 숨김/템플릿 제외.
latest="$(ls -1 "$wh"/*.md 2>/dev/null | grep -viE '/(_|template)' | sort | tail -1)"
if [ -z "$latest" ]; then
  echo "ARTIFACTS: missing:no-result-doc-in($wh)"
  exit 0
fi

# 2) 누탐 방지 — 빈/스텁 파일 false-pass 차단: 최소 크기 + `## 다음 단계 참조` 블록 필수(RAG 진입점).
bytes="$(wc -c < "$latest" 2>/dev/null | tr -d ' ')"
if [ "${bytes:-0}" -lt 200 ]; then
  echo "ARTIFACTS: missing:result-doc-too-small(${bytes}b:$latest)"
  exit 0
fi
if ! grep -q '^## 다음 단계 참조' "$latest" 2>/dev/null; then
  echo "ARTIFACTS: missing:no-next-step-block($latest)"
  exit 0
fi

# 3) (선택) _workspace 에 영속 클래스(design/plans)가 있는데 working_history 최신보다 새로우면 경고.
#    휘발(reviews/status)은 무시. 경고는 차단 아님(끝줄은 ok 유지, stderr 안내만).
proj_root="$(dirname "$docs_dir")"
ws="$proj_root/_workspace"
for sub in design plans plan; do
  if [ -d "$ws/$sub" ] && [ -n "$(ls -1 "$ws/$sub"/*.md 2>/dev/null | head -1)" ]; then
    echo "WARN: 영속 클래스 산출물이 _workspace/$sub 에 있음 — docs/ 승격 검토(휘발 소멸 위험)." >&2
  fi
done

echo "ARTIFACTS: ok"
exit 0
