리뷰 대상(설계 정본): skills/myharness/references/self-improvement-loop.md — 하네스 팩토리가 생성한 스킬/에이전트를 벤치마크로 측정→제안→holdout 검증→승인→채택하는 자기개선 루프 설계.
관련: skill-testing-guide.md, loop-self-eval.md, external-review-loop.md, SKILL.md(Phase 6/7).
성능·안정성·실효성 중심 리뷰: 벤치 실행 비용 폭증, holdout 운영 부담, baseline 표류·노후, 자동채택 위험, 단순화·우선순위, 미구현 러너 리스크.
- Goodhart/과적합/에코체임버/플래핑을 4개 앵커(GT assertion·holdout·제안+승인·단계적)가 실제로 막는가, 구멍은?
- holdout 분리·누수 방지가 LLM 생성 과제에서 실효적인가(도메인 누수·train/holdout 오염)
- baseline 레지스트리·re-baseline·롤백의 정합성, baseline 자체가 자기측정이라 표류할 위험
- assertion 앵커의 한계(자동개선 대상/비대상 경계), non-discriminating 방지 실효
- 기존 정책(loop-self-eval·Phase 6/7)과 중복·모순, 과설계, 단순화 지점
- 미구현 러너 의존으로 설계가 공허해질 위험
<이슈 작성 방법>
1. [레벨(critical/high/med/low)] 제목
- 현황: / - 이슈: / - 권고:
</이슈 작성 방법>
