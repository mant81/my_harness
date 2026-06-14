#!/usr/bin/env bash
# 외부 리뷰 도구(codex CLI · agy[antigravity] CLI) 연동 점검.
# agy는 Gemini 모델을 제공한다(gemini CLI 후속 — gemini는 legacy 폴백).
# 용도: 하네스 생성 시 external-review-loop 스킬을 만들지 결정 + 생성 스킬의 런타임 폴백.
# 사용: bash check-review-tools.sh
# 출력 끝줄: AVAILABLE: <codex|agy|gemini 공백구분 | none>
# 종료코드: 항상 0 (none도 정상 신호). 도구 유무는 끝줄 AVAILABLE만 신뢰할 것
#   — set -e/자동화 파이프라인이 파싱 전 중단되는 것을 막기 위함.
set -uo pipefail

avail=()
# codex = 일반/정합성 리뷰어. agy = 성능/안정성 리뷰어(Gemini 모델). gemini = agy 없을 때 legacy.
for t in codex agy gemini; do
  if command -v "$t" >/dev/null 2>&1; then
    echo "$t: ✓ 연동됨 ($(command -v "$t"))"
    avail+=("$t")
  else
    echo "$t: ✗ 미설치"
  fi
done

# 권고: agy가 있으면 Gemini 리뷰는 agy로(gemini는 deprecated). 둘 다 있으면 agy 우선.
printf '%s\n' "${avail[@]}" | grep -q '^agy$' && printf '%s\n' "${avail[@]}" | grep -q '^gemini$' && echo "note: agy·gemini 공존 → agy 우선(gemini legacy)"

# 상태는 끝줄 AVAILABLE로만 전달한다. 항상 exit 0.
if [ "${#avail[@]}" -eq 0 ]; then
  echo "AVAILABLE: none"
else
  echo "AVAILABLE: ${avail[*]}"
fi
exit 0
