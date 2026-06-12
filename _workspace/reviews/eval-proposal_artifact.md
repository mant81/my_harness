# 제안: external-review-loop 자체 평가 닫힌 고리 (리뷰 대상)

대상 컨텍스트: 이 레포 `skills/myharness/` 하네스 팩토리. external-review-loop는 라운드 반복 루프(loop-until-dry + MAX_ROUNDS + verdicts 원장 + 수정본 재리뷰)로 이미 구현됨. 아래는 그 위에 "자체 평가→흐름 개선" 닫힌 고리를 추가하려는 제안.

## 갭
1. [critical] 루프 자체 평가 부재 — 수렴만 하고 자기 성과(리뷰어 정밀도=확인/(확인+기각)·수렴 라운드수·확인당 비용·오탐률·라운드별 신규 곡선) 미측정. 리뷰 프롬프트/도구 품질·루프 건강 모름.
2. [high] 수렴 ≠ 품질 — loop-until-dry "신규 0건"은 부재 신호. 리뷰어 소진인지 실품질 상승인지 구분 못 함. 종료에 양의 품질 신호(게이트 PASS + assertion 통과율 ≥ θ) 필요. converged-good/exhausted/max-rounds 라벨.
3. [high] 평가 결과 미영속·미추세 — eval 스키마(eval_metadata/grading/timing)는 있으나 루프에 미배선. 매 실행 고립 → 추세·회귀 감지 불가.
4. [high] 평가→흐름 자동 환류 부재 — Phase 7-4 트리거가 관찰적. 수치 임계 자동 발화 없음. 추세 데이터 소스 없음.
5. [med] 판정 보정 없음 — 확인/기각 사후 검증 없음 → 기각 사유표·리뷰어 신뢰도 미교정.
6. [med] 테스트 루프 수렴 지표 모호 — "의미 있는 개선 없을 때까지" → assertion 통과율 델타 < ε 수치화 + scorecard 연동.

## 핵심 제안
- P1. 루프 self-eval scorecard — 각 루프가 `_workspace/eval/{loop}_{단계ID}.json` 발행. external-review: rounds_to_converge·reviewer_precision·confirmed/partial/deferred/rejected·new_per_round·cost_tokens·gate_pass·false_positive_rate. build/test: assertion_pass_rate·with/without_delta·regression_flags. (grading.json 재사용)
- P2. 수렴 품질 신호 — 종료 = (신규 확인 0건 K회) AND (게이트 PASS + assertion 통과율 ≥ θ). 종료사유 라벨.
- P3. 자체 평가 스텝 → 흐름 제안 — 루프 끝 scorecard 점수화 → 롤링 베이스라인 대비 → 악화 시 흐름 개선안 자동 emit(프롬프트 튜닝/게이트 강도/QA 체크 추가/에이전트 분리).
- P4. Phase 7-4 수치 트리거 — 누적 scorecard로 reviewer_precision<θ, rounds 상승, 동일 경계 N회 실패, 확인당 비용 상승 시 진화 발화.
- P5. 판정 보정 — 사후 기각/이월 표본 재점검 → 틀린 기각이면 사유표·신뢰도 교정.
- P6. 테스트 루프 수렴 수치화 — assertion 통과율 델타 < ε 종료 + scorecard.
