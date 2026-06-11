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
이 레포의 `skills/myharness/` 및 관련 정책 문서(`SKILL.md`, `references/*.md`, `scripts/`)를 리뷰한 결과, 하네스 팩토리의 정책적 견고성 및 듀얼 런타임 대응 체계에서 발견된 이슈를 보고합니다.

---

### 1. [Critical] 듀얼 런타임 정합성 유지 정책 부재 (Drift Risk)
- **현황**: `SKILL.md`(원칙 8, Phase 5-4)와 `runtime-adapters.md`(5절)는 하네스 생성 시 Claude Code(`.claude/`)와 Codex(`.agents/`, `.codex/`) 경로 양쪽에 산출물을 동시 출력하도록 명시함.
- **이슈**: 초기 생성 이후 **지속적인 동기화 정책**이 누락됨. 사용자가 한쪽 런타임(예: Claude Code)에서 스킬이나 에이전트 정의를 수정할 경우, 다른 쪽(Codex)은 즉시 stale 상태가 되어 런타임에 따라 에이전트 행동이 달라지는 '하네스 드리프트'가 발생함.
- **권고**: Phase 7(하네스 진화)에 "런타임 동기화" 단계를 추가하고, 양쪽 경로의 체크섬이나 수정일을 대조하여 불일치를 감지·수정하는 자동화 스크립트(예: `sync-runtimes.sh`) 제공 정책을 수립해야 함.

### 2. [High] `external-review-loop` 실행 시 프로세스 제어 미흡
- **현황**: `external-review-loop.md` Step 2에서 `codex exec` 및 `gemini`를 백그라운드(`&`)로 병렬 실행함.
- **이슈**: 표준 Bash 백그라운드 실행은 자체적인 **타임아웃 제어 기능이 없음**. 문서상에는 600초 타임아웃을 언급하나, 제공된 코드 예시에는 `timeout` 명령어가 누락되어 있어 외부 도구 응답 지연 시 세션이 무한 대기하거나 좀비 프로세스가 발생할 위험이 높음.
- **권고**: 실행 코드를 `timeout 600s codex exec ... &` 형태로 수정하고, 타임아웃 발생 시(exit code 124)의 예외 처리 로직을 명시해야 함.

### 3. [High] `gemini` CLI 명령어 플래그 정합성 의문
- **현황**: `external-review-loop.md` Step 2에서 `gemini -p "..."` 형식을 사용함.
- **이슈**: 환경에 따라 `gemini` CLI(Google Generative AI SDK 등)의 프롬프트 전달 방식은 표준 입력(pipe)이나 위치 인자인 경우가 많음. `-p` 플래그가 존재하지 않는 버전일 경우 외부 리뷰 루프 전체가 실패함.
- **권고**: 타겟 시스템의 `gemini` CLI 버전을 명시하거나, 가장 범용적인 방식인 `cat prompt.md | gemini` 또는 `gemini "$(cat prompt.md)"` 패턴으로 가이드를 통일해야 함.

### 4. [Med] 도구 부재 시 폴백 정책의 상충
- **현황**: `SKILL.md`(Phase 4-6)는 "도구 미설치 시 스킬 생성 안 함"이라고 명시하나, `external-review-loop.md`와 `check-review-tools.sh`는 "Runtime Fallback(AVAILABLE: none)"을 상정함.
- **이슈**: 오케스트레이터가 게이트(Phase 5-6)에서 스킬을 호출하도록 배선되어 있는데, 생성 시점에 스킬 자체가 없으면 '도구 미설치' 상황에서 오케스트레이터 실행 에러가 발생함.
- **권고**: "스킬은 항상 생성하되, `check-review-tools.sh`를 통해 런타임에 폴백(내부 QA로 축소)하는 방식"으로 정책을 단일화하고 `SKILL.md`를 수정해야 함.

### 5. [Med] `runtime-adapters.md` 내 불명확한 템플릿 참조
- **현황**: `runtime-adapters.md` 4절에서 "템플릿 A", "템플릿 D"를 언급함.
- **이슈**: 해당 템플릿의 실체는 `orchestrator-template.md`에 있으나, 파일 경로에 대한 명시적 링크나 가이드가 부족하여 사용자가 듀얼 런타임 구현 시 혼선을 겪을 수 있음.
- **권고**: 템플릿 언급 시 `references/orchestrator-template.md` 경로를 명시하고 해당 파일 내 섹션명을 정확히 매핑해야 함.

### 6. [Med] 외부 리뷰 판정 권위(Authority) 정의의 모호성
- **현황**: `external-review-loop.md`는 "판정 권위는 오케스트레이터에 있으며 위임 금지"라고 명시함.
- **이슈**: 그러나 `SKILL.md` 워크플로우상에서는 `external-review-loop` 스킬이 Step 4(전건 판정)를 수행하는 구조임. 이는 사실상 스킬에 판정을 위임하는 형태가 되어 정책적 모순이 발생함.
- **권고**: 외부 리뷰 스킬은 '판정 안(Draft)'만 제시하고, 오케스트레이터 에이전트가 자신의 컨텍스트에서 실코드와 대조하여 최종 '확정(Confirm)'을 내리는 2단계 승인 구조임을 명확히 기술해야 함.

### 7. [Low] Phase 번호 및 용어 불일치
- **현황**: `SKILL.md` Phase 0에서 "Phase 7-5 운영/유지보수"로 이동하라고 지시함.
- **이슈**: Phase 7의 공식 타이틀은 "하네스 진화"이며, Phase 0에서 부르는 "운영/유지보수"와 용어상 괴리가 있어 매핑이 직관적이지 않음.
- **권고**: Phase 7의 제목을 "하네스 진화 및 운영/유지보수"로 확장하여 일관성을 확보해야 함.

### 8. [Low] 플레이스홀더 일관성 결여
- **현황**: `{harness-name}`, `{name}`, `{Domain}` 등 플레이스홀더 명명법이 혼용됨.
- **이슈**: 팩토리 실행 시 자동 치환 로직에서 누락되거나 잘못 치환될 위험이 있음.
- **권고**: `{harness-name}`(전체), `{agent-name}`(에이전트), `{skill-name}`(스킬) 등으로 표준화하여 문서 전반에 적용해야 함.

---
**종합 의견**: 본 하네스 팩토리는 듀얼 런타임 대응 및 외부 리뷰 게이트 등 고도화된 설계를 갖추고 있으나, **런타임 간 동기화(Drift)** 및 **명령어 실행의 안전성(Timeout/Syntax)** 측면에서 보완이 필요합니다. 특히 외부 도구 의존성이 높은 `external-review-loop`의 예외 처리를 강화할 것을 권장합니다.
