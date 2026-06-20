# Changelog

이 프로젝트는 [Semantic Versioning](https://semver.org/)을 따릅니다.

## [Unreleased]

### Added

- **`/myharness update` (빌드된 하네스 동기화)** — 팩토리 정본을 고친 뒤 이미 빌드된 하네스(생성 산출물)에 재전파. **사용자 수정 보존**(해시 감지 + propose): 생성 시 `.harness-manifest.json` 기준선 기록 → update가 파일별로 SAME/UPDATABLE(자동)/USER-MODIFIED(승인)/NEW 분류. `scripts/harness-update.sh`(manifest/plan/apply) + `references/harness-update.md`. 사용자 정책은 `*.local.*` 분리 권장(관리 제외). 관리 대상 v1: dev-rules·tdd-doctrine 교리 + check-review-tools·build-scorecard 스크립트.

### Changed

- **외부 리뷰 — 런타임별 리뷰어(엔진 독립성)** — 외부 리뷰어를 러너 엔진과 다른 엔진으로 선택(독립성 = 엔진 다양성). Claude Code → `codex`+`agy`, Codex → `claude`+`agy`. `check-review-tools.sh`에 `claude` 탐지·런타임 감지·러너 제외 `REVIEWERS:` 산출·runner 값 검증 추가. Step 4-6 생성 조건을 `AVAILABLE`→`REVIEWERS` 기준으로 전환.
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
