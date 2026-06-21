# Changelog

이 프로젝트는 [Semantic Versioning](https://semver.org/)을 따릅니다.

## [Unreleased]

### Fixed

- **`TeamCreate`/`TeamDelete` 제거 대응 (Claude Code v2.1.178)** — Claude Code가 에이전트 팀 setup/teardown 단계를 없애면서 `TeamCreate`·`TeamDelete` 도구를 제거했다(팀원은 이제 `Agent` 도구로 직접 spawn, `team_name`은 무시, 세션 종료 시 자동 정리). 죽은 도구를 가리키던 스킬 본문·references·문서 3개국어를 `Agent` 팀원 spawn 모델로 갱신. `SendMessage`·`TaskCreate`는 그대로 유효(플래그 게이트 유지). 대상: `skills/myharness/SKILL.md`, `references/{orchestrator-template,team-examples,runtime-adapters,agent-design-patterns}.md`, `README*.md`, `AGENTS.md`, `docs/experimental-dependency.md`. 상세: `docs/experimental-dependency.md` Scenario A/C.

## [1.1.0] - 2026-06-20

### Added

- **빌드된 하네스 동기화 (Claude `/myharness update` · Codex `$myharness update`)** — 팩토리 정본을 고친 뒤 이미 빌드된 하네스(생성 산출물)에 재전파하되 **로컬 수정을 덮어쓰기로부터 보호**(3-way 병합 아님 — 통째 교체 또는 보류). 생성 시 `.harness-manifest.json` 기준선 기록 → `harness-update.sh`(manifest/plan/apply)가 파일별 해시 분류: SAME / UPDATABLE(자동) / USER-MODIFIED(보류, 명시 승인 시 정본 통째 교체) / UNKNOWN(보수 — manifest 없음) / NEW. `plan`으로 diff 확인 후 승인하는 워크플로. 사용자 정책은 `*.local.*` 분리 권장(관리 제외). 관리 대상 v1: dev-rules·tdd-doctrine 교리 + check-review-tools·build-scorecard 스크립트. 상세: `references/harness-update.md`.

### Changed

- **외부 리뷰 — 런타임별 리뷰어(엔진 독립성)** — 외부 리뷰어를 러너 엔진과 다른 엔진으로 선택(독립성 = 엔진 다양성). Claude Code → `codex`+`agy`, Codex → `claude`+`agy`. `check-review-tools.sh`에 `claude` 탐지·런타임 감지·러너 제외 `REVIEWERS:` 산출·runner 값 검증 추가. Phase 4-6 생성 조건을 `AVAILABLE`→`REVIEWERS` 기준으로 전환.
- **개발 규칙(dev-rules) 보강** — 주입 교리에 의존성 신중(§5)·추측성 아키텍처 금지(§6)·질문 절제(§1) 규칙 추가.

## [1.0.0] - 2026-06-10

### Added

- **하네스 팩토리** — 도메인 한 문장을 에이전트 팀 + 스킬로 변환하는 메타 스킬. 6가지 팀 아키텍처 패턴(파이프라인, 팬아웃/팬인, 전문가 풀, 생성-검증, 감독자, 계층적 위임).
- **스킬 생성** — Progressive Disclosure 기반 스킬 자동 생성, 트리거 검증·드라이런·with/without 비교 테스트.
- **2층 품질 게이트** — 내부 생성-검증 QA + 외부 독립 리뷰 루프(`external-review-loop`, codex/gemini). 오케스트레이터 실코드 대조 전건 판정(확인/부분/이월/기각). 도구 연동 점검(`check-review-tools.sh`) 후 부재 시 게이트 생략. 리스크 등급(경량/표준/중대)으로 강도 조절.
- **교리 주입** — 코드/수정 에이전트에 TDD(`tdd-doctrine.md`)·개발 규칙(`dev-rules.md`) 실경로 주입.
- **듀얼 런타임 (Claude Code + Codex)** — 단일 출처(`skills/myharness/`) + 런타임별 어댑터. `CLAUDE.md`·`AGENTS.md` 듀얼 포인터 출력, 오케스트레이션 분기(`TeamCreate` ↔ Codex subagents/`codex exec`). `install.sh`로 양쪽 설치.
- **결과서-RAG 연속성** — 결과서 `## 다음 단계 참조` 블록으로 단계 간 판단 연속성 유지.
- **3개국어 문서** — README EN/KO/JA.
