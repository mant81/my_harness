# CLAUDE.md

이 레포는 `harness` 플러그인(에이전트 팀 & 스킬 아키텍트 메타 스킬)이다. 두 개의 하네스가 구성되어 있다.

## 하네스 1: my-harness (포크판 팩토리)

**목표:** 도메인 한 문장 → 에이전트 팀 + 스킬을 한국어 우선·슬림(패턴 3종)으로 찍어내는 개인 포크 팩토리.

**트리거:** 새 도메인/프로젝트용 하네스를 만들거나 확장할 때 `my-harness` 스킬을 사용하라. 업스트림 디테일이 필요하면 `skills/myharness/references/*`를 읽는다. 단순 질문은 직접 응답.

## 하네스 2: repo-maintainer (이 레포 유지보수)

**목표:** 이 레포의 문서 동기화·릴리스·스킬 본문 개선·정합성 검증을 에이전트 팀으로 조율.

**트리거:** 문서/버전 정합성, 릴리스, 스킬 본문 개선 등 여러 파일·여러 전문성이 얽힌 유지보수 요청 시 `repo-maintainer` 스킬을 사용하라. 단순 1파일 수정은 직접 처리.

**구성:** 에이전트 4(`doc-syncer`, `release-manager`, `skill-maintainer`, `repo-qa`) + 스킬 3(`doc-sync`, `release-flow`, `skill-authoring`) + 오케스트레이터(`repo-maintainer`). 모드: 에이전트 팀(생성-검증+파이프라인 하이브리드), 전원 `model: opus`. 상세는 각 `.claude/agents/*`, `.claude/skills/*`에서 단일 출처로 관리.

**알려진 정합성 이슈:** 없음. 버전 1.1.0 정합(plugin=marketplace=badge=CHANGELOG), `bash skills/myharness/scripts/run-policy-audit.sh` PASS(warn 1=의도된 revfactory sibling 링크).

## 변경 이력
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-06-08 | 초기 구성 — my-harness 포크 팩토리 + repo-maintainer 유지보수 하네스 | 전체 | 레포 기반 커스텀 하네스 구축 |
| 2026-06-10 | 외부 리뷰 루프 스킬(codex/gemini 독립 검증) + TDD 교리·개발 규칙 주입 doctrine 추가. my-harness에 품질 게이트 2층·교리 주입·단계 게이트 배선 | skills/external-review-loop, skills/my-harness(+references/tdd-doctrine,dev-rules) | _needs/ 3종 일반화 적용 — 외부 독립 리뷰는 내부 QA와 별개 축 |
| 2026-06-10 | 코드레벨 리뷰 반영 P1+P2: F1 죽은 포인터→실경로, F2 커밋순서·자율노브(`_workspace/.autonomous`), F3 리스크 등급(경량/표준/중대), F5 결과서-RAG 연속성 | skills/my-harness(+references), skills/external-review-loop | 무차별 게이트 과의식 제거 + 주입 기능 무효 버그 수정 + R2-D2 신규 가치(결과서 RAG) 추출 |
| 2026-06-15 | 외부 리뷰 성능 리뷰어 `gemini`(deprecated) → `agy`(antigravity CLI, Gemini 모델) 이관. check-review-tools.sh agy 감지·우선, external-review-loop Step1/2 `agy -p --model "Gemini 3.1 Pro (High)" --sandbox --print-timeout` 실행으로 교체, 산문·scorecard source 화이트리스트 sweep. gemini는 legacy 폴백 유지 | skills/myharness(+scripts/check-review-tools.sh, build-scorecard.sh, references/external-review-loop.md 외), README 3종, plugin/marketplace, docs/self-evaluation-system.md | gemini CLI 단종 → agy로 Gemini 연동 지속(스모크 테스트 통과). 정책 감사 PASS |
| 2026-06-21 | `TeamCreate`/`TeamDelete` 제거 대응(Claude Code v2.1.178). 팀 setup/teardown 단계 폐지 → 팀원은 `Agent` 도구로 직접 spawn, 세션 종료 시 자동 정리. 죽은 도구 가리키던 본문·references·문서 3개국어 갱신(`SendMessage`·`TaskCreate`는 유효 유지) | skills/myharness/SKILL.md(+references/{orchestrator-template,team-examples,runtime-adapters,agent-design-patterns}), README 3종, AGENTS.md, docs/experimental-dependency.md, CHANGELOG | 외부 댓글 제보 → 공식 changelog/agent-teams docs로 검증(Scenario A/C 실현). 정책 감사 PASS |
