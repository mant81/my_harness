---
name: external-review-loop
description: 작업 단계(P0-N/P1-N/P2-N/CL-N) 커밋 직후 외부 AI 리뷰어(codex CLI·gemini CLI)에 리뷰를 요청하고, 보고된 이슈를 오케스트레이터가 실코드 대조로 전건 판정(확인/부분/기각)한 뒤 확인분만 TDD 수정·fix 커밋하는 단계 마감 게이트. 단계 커밋 완료 시, "외부 리뷰", "codex/gemini 리뷰", "리뷰 게이트", "이슈 검증하고 수정" 요청 시 반드시 사용. 사용자가 이슈 목록을 직접 제출하는 기존 수동 리뷰 처리에도 동일한 판정·수정 절차(Step 4~7)를 적용할 것.
---

# 외부 리뷰 루프 (External Review Loop)

단계 커밋마다 codex·gemini에게 리뷰를 요청 → 이슈를 **직접 검증** → 확인분만 수정. P0-3~P1-6에서 수동으로 검증된 루프(누적 ~170건 처리)의 자동화 정본.

**왜 직접 검증인가**: 외부 리뷰어는 설계 결정(M1 동결·DEC·SYN)·기수정 이력·실측 수치를 모른다. 보고 이슈의 30~40%는 기각 대상(과거 실적: 확인 60~75%) — 무비판 반영은 계약 파괴·과설계·재작업을 만든다. 판정 권위 = 오케스트레이터(실코드 대조).

## 입력

- `{결과서}`: `docs/1st_project/working_history/P{n}_*.md` (해당 단계)
- `{커밋id}`: 단계 커밋 풀 해시 (`git rev-parse HEAD`)

## Step 1 — 리뷰 요청 프롬프트 구성

2종 분담: **codex = 일반 리뷰**, **gemini = 성능/속도·안정성 리뷰**. 템플릿(원문 고정 — 변형 금지):

```text
# 일반 (codex)
작업결과서 : {결과서 경로}
관련 commit id : {커밋id}
작업 결과와 관련된 소스코드들에 대해 리뷰 및 검토하여 발생 가능한 이슈들을 모두 찾아 보고해줘.
<이슈 및 의견 작성 방법>
1. [{이슈레벨}] {이슈 타이틀}
- 현황: {이슈에 대한 현황/상황 정리}
- 이슈: {이슈의 상세 내용}
- 권고: {이슈를 해결하기 위한 해결 및 대응 방안}
</이슈 및 의견 작성 방법>
```

```text
# 성능/안정성 (gemini)
작업결과서 : {결과서 경로}
관련 commit id : {커밋id}
리팩토링을 위해 성능/속도 및 안정성 중심으로, 작업 결과와 관련된 소스코드들에 대해 리뷰 및 검토하여 발생 가능한 이슈들을 모두 찾아 보고해줘.
<이슈 및 의견 작성 방법>
(동일)
```

## Step 2 — 병렬 비대화 실행

프로젝트 루트에서, 두 CLI를 **백그라운드 병렬**(읽기 전용) 실행. 출력 = `_workspace/reviews/{단계}_{tool}_{일자}.md`:

프롬프트 파일도 `_workspace/reviews/`에 보존(감사 추적 — /tmp 금지):

```bash
mkdir -p _workspace/reviews
# 주의(P2-1 실측): codex exec는 stdin이 열려 있으면
# "Reading additional input from stdin..." 무한 대기 — 반드시 < /dev/null 로 stdin 폐쇄
codex exec --sandbox read-only "$(cat _workspace/reviews/P2-1_prompt_general.md)" < /dev/null \
  > _workspace/reviews/P2-1_codex_$(date +%Y%m%d).md 2>&1 &
gemini -p "$(cat _workspace/reviews/P2-1_prompt_perf.md)" < /dev/null \
  > _workspace/reviews/P2-1_gemini_$(date +%Y%m%d).md 2>&1 &
# gemini 대안(긴 프롬프트 안정 전달): cat prompt.md | gemini -p "위 요청대로 리뷰하고 지정 형식으로 보고하라"
```

- Bash `run_in_background` 사용, timeout 600s. 완료 통보 수신까지 다른 작업 가능.
- 실패/타임아웃 → 1회 재시도 → 재실패 시 해당 도구 누락을 결과서에 명시하고 단일 출처로 진행(루프 차단 금지).

## Step 3 — 이슈 통합

