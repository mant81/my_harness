# CLAUDE.md

이 레포는 `harness` 플러그인(에이전트 팀 & 스킬 아키텍트 메타 스킬)이다. 두 개의 하네스가 구성되어 있다.

## 하네스 1: my-harness (포크판 팩토리)

**목표:** 도메인 한 문장 → 에이전트 팀 + 스킬을 한국어 우선·슬림(패턴 3종)으로 찍어내는 개인 포크 팩토리.

**트리거:** 새 도메인/프로젝트용 하네스를 만들거나 확장할 때 `my-harness` 스킬을 사용하라. 업스트림 디테일이 필요하면 `skills/harness/references/*`를 읽는다. 단순 질문은 직접 응답.

## 하네스 2: repo-maintainer (이 레포 유지보수)

**목표:** 이 레포의 문서 동기화·릴리스·스킬 본문 개선·정합성 검증을 에이전트 팀으로 조율.

**트리거:** 문서/버전 정합성, 릴리스, 스킬 본문 개선 등 여러 파일·여러 전문성이 얽힌 유지보수 요청 시 `repo-maintainer` 스킬을 사용하라. 단순 1파일 수정은 직접 처리.

**구성:** 에이전트 4(`doc-syncer`, `release-manager`, `skill-maintainer`, `repo-qa`) + 스킬 3(`doc-sync`, `release-flow`, `skill-authoring`) + 오케스트레이터(`repo-maintainer`). 모드: 에이전트 팀(생성-검증+파이프라인 하이브리드), 전원 `model: opus`. 상세는 각 `.claude/agents/*`, `.claude/skills/*`에서 단일 출처로 관리.

**알려진 정합성 이슈:** `bash .claude/skills/release-flow/scripts/check-version.sh` 결과 CHANGELOG 최신 `[1.2.1]` vs plugin.json `1.2.0` 불일치. 다음 릴리스 시 release-manager가 복구.

## 변경 이력
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-06-08 | 초기 구성 — my-harness 포크 팩토리 + repo-maintainer 유지보수 하네스 | 전체 | 레포 기반 커스텀 하네스 구축 |
| 2026-06-10 | 외부 리뷰 루프 스킬(codex/gemini 독립 검증) + TDD 교리·개발 규칙 주입 doctrine 추가. my-harness에 품질 게이트 2층·교리 주입·단계 게이트 배선 | skills/external-review-loop, skills/my-harness(+references/tdd-doctrine,dev-rules) | _needs/ 3종 일반화 적용 — 외부 독립 리뷰는 내부 QA와 별개 축 |
| 2026-06-10 | 코드레벨 리뷰 반영 P1+P2: F1 죽은 포인터→실경로, F2 커밋순서·자율노브(`_workspace/.autonomous`), F3 리스크 등급(경량/표준/중대), F5 결과서-RAG 연속성 | skills/my-harness(+references), skills/external-review-loop | 무차별 게이트 과의식 제거 + 주입 기능 무효 버그 수정 + R2-D2 신규 가치(결과서 RAG) 추출 |
