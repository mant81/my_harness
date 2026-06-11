# 외부 리뷰 루프 (External Review Loop) — 방법론 & 생성 템플릿

이 파일은 두 역할을 한다:
1. **방법론 정본** — 단계 산출물 마감 게이트(외부 독립 AI 리뷰)의 표준 절차.
2. **생성 템플릿** — 코드/설계 도메인 하네스를 만들 때, 이 내용을 타겟 프로젝트의 `.claude/skills/external-review-loop/SKILL.md`로 생성한다(아래 frontmatter 포함). **단, 생성 전 `check-review-tools.sh`로 codex/gemini 연동을 확인**하고, 둘 다 미설치면 스킬을 만들지 않는다(Phase 4-6). 생성 시 `check-review-tools.sh`를 스킬의 `scripts/`로 함께 번들한다.

**왜 외부 리뷰인가**: 내부 생성-검증/QA는 같은 세션·같은 컨텍스트라 *동일한 맹점*을 공유한다. 외부 독립 AI(codex/gemini)는 다른 관점으로 결함을 잡는다. 단, **합의=정답이 아니다** — 두 AI가 같은 답을 내도 공유 학습데이터로 인한 상관 오류일 수 있다. 합의는 약한 증거이며, **판정 권위는 오케스트레이터(실코드/실문서 대조)에 있다. 위임 금지.**

## 생성 시 frontmatter
```yaml
---
name: external-review-loop
description: 작업 단계 산출물(설계서·코드·문서)마다 외부 독립 AI(codex/gemini)에 리뷰 요청 → 오케스트레이터가 실코드 대조 전건 판정(확인/부분/이월/기각) → 확인분만 TDD 수정·커밋하는 단계 마감 게이트. "외부 리뷰", "codex/gemini 리뷰", "리뷰 게이트", "설계서/코드 리뷰해서 검증·수정", "이슈 검증하고 수정" 요청 시 반드시 사용. 사용자 수동 이슈 제출에도 Step4~7 적용. 내부 QA와 별개의 독립 관점 게이트.
---
```

## 입력 (플레이스홀더)
- `{산출물}`: 리뷰 대상 — 설계서/코드 디렉토리/문서
- `{단계ID}`: 임의 단계 식별자 (예: `design-auth`, `feat-login`)
- `{커밋id}`: 해당 시 `git rev-parse HEAD`, 아니면 생략
- `{게이트명령}`: 프로젝트 테스트/린트 게이트 (예: `npm test && tsc --noEmit` / 없으면 생략)

## Step 1 — 리뷰 요청 프롬프트
2종 분담: **codex = 일반/정합성**, **gemini = 성능·안정성**. 산출물 유형에 맞게 "소스코드"→"설계서/문서" 치환.
```text
리뷰 대상 : {산출물}
관련 commit id : {커밋id}   # 없으면 생략
위 산출물과 관련 자료를 리뷰·검토하여 발생 가능한 이슈를 모두 찾아 보고해줘.
<이슈 작성 방법>
1. [{이슈레벨}] {타이틀}
- 현황: {상황}  - 이슈: {상세}  - 권고: {대응방안}
</이슈 작성 방법>
```
gemini는 동일 틀 + "성능/속도·안정성 중심으로" 추가.