두 출력에서 이슈 추출 → 중복 병합(동일 파일·동일 결함 = 1건, 출처 병기) → 번호 재부여. 이슈 0건이면 결과서에 "외부 리뷰 — 이슈 0건(codex·gemini)" 기록 후 종료.

## Step 4 — 전건 판정 (오케스트레이터 직접 — 위임 금지)

이슈마다 **실코드 대조**(grep/Read) 후 판정. 핵심 grep은 직접, 대량 확인만 에이전트 보조.

| 판정 | 기준 | 처리 |
|------|------|------|
| **확인** | 실코드에서 결함 재현 가능 | Step 5 수정 |
| **부분 확인** | 지적은 실재하나 권고가 과잉/계약 위배 | 비파괴 범위만 수정 + 잔여 기각 근거 |
| **이월(DEFERRED)** | 타당하나 본 단계 범위 외/후순위(2차·P2-6 등) | 백로그 위치 명기(결과서 이월표·main_todolist 리스크) — 기각과 구분 |
| **기각** | 아래 기각 사유표 | 근거 명시(코드 인용·정본 인용) — 삭제 금지 |

**기각 사유표(선례 — 누적 판정 기준)**:
- **M1 동결 위배**: 응답 계약 변경(200→202, 필드 제거, keyset 전환 등) — 동결본 breaking. 2차 백로그로 기록
- **설계 정본 명시 결정**: 계획서 RED 스펙·DEC·SYN에 명시된 의도(예: quote 첫 매치=결정적) — 유지, additive 보강만
- **기구현 오판**: 리뷰어가 호출 형태만 보고 오판(예: 공유 폴링 레지스트리) — 코드 인용으로 반박
- **YAGNI/과설계**: PoC 규모 대비 과잉(파티셔닝·current-state 테이블·chunk fan-out·version 조건부) — 백로그 기록
- **리뷰어 자인 비병목**: 실측 수치 제시된 항목("현재 수준에서는 병목 아님")
- **다중 탭/멱등과 상충**: actor self-skip·세션 단위 ID 등 — 상충 분석 명기

## Step 5 — 확인분 TDD 수정

- BE/FE(필요 시 BE 2분할 — 정합성/성능) 에이전트 병렬, **파일권 명시 분리**(병렬 충돌 = 1차 실패 주원인)
- 에이전트 규율: 건별 RED(결함 재현) → GREEN → `git commit·브랜치 금지` → status 기록(`_workspace/status/`)
- 게이트 불변 조건: 골든 (a) exact·M1 breaking 0·OpenAPI additive만(`gen_api_types.sh` 재생성+typegen drift 0)

## Step 6 — 통합 게이트

- BE `make gates`(풀 pytest·mypy·ruff·diff) — **FE vitest와 동시 실행 금지**(테스트 DB 간섭 선례). 충돌 시 `docker rm -f firstpick-test-pg-*` 후 단독 재실행
- FE `vitest run`+`tsc --noEmit`+`build`

## Step 7 — 기록·커밋·graphify

1. 결과서에 `## N. 외부 리뷰 반영 (일자 — 커밋 {id} 대상 {k}건)` § 추가 — 판정표(확인/부분/기각 + 근거)·게이트 수치·출처(codex/gemini)
2. `[P{n}] fix: 외부 리뷰 {k}건 — {요지}` 단일 커밋(Co-Authored-By 포함)
3. graphify 증분 업데이트(`_workspace/scripts/graphify_update_p1_4.py` 패턴 — 커밋 id 치환 후 실행)
4. 데모 스택 영향 시(BE 변경·마이그레이션) 리빌드+`alembic upgrade head`

## 재진입

- 동일 단계 2차 리뷰(사용자 재제출 포함): 기수정 항목은 재작업 금지 — 수정 커밋 코드 인용+게이트 재실행으로 "기수정 확인" 응답
- 리뷰가 수정 전 코드 기준이면(시점차) 동일 처리

## 테스트 시나리오

- **정상**: P2-1 커밋 → codex 8건+gemini 3건 → 중복 1 병합 → 10건 판정(확인 6/부분 2/기각 2) → BE·FE 병렬 수정 → 게이트 PASS → 결과서 §·fix 커밋·graphify
- **에러**: gemini 타임아웃 ×2 → "gemini 미수집" 명시, codex 단독 진행 — 루프 완료. 다음 단계에서 정상 복귀
- **후속**: 사용자가 동일 목록 재제출 → 기수정 검증(코드 인용+게이트 재실행)만으로 응답
