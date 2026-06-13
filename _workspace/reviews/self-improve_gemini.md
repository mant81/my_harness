[ExtensionManager] Error loading agent from caveman: Failed to load agent from /Users/junghojang/.gemini/extensions/caveman/agents/cavecrew-builder.md: Validation failed: Agent Definition:
tools.0: Invalid tool name
tools.1: Invalid tool name
tools.2: Invalid tool name
tools.3: Invalid tool name
tools.4: Invalid tool name
[ExtensionManager] Error loading agent from caveman: Failed to load agent from /Users/junghojang/.gemini/extensions/caveman/agents/cavecrew-investigator.md: Validation failed: Agent Definition:
tools.0: Invalid tool name
tools.1: Invalid tool name
tools.2: Invalid tool name
tools.3: Invalid tool name
[ExtensionManager] Error loading agent from caveman: Failed to load agent from /Users/junghojang/.gemini/extensions/caveman/agents/cavecrew-reviewer.md: Validation failed: Agent Definition:
tools.0: Invalid tool name
tools.1: Invalid tool name
tools.2: Invalid tool name
Ripgrep is not available. Falling back to GrepTool.
`self-improvement-loop.md` 설계 정본 리뷰 결과. `caveman ultra` 모드 적용.

## 🔴 [Critical] 벤치마크 비용 폭증 (Cost Explosion)
- **현황:** 개선마다 `with/without x N과제` 실행. Phase 6-3 반복 개선 결합 시 호출수 기하급수적 증가.
- **이슈:** Opus 고추론 모델 사용 시 단일 스킬 개선 비용이 하네스 구축 전체 비용 상회 가능성. 벤치마크가 '배보다 배꼽' 상황 초래.
- **권고:** 
    - **Tiered Eval:** `smoke`(1-2개) 우선 통과 시에만 `full`(Holdout 전체) 실행.
    - **Caching:** Without(Baseline) 결과물은 assertion/모델 변경 전까지 영구 캐싱. 매번 재실행 금지.
    - **Cheap-Judge:** 측정·감지는 Haiku/Sonnet 등 경량 모델 우선. 최종 승인만 Opus.

## 🔴 [Critical] Holdout 오염 & 도메인 누수 (Leakage)
- **현황:** train/holdout 70/30 분리 명시. 하지만 LLM 생성 과제 특성상 패턴 유사성 높음.
- **이슈:** 과제 A(train) 고치면 과제 B(holdout)도 같이 풀리는 '가짜 개선' 발생. 특히 하네스가 생성한 과제는 자기 편향(Self-bias)으로 인해 변별력 급락.
- **권고:** 
    - **External Seed:** Holdout 과제는 하네스 외부(사람 또는 타 모델)에서 주입한 Seed 데이터 강제 포함.
    - **Negative Case:** "스킬을 쓰면 오히려 방해되는" 역기획 과제 필수 포함. 과적합 시 여기서 점수 폭락 유도.

## 🟡 [High] Baseline 표류 & Assertion 노후화 (Stale Baseline)
- **현황:** 채택 시 re-baseline. assertion 100% 도달 시 무의미 감지.
- **이슈:** assertion이 쉬우면 품질 하락에도 100% 유지되어 '개선 불필요' 오판. baseline 자체가 과거의 유산이 되어 현재 모델 성능 향상을 못 따라갈 위험.
- **권고:** 
    - **Dynamic Hardness:** 정기적(예: 1개월)으로 전체 baseline 강제 재측정(Re-benchmark). 모델 자체 업그레이드 반영.
    - **Assertion versioning:** assertion 코드 수정 시 baseline 무효화 및 전체 재측정 강제.

## 🟡 [High] 미구현 러너(`run-benchmark.sh`) 의존성 (Phantom Runner)
- **현황:** "러너는 별도 구현 대상"으로 명시.
- **이슈:** 설계는 화려하나 실제 벤치마크 자동 실행·채점·집계 스크립트 부재로 실천 불능. 설계 정본이 '공허한 약속'이 될 리스크.
- **권고:** 
    - **MVP Runner:** 복잡한 집계 전, `run-eval.sh {case_id} {skill_path}` 수준의 최소 실행기부터 `scripts/`에 구현 병행.

## 🔵 [Med] `loop-self-eval.md`와 중복 (Metric Redundancy)
- **현황:** `alignment_score` 등 루프 자체 측정 지표와 `grading.json` 산출물 지표 혼재.
- **이슈:** 루프가 잘 도는 것(Self-eval)과 스킬이 좋은 것(Self-improvement)의 경계 모호. 지표 과다로 의사결정 피로도 상승.
- **권고:** 
    - **Metric Decoupling:** `loop_scorecard.json`은 '루프 효율'만, `grading.json`은 '산출물 품질'만 담당하도록 역할 엄격 분리. 오케스트레이터 보고 시 두 지표를 섞지 말 것.

## 🔵 [Low] 사람 승인 게이트 병목 (Human Bottleneck)
- **현황:** 모든 채택에 사람 승인 필수.
- **이슈:** 개선 제안이 잦아질 경우 사용자가 승인을 귀찮아하며 대충 승인(Rubber stamping)할 위험.
- **권고:** 
    - **Batch Approval:** 건별 승인 대신 N개 개선안을 모아서 'Best of N' 선택 또는 일괄 승인 지원.

---
**총평:** 4개 앵커(Assertion, Holdout, 승인, 단계적)는 견고함. **비용 통제(Tiered/Caching)**와 **실제 러너 구현**이 설계 실효성의 관건. `caveman` 정신에 따라 벤치마크 자동화도 최소한의 스크립트로 시작할 것.
