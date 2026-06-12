리뷰 대상(설계 제안): _workspace/reviews/eval-proposal_artifact.md (이 레포 skills/myharness/ 하네스 팩토리의 external-review-loop에 "자체 평가→흐름 개선" 닫힌 고리를 추가하는 제안 P1~P6).
관련 참조: skills/myharness/references/external-review-loop.md, skill-testing-guide.md, skill-writing-guide.md(§7 데이터 스키마), skills/myharness/SKILL.md(Phase 7).
이 제안의 정합성·타당성·구현 가능성을 리뷰해 발생 가능한 이슈를 모두 찾아 보고하라:
- 기존 정책/스키마와의 정합(eval_metadata/grading/timing 재사용이 실제 맞물리나), 중복·모순
- 메트릭 정의의 정확성(reviewer_precision·false_positive_rate·rounds_to_converge 산식이 의미 있나, 측정 가능?)
- 자동 환류(P3/P4)의 위험: 과적합·오발화·자기강화 편향·임계(θ,ε,N) 근거
- 메타-루프(평가가 또 평가를 부르는) 비용·복잡도, over-engineering 여부
- 누락된 측정/실패 모드, 단순화 가능 지점
<이슈 작성 방법>
1. [레벨(critical/high/med/low)] 제목
- 현황: / - 이슈: / - 권고:
</이슈 작성 방법>