## Step 2 — 병렬 비대화 실행
먼저 `bash scripts/check-review-tools.sh`로 사용가능 도구 재확인(끝줄 `AVAILABLE:`). 사용가능 도구만 실행한다. 루트에서 백그라운드 병렬·읽기전용. 프롬프트·출력 모두 `_workspace/reviews/`에 보존(감사 — /tmp 금지).
```bash
mkdir -p _workspace/reviews
# 주의: codex exec는 stdin 열려 있으면 무한 대기 → 반드시 < /dev/null
# 타임아웃 필수(timeout 600s) — 무한 대기·좀비 프로세스 방지. exit 124 = 타임아웃.
timeout 600s codex exec --sandbox read-only "$(cat _workspace/reviews/{단계ID}_prompt_general.md)" < /dev/null \
  > _workspace/reviews/{단계ID}_codex.md 2>&1 &
# gemini는 자체 sandbox 옵션이 없다(읽기전용 보장 불가). 프롬프트로만 "읽기 전용 리뷰"를 제약하고,
# 쓰기 위험이 우려되면 read-only 권한 셸/복제본에서 실행할 것.
timeout 600s gemini -p "$(cat _workspace/reviews/{단계ID}_prompt_perf.md)" < /dev/null \
  > _workspace/reviews/{단계ID}_gemini.md 2>&1 &
wait
```
- Bash `run_in_background` 사용 가능. 타임아웃(exit 124) → 1회 재시도 → 재실패 시 해당 도구 누락 명시 후 단일 출처로 진행(**루프 차단 금지**).
- gemini `-p` 플래그가 없는 버전이면 `cat prompt.md | gemini` 또는 `gemini "$(cat prompt.md)"`로 대체.
- **도구 부재 폴백:** codex/gemini 미설치면 그 사실을 결과서에 명시하고 내부 QA만으로 진행.

## Step 3 — 이슈 통합
두 출력에서 이슈 추출 → 중복 병합(동일 대상·동일 결함=1건, 출처 병기) → 번호 재부여. 0건이면 "외부 리뷰 — 이슈 0건" 기록 후 종료.

## Step 4 — 전건 판정 (오케스트레이터 직접, 위임 금지)
이슈마다 실코드/실문서 대조(grep/Read) 후 판정.

| 판정 | 기준 | 처리 |
|------|------|------|
| **확인** | 결함 재현/실재 | Step 5 수정 |
| **부분 확인** | 지적 실재하나 권고 과잉/계약 위배 | 비파괴 범위만 + 잔여 기각 근거 |
| **이월** | 타당하나 본 단계 범위 외 | 백로그 위치 명기 — 기각과 구분 |
| **기각** | 사유표 | 근거 명시(코드/정본 인용) — 삭제 금지 |

**기각 사유표:** 동결 계약 위배 · 설계 정본 명시 결정 · 기구현 오판(호출 형태만 보고 오판) · YAGNI/과설계 · 리뷰어 자인 비병목 · 기존 설계와 상충(멱등·격리 등).

## Step 5 — 확인분 TDD 수정
`tdd-doctrine.md` 규율(Red→Green→Refactor, 구조/행위 분리). 다중 에이전트 병렬 시 파일권 명시 분리(병렬 충돌 = 1차 실패 주원인). 에이전트는 커밋·브랜치 금지, status는 `_workspace/status/`.

## Step 6 — 통합 게이트
`{게이트명령}` 실행 → PASS. 게이트 없으면(설계서) 정본 정합성 재확인으로 대체. 테스트 리소스 간섭 게이트는 동시 실행 금지.

## Step 7 — 기록·커밋 (커밋 순서·자율 노브)
1. 결과서에 `## 외부 리뷰 반영 ({일자} — {단계ID} {k}건)` § — 판정표·게이트 수치·출처(codex/gemini).
2. 순서: 게이트 PASS → **승인 관문** → 단일 커밋(`fix: 외부 리뷰 {k}건 — {요지}`, Co-Authored-By).
   - 승인 관문 기본: 사용자 대기. `_workspace/.autonomous` 마커(또는 "자율로" 발화) 시 자동 통과.
   - **push는 자율이어도 기본 대기** — `_workspace/.autonomous-push` 마커 시만 자동.
   - 권한모드(bypassPermissions)는 스킬이 못 읽으므로 마커/발화로 명시. 마커 ON이어도 리뷰·판정·게이트는 그대로(인간 승인 한 스텝만 생략).

## 재진입
동일 단계 2차 리뷰(재제출 포함): 기수정 항목은 재작업 금지 — 수정 커밋 코드 인용 + 게이트 재실행으로 "기수정 확인" 응답.

## 테스트 시나리오
- **정상**: 설계서 커밋 → codex 8 + gemini 3 → 중복 1 병합 → 10건 판정(확인6/부분2/이월1/기각1) → TDD 수정 → 게이트 PASS → 기록·커밋
- **에러**: gemini 타임아웃 ×2 → "gemini 미수집" 명시, codex 단독 진행 — 루프 완료
