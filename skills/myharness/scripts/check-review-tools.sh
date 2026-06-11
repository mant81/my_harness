#!/usr/bin/env bash
# 외부 리뷰 도구(codex·gemini CLI) 연동 점검.
# 용도: 하네스 생성 시 external-review-loop 스킬을 만들지 결정 + 생성 스킬의 런타임 폴백.
# 사용: bash check-review-tools.sh
# 출력 끝줄: AVAILABLE: <codex|gemini 공백구분 | none>
# 종료코드: 0 = 1개 이상 사용가능, 1 = 전무.
set -uo pipefail

avail=()
for t in codex gemini; do
  if command -v "$t" >/dev/null 2>&1; then
    echo "$t: ✓ 연동됨 ($(command -v "$t"))"
    avail+=("$t")
  else
    echo "$t: ✗ 미설치"
  fi
done

# 상태는 끝줄 AVAILABLE로만 전달한다. 항상 exit 0 — set -e/자동화 파이프라인이
# 출력 파싱 전에 중단되는 것을 막기 위함(none도 정상 신호).
if [ "${#avail[@]}" -eq 0 ]; then
  echo "AVAILABLE: none"
else
  echo "AVAILABLE: ${avail[*]}"
fi
exit 0
