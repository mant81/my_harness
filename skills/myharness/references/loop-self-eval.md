# 루프 자체 평가 (Loop Self-Evaluation) — scorecard & 단계적 도입

루프(external-review-loop 등)가 자기 실행을 측정해 흐름 개선으로 환류하는 닫힌 고리. **외부 리뷰(codex/gemini) 검증을 거쳐 교정된 정본** — 순진한 precision·자동 적용·grading.json 재사용을 모두 제거했다.

## 핵심 경계 (먼저 읽을 것)
- **자기채점 ≠ 품질.** 오케스트레이터가 자기 판정으로 산출한 지표는 "정밀도"가 아니라 *자기와의 정합도*다. 그래서 precision이 아니라 **`alignment_score`**로 부른다. 리뷰어가 아무것도 안 내도 alignment는 좋아 보인다 — **놓친 결함(recall/miss)은 Ground Truth로만** 측정한다(아래).
- **측정과 자동화를 분리한다.** 측정은 안전, 자동 흐름 변경은 고위험(Goodhart·플래핑). **단계적 도입**으로 측정부터.

## 단계적 도입 (한 번에 다 넣지 말 것)
| 단계 | 내용 | 자동화 |
|------|------|--------|
| **1 (현재 정본)** | `loop_scorecard.json` 로깅만. 측정·기록. | 없음 |
| 2 | 누적 scorecard 요약을 사람이 수동 검토 | 없음 |
| 3 | 수치 트리거가 **개선안 "제안"**만 emit (적용 X) | 제안만 + 승인 게이트 |
| 4 | 충분 데이터 + holdout 검증 후 자동 흐름 개선 | 최후, 승인 필수 |

> 3·4단계는 롤링윈도우(최근 N회)·3회 연속 하락·`min_adjudicated_claims ≥ 20` 충족 시에만. 단일 실행 노이즈로 프롬프트/게이트를 바꾸지 않는다(플래핑 방지).

## loop_scorecard.json 스키마 (신규 — grading.json 재사용 아님)
실행 단위 디렉터리에 발행: `_workspace/evals/{loop}/{stage_id}/{run_id}/scorecard.json`.
```json
{
  "schema_version": "1",
  "loop": "external-review",
  "stage_id": "design-auth",
  "run_id": "20260612_1530",
  "rounds": 3,
  "termination_reason": "converged-good | exhausted | max-rounds | failed-quality-gate",
  "verdict_counts": { "confirmed": 6, "partial": 2, "deferred": 1, "rejected": 1, "duplicate": 1 },
  "new_per_round": [10, 1, 0],
  "alignment_score": 0.67,        // (confirmed + 0.5*partial) / adjudicated_non_deferred. deferred 분모 제외
  "rejected_rate": 0.11,          // rejected / adjudicated_new_claims (1-alignment 아님, 별도)
  "deferred_rate": 0.10,
  "duplicate_rate": 0.09,
  "rounds_normalized": 0.6,       // rounds / f(diff_lines, risk_level) — 난이도 보정
  "diff_lines": 120, "risk_level": "standard",
  "cost_per_run_tokens": 48000,
  "cost_per_confirmed": 8000,     // confirmed>0일 때만. 0이면 null
  "quality_label": "gate_pass | failed-quality-gate | n/a(design)",
  "missed_defect_rate": null,     // Ground Truth 있을 때만 채움(아래)
  "overturned_rejection_rate": null,
  "links": { "grading": "../grading.json", "timing": "../timing.json", "verdicts": "../../{stage_id}_verdicts.json" }
}
```
- **Lean:** 원본 JSON을 세션에 상시 로드하지 않는다. 파일로만 보존, **Phase 시작 시 요약본만** 읽는다.
- `grading.json`/`timing.json`은 assertion·토큰 정보가 있을 때 **링크**로 연결(중복 보관 금지).

## 메트릭 정의 (교정본)
- **alignment_score** = (confirmed + 0.5·partial) / (adjudicated 중 deferred 제외). 이름 그대로 "리뷰 보고 ↔ 오케스트레이터 판정" 정합도. **리뷰어 건강·정밀도라고 부르지 않는다.**
- **rejected_rate / deferred_rate / duplicate_rate** — 각각 별도. `false_positive_rate`는 *사후 확정 가능*할 때만(기각이 나중에 진짜 결함으로 판명) `overturned_rejection_rate`로 기록.
- **rounds_to_converge** 원시값은 K·MAX_ROUNDS·변경 규모에 좌우 → `diff_lines`·`risk_level`로 정규화한 `rounds_normalized`를 1차 지표로, 원시값은 보조.
- **cost_per_confirmed** confirmed=0이면 분모 0 → `null`. 항상 `cost_per_run`·`cost_per_adjudicated_claim`과 함께 본다.
- **missed_defect_rate (recall)** — 자기채점으로 불가. **Ground Truth가 있을 때만**: seeded(주입) 결함 탐지율, 사후 발견된 회귀의 원인 역추적, 사용자 반박. 없으면 비워두고 "보고 품질"로만 명명(리뷰어 누락은 측정 안 됨).

## 종료 사유 라벨 (P2 — 종료조건 아님, 라벨)
gate/assertion은 **코드/테스트 단계 전용**. 설계·문서 리뷰엔 측정값이 없으므로 종료조건에 넣지 않는다.
- `converged-good`: 신규 확인 0건 K회 + (코드 단계) 게이트 PASS·assertion ≥ θ.
- `exhausted`: 신규 0건이나 품질 신호 부재/미달(소진).
- `max-rounds`: MAX_ROUNDS 강제 종료(미수렴 보고).
- `failed-quality-gate`: 품질 θ 미달이 명백 → **루프 중단**(MAX_ROUNDS 헛돌지 않게, 비용 폭증 방지).
- **설계/문서 단계:** 게이트 대신 `verdicts.json` 완료 + 정본 대조 체크리스트로 종료 판정.

## 판정 보정 (P5 — Ground Truth만)
같은 오케스트레이터·같은 근거수집으로 재점검하면 편향 반복(에코체임버). 보정은 **독립 신호가 있을 때만** 발화: 사용자 반박 / 후속 결함 발견 / 독립 리뷰어 표본 감사. 결과는 `overturned_rejection_rate`로 기록하고, 임계 초과 시 기각 사유표·리뷰어 신뢰도를 *제안* 형태로 조정(자동 적용 금지).

## 환류(P3/P4) 안전장치 — 3·4단계에서만
- 자동 **"적용" 금지 → "제안"**만. 적용 전 사용자 또는 독립 검토 게이트.
- 롤링윈도우(최근 N회 평균)·3회 연속 하락만 발화(단일 노이즈 무시).
- `min_adjudicated_claims ≥ 20` 전에는 트리거 금지(표본 부족).
- 변경 후 holdout 시나리오·기존 회귀 케이스로 검증.
- θ·ε·N은 리스크 등급별 기본값 + 관찰 전용 시작(고정 자동화 금지).

> 테스트 개선 루프 수렴(assertion 통과율 델타 < ε)은 목적이 달라 분리한다 — `skill-testing-guide.md`에서 다루고, scorecard 링크 규약만 공유.
