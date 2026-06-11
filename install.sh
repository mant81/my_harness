#!/usr/bin/env bash
# 하네스 팩토리 듀얼 런타임 설치 — Claude Code + Codex.
# 정본은 skills/myharness/ 한 곳. 런타임별 진입점만 연결한다.
# 사용: bash install.sh
set -euo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || dirname "$0")"

echo "== 하네스 팩토리 듀얼 런타임 설치 =="

REPO="$(pwd)"
# --- Codex: 사용자 글로벌 스킬 dir에 심링크 (가장 안정적 — trust 불필요) ---
# Codex는 ~/.codex/skills/{name}/SKILL.md 를 description 기반으로 활성화한다.
# 호출: $myharness 또는 /skills 메뉴. (/myharness 슬래시 명령은 미지원)
CODEX_SKILLS="$HOME/.codex/skills"
mkdir -p "$CODEX_SKILLS"
if [ -e "$CODEX_SKILLS/myharness" ] && [ ! -L "$CODEX_SKILLS/myharness" ]; then
  mv "$CODEX_SKILLS/myharness" "$CODEX_SKILLS/myharness.bak.$(git rev-parse --short HEAD 2>/dev/null || echo old)"
  echo "Codex: 기존 구버전 myharness → myharness.bak.* 백업"
fi
ln -sfn "$REPO/skills/myharness" "$CODEX_SKILLS/myharness"
echo "Codex: ~/.codex/skills/myharness → $REPO/skills/myharness 심링크 (최신 반영)"

# repo .agents/skills (trusted 프로젝트에서 codex가 추가로 스캔)
mkdir -p .agents/skills
ln -sfn ../../skills/myharness .agents/skills/myharness
echo "Codex: .agents/skills/myharness 심링크 (trusted 프로젝트용)"
[ -f AGENTS.md ] && echo "Codex: AGENTS.md 존재 ✓ (codex 자동 로드)" || echo "Codex: ⚠ AGENTS.md 없음"

# --- 외부 리뷰 도구 점검 ---
echo "-- 외부 리뷰 도구(codex/gemini) 점검 --"
bash skills/myharness/scripts/check-review-tools.sh || echo "  (도구 전무 → external-review-loop 게이트는 생략됨)"

# --- Claude Code 안내 (수동) ---
cat <<'EOF'

== Claude Code 설치 (수동) ==
이 레포는 .claude-plugin/plugin.json 플러그인이다. Claude Code에서:
  /plugin  으로 추가하거나, marketplace.json을 마켓에 등록.
  skills/ 는 자동 발견된다.

설치 완료.
- Claude Code: 자동 (plugin)
- Codex: ~/.codex/skills/myharness (최신 심링크)
  호출법 → `$myharness` 또는 `/skills` 메뉴 또는 "하네스 만들어줘" (※ `/myharness` 슬래시 명령은 미지원)
EOF
