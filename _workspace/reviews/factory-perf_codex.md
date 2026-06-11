Reading additional input from stdin...
OpenAI Codex v0.139.0
--------
workdir: /Users/junghojang/Developments/myProject/myHarness
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: medium
reasoning summaries: none
session id: 019eb6f6-db77-7932-92bb-13c617d5e405
--------
user
리뷰 대상: 이 레포 skills/myharness/ (Claude Code+Codex 하네스 팩토리 메타스킬). 관련 commit id: f2af5bb.
**성능/속도 및 안정성** 중심으로 이 팩토리 정책을 리뷰해 발생 가능한 이슈를 모두 찾아 보고하라:
- 토큰/컨텍스트 효율: SKILL.md 500줄 천장 정책, Progressive Disclosure, references 분리가 실제로 컨텍스트를 아끼는가. 한 번에 너무 많이 로드하는 구간?
- 병렬성·동시성: 에이전트 팀 fan-out 수, 팀 크기 가이드, 병렬 codex exec, subprocess 수 제한/백프레셔 정책 유무.
- 응답 속도/지연: 외부 리뷰 게이트(codex/gemini)의 직렬/병렬, 타임아웃, 재시도 비용. 매 단계 게이트가 워크플로우를 느리게 하나.
- 안정성/복원력: 에러 핸들링, 부분 실패 시 진행, 좀비/타임아웃, 도구 부재 폴백, 무한 대기 가능성.
- 비용: 다중 에이전트·opus 강제·외부 리뷰의 토큰/호출 비용 폭증 위험과 통제 장치.
- 확장성: 대규모 도메인(에이전트 7+개)·반복 실행 시 병목.
<이슈 작성 방법>
1. [레벨(critical/high/med/low)] 제목
- 현황: / - 이슈: / - 권고:
</이슈 작성 방법>
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
`myharness` 스킬과 `context-mode`를 사용합니다. 먼저 스킬 지침과 대상 커밋/파일 구조를 인덱싱해 원문을 과도하게 들여오지 않고 리뷰 근거를 추출하겠습니다.
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc 'pwd && git status --short && git rev-parse --show-toplevel && git rev-parse f2af5bb' in /Users/junghojang/Developments/myProject/myHarness
exec
/bin/zsh -lc "sed -n '1,260p' /Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
---
name: myharness
description: "하네스(에이전트 팀 + 스킬)를 구성·확장·점검하는 메타 스킬 (myharness · /myharness · $myharness). 신규 도메인/프로젝트 자동화 체계 구축, 기존 하네스 재구성·운영·유지보수에 사용. 트리거 — KO: '하네스 구성/구축/설계/엔지니어링', '하네스 점검/감사/현황', '에이전트·스킬 동기화'; EN: 'build a harness for this project', 'build/design an agent team', 'scaffold agents and skills', 'audit the harness'; JA: 'ハーネスを構成して', 'ハーネスを設計', 'エージェントチームを作成', 'ハーネスを点検'."
---

# Harness — The Team-Architecture Factory

**핵심 원칙:**
1. 에이전트 정의(`.claude/agents/`)와 스킬(`.claude/skills/`)을 생성한다.
2. **에이전트 팀을 기본 실행 모드로 사용한다.**
3. **CLAUDE.md(+ Codex는 AGENTS.md)에 하네스 포인터를 등록한다.** — 새 세션에서 오케스트레이터 스킬이 트리거되도록 최소한의 포인터(트리거 규칙 + 변경 이력)만 기록한다. (듀얼 출력은 원칙 8·Phase 5-4)
4. **하네스는 고정물이 아니라 진화하는 시스템이다.** — 매 실행 후 피드백을 반영하고, 에이전트·스킬·CLAUDE.md를 지속 갱신한다.
5. **품질 게이트 2층 (코드/설계 도메인).** *내부* 생성-검증(같은 세션 QA)과 *외부* 리뷰 루프(codex/gemini 독립 검증)를 병행한다. 같은 컨텍스트 QA는 같은 맹점을 공유하므로 외부 독립 관점이 추가 결함을 잡는다. 단 합의=정답 아님 — 판정 권위는 오케스트레이터. 상세: `references/external-review-loop.md`.
6. **생성물에 교리 주입.** 빌더·수정·QA 에이전트의 작업 원칙에 개발 규칙·TDD 교리를 **타겟상대 실경로**로 주입한다(`[[ ]]`·플러그인 내부 경로 금지 — 서브에이전트가 해소 못 함). 상세: `references/dev-rules.md`, `references/tdd-doctrine.md`.
7. **리스크 등급으로 게이트 강도 조절.** 무차별 게이트는 과의식이다. 단계마다 경량/표준/중대 등급을 정해 게이트 강도를 맞춘다 (Phase 5-6).
8. **듀얼 런타임 (Claude Code + Codex).** 두 런타임 거의 대칭(둘 다 skills·agents·MCP·hooks). SKILL.md 포맷 동일이라 정본 공유, 어댑터로 분기할 것만: 진입점(plugin.json+CLAUDE.md / AGENTS.md), 스킬 경로(`.claude/skills/` / `.agents/skills/`), 에이전트(`.md` / `.codex/agents/*.toml`), 오케스트레이션(TeamCreate / Codex subagents·subprocess). 생성 시 양쪽 출력. 상세·검증: `references/runtime-adapters.md`.

## 워크플로우

### Phase 0: 현황 감사

하네스 스킬이 트리거되면 가장 먼저 기존 하네스 현황을 확인한다.

1. `프로젝트/.claude/agents/`·`skills/`·`CLAUDE.md`를 읽는다. **듀얼 런타임이면 `AGENTS.md`·`.agents/skills/`·`.codex/agents/`도 읽어 양쪽 drift 점검**
2. 현황에 따라 실행 모드를 분기한다:
   - **신규 구축**: 에이전트/스킬 디렉토리가 없거나 비어있음 → Phase 1부터 전체 실행
   - **기존 확장**: 기존 하네스가 있고 새 에이전트/스킬 추가 요청 → 아래 Phase 선택 매트릭스에 따라 필요한 Phase만 실행
   - **운영/유지보수**: 기존 하네스의 감사·수정·동기화 요청 → Phase 7-5 운영/유지보수 워크플로우로 이동

   **기존 확장 시 Phase 선택 매트릭스:**
   | 변경 유형 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 |
   |----------|---------|---------|---------|---------|---------|---------|
   | 에이전트 추가 | 건너뜀 (Phase 0 결과 활용) | 배치 결정만 | 필수 (3-0 포함) | 전용 스킬 필요 시 (4-0 포함) | 오케스트레이터 수정 | 필수 |
   | 스킬 추가/수정 | 건너뜀 | 건너뜀 | 건너뜀 | 필수 (4-0 포함) | 연결 변경 시 | 필수 |
   | 아키텍처 변경 | 건너뜀 | 필수 | 영향받는 에이전트만 (3-0 포함) | 영향받는 스킬만 (4-0 포함) | 필수 | 필수 |
3. 기존 에이전트/스킬 목록과 CLAUDE.md 기록을 대조하여 불일치(drift)를 감지한다
4. 감사 결과를 사용자에게 요약 보고하고, 실행 계획을 확인받는다

### Phase 1: 도메인 분석
1. 사용자 요청에서 도메인/프로젝트 파악
2. 핵심 작업 유형 식별 (생성, 검증, 편집, 분석 등)
3. Phase 0 감사 결과를 기반으로 기존 에이전트/스킬과의 충돌/중복 분석
4. 프로젝트 코드베이스 탐색 — 기술 스택, 데이터 모델, 주요 모듈 파악
5. **사용자 숙련도 감지** — 대화의 맥락 단서(사용 용어, 질문 수준)로 기술 수준을 파악하고, 이후 커뮤니케이션 톤을 조절한다. 코딩 경험이 적은 사용자에게는 "assertion", "JSON schema" 같은 용어를 설명 없이 쓰지 않는다.

### Phase 2: 팀 아키텍처 설계

#### 2-1. 실행 모드 선택

**에이전트 팀이 최우선 기본값이다.** 2개 이상의 에이전트가 협업할 때는 반드시 에이전트 팀을 먼저 검토한다. 팀원 간 직접 통신(SendMessage)과 공유 작업 목록(TaskCreate)으로 자체 조율하며, 발견 공유·상충 토론·누락 보완이 결과 품질을 높인다.

| 모드 | 언제 사용 | 특성 |
|------|----------|------|
| **에이전트 팀** (기본) | 2명 이상 협업, 실시간 조율·피드백 교환이 필요, 중간 산출물 상호 참조 | `TeamCreate` + `SendMessage` + `TaskCreate`로 자체 조율 |
| **서브 에이전트** (대안) | 단일 에이전트 작업, 결과만 메인에 반환하면 충분, 팀 통신 오버헤드가 과할 때 | `Agent` 도구 직접 호출, `run_in_background`로 병렬 |
| **하이브리드** | Phase마다 특성이 다를 때 — 예: 병렬 수집(서브) → 합의 기반 통합(팀) | Phase 단위로 팀/서브를 섞어 구성 |

**의사결정 순서:**
1. 먼저 에이전트 팀으로 설계 가능한지 검토한다 — 2명 이상이면 기본값
2. 팀 통신이 구조적으로 불필요하고(결과 전달만), 팀 오버헤드가 이득보다 클 때만 서브 에이전트 선택
3. Phase별 특성이 확연히 다르면 하이브리드 고려 — 각 Phase의 실행 모드를 오케스트레이터에 명시

> 상세 비교표와 패턴별 의사결정 트리는 `references/agent-design-patterns.md`의 "실행 모드" 참조.

#### 2-2. 아키텍처 패턴 선택

1. 작업을 전문 영역으로 분해
2. 에이전트 팀 구조 결정 (아키텍처 패턴은 `references/agent-design-patterns.md` 참조)
   - **파이프라인**: 순차 의존 작업
   - **팬아웃/팬인**: 병렬 독립 작업
   - **전문가 풀**: 상황별 선택 호출
   - **생성-검증**: 생성 후 품질 검수
   - **감독자**: 중앙 에이전트가 상태 관리 및 동적 분배
   - **계층적 위임**: 상위 에이전트가 하위에 재귀적 위임

#### 2-3. 에이전트 분리 기준

전문성·병렬성·컨텍스트·재사용성 4축으로 판단한다. 상세 기준표는 `references/agent-design-patterns.md`의 "에이전트 분리 기준" 참조. 기존 에이전트와의 중복·재사용 검토는 Phase 3-0에서 다룬다.

### Phase 3: 에이전트 정의 생성

> **듀얼 런타임:** 아래 `.claude/agents/*.md`는 Claude 기준. Codex 동시 출력 시 같은 역할을 `.codex/agents/{name}.toml`로도 생성한다 (`references/runtime-adapters.md` §3-4).

#### 3-0. 기존 에이전트 중복 검토

신규 에이전트 생성 전, `프로젝트/.claude/agents/`의 기존 에이전트와 중복 여부를 확인한다. 하네스를 반복 구축하다 보면 역할이 겹치는 에이전트가 다른 이름으로 누적되기 쉽다.

> 중복 분류 기준과 재사용 설계는 `references/agent-design-patterns.md`의 "에이전트 재사용 설계" 참조.

**모든 에이전트는 반드시 `프로젝트/.claude/agents/{name}.md` 파일로 정의한다.** 에이전트 정의 파일 없이 Agent 도구의 prompt에 역할을 직접 넣는 것은 금지한다. 이유:
- 에이전트 정의가 파일로 존재해야 다음 세션에서 재사용 가능
- 팀 통신 프로토콜이 명시되어야 에이전트 간 협업 품질 보장
- 하네스의 핵심 가치는 에이전트(누가)와 스킬(어떻게)의 분리

빌트인 타입(`general-purpose`, `Explore`, `Plan`)을 사용하더라도 에이전트 정의 파일은 생성한다. 빌트인 타입은 Agent 도구의 `subagent_type` 파라미터로 지정하고, 에이전트 정의 파일에는 역할·원칙·프로토콜을 담는다.

**모델 설정:** Claude 런타임은 모든 Agent 호출에 `model: "opus"`를 명시한다(추론 품질 = 하네스 품질). Codex 런타임은 `.codex/agents/*.toml`·내장 `worker`/`explorer`의 현재 Codex 모델/설정값을 사용(`opus` 파라미터와 무관).

**팀 재구성:** 에이전트 팀은 세션당 한 팀만 활성화할 수 있지만, Phase 간에 팀을 해체하고 새 팀을 구성할 수 있다. 파이프라인 패턴처럼 Phase별로 다른 전문가 조합이 필요하면, 이전 팀의 산출물을 파일로 저장한 뒤 팀을 정리하고 새 팀을 생성한다.

각 에이전트를 `프로젝트/.claude/agents/{name}.md`에 정의한다. 필수 섹션: 핵심 역할, 작업 원칙, 입력/출력 프로토콜, 에러 핸들링, 협업. 에이전트 팀 모드에서는 `## 팀 통신 프로토콜` 섹션을 추가하여 메시지 수신/발신 대상과 작업 요청 범위를 명시한다.

> 정의 템플릿과 실제 파일 전문은 `references/agent-design-patterns.md`의 "에이전트 정의 구조" + `references/team-examples.md` 참조.

**QA 에이전트 포함 시 필수 사항:**
- QA 에이전트는 `general-purpose` 타입을 사용하라 (`Explore`는 읽기 전용이므로 검증 스크립트 실행 불가)
- QA의 핵심은 "존재 확인"이 아니라 **"경계면 교차 비교"** — API 응답과 프론트 훅을 동시에 읽고 shape을 비교
- QA는 전체 완성 후 1회가 아니라, **각 모듈 완성 직후 점진적으로 실행** (incremental QA)
- 상세 가이드: `references/qa-agent-guide.md` 참조

#### 3-1. 교리 주입 (코드/수정 에이전트)

코드를 쓰거나 고치는 에이전트(빌더·수정·QA)의 `## 작업 원칙`에 개발 규칙·TDD 교리를 주입한다. 절차:
1. `references/dev-rules.md`, `references/tdd-doctrine.md`를 타겟 하네스의 `프로젝트/.claude/skills/{harness-name}/references/`로 **복사**한다 (Codex 동시 출력 시 `.agents/skills/{harness-name}/references/`에도 복사, 주입 실경로도 런타임별로 맞춘다).
2. 에이전트 정의에 **타겟상대 실경로** 한 줄씩 넣는다 — `> 개발 규칙: \`.claude/skills/{harness-name}/references/dev-rules.md\` 준수.` / `> TDD 규율: \`.claude/skills/{harness-name}/references/tdd-doctrine.md\` 준수.`
3. `[[ ]]`나 플러그인 내부 경로는 서브에이전트가 해소 못 하므로 금지. 본문 복붙도 금지(DRY).
- 비코드 에이전트(문서·리서치)는 dev-rules만 선택 적용(TDD 제외).

### Phase 4: 스킬 생성

각 에이전트가 사용할 스킬을 `프로젝트/.claude/skills/{name}/SKILL.md`에 생성한다. **듀얼 런타임이면 `.agents/skills/{name}/`에도 동시 출력**(SKILL.md 포맷 동일, `references/runtime-adapters.md` §3·5). 상세 작성 가이드는 `references/skill-writing-guide.md` 참조.

#### 4-0. 기존 스킬 중복 검토

신규 스킬 생성 전, `프로젝트/.claude/skills/`의 기존 스킬과 중복 여부를 확인한다. 하네스를 반복 구축하다 보면 기능이 겹치는 스킬이 다른 이름으로 누적되기 쉽다.

> 중복 분류 기준과 일반화 패턴은 `references/skill-writing-guide.md`의 "스킬 재사용 설계" 참조.

#### 4-1. 스킬 구조

```
skill-name/
├── SKILL.md (필수)
│   ├── YAML frontmatter (name, description 필수)
│   └── Markdown 본문
└── Bundled Resources (선택)
    ├── scripts/    - 반복/결정적 작업용 실행 코드
    ├── references/ - 조건부 로딩하는 참조 문서
    └── assets/     - 출력에 사용되는 파일 (템플릿, 이미지 등)
```

#### 4-2. Description 작성 — 적극적 트리거 유도

description은 스킬의 유일한 트리거 메커니즘이다. Claude는 보수적으로 판단하므로 **적극적("pushy")**으로 작성한다. 핵심: 하는 일 + 구체적 트리거 상황을 모두 기술 + 유사하나 트리거 금지인 경우와 구분. (나쁜 예 `"PDF 처리 스킬"` ↔ 좋은 예 `"PDF 읽기·추출·병합·분할·OCR 등 모든 PDF 작업; .pdf 언급/PDF 산출물 요청 시 반드시 사용"`)

#### 4-3. 본문 작성 원칙

| 원칙 | 설명 |
|------|------|
| **Why를 설명하라** | "ALWAYS/NEVER" 같은 강압적 지시 대신, 왜 그렇게 해야 하는지 이유를 전달한다. LLM은 이유를 이해하면 엣지 케이스에서도 올바르게 판단한다. |
| **Lean하게 유지** | 컨텍스트 윈도우는 공공재다. SKILL.md 본문은 500줄 이내를 목표로, 무게를 벌지 않는 내용은 삭제하거나 references/로 이동한다. |
| **일반화하라** | 특정 예시에만 맞는 좁은 규칙보다, 원리를 설명하여 다양한 입력에 대응할 수 있게 한다. 오버피팅 금지. |
| **반복 코드는 번들링** | 테스트 실행에서 에이전트들이 공통으로 작성하는 스크립트가 발견되면 `scripts/`에 미리 번들링한다. |
| **명령형으로 작성** | "~한다", "~하라" 형태의 명령형/지시형 어조를 사용한다. |

#### 4-4. Progressive Disclosure (단계적 정보 공개)

스킬은 3단계 로딩 시스템으로 컨텍스트를 관리한다:

| 단계 | 로딩 시점 | 크기 목표 |
|------|----------|----------|
| **Metadata** (name + description) | 항상 컨텍스트에 존재 | ~100단어 |
| **SKILL.md 본문** | 스킬 트리거 시 | <500줄 |
| **references/** | 필요할 때만 | 무제한 (스크립트는 로딩 없이 실행 가능) |

**크기 관리 규칙:**
- SKILL.md가 500줄에 근접하면 세부 내용을 references/로 분리하고, 본문에 "언제 이 파일을 읽으라"는 포인터를 남긴다
- 300줄 이상의 reference 파일에는 상단에 **목차(ToC)**를 포함한다
- 도메인/프레임워크별 변형이 있으면 references/ 하위에 도메인별로 분리하여, 관련 파일만 로드한다

```
cloud-deploy/
├── SKILL.md (워크플로우 + 선택 가이드)
└── references/
    ├── aws.md    ← AWS 선택 시만 로드
    ├── gcp.md
    └── azure.md
```

#### 4-5. 스킬-에이전트 연결 원칙

- 에이전트 1개 ↔ 스킬 1~N개 (1:1 또는 1:다)
- 여러 에이전트가 공유하는 스킬도 가능
- 스킬은 "어떻게 하는가"를 담고, 에이전트는 "누가 하는가"를 담는다

> 상세 작성 패턴, 예시, 데이터 스키마 표준은 `references/skill-writing-guide.md` 참조.

#### 4-6. 외부 리뷰 스킬 생성 (코드/설계 — 도구 연동 확인 후)

코드/설계 도메인이어도 **codex/gemini 연동 시에만** 만든다(작동 불가 스킬 방지).
1. **점검:** `bash skills/myharness/scripts/check-review-tools.sh` → 끝줄 `AVAILABLE:`. **none**=스킬 생성 안 함(내부 QA만, 보고서·CLAUDE.md에 "도구 미연동 생략" 명시) / **하나만**=그 도구만 쓰는 저하 모드 생성 / **둘 다**=풀 생성.
2. **생성:** `references/external-review-loop.md`(방법론 겸 템플릿)를 타겟 `.claude/skills/external-review-loop/SKILL.md`(듀얼 런타임이면 `.agents/skills/external-review-loop/`에도)로 생성(frontmatter 포함). `check-review-tools.sh`도 그 스킬 `scripts/`로 복사(런타임 폴백).
3. 오케스트레이터가 단계 마감 시 호출(5-6). 스킬 없으면 게이트는 내부 QA로 축소. 비코드 도메인은 점검 없이 생략.

### Phase 5: 통합 및 오케스트레이션

오케스트레이터는 스킬의 특수한 형태로, 개별 에이전트와 스킬을 하나의 워크플로우로 엮어 팀 전체를 조율한다. Phase 4에서 생성한 개별 스킬이 "각 에이전트가 무엇을 어떻게 하는가"를 정의한다면, 오케스트레이터는 "누가 언제 어떤 순서로 협업하는가"를 정의한다. 구체적 템플릿은 `references/orchestrator-template.md` 참조.

**기존 확장 시 오케스트레이터 수정:** 신규 구축이 아닌 기존 확장일 때는 오케스트레이터를 새로 생성하지 않고 기존 오케스트레이터를 수정한다. 에이전트 추가 시 팀 구성·작업 할당·데이터 흐름에 새 에이전트를 반영하고, description에 새 에이전트 관련 트리거 키워드를 추가한다.

Phase 2-1에서 선택한 실행 모드에 따라 오케스트레이터 패턴이 달라진다:

#### 5-0. 오케스트레이터 패턴 (모드별)

**에이전트 팀 패턴 (기본):**
오케스트레이터가 `TeamCreate`로 팀을 구성하고, `TaskCreate`로 작업을 할당한다. 팀원들은 `SendMessage`로 직접 통신하며 자체 조율한다. 리더(오케스트레이터)는 진행 상황을 모니터링하고 결과를 종합한다.

```
[오케스트레이터/리더]
    ├── TeamCreate(team_name, members)
    ├── TaskCreate(tasks with dependencies)
    ├── 팀원들이 자체 조율 (SendMessage)
    ├── 결과 수집 및 종합
    └── 팀 정리
```

**서브 에이전트 패턴 (대안):**
오케스트레이터가 `Agent` 도구로 서브 에이전트를 직접 호출한다. 병렬 실행은 `run_in_background: true`, 결과는 메인에게만 반환된다. 팀 통신이 불필요하고 오버헤드를 줄이고 싶을 때 사용.

```
[오케스트레이터]
    ├── Agent(agent-1, run_in_background=true)
    ├── Agent(agent-2, run_in_background=true)
    ├── 결과 대기 및 수집
    └── 통합 산출물 생성
```

**하이브리드 패턴:**
Phase마다 다른 모드를 섞어 구성한다. 자주 쓰이는 조합:
- **병렬 수집(서브) → 합의 통합(팀)**: Phase 2에서 서브 에이전트로 독립 자료를 병렬 수집 → Phase 3에서 팀을 만들어 토론·합의 기반 통합
- **팀 생성(팀) → 검증(서브)**: Phase 2에서 팀이 초안 생성 → Phase 3에서 단일 서브 에이전트가 독립 검증
- **Phase 간 팀 재구성**: 각 Phase마다 `TeamDelete` 후 새 `TeamCreate`, 사이에 서브 에이전트 호출 삽입

하이브리드 선택 시 오케스트레이터의 각 Phase 섹션 상단에 해당 Phase의 실행 모드를 명시한다 (예: `**실행 모드:** 에이전트 팀`).

#### 5-1. 데이터 전달 프로토콜

오케스트레이터 내에 에이전트 간 데이터 전달 방식을 명시한다:

| 전략 | 방식 | 적용 모드 | 적합한 경우 |
|------|------|----------|-----------|
| **메시지 기반** | `SendMessage`로 팀원 간 직접 통신 | 팀 | 실시간 조율, 피드백 교환, 가벼운 상태 전달 |
| **태스크 기반** | `TaskCreate`/`TaskUpdate`로 작업 상태 공유 | 팀 | 진행상황 추적, 의존 관계 관리, 작업 자체 요청 |
| **파일 기반** | 약속된 경로에 파일을 쓰고 읽음 | 팀 + 서브 | 대용량 데이터, 구조화된 산출물, 감사 추적 필요 |
| **반환값 기반** | `Agent` 도구의 반환 메시지 | 서브 | 서브 에이전트 결과를 메인이 직접 수집 |

**권장 조합 (팀 모드):** 태스크 기반(조율) + 파일 기반(산출물) + 메시지 기반(실시간 소통)
**권장 조합 (서브 모드):** 반환값 기반(결과 수집) + 파일 기반(대용량 산출물)
**하이브리드:** 각 Phase의 실행 모드에 맞춰 해당 조합 적용

파일 기반 전달 시 규칙:
- 작업 디렉토리 하위에 `_workspace/` 폴더를 만들어 중간 산출물 저장
- 파일명 컨벤션: `{phase}_{agent}_{artifact}.{ext}` (예: `01_analyst_requirements.md`)
- 최종 산출물만 사용자 지정 경로에 출력, 중간 파일(`_workspace/`)은 보존 (사후 검증·감사 추적용)
- **결과서-RAG 연속성:** 각 결과서 상단에 `## 다음 단계 참조` 블록 의무 — 미해결 이슈·핵심 결정과 이유·다음 단계 안내. 다음 단계 사전작업은 직전 결과서의 이 블록을 **먼저 읽고** 시작한다(판단 연속성, 맥락 단절 방지, 비용 ~0).

#### 5-2. 에러 핸들링

오케스트레이터 내에 에러 처리 방침을 포함한다. 핵심 원칙: 1회 재시도 후 재실패 시 해당 결과 없이 진행(보고서에 누락 명시), 상충 데이터는 삭제하지 않고 출처 병기.


hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse
 succeeded in 4710ms:
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-dKC2c4Ym' (errno=Operation not permitted)
?? _workspace/reviews/factory-perf_codex.md
?? _workspace/reviews/factory-perf_gemini.md
?? _workspace/reviews/factory-perf_prompt.md
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-wHU9OXBG' (errno=Operation not permitted)
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-TYm654Ez' (errno=Operation not permitted)
/Users/junghojang/Developments/myProject/myHarness
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-U96bg2mi' (errno=Operation not permitted)
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-oBequG8E' (errno=Operation not permitted)
f2af5bbc3e811d237a9c09403bac234f4d62ab47

hook: PostToolUse Completed
codex
대상 스킬 본문을 절반 읽었습니다. 다음은 나머지와 references 목록, commit 파일 상태를 프로그램으로 집계해 병목 후보를 좁히겠습니다.
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse
exec
/bin/zsh -lc "sed -n '261,620p' /Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
> 에러 유형별 전략표와 구현 상세는 `references/orchestrator-template.md`의 "에러 핸들링" 참조.

#### 5-3. 팀 크기 가이드라인

| 작업 규모 | 권장 팀원 수 | 팀원당 작업 수 |
|----------|------------|--------------|
| 소규모 (5~10개 작업) | 2~3명 | 3~5개 |
| 중규모 (10~20개 작업) | 3~5명 | 4~6개 |
| 대규모 (20개+ 작업) | 5~7명 | 4~5개 |

> 팀원이 많을수록 조율 오버헤드가 커진다. 3명의 집중된 팀원이 5명의 산만한 팀원보다 낫다.

#### 5-4. CLAUDE.md 하네스 포인터 등록

하네스 구성 완료 후, 프로젝트의 `CLAUDE.md`에 최소한의 포인터를 등록한다. CLAUDE.md는 새 세션마다 로딩되므로, 하네스 존재와 트리거 규칙만 기록하면 오케스트레이터 스킬이 나머지를 처리한다.

**CLAUDE.md 템플릿:**

````markdown
## 하네스: {도메인명}

**목표:** {하네스의 핵심 목표 한 줄}

**트리거:** {도메인} 관련 작업 요청 시 `{orchestrator-skill-name}` 스킬을 사용하라. 단순 질문은 직접 응답 가능.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| {YYYY-MM-DD} | 초기 구성 | 전체 | - |
````

**듀얼 런타임 포인터:** Codex용으로 레포 루트 `AGENTS.md`에도 같은 포인터 + Codex 오케스트레이션 어댑터(subagents/subprocess) 주석을 출력한다(Codex 자동 로드). 둘 다 같은 정본을 가리킴. 한쪽만 갱신=drift. 상세: `references/runtime-adapters.md`.

**CLAUDE.md에 넣지 않는 것:** 에이전트 목록, 스킬 목록, 디렉토리 구조, 실행 규칙 상세. 이유: 에이전트/스킬 목록은 오케스트레이터 스킬과 `.claude/agents/`, `.claude/skills/`에서 관리하므로 중복이다. 디렉토리 구조는 파일 시스템에서 직접 확인 가능하다. CLAUDE.md는 **포인터(트리거 규칙) + 변경 이력**만 담는다.

#### 5-5. 후속 작업 지원

오케스트레이터는 초기 실행뿐 아니라 후속 작업도 처리해야 한다. 다음 세 가지를 보장하라:

**1. 오케스트레이터 description에 후속 키워드 포함:**
초기 생성 키워드만으로는 후속 요청이 트리거되지 않는다. description에 반드시 포함할 후속 표현:
- "다시 실행", "재실행", "업데이트", "수정", "보완"
- "{도메인}의 {부분작업}만 다시"
- "이전 결과 기반으로", "결과 개선"

**2. 오케스트레이터 Phase 0에 컨텍스트 확인 단계 추가:**
워크플로우 시작 시 기존 산출물 존재 여부를 확인하여 실행 모드를 결정한다:
- `_workspace/` 존재 + 사용자가 부분 수정 요청 → **부분 재실행** (해당 에이전트만 재호출)
- `_workspace/` 존재 + 사용자가 새 입력 제공 → **새 실행** (기존 _workspace를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동 — 반복 실행 덮어쓰기 방지, 템플릿과 일치)
- `_workspace/` 미존재 → **초기 실행**

**3. 에이전트 정의에 재호출 지침 포함:**
각 에이전트 `.md` 파일에 "이전 산출물이 있을 때의 행동"을 명시한다:
- 이전 결과 파일이 존재하면 읽고 개선점을 반영
- 사용자 피드백이 주어지면 해당 부분만 수정

> 오케스트레이터 템플릿의 "Phase 0: 컨텍스트 확인" 섹션 참조: `references/orchestrator-template.md`

#### 5-6. 품질 게이트 (코드/설계 도메인)

내부 생성-검증(QA 에이전트)에 더해, 단계 산출물마다 외부 리뷰 게이트를 건다. 무차별 적용은 과의식이므로 **리스크 등급으로 강도를 맞춘다.**

| 등급 | 조건 | 게이트 |
|------|------|--------|
| 경량 | 1파일·가역·테스트 無 (오타·문구·설정) | 내부 QA만 |
| 표준 | 다파일·기능 추가 | 내부 QA + 외부리뷰 **1회**(단계 끝) |
| 중대 | 계약 변경·비가역·다도메인 | **단계마다** 외부리뷰 + 승인 사다리(PRD→계획서→실행: 각 관문마다 사용자 승인+외부리뷰, 반려 시 해당 단계 재작업; 승인 관문 절차는 external-review-loop Step 7 준용) |

**단계 마감 게이트(표준·중대):** 오케스트레이터가 `external-review-loop` 스킬 호출 — codex/gemini 병렬 → 전건 판정(확인/부분/이월/기각) → 확인분만 TDD 수정 → 게이트 PASS. 판정 권위는 오케스트레이터(위임 금지). 상세: `references/external-review-loop.md`.

**커밋 순서(순환 제거):** 리뷰→판정→수정→게이트 PASS → **승인 관문** → 단일 커밋. (리뷰는 커밋 *전* 작업트리/스테이지 대상 — "커밋 직후 리뷰" 아님.)
- 승인 관문 기본: 사용자 승인 대기.
- **자율 노브:** `프로젝트/_workspace/.autonomous` 마커(또는 "자율로"·"승인 생략" 발화) 시 승인 자동 통과 → 커밋. 권한모드(bypassPermissions)는 스킬이 못 읽으므로 마커/발화로 명시. 마커 ON이어도 외부리뷰·판정·게이트는 그대로(인간 승인 한 스텝만 생략).
- **push는 자율이어도 기본 대기**(외부 송출·되돌리기 어려움) — `_workspace/.autonomous-push` 마커 시만 자동.

### Phase 6: 검증 및 테스트

생성된 하네스를 검증한다. 상세 테스트 방법론은 `references/skill-testing-guide.md` 참조.

#### 6-1. 구조 검증

- 모든 에이전트 파일이 올바른 위치에 있는지 확인
- 스킬의 frontmatter(name, description) 검증
- 에이전트 간 참조 일관성 확인
- 커맨드가 생성되지 않았는지 확인

#### 6-2. 실행 모드별 검증

- **에이전트 팀**: 팀원 간 통신 경로, 작업 의존성, 팀 크기 적정성 확인
- **서브 에이전트**: 각 에이전트의 입출력 연결, `run_in_background` 설정, 반환값 수집 로직 확인
- **하이브리드**: 각 Phase의 실행 모드가 오케스트레이터에 명시되었는지, Phase 경계에서 데이터 전달이 끊기지 않는지 확인 (팀 → 서브 전환 시 팀의 산출물이 서브의 입력으로 연결되는지)

#### 6-3. 스킬 실행 테스트

생성된 각 스킬에 대해 실제 실행 테스트를 수행한다:

1. **테스트 프롬프트 작성** — 각 스킬에 대해 2~3개의 현실적인 테스트 프롬프트를 작성한다. 실제 사용자가 입력할 법한 구체적이고 자연스러운 문장으로 작성한다.

2. **With-skill vs Without-skill 비교 실행** — 가능하면 스킬 있는 실행과 없는 실행을 병렬로 수행하여 스킬의 부가가치를 확인한다. 에이전트를 두 개씩 스폰한다:
   - **With-skill**: 스킬을 읽고 작업 수행
   - **Without-skill (baseline)**: 같은 프롬프트를 스킬 없이 수행

3. **결과 평가** — 산출물의 품질을 정성적(사용자 리뷰) + 정량적(assertion 기반) 으로 평가한다. 산출물이 객관적으로 검증 가능한 경우(파일 생성, 데이터 추출 등) assertion을 정의하고, 주관적인 경우(문체, 디자인) 사용자 피드백에 의존한다.

4. **반복 개선 루프** — 테스트 결과에서 문제가 발견되면:
   - 피드백을 **일반화**하여 스킬을 수정한다 (특정 예시에만 맞는 좁은 수정 금지)
   - 수정 후 재테스트한다
   - 사용자가 만족하거나 의미 있는 개선이 더 이상 없을 때까지 반복한다

5. **반복 패턴 번들링** — 테스트 실행에서 에이전트들이 공통으로 작성하는 코드(예: 모든 테스트에서 동일한 헬퍼 스크립트를 생성)가 발견되면, 해당 코드를 `scripts/`에 미리 번들링한다.

#### 6-4. 트리거 검증

각 스킬의 description이 올바르게 트리거되는지 검증한다:

1. **Should-trigger 쿼리** (8~10개) — 스킬을 트리거해야 하는 다양한 표현 (공식적/캐주얼, 명시적/암시적)
2. **Should-NOT-trigger 쿼리** (8~10개) — 키워드가 유사하지만 이 스킬이 아닌 다른 도구/스킬이 적합한 "near-miss" 쿼리

**near-miss 작성 핵심:** "피보나치 함수 작성" 같이 명백히 무관한 쿼리는 테스트 가치가 없다. "이 엑셀 파일의 차트를 PNG로 추출해줘" (xlsx 스킬 vs 이미지 변환)처럼 **경계가 모호한 쿼리**가 좋은 테스트 케이스다.

기존 스킬과의 트리거 충돌도 이 단계에서 확인한다.

#### 6-5. 드라이런 테스트

- 오케스트레이터 스킬의 Phase 순서가 논리적인지 검토
- 데이터 전달 경로에 빈 구간(dead link)이 없는지 확인
- 모든 에이전트의 입력이 이전 Phase의 출력과 매칭되는지 확인
- 에러 시나리오별 폴백 경로가 실행 가능한지 확인

#### 6-6. 테스트 시나리오 작성

- 오케스트레이터 스킬에 `## 테스트 시나리오` 섹션 추가
- 정상 흐름 1개 + 에러 흐름 1개 이상 기술

### Phase 7: 하네스 진화

하네스는 한 번 만들고 끝나는 정적 산출물이 아니다. 사용자 피드백에 따라 계속 진화하는 시스템이다.

#### 7-1. 실행 후 피드백 수집

매 하네스 실행 완료 후, 사용자에게 피드백을 요청한다:
- "결과에서 개선할 부분이 있나요?"
- "에이전트 팀 구성이나 워크플로우에 바꾸고 싶은 점이 있나요?"

피드백이 없으면 넘어간다. 강요하지 않되, 반드시 기회를 제공한다.

#### 7-2. 피드백 반영 경로

피드백 유형에 따라 수정 대상이 다르다:

| 피드백 유형 | 수정 대상 | 예시 |
|-----------|----------|------|
| 결과물 품질 | 해당 에이전트의 스킬 | "분석이 너무 피상적" → 스킬에 깊이 기준 추가 |
| 에이전트 역할 | 에이전트 정의 `.md` | "보안 검토도 필요" → 새 에이전트 추가 |
| 워크플로우 순서 | 오케스트레이터 스킬 | "검증을 먼저 해야" → Phase 순서 변경 |
| 팀 구성 | 오케스트레이터 + 에이전트 | "이 둘은 합쳐도 될 듯" → 에이전트 병합 |
| 트리거 누락 | 스킬 description | "이 표현으로 하면 작동 안 함" → description 확장 |

#### 7-3. 변경 이력

모든 변경은 CLAUDE.md의 **변경 이력** 테이블에 기록한다 (Phase 5-4 템플릿의 "변경 이력" 섹션과 동일 테이블):

```markdown
**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-04-05 | 초기 구성 | 전체 | - |
| 2026-04-07 | QA 에이전트 추가 | agents/qa.md | 산출물 품질 검증 부족 피드백 |
| 2026-04-10 | 톤 가이드 추가 | skills/content-creator | "너무 딱딱하다" 피드백 |
```

이 이력을 통해 하네스가 어떤 방향으로 진화했는지 추적하고, 퇴행(regression)을 방지한다.

#### 7-4. 진화 트리거

사용자가 명시적으로 "하네스 수정해줘"라고 할 때만이 아니라, 다음 상황에서도 진화를 제안한다:
- 같은 유형의 피드백이 2회 이상 반복될 때
- 에이전트가 반복적으로 실패하는 패턴이 발견될 때
- 사용자가 오케스트레이터를 우회하여 수동으로 작업하는 것이 관찰될 때

#### 7-5. 운영/유지보수 워크플로우

기존 하네스의 점검·수정·동기화를 체계적으로 수행한다. Phase 0에서 "운영/유지보수" 분기로 진입했을 때 이 워크플로우를 따른다.

**Step 1: 현황 감사**
- `.claude/agents/` 파일 목록과 오케스트레이터 스킬의 에이전트 구성 비교 → 불일치 목록 생성
- `.claude/skills/` 디렉토리 목록과 오케스트레이터 스킬의 스킬 구성 비교 → 불일치 목록 생성
- 감사 결과를 사용자에게 보고한다

**Step 2: 점진적 추가/수정**
- 사용자 요청에 따라 에이전트 추가/수정/삭제, 스킬 추가/수정/삭제를 수행한다
- 변경은 한 번에 하나씩, 각 변경 후 즉시 Step 3(동기화)을 실행한다

**Step 3: CLAUDE.md 변경 이력 갱신**
- 변경 이력 테이블에 날짜, 변경 내용, 대상, 사유를 기록한다

**Step 4: 변경 검증**
- 수정된 에이전트/스킬의 구조 검증 (Phase 6-1 기준)
- 수정 범위가 트리거에 영향을 주면 트리거 검증 (Phase 6-4 기준)
- 대규모 변경(아키텍처 변경, 에이전트 3개 이상 추가/삭제) 시 Phase 6-3(실행 테스트), 6-5(드라이런)까지 수행
- CLAUDE.md와 실제 파일의 일치 여부 최종 확인

#### 7-6. 런타임 동기화 (듀얼 런타임 — drift 방지)
한쪽 런타임(예: `.claude/`)에서 스킬·에이전트를 수정하면 다른 쪽(`.agents/`·`.codex/`)이 stale → 런타임별 행동 불일치(하네스 drift). **모든 수정 후** 양쪽 경로(`.claude/skills/`↔`.agents/skills/`, `.claude/agents/*.md`↔`.codex/agents/*.toml`)의 정합을 대조·동기화한다. CLAUDE.md·AGENTS.md 포인터도 동시 갱신. 심링크 운영(예: `.agents/skills/{name}`→`.claude` 또는 공통 출처)이면 자동 동기되므로 권장.

## 산출물 체크리스트

생성 완료 후 확인:

- [ ] `.claude/agents/`(정의 파일, 빌트인 타입도 필수) + `.claude/skills/`(SKILL.md + references/) 생성
- [ ] 오케스트레이터 스킬 1개 (데이터 흐름 + 에러 핸들링 + 테스트 시나리오 포함)
- [ ] 실행 모드 명시 (에이전트 팀 / 서브 에이전트 / 하이브리드 중 선택, 하이브리드면 Phase별 모드 기재)
- [ ] Claude Agent 호출에 `model: "opus"` 명시 (Codex는 런타임 모델/설정)
- [ ] 신규 에이전트·스킬 생성 전 기존 중복 검토 완료 (Phase 3-0, 4-0)
- [ ] `.claude/commands/` — 아무것도 생성하지 않음
- [ ] 기존 에이전트/스킬과 충돌 없음
- [ ] 스킬 description이 적극적("pushy")으로 작성됨 — **후속 작업 키워드 포함**
- [ ] SKILL.md 본문이 500줄 이내, 초과 시 references/ 분리
- [ ] 테스트 프롬프트 2~3개 실행 검증 + 트리거 검증(should/should-NOT) 완료
- [ ] **CLAUDE.md 포인터 등록 + 변경 이력에 에이전트/스킬 추가·삭제·수정 기록**
- [ ] **오케스트레이터 Phase 0에 컨텍스트 확인 단계** (초기/후속/부분 재실행 판별)
- [ ] (듀얼 런타임) `.codex/agents/*.toml` 생성 + `.claude`↔`.codex` 역할 동등성 + `.agents/skills/` references/scripts 동봉 검증
- [ ] (코드/설계) 코드/수정 에이전트에 dev-rules·tdd-doctrine **타겟상대 실경로** 주입 (`[[ ]]` 금지) + 교리 파일 타겟 복사 (Phase 3-1)
- [ ] (코드/설계) **codex/gemini 연동 점검**(`check-review-tools.sh`) 후 `external-review-loop` 스킬 생성 — 도구 전무면 생략(불필요 스킬 방지) + 단계 게이트 배선, 단계마다 리스크 등급 판정 (Phase 4-6, 5-6)
- [ ] (코드/설계) 커밋 순서·자율 노브(`_workspace/.autonomous`)·push 별도 게이트 반영
- [ ] 결과서에 `## 다음 단계 참조` 블록 (연속성)
- [ ] **듀얼 런타임:** 루트 `AGENTS.md` + 스킬 `.agents/skills/` 출력, 오케스트레이터에 어댑터(TeamCreate / Codex subagents·subprocess) 명시 (`references/runtime-adapters.md`)

## 참고

- 하네스 패턴: `references/agent-design-patterns.md`
- 기존 하네스 예시 (실제 파일 전문 포함): `references/team-examples.md`
- 오케스트레이터 템플릿: `references/orchestrator-template.md`
- **스킬 작성 가이드**: `references/skill-writing-guide.md` — 작성 패턴, 예시, 데이터 스키마 표준
- **스킬 테스트 가이드**: `references/skill-testing-guide.md` — 테스트/평가/반복 개선 방법론
- **QA 에이전트 가이드**: `references/qa-agent-guide.md` — 빌드 하네스에 QA 에이전트를 포함할 때 참조. 통합 정합성 검증 방법론, 경계면 버그 패턴, QA 에이전트 정의 템플릿 포함. 실제 프로젝트에서 발견된 7개 버그 사례 기반.
- **외부 리뷰 루프**: `references/external-review-loop.md` — 코드/설계 도메인 하네스에 codex/gemini 독립 검증 단계 게이트를 넣을 때 참조. 방법론 겸 생성 템플릿. 전건 판정·기각 사유표·커밋 순서·자율 노브 포함.
- **TDD 교리 / 개발 규칙**: `references/tdd-doctrine.md`, `references/dev-rules.md` — 코드/수정 에이전트 작업 원칙 주입용.
- **런타임 어댑터**: `references/runtime-adapters.md` — Claude Code/Codex 듀얼 런타임 설계. 진입점·오케스트레이션 매핑, AGENTS.md·`.agents/skills/` 생성, 설치(Codex 공식 docs 검증).

hook: PostToolUse
exec
/bin/zsh -lc 'find /Users/junghojang/Developments/myProject/myHarness/skills/myharness -maxdepth 3 -type f | sort' in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md
/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/agent-design-patterns.md
/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/dev-rules.md
/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/external-review-loop.md
/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/orchestrator-template.md
/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/qa-agent-guide.md
/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/runtime-adapters.md
/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/skill-testing-guide.md
/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/skill-writing-guide.md
/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/tdd-doctrine.md
/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/team-examples.md
/Users/junghojang/Developments/myProject/myHarness/skills/myharness/scripts/check-review-tools.sh

hook: PostToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc 'git show --stat --oneline --decorate --no-renames f2af5bb -- skills/myharness' in /Users/junghojang/Developments/myProject/myHarness
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse
 succeeded in 1204ms:
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-sdfwYUtH' (errno=Operation not permitted)
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-gpT3LnXX' (errno=Operation not permitted)
f2af5bb (HEAD -> main, origin/main) fix(factory): apply 1st external review (codex+gemini) — dual-runtime threading + robustness
 skills/myharness/SKILL.md                          | 33 +++++++++++-----------
 .../myharness/references/agent-design-patterns.md  |  2 +-
 .../myharness/references/external-review-loop.md   | 12 +++++---
 .../myharness/references/orchestrator-template.md  |  2 +-
 skills/myharness/references/skill-writing-guide.md |  2 ++
 skills/myharness/scripts/check-review-tools.sh     |  6 ++--
 6 files changed, 33 insertions(+), 24 deletions(-)

hook: PostToolUse Completed
codex
`context-mode` MCP 도구는 현재 활성 도구 목록에 직접 노출되어 있지 않습니다. 사용 가능한 검색으로 확인하되, 없으면 짧은 프로그램 출력만 사용해 같은 원칙으로 진행하겠습니다.
codex
`ctx_*` 도구 확인됨. 이제 `skills/myharness` 전체를 인덱싱하고, 줄 수·타임아웃·병렬성·게이트 관련 문구를 코드로 추출해 이슈 후보를 만들겠습니다.
mcp: context-mode/ctx_index started
mcp: context-mode/ctx_index (failed)
user cancelled MCP tool call
codex
인덱싱 호출이 취소되었습니다. 원문 전체 저장 대신 `ctx_execute`로 필요한 지표와 근거 줄만 추출해 리뷰를 계속합니다.
mcp: context-mode/ctx_execute started
mcp: context-mode/ctx_execute (failed)
user cancelled MCP tool call
codex
`ctx_execute`도 취소되어 사용할 수 없습니다. 대체로 Node 스크립트를 짧은 요약 출력만 내게 실행합니다. raw 파일 덤프 없이 근거 줄만 뽑겠습니다.
hook: PreToolUse
hook: PreToolUse Completed
hook: PostToolUse
hook: PostToolUse Completed
codex
읽기 전용 샌드박스라 here-doc 임시 파일 생성도 막혔습니다. `node -e` 단일 실행으로 같은 집계만 출력하겠습니다.
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc "node -e 'const fs=require(\"fs\"),path=require(\"path\");const root=\"/Users/junghojang/Developments/myProject/myHarness/skills/myharness\";function walk(d){let out=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())out=out.concat(walk(p));else if(/\\.(md|sh)"'$/.test(e.name))out.push(p)}return out}const pats=[/500줄|Progressive|references'"\\//i,/TeamCreate|SendMessage|TaskCreate|run_in_background|codex exec|concurrency|병렬|동시|fan|팀원|팀 크기/i,/timeout|타임아웃|retry|재시도|zombie|좀비|무한|대기|kill|trap|AVAILABLE|gemini|codex/i,/opus|비용|토큰|context|컨텍스트|외부 리뷰|review/i,/7명|대규모|확장|반복|backpressure|백프레셔|semaphore|limit/i];for(const f of walk(root)){const rel=path.relative(root,f),s=fs.readFileSync(f,\"utf8\"),lines=s.split(/\\r?\\n/);let hits=[];lines.forEach((l,i)=>{if(pats.some(p=>p.test(l)))hits.push("'`${i+1}: ${l.slice(0,220)}`)});console.log(`'"\\n## "'${rel} (${lines.length} lines; hits ${hits.length})`);console.log(hits.slice(0,35).join("'"\\n\")||\"(no hits)\");if(hits.length>35)console.log("'`... ${hits.length-35} more hits`) }'"'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:

## SKILL.md (500 lines; hits 113)
3: description: "하네스(에이전트 팀 + 스킬)를 구성·확장·점검하는 메타 스킬 (myharness · /myharness · $myharness). 신규 도메인/프로젝트 자동화 체계 구축, 기존 하네스 재구성·운영·유지보수에 사용. 트리거 — KO: '하네스 구성/구축/설계/엔지니어링', '하네스 점검/감사/현황', '에이전트·스킬 동기화'; EN: 'build a harness f
9: 1. 에이전트 정의(`.claude/agents/`)와 스킬(`.claude/skills/`)을 생성한다.
11: 3. **CLAUDE.md(+ Codex는 AGENTS.md)에 하네스 포인터를 등록한다.** — 새 세션에서 오케스트레이터 스킬이 트리거되도록 최소한의 포인터(트리거 규칙 + 변경 이력)만 기록한다. (듀얼 출력은 원칙 8·Phase 5-4)
13: 5. **품질 게이트 2층 (코드/설계 도메인).** *내부* 생성-검증(같은 세션 QA)과 *외부* 리뷰 루프(codex/gemini 독립 검증)를 병행한다. 같은 컨텍스트 QA는 같은 맹점을 공유하므로 외부 독립 관점이 추가 결함을 잡는다. 단 합의=정답 아님 — 판정 권위는 오케스트레이터. 상세: `references/external-review-loop.md`.
14: 6. **생성물에 교리 주입.** 빌더·수정·QA 에이전트의 작업 원칙에 개발 규칙·TDD 교리를 **타겟상대 실경로**로 주입한다(`[[ ]]`·플러그인 내부 경로 금지 — 서브에이전트가 해소 못 함). 상세: `references/dev-rules.md`, `references/tdd-doctrine.md`.
16: 8. **듀얼 런타임 (Claude Code + Codex).** 두 런타임 거의 대칭(둘 다 skills·agents·MCP·hooks). SKILL.md 포맷 동일이라 정본 공유, 어댑터로 분기할 것만: 진입점(plugin.json+CLAUDE.md / AGENTS.md), 스킬 경로(`.claude/skills/` / `.agents/skills/`), 에이전트(`.md` / `.cod
24: 1. `프로젝트/.claude/agents/`·`skills/`·`CLAUDE.md`를 읽는다. **듀얼 런타임이면 `AGENTS.md`·`.agents/skills/`·`.codex/agents/`도 읽어 양쪽 drift 점검**
27:    - **기존 확장**: 기존 하네스가 있고 새 에이전트/스킬 추가 요청 → 아래 Phase 선택 매트릭스에 따라 필요한 Phase만 실행
30:    **기존 확장 시 Phase 선택 매트릭스:**
50: **에이전트 팀이 최우선 기본값이다.** 2개 이상의 에이전트가 협업할 때는 반드시 에이전트 팀을 먼저 검토한다. 팀원 간 직접 통신(SendMessage)과 공유 작업 목록(TaskCreate)으로 자체 조율하며, 발견 공유·상충 토론·누락 보완이 결과 품질을 높인다.
54: | **에이전트 팀** (기본) | 2명 이상 협업, 실시간 조율·피드백 교환이 필요, 중간 산출물 상호 참조 | `TeamCreate` + `SendMessage` + `TaskCreate`로 자체 조율 |
55: | **서브 에이전트** (대안) | 단일 에이전트 작업, 결과만 메인에 반환하면 충분, 팀 통신 오버헤드가 과할 때 | `Agent` 도구 직접 호출, `run_in_background`로 병렬 |
56: | **하이브리드** | Phase마다 특성이 다를 때 — 예: 병렬 수집(서브) → 합의 기반 통합(팀) | Phase 단위로 팀/서브를 섞어 구성 |
63: > 상세 비교표와 패턴별 의사결정 트리는 `references/agent-design-patterns.md`의 "실행 모드" 참조.
68: 2. 에이전트 팀 구조 결정 (아키텍처 패턴은 `references/agent-design-patterns.md` 참조)
70:    - **팬아웃/팬인**: 병렬 독립 작업
78: 전문성·병렬성·컨텍스트·재사용성 4축으로 판단한다. 상세 기준표는 `references/agent-design-patterns.md`의 "에이전트 분리 기준" 참조. 기존 에이전트와의 중복·재사용 검토는 Phase 3-0에서 다룬다.
82: > **듀얼 런타임:** 아래 `.claude/agents/*.md`는 Claude 기준. Codex 동시 출력 시 같은 역할을 `.codex/agents/{name}.toml`로도 생성한다 (`references/runtime-adapters.md` §3-4).
86: 신규 에이전트 생성 전, `프로젝트/.claude/agents/`의 기존 에이전트와 중복 여부를 확인한다. 하네스를 반복 구축하다 보면 역할이 겹치는 에이전트가 다른 이름으로 누적되기 쉽다.
88: > 중복 분류 기준과 재사용 설계는 `references/agent-design-patterns.md`의 "에이전트 재사용 설계" 참조.
97: **모델 설정:** Claude 런타임은 모든 Agent 호출에 `model: "opus"`를 명시한다(추론 품질 = 하네스 품질). Codex 런타임은 `.codex/agents/*.toml`·내장 `worker`/`explorer`의 현재 Codex 모델/설정값을 사용(`opus` 파라미터와 무관).
103: > 정의 템플릿과 실제 파일 전문은 `references/agent-design-patterns.md`의 "에이전트 정의 구조" + `references/team-examples.md` 참조.
107: - QA의 핵심은 "존재 확인"이 아니라 **"경계면 교차 비교"** — API 응답과 프론트 훅을 동시에 읽고 shape을 비교
109: - 상세 가이드: `references/qa-agent-guide.md` 참조
114: 1. `references/dev-rules.md`, `references/tdd-doctrine.md`를 타겟 하네스의 `프로젝트/.claude/skills/{harness-name}/references/`로 **복사**한다 (Codex 동시 출력 시 `.agents/skills/{harness-name}/references/`에도 복사, 주입 실경로도 런타임별로 맞춘다).
115: 2. 에이전트 정의에 **타겟상대 실경로** 한 줄씩 넣는다 — `> 개발 규칙: \`.claude/skills/{harness-name}/references/dev-rules.md\` 준수.` / `> TDD 규율: \`.claude/skills/{harness-name}/references/tdd-doctrine.md\` 준수.`
121: 각 에이전트가 사용할 스킬을 `프로젝트/.claude/skills/{name}/SKILL.md`에 생성한다. **듀얼 런타임이면 `.agents/skills/{name}/`에도 동시 출력**(SKILL.md 포맷 동일, `references/runtime-adapters.md` §3·5). 상세 작성 가이드는 `references/skill-writing-guide.md` 참조.
125: 신규 스킬 생성 전, `프로젝트/.claude/skills/`의 기존 스킬과 중복 여부를 확인한다. 하네스를 반복 구축하다 보면 기능이 겹치는 스킬이 다른 이름으로 누적되기 쉽다.
127: > 중복 분류 기준과 일반화 패턴은 `references/skill-writing-guide.md`의 "스킬 재사용 설계" 참조.
132: skill-name/
133: ├── SKILL.md (필수)
137:     ├── scripts/    - 반복/결정적 작업용 실행 코드
138:     ├── references/ - 조건부 로딩하는 참조 문서
151: | **Lean하게 유지** | 컨텍스트 윈도우는 공공재다. SKILL.md 본문은 500줄 이내를 목표로, 무게를 벌지 않는 내용은 삭제하거나 references/로 이동한다. |
153: | **반복 코드는 번들링** | 테스트 실행에서 에이전트들이 공통으로 작성하는 스크립트가 발견되면 `scripts/`에 미리 번들링한다. |
... 78 more hits

## references/agent-design-patterns.md (301 lines; hits 44)
9: 팀 리더가 `TeamCreate`로 팀을 구성하고, 팀원들은 독립적인 Claude Code 인스턴스로 실행된다. 팀원들은 `SendMessage`로 직접 통신하고, 공유 작업 목록(`TaskCreate`/`TaskUpdate`)으로 자체 조율한다.
12: [리더] ←→ [팀원A] ←→ [팀원B]
18: - `TeamCreate`: 팀 생성 + 팀원 스폰
19: - `SendMessage({to: name})`: 특정 팀원에게 메시지
20: - `SendMessage({to: "all"})`: 브로드캐스트 (비용 높음, 드물게)
21: - `TaskCreate`/`TaskUpdate`: 공유 작업 목록 관리
24: - 팀원끼리 직접 대화, 도전, 검증 가능
25: - 리더가 거치지 않고 팀원 간 정보 교환
27: - 팀원이 유휴 상태가 되면 자동으로 리더에게 알림
32: - 중첩 팀 불가 (팀원이 자신의 팀 생성 불가)
34: - 토큰 비용 높음
50: - `Agent(prompt, subagent_type, run_in_background)`: 서브 에이전트 생성
54: - 결과가 메인 컨텍스트로 요약 반환
55: - 토큰 효율적
77: > **핵심 원칙:** 에이전트 팀이 기본이다. 서브 에이전트를 선택할 때는 "팀원 간 통신이 정말 불필요한가?"를 자문한다.
93: **팀 모드 적합성:** 순차 의존이 강해 팀 모드의 이점이 제한적. 단, 파이프라인 내 병렬 구간이 있으면 팀 모드 유용.
95: ### 2. 팬아웃/팬인 (Fan-out/Fan-in)
96: 병렬 처리 후 결과 통합. 독립적 작업을 동시 수행.
105: **예시:** 종합 리서치 — 공식/미디어/커뮤니티/배경 동시 조사 → 통합 보고
107: **팀 모드 적합성:** 에이전트 팀의 가장 자연스러운 패턴. **반드시 에이전트 팀으로 구성해야 한다.** 팀원들이 서로 발견을 공유하고 도전하며, 한 에이전트의 발견이 다른 에이전트의 조사 방향을 실시간으로 수정할 수 있어 단독 조사 대비 품질이 크게 향상된다.
121: ### 4. 생성-검증 (Producer-Reviewer)
129: **예시:** 웹툰 — artist 생성 → reviewer 검수 → 문제 패널 재생성
130: **주의:** 무한 루프 방지를 위해 최대 재시도 횟수(2~3회) 설정 필수.
131: **팀 모드 적합성:** 에이전트 팀이 유용. SendMessage로 생성자↔검증자 간 실시간 피드백 교환.
143: **예시:** 대규모 코드 마이그레이션 — 감독자가 파일 목록을 분석하고 워커들에게 배치 할당
146: **팀 모드 적합성:** 에이전트 팀의 공유 작업 목록이 감독자 패턴과 자연스럽게 매칭. TaskCreate로 작업 등록, 팀원들이 자체 요청.
159: **주의:** 깊이 3단계 이상은 지연과 컨텍스트 손실이 커짐. 2단계 이내 권장.
160: **팀 모드 적합성:** 에이전트 팀은 중첩 불가 (팀원이 팀 생성 불가). 1단계는 팀, 2단계는 서브 에이전트로 구현하거나, 평탄화하여 단일 팀으로 구성.
168: | **팬아웃 + 생성-검증** | 병렬 생성 후 각각 검증 | 다국어 번역 — 4개 언어 병렬 번역 → 각각 네이티브 리뷰어 검수 |
169: | **파이프라인 + 팬아웃** | 순차 단계 중 일부를 병렬화 | 분석(순차) → 구현(병렬) → 통합 테스트(순차) |
174: **기본적으로 모든 복합 패턴에 에이전트 팀을 사용한다.** 팀원 간 활발한 커뮤니케이션이 결과 품질의 핵심 동력이다.
187: 에이전트를 호출할 때 Agent 도구의 `subagent_type` 파라미터로 타입을 지정한다. 에이전트 팀의 팀원도 커스텀 에이전트 정의를 사용할 수 있다.
213: **모델:** 모든 에이전트는 `model: "opus"`를 사용한다. Agent 도구 호출 시 반드시 `model: "opus"` 파라미터를 명시한다.
247: - [타임아웃 시 행동]
258: | 병렬성 | 독립 실행 가능하면 분리 | 순차 종속이면 통합 고려 |
... 9 more hits

## references/dev-rules.md (29 lines; hits 1)
28: 팩토리는 이 파일을 타겟 하네스의 `.claude/skills/{harness-name}/references/dev-rules.md`로 **복사**한 뒤, 에이전트 정의 `## 작업 원칙`에 **타겟 실경로** 한 줄을 넣는다: `> 개발 규칙: \`.claude/skills/{harness-name}/references/dev-rules.md\` 준수.` 서브에이전트는 `[[ ]]`·플러그

## references/external-review-loop.md (88 lines; hits 29)
1: # 외부 리뷰 루프 (External Review Loop) — 방법론 & 생성 템플릿
5: 2. **생성 템플릿** — 코드/설계 도메인 하네스를 만들 때, 이 내용을 타겟 프로젝트의 `.claude/skills/external-review-loop/SKILL.md`로 생성한다(아래 frontmatter 포함). **단, 생성 전 `check-review-tools.sh`로 codex/gemini 연동을 확인**하고, 둘 다 미설치면 스킬을 만들지 않는다(Phase 4-6). 생성
7: **왜 외부 리뷰인가**: 내부 생성-검증/QA는 같은 세션·같은 컨텍스트라 *동일한 맹점*을 공유한다. 외부 독립 AI(codex/gemini)는 다른 관점으로 결함을 잡는다. 단, **합의=정답이 아니다** — 두 AI가 같은 답을 내도 공유 학습데이터로 인한 상관 오류일 수 있다. 합의는 약한 증거이며, **판정 권위는 오케스트레이터(실코드/실문서 대조)에 있다. 위임 금지.**
12: name: external-review-loop
13: description: 작업 단계 산출물(설계서·코드·문서)마다 외부 독립 AI(codex/gemini)에 리뷰 요청 → 오케스트레이터가 실코드 대조 전건 판정(확인/부분/이월/기각) → 확인분만 TDD 수정·커밋하는 단계 마감 게이트. "외부 리뷰", "codex/gemini 리뷰", "리뷰 게이트", "설계서/코드 리뷰해서 검증·수정", "이슈 검증하고 수정" 요청 시 반드시 사용. 사용
24: 2종 분담: **codex = 일반/정합성**, **gemini = 성능·안정성**. 산출물 유형에 맞게 "소스코드"→"설계서/문서" 치환.
34: gemini는 동일 틀 + "성능/속도·안정성 중심으로" 추가.
36: ## Step 2 — 병렬 비대화 실행
37: 먼저 `bash scripts/check-review-tools.sh`로 사용가능 도구 재확인(끝줄 `AVAILABLE:`). 사용가능 도구만 실행한다. 루트에서 백그라운드 병렬·읽기전용. 프롬프트·출력 모두 `_workspace/reviews/`에 보존(감사 — /tmp 금지).
39: mkdir -p _workspace/reviews
40: # 주의: codex exec는 stdin 열려 있으면 무한 대기 → 반드시 < /dev/null
41: # 타임아웃 필수(timeout 600s) — 무한 대기·좀비 프로세스 방지. exit 124 = 타임아웃.
42: timeout 600s codex exec --sandbox read-only "$(cat _workspace/reviews/{단계ID}_prompt_general.md)" < /dev/null \
43:   > _workspace/reviews/{단계ID}_codex.md 2>&1 &
44: # gemini는 자체 sandbox 옵션이 없다(읽기전용 보장 불가). 프롬프트로만 "읽기 전용 리뷰"를 제약하고,
46: timeout 600s gemini -p "$(cat _workspace/reviews/{단계ID}_prompt_perf.md)" < /dev/null \
47:   > _workspace/reviews/{단계ID}_gemini.md 2>&1 &
50: - Bash `run_in_background` 사용 가능. 타임아웃(exit 124) → 1회 재시도 → 재실패 시 해당 도구 누락 명시 후 단일 출처로 진행(**루프 차단 금지**).
51: - gemini `-p` 플래그가 없는 버전이면 `cat prompt.md | gemini` 또는 `gemini "$(cat prompt.md)"`로 대체.
52: - **도구 부재 폴백:** codex/gemini 미설치면 그 사실을 결과서에 명시하고 내부 QA만으로 진행.
55: 두 출력에서 이슈 추출 → 중복 병합(동일 대상·동일 결함=1건, 출처 병기) → 번호 재부여. 0건이면 "외부 리뷰 — 이슈 0건" 기록 후 종료.
70: `tdd-doctrine.md` 규율(Red→Green→Refactor, 구조/행위 분리). 다중 에이전트 병렬 시 파일권 명시 분리(병렬 충돌 = 1차 실패 주원인). 에이전트는 커밋·브랜치 금지, status는 `_workspace/status/`.
73: `{게이트명령}` 실행 → PASS. 게이트 없으면(설계서) 정본 정합성 재확인으로 대체. 테스트 리소스 간섭 게이트는 동시 실행 금지.
76: 1. 결과서에 `## 외부 리뷰 반영 ({일자} — {단계ID} {k}건)` § — 판정표·게이트 수치·출처(codex/gemini).
77: 2. 순서: 게이트 PASS → **승인 관문** → 단일 커밋(`fix: 외부 리뷰 {k}건 — {요지}`, Co-Authored-By).
78:    - 승인 관문 기본: 사용자 대기. `_workspace/.autonomous` 마커(또는 "자율로" 발화) 시 자동 통과.
79:    - **push는 자율이어도 기본 대기** — `_workspace/.autonomous-push` 마커 시만 자동.
86: - **정상**: 설계서 커밋 → codex 8 + gemini 3 → 중복 1 병합 → 10건 판정(확인6/부분2/이월1/기각1) → TDD 수정 → 게이트 PASS → 기록·커밋
87: - **에러**: gemini 타임아웃 ×2 → "gemini 미수집" 명시, codex 단독 진행 — 루프 완료

## references/orchestrator-template.md (340 lines; hits 71)
8: - **템플릿 D: Codex 런타임 어댑터** — Codex CLI에서 실행 시(팀 도구 부재). A/B를 순차·subprocess로 매핑
10: > 듀얼 런타임(Claude Code + Codex) 설계 전반은 `references/runtime-adapters.md` 참조. 오케스트레이터 상단에 "런타임 감지 후 분기" 한 줄을 넣고, 팀 도구 가용 시 A, 부재 시 D를 따른다.
16: 2명 이상의 에이전트가 협업할 때 **가장 먼저 검토하는 기본 모드**. `TeamCreate`로 팀을 구성하고, 공유 작업 목록과 `SendMessage`로 조율한다.
32: | 팀원 | 에이전트 타입 | 역할 | 스킬 | 출력 |
34: | {teammate-1} | {커스텀 또는 빌트인} | {역할} | {skill} | {output-file} |
35: | {teammate-2} | {커스텀 또는 빌트인} | {역할} | {skill} | {output-file} |
40: ### Phase 0: 컨텍스트 확인 (후속 작업 지원)
62:    TeamCreate(
65:        { name: "{teammate-1}", agent_type: "{type}", model: "opus", prompt: "{역할 설명 및 작업 지시}" },
66:        { name: "{teammate-2}", agent_type: "{type}", model: "opus", prompt: "{역할 설명 및 작업 지시}" },
74:    TaskCreate(tasks: [
82:    > 팀원당 5~6개 작업이 적정. 의존성이 있는 작업은 `depends_on`으로 명시.
86: **실행 방식:** 팀원들이 자체 조율
88: 팀원들은 공유 작업 목록에서 작업을 요청(claim)하고 독립적으로 수행한다.
91: **팀원 간 통신 규칙:**
92: - {teammate-1}은 {teammate-2}에게 {어떤 정보}를 SendMessage로 전달
94: - 팀원이 다른 팀원의 결과가 필요하면 SendMessage로 요청
98: | 팀원 | 출력 경로 |
104: - 팀원이 유휴 상태가 되면 자동 알림 수신
105: - 특정 팀원이 막혔을 때 SendMessage로 지시 또는 작업 재할당
109: 1. 모든 팀원의 작업 완료 대기 (TaskGet으로 상태 확인)
110: 2. 각 팀원의 산출물을 Read로 수집
115: 1. 팀원들에게 종료 요청 (SendMessage)
120: > **팀 재구성이 필요한 경우:** Phase별로 다른 전문가 조합이 필요하면, 현재 팀을 TeamDelete로 정리한 뒤 새 TeamCreate로 다음 Phase의 팀을 구성한다. 이전 팀의 산출물은 `_workspace/`에 보존되므로 새 팀이 Read로 접근 가능.
125: [리더] → TeamCreate → [teammate-1] ←SendMessage→ [teammate-2]
141: | 팀원 1명 실패/중지 | 리더가 감지 → SendMessage로 상태 확인 → 재시작 또는 대체 팀원 생성 |
142: | 팀원 과반 실패 | 사용자에게 알리고 진행 여부 확인 |
143: | 타임아웃 | 현재까지 수집된 부분 결과 사용, 미완료 팀원 종료 |
144: | 팀원 간 데이터 충돌 | 출처 명시 후 병기, 삭제하지 않음 |
152: 3. Phase 2에서 팀 구성 ({N}명 팀원 + {M}개 작업)
153: 4. Phase 3에서 팀원들이 자체 조율하며 작업 수행
161: 3. SendMessage로 상태 확인 → 재시작 시도
185: | {agent-1} | {빌트인 또는 커스텀} | {역할} | {skill} | {output-file} |
190: ### Phase 0: 컨텍스트 확인
197: ### Phase 2: 병렬 실행
... 36 more hits

## references/qa-agent-guide.md (229 lines; hits 5)
122: ### 3-3. "양쪽을 동시에 읽어라" 원칙
134: - 버그가 누적되어 수정 비용이 높아짐
196: ## 검증 방법: "양쪽 동시 읽기"
198: 경계면 검증은 반드시 **양쪽 코드를 동시에 열어** 비교한다:
226: | 생성 페이지 영원히 대기 | 상태전이→코드 | `template_approved` 전이 코드 누락 |

## references/runtime-adapters.md (65 lines; hits 29)
1: # 런타임 어댑터 — Claude Code / Codex 듀얼 런타임
3: 하네스 정본(스킬 본문·references·스크립트)은 **런타임 무관 마크다운**이다. Claude Code와 Codex는 커스터마이징 모델이 **거의 대칭**이다(둘 다 skills·agents·plugin·MCP·hooks 보유). 차이는 진입점 파일명·에이전트 정의 포맷·오케스트레이션 도구뿐. 그 셋만 어댑터로 흡수한다.
5: > 본 문서의 Codex 사실관계는 공식 Codex docs(developers.openai.com/codex) + `codex-cli 0.137.0` 기준 검증됨.
18: | 관심사 | Claude Code | Codex CLI | 이식성 |
20: | 인스트럭션 | `CLAUDE.md` | `AGENTS.md` (글로벌 `~/.codex` → 레포 루트→cwd concat, **가까운 쪽 우선**, 32KiB cap) | ✅ 듀얼 출력 |
21: | 스킬 | `.claude/skills/{n}/SKILL.md` (desc 자동 트리거) | `.agents/skills/{n}/SKILL.md` (desc 기반 implicit activation, `/skills`·`$name` 명시) | ✅ **포맷 동일** |
22: | 에이전트 정의 | `.claude/agents/{n}.md` | `.codex/agents/{n}.toml` (커스텀) + 내장 `default`/`worker`/`explorer` | 🟡 포맷 변환(md→toml) |
23: | 멀티 에이전트 | `TeamCreate`/`SendMessage`/`TaskCreate` | **네이티브 subagents**(병렬 spawn) 또는 `codex exec` subprocess | 🟡 어댑터 |
24: | 플러그인/배포 | `.claude-plugin/plugin.json` + marketplace | 플러그인 번들(skills+commands+MCP+hooks+marketplace) | 🟡 별도 매니페스트 |
25: | 설정 | settings.json | `.codex/config.toml`(프로젝트, trusted) + `~/.codex/config.toml` | 🟡 |
27: | 커스텀 슬래시 | `commands/*.md` | ❌ `~/.codex/prompts/*.md`·`$ARGUMENTS` 0.137.0 미지원 | 🔴 생략 |
28: | 외부 리뷰(codex/gemini 호출) | subprocess | subprocess (동일) | ✅ 공짜 |
34: - **Claude Code:** `.claude-plugin/plugin.json` + `skills/` 자동 발견 + `CLAUDE.md`. (현행)
35: - **Codex:** 레포 루트 `AGENTS.md` 자동 로드(루트→cwd concat, 가까운 쪽 우선). AGENTS.md 역할: 하네스 포인터 + "하네스 만들/고치려면 `skills/myharness/SKILL.md`를 따르라" + 오케스트레이션은 §4 어댑터. (Codex 스킬 auto-activation이 있으므로, 스킬을 `.agents/skills/`에 두면 AGENTS.m
38: - **스킬:** SKILL.md(name+description+본문) 포맷이 양쪽 동일. 생성 시 `.claude/skills/{n}/`와 `.agents/skills/{n}/` **양쪽에 출력**(또는 한쪽을 심링크). references/scripts도 동봉.
39: - **에이전트:** Claude는 `.claude/agents/{n}.md`. Codex는 `.codex/agents/{n}.toml`(커스텀) — 같은 역할/원칙/프로토콜을 TOML로 변환하거나, 단순 역할은 내장 `worker`/`explorer`에 프롬프트로 매핑. 교리 주입(dev-rules/tdd-doctrine) 실경로는 런타임별 스킬 경로로 맞춘다.
43: - **Claude Code:** `TeamCreate`+`SendMessage`+`TaskCreate` (템플릿 A).
44: - **Codex:** 네이티브 subagents로 병렬 specialized agents spawn(`/agent` 전환, `.codex/agents/*.toml`), 또는 독립 병렬이 필요하면 `codex exec` subprocess. 데이터는 `_workspace/` 파일 기반(템플릿 D).
45:   - `codex exec` 베스트 프랙티스(검증): 기본 read-only / 쓰기 작업만 `--sandbox workspace-write` / 스크립트 소비는 `--json` / 최종 메시지만 `-o`(`--output-last-message`) / 격리는 `--ignore-user-config` / stdin은 `< /dev/null`.
46: - external-review-loop 게이트는 양쪽 동일(이미 subprocess).
51: - 스킬 → `.claude/skills/` + `.agents/skills/`
52: - 에이전트 → `.claude/agents/{n}.md` + `.codex/agents/{n}.toml`
53: - (선택) MCP 필요 시 `.codex/config.toml`의 `mcp_servers.<id>` 동봉
56: - **Claude Code:** 플러그인 추가(`/plugin` 또는 marketplace.json). `skills/` 자동 인식.
57: - **Codex:** 레포 루트 `AGENTS.md`·`.agents/skills/`·`.codex/`는 trusted 프로젝트에서 자동 인식 — 별도 설치 최소. MCP는 `.codex/config.toml`에 동봉(trusted 한정, auth/telemetry 등 machine-local 키는 project-local 무시됨).
58: - 양쪽 자동화는 레포 루트 `install.sh` 참조. codex/gemini는 `check-review-tools.sh`로 점검.
61: - **커스텀 슬래시 프롬프트는 Codex 0.137.0 미지원** — Claude의 `commands/`에 1:1 대응 없음(애초에 하네스는 커맨드 안 만드니 영향 작음).
63: - **팀 통신 시맨틱 차이** — Claude의 SendMessage 실시간 토론 ↔ Codex subagents/파일 기반. 합의 중심 하네스는 Claude가 더 매끄러움.
64: - 결론(codex 자문): 듀얼 포팅 단위는 "AGENTS.md 인라인"만이 아니라 **plugin + skills + (선택)subagents + 프로젝트 `.codex/config.toml`**. 정본·리뷰·스크립트는 공유, 변환은 에이전트 포맷·오케스트레이션뿐.

## references/skill-testing-guide.md (308 lines; hits 21)
1: # 스킬 테스트 & 반복 개선 가이드
3: 하네스에서 생성한 스킬의 품질을 검증하고 반복적으로 개선하는 방법론. SKILL.md Phase 6의 보충 레퍼런스.
11: 3. [실행 테스트: With-skill vs Baseline](#3-실행-테스트-with-skill-vs-baseline)
14: 6. [반복 개선 루프](#6-반복-개선-루프)
50: "다운로드 폴더에 있는 'Q4_매출_최종_v2.xlsx'에서 C열(매출)과 D열(비용)을
75: ## 3. 실행 테스트: With-skill vs Baseline
79: 각 테스트 프롬프트에 대해 두 개의 서브에이전트를 **동시에** 스폰한다:
81: **With-skill 실행:**
85: 출력 경로: _workspace/iteration-N/eval-{id}/with_skill/outputs/
92: 출력 경로: _workspace/iteration-N/eval-{id}/without_skill/outputs/
183: **활용 시점:** "새 버전이 정말 더 나은가?"를 엄밀하게 확인하고 싶을 때. 일반적인 반복 개선에서는 생략 가능.
195: - 시간/토큰 트레이드오프 (스킬이 품질은 높이지만 비용도 높이는 경우)
199: ## 6. 반복 개선 루프
210: 4. **반복 작업은 번들링하라** — 모든 테스트 실행에서 동일한 헬퍼 스크립트가 생성되면, `scripts/`에 미리 포함한다.
212: ### 6-3. 반복 절차
219: 5. 다시 수정 → 반복
272: 5. 최대 5회 반복
274: > 이 과정은 `claude -p`를 사용하는 자동화 스크립트로 수행한다. 토큰 비용이 높으므로 스킬이 충분히 안정화된 후 최종 단계에서 실행한다.
283: {skill-name}-workspace/
287: │   │   ├── with_skill/
291: │   │   └── without_skill/

## references/skill-writing-guide.md (301 lines; hits 19)
3: 하네스에서 생성하는 스킬의 품질을 높이기 위한 상세 작성 가이드. SKILL.md Phase 4의 보충 레퍼런스.
13: 5. [Progressive Disclosure 패턴](#5-progressive-disclosure-패턴)
22: Description은 스킬의 유일한 트리거 메커니즘이다. Claude는 `available_skills` 목록에서 name + description만 보고 스킬 사용 여부를 결정한다.
94: ### 컨텍스트 절약
96: 컨텍스트 윈도우는 공공재다. 모든 문장이 토큰 비용을 정당화하는지 자문한다:
129: 입력: JWT 토큰 기반 사용자 인증 추가
139: ## 5. Progressive Disclosure 패턴
144: bigquery-skill/
145: ├── SKILL.md (개요 + 도메인 선택 가이드)
146: └── references/
162: docx-js로 새 문서를 생성한다. → [DOCX-JS.md](references/docx-js.md) 참조.
166: **추적 변경이 필요하면**: [REDLINING.md](references/redlining.md) 참조
198: | 동일한 다단계 접근법 반복 | 스킬 본문에 표준 절차로 기술 |
251: 실행 시간/토큰 측정:
268: - 스킬 생성 과정의 메타 정보 (테스트 결과, 반복 이력)
276: 신규 스킬 생성 전, 기존 스킬과의 중복을 확인한다. 하네스를 반복 구축하다 보면 기능이 겹치는 스킬이 다른 이름으로 누적되기 쉽다.
281: | 기존 스킬이 부분 포함이고 일반화 가능 | 기존 스킬을 일반화하여 확장 |
289: 일반화는 무한히 가능하므로 **의도된 책임 범위**에서 멈춘다. 의도된 도메인 특화는 유지하고, 우연한 종속만 제거한다.
300: 해당 스킬에 의존하는 에이전트의 동작이 변경될 수 있다. 확장 전 의존성을 확인하고, description에 확장된 사용 범위를 반영한다.

## references/tdd-doctrine.md (28 lines; hits 3)
3: 생성된 빌더/수정/QA 에이전트의 작업 원칙에 주입하는 표준 교리. Kent Beck TDD + Tidy First 기반. `external-review-loop.md` Step 5의 수정 규율이 이 문서를 따른다.
18: 커밋 조건(전부 충족): ① 모든 테스트 통과 ② 린터 경고 0 ③ 단일 논리 단위 ④ 메시지에 구조/행위 명시. 작고 잦은 커밋. **에이전트는 커밋·브랜치 금지** — 오케스트레이터가 게이트·승인 후 단일 커밋(승인 순서는 `external-review-loop.md` Step 7).
27: 팩토리는 이 파일을 타겟 하네스의 `.claude/skills/{harness-name}/references/tdd-doctrine.md`로 **복사**한 뒤, 코드 에이전트 정의 `## 작업 원칙`에 **타겟 실경로** 한 줄을 넣는다: `> TDD 규율: \`.claude/skills/{harness-name}/references/tdd-doctrine.md\` 준수.` 서브에이전트는 `

## references/team-examples.md (329 lines; hits 55)
12:     ├── TeamCreate(research-team)
13:     ├── TaskCreate(4개 조사 작업)
14:     ├── 팀원들이 자체 조율 (SendMessage)
21: | 팀원 | 에이전트 타입 | 역할 | 출력 |
39:   - TeamCreate(team_name: "research-team", members: [
45:   - TaskCreate(tasks: [
53:   - 4명의 팀원이 독립적으로 조사
54:   - 흥미로운 발견이 있으면 팀원 간 SendMessage로 공유
56:   - 상충 정보 발견 시 팀원 간 직접 토론
57:   - 각 팀원은 완료 시 파일 저장 + 리더에게 알림
65:   - 팀원들 종료 요청
73: official ──SendMessage──→ background  (관련 공식 발표 공유)
74: media ────SendMessage──→ background  (투자/인수 정보 공유)
75: community ─SendMessage──→ media      (커뮤니티 반응 중 미디어 관련 정보)
76: 모든 팀원 ──TaskUpdate──→ 공유 작업 목록  (진행률 업데이트)
77: 리더 ←───── 유휴 알림 ──── 완료된 팀원   (자동)
88: Phase 1 (병렬 — 에이전트 팀): worldbuilder + character-designer + plot-architect
89:   → 서로 SendMessage로 일관성 조율
91: Phase 3 (병렬 — 에이전트 팀): science-consultant + continuity-manager (리뷰)
92:   → 서로 SendMessage로 발견 공유
98: | 팀원 | 에이전트 타입 | 역할 | 스킬 |
103: | prose-stylist | 커스텀 | 문체 편집 + 집필 | write-scene, review-chapter |
117: 당신은 SF 소설의 세계관 설계 전문가입니다. 과학적 사실에 기반하되 상상력을 확장하여, 이야기가 펼쳐질 세계의 물리적·사회적·기술적 토대를 구축합니다.
136: - character-designer에게: 사회 구조, 계급 시스템, 직업군 정보 SendMessage
137: - plot-architect에게: 세계의 주요 갈등 구조, 위기 요소 SendMessage
139: - 세계관 변경 시 관련 팀원 전체에 브로드캐스트
154: Phase 1: TeamCreate(team_name: "novel-team", members: [worldbuilder, character-designer, plot-architect])
155:          TaskCreate([세계관 구축, 캐릭터 설계, 플롯 구조])
156:          → 팀원들이 자체 조율하며 병렬 작업
157:          → worldbuilder가 사회 구조 완성 시 character-designer에게 SendMessage
158:          → character-designer가 주인공 설정 시 plot-architect에게 SendMessage
164: Phase 3: 새 팀 생성 — TeamCreate(team_name: "review-team", members: [science-consultant, continuity-manager])
184: Phase 2: Agent(webtoon-reviewer) → 검수
193: | webtoon-reviewer | 커스텀 | 품질 검수 | review-webtoon, fix-webtoon-panel |
195: ### 에이전트 파일 전문 예시: `webtoon-reviewer.md`
... 20 more hits

## scripts/check-review-tools.sh (27 lines; hits 8)
2: # 외부 리뷰 도구(codex·gemini CLI) 연동 점검.
3: # 용도: 하네스 생성 시 external-review-loop 스킬을 만들지 결정 + 생성 스킬의 런타임 폴백.
4: # 사용: bash check-review-tools.sh
5: # 출력 끝줄: AVAILABLE: <codex|gemini 공백구분 | none>
10: for t in codex gemini; do
19: # 상태는 끝줄 AVAILABLE로만 전달한다. 항상 exit 0 — set -e/자동화 파이프라인이
22:   echo "AVAILABLE: none"
24:   echo "AVAILABLE: ${avail[*]}"

hook: PostToolUse
hook: PostToolUse Completed
codex
후보가 잡혔습니다. 이제 이슈별 근거가 되는 특정 범위만 확인합니다: 외부 리뷰 루프, Codex 어댑터, 오케스트레이터 템플릿의 대기/에러 처리, 테스트 가이드의 반복 실행 비용입니다.
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc "node -e 'const fs=require(\"fs\"),path=require(\"path\");const root=\"/Users/junghojang/Developments/myProject/myHarness/skills/myharness\";const ranges={\"references/external-review-loop.md\":[[36,53],[70,79]],\"references/orchestrator-template.md\":[[136,164],[190,258],[276,340]],\"references/skill-testing-guide.md\":[[75,95],[212,276]],\"references/agent-design-patterns.md\":[[1,36],[121,161],[213,283]],\"references/skill-writing-guide.md\":[[139,169],[251,274]],\"scripts/check-review-tools.sh\":[[1,27]],\"references/runtime-adapters.md\":[[20,46]]};for(const [rel,rs] of Object.entries(ranges)){const lines=fs.readFileSync(path.join(root,rel),\"utf8\").split(/\\r?\\n/);console.log("'`'"\\n## "'${rel}`);for(const [a,b] of rs){for(let i=a;i<=b&&i<=lines.length;i++)console.log(`${i}: ${lines[i-1]}`);}}'"'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:

## references/external-review-loop.md
36: ## Step 2 — 병렬 비대화 실행
37: 먼저 `bash scripts/check-review-tools.sh`로 사용가능 도구 재확인(끝줄 `AVAILABLE:`). 사용가능 도구만 실행한다. 루트에서 백그라운드 병렬·읽기전용. 프롬프트·출력 모두 `_workspace/reviews/`에 보존(감사 — /tmp 금지).
38: ```bash
39: mkdir -p _workspace/reviews
40: # 주의: codex exec는 stdin 열려 있으면 무한 대기 → 반드시 < /dev/null
41: # 타임아웃 필수(timeout 600s) — 무한 대기·좀비 프로세스 방지. exit 124 = 타임아웃.
42: timeout 600s codex exec --sandbox read-only "$(cat _workspace/reviews/{단계ID}_prompt_general.md)" < /dev/null \
43:   > _workspace/reviews/{단계ID}_codex.md 2>&1 &
44: # gemini는 자체 sandbox 옵션이 없다(읽기전용 보장 불가). 프롬프트로만 "읽기 전용 리뷰"를 제약하고,
45: # 쓰기 위험이 우려되면 read-only 권한 셸/복제본에서 실행할 것.
46: timeout 600s gemini -p "$(cat _workspace/reviews/{단계ID}_prompt_perf.md)" < /dev/null \
47:   > _workspace/reviews/{단계ID}_gemini.md 2>&1 &
48: wait
49: ```
50: - Bash `run_in_background` 사용 가능. 타임아웃(exit 124) → 1회 재시도 → 재실패 시 해당 도구 누락 명시 후 단일 출처로 진행(**루프 차단 금지**).
51: - gemini `-p` 플래그가 없는 버전이면 `cat prompt.md | gemini` 또는 `gemini "$(cat prompt.md)"`로 대체.
52: - **도구 부재 폴백:** codex/gemini 미설치면 그 사실을 결과서에 명시하고 내부 QA만으로 진행.
53: 
70: `tdd-doctrine.md` 규율(Red→Green→Refactor, 구조/행위 분리). 다중 에이전트 병렬 시 파일권 명시 분리(병렬 충돌 = 1차 실패 주원인). 에이전트는 커밋·브랜치 금지, status는 `_workspace/status/`.
71: 
72: ## Step 6 — 통합 게이트
73: `{게이트명령}` 실행 → PASS. 게이트 없으면(설계서) 정본 정합성 재확인으로 대체. 테스트 리소스 간섭 게이트는 동시 실행 금지.
74: 
75: ## Step 7 — 기록·커밋 (커밋 순서·자율 노브)
76: 1. 결과서에 `## 외부 리뷰 반영 ({일자} — {단계ID} {k}건)` § — 판정표·게이트 수치·출처(codex/gemini).
77: 2. 순서: 게이트 PASS → **승인 관문** → 단일 커밋(`fix: 외부 리뷰 {k}건 — {요지}`, Co-Authored-By).
78:    - 승인 관문 기본: 사용자 대기. `_workspace/.autonomous` 마커(또는 "자율로" 발화) 시 자동 통과.
79:    - **push는 자율이어도 기본 대기** — `_workspace/.autonomous-push` 마커 시만 자동.

## references/orchestrator-template.md
136: 
137: ## 에러 핸들링
138: 
139: | 상황 | 전략 |
140: |------|------|
141: | 팀원 1명 실패/중지 | 리더가 감지 → SendMessage로 상태 확인 → 재시작 또는 대체 팀원 생성 |
142: | 팀원 과반 실패 | 사용자에게 알리고 진행 여부 확인 |
143: | 타임아웃 | 현재까지 수집된 부분 결과 사용, 미완료 팀원 종료 |
144: | 팀원 간 데이터 충돌 | 출처 명시 후 병기, 삭제하지 않음 |
145: | 작업 상태 지연 | 리더가 TaskGet으로 확인 후 수동으로 TaskUpdate |
146: 
147: ## 테스트 시나리오
148: 
149: ### 정상 흐름
150: 1. 사용자가 {입력}을 제공
151: 2. Phase 1에서 {분석 결과} 도출
152: 3. Phase 2에서 팀 구성 ({N}명 팀원 + {M}개 작업)
153: 4. Phase 3에서 팀원들이 자체 조율하며 작업 수행
154: 5. Phase 4에서 산출물 통합하여 최종 결과 생성
155: 6. Phase 5에서 팀 정리
156: 7. 예상 결과: `{output-path}/{filename}` 생성
157: 
158: ### 에러 흐름
159: 1. Phase 3에서 {teammate-2}가 에러로 중지
160: 2. 리더가 유휴 알림 수신
161: 3. SendMessage로 상태 확인 → 재시작 시도
162: 4. 재시작 실패 시 {teammate-2} 작업을 {teammate-1}에게 재할당
163: 5. 나머지 결과로 Phase 4 진행
164: 6. 최종 보고서에 "{teammate-2} 영역 일부 미수집" 명시
190: ### Phase 0: 컨텍스트 확인
191: (Template A와 동일 — `_workspace/` 존재 여부 분기)
192: 
193: ### Phase 1: 준비
194: 1. 입력 분석
195: 2. `_workspace/` 생성 (초기 실행 시, 또는 새 실행에서 기존 `_workspace/`를 보관 디렉토리로 이동한 직후)
196: 
197: ### Phase 2: 병렬 실행
198: 단일 메시지에서 N개 Agent 도구를 동시 호출:
199: 
200: | 에이전트 | 입력 | 출력 | model | run_in_background |
201: |---------|------|------|-------|-------------------|
202: | {agent-1} | {소스} | `_workspace/{phase}_{agent}_{artifact}.md` | opus | true |
203: | {agent-2} | {소스} | `_workspace/{phase}_{agent}_{artifact}.md` | opus | true |
204: 
205: ### Phase 3: 통합
206: 1. 각 에이전트의 반환값 수집
207: 2. 파일 기반 산출물은 Read로 수집
208: 3. 통합 로직 적용 → 최종 산출물
209: 
210: ### Phase 4: 정리
211: 1. `_workspace/` 보존
212: 2. 결과 요약 보고
213: 
214: ## 에러 핸들링
215: - 에이전트 1개 실패: 1회 재시도. 재실패 시 누락 명시하고 진행
216: - 과반 실패: 사용자에게 알리고 진행 여부 확인
217: - 타임아웃: 현재까지 수집된 부분 결과 사용
218: ```
219: 
220: ---
221: 
222: ## 템플릿 C: 하이브리드 모드
223: 
224: Phase마다 다른 실행 모드를 사용한다. 각 Phase 상단에 `**실행 모드:** {팀 | 서브}`를 명시한다.
225: 
226: ```markdown
227: ---
228: name: {domain}-orchestrator
229: description: "{도메인} 오케스트레이터 (하이브리드). {키워드}. 후속 작업 키워드 포함."
230: ---
231: 
232: ## 실행 모드: 하이브리드
233: 
234: | Phase | 모드 | 이유 |
235: |-------|------|------|
236: | Phase 2 (병렬 수집) | 서브 에이전트 | 독립 자료 수집, 팀 통신 불필요 |
237: | Phase 3 (합의 통합) | 에이전트 팀 | 상충 데이터 토론·합의 필요 |
238: | Phase 4 (독립 검증) | 서브 에이전트 | QA 에이전트 1명이 객관 검증 |
239: 
240: ## 워크플로우
241: 
242: ### Phase 2: 병렬 자료 수집
243: **실행 모드:** 서브 에이전트
244: 
245: 단일 메시지에서 Agent 도구로 N개 에이전트 병렬 호출 (`run_in_background: true`).
246: 각 결과는 `_workspace/02_{agent}_raw.md`에 저장.
247: 
248: ### Phase 3: 합의 기반 통합
249: **실행 모드:** 에이전트 팀
250: 
251: 1. `TeamCreate`로 통합 팀 구성 (editor + fact-checker + synthesizer)
252: 2. `TaskCreate`로 작업 분배 — 모두 Phase 2의 `_workspace/02_*` 파일을 Read
253: 3. 팀원들이 `SendMessage`로 상충 데이터를 논의, 파일 기반으로 합의안 도출
254: 4. 최종 통합본 `_workspace/03_integrated.md` 생성
255: 5. `TeamDelete`로 팀 정리
256: 
257: ### Phase 4: 독립 검증
258: **실행 모드:** 서브 에이전트
276: ```markdown
277: ## 실행 모드: Codex 어댑터 (런타임 감지 후 분기)
278: 
279: > 팀 도구(TeamCreate 등) 가용 시 템플릿 A. 부재 시(=Codex) 아래.
280: 
281: ### 매핑 규칙
282: | 팀 모드(A) | Codex 어댑터(D) |
283: |-----------|----------------|
284: | TeamCreate(members) | Codex subagents 병렬 spawn(`.codex/agents/*.toml` 또는 내장 worker/explorer), `/agent`로 전환 |
285: | TaskCreate/depends_on | 단계 순서 실행(의존 = 선행 단계 산출물 파일 존재 확인) |
286: | SendMessage(팀원 통신) | `_workspace/` 파일로 전달 — 다음 단계가 Read |
287: | 완전 독립 병렬(CI 등) | `codex exec` subprocess 백그라운드 |
288: 
289: ### Phase 2: 실행
290: subagents 병렬 또는 순차. 각 산출물 `_workspace/{phase}_{agent}_{artifact}.md` 저장 → 다음 단계가 Read로 입력(메시지 대신 파일).
291: 
292: ### codex exec subprocess (독립 병렬·CI)
293: ```bash
294: mkdir -p _workspace
295: # stdin 폐쇄 필수(< /dev/null) — 안 하면 codex exec 무한 대기
296: codex exec --sandbox read-only --json -o _workspace/{phase}_{agent}.md \
297:   "$(cat _workspace/{agent}_prompt.md)" < /dev/null &
298: wait   # 여러 개 띄운 뒤
299: ```
300: - 베스트 프랙티스(검증): 기본 `read-only` / 쓰기만 `--sandbox workspace-write` / 스크립트 소비 `--json` / 최종 메시지만 `-o`(`--output-last-message`) / 격리 `--ignore-user-config`.
301: - 외부 리뷰 게이트(external-review-loop)는 양쪽 동일 — 이미 subprocess.
302: 
303: ### 에러 핸들링
304: - 실패 작업 1회 재시도 → 누락 명시 후 진행. 산출물 충돌: 출처 병기, 삭제 금지(A와 동일).
305: 
306: ### 데이터 흐름
307: [오케스트레이터] → subagents/순차/codex exec → `_workspace/*.md` → Read 통합 → 최종 산출물
308: ```
309: 
310: > Codex 진입점(AGENTS.md)·스킬 경로(`.agents/skills/`)·설치·한계는 `references/runtime-adapters.md`.
311: 
312: ---
313: 
314: ## 작성 원칙
315: 
316: 1. **실행 모드를 먼저 명시** — 오케스트레이터 상단에 "에이전트 팀" / "서브 에이전트" / "하이브리드" / "Codex 어댑터" 중 하나 명시. 듀얼 런타임이면 "런타임 감지 후 A 또는 D" 명시. 하이브리드면 Phase별 모드 표 필수
317: 2. **팀 모드는 TeamCreate/SendMessage/TaskCreate 사용법을 구체적으로** — 팀 구성, 작업 등록, 통신 규칙
318: 3. **서브 모드는 Agent 도구 파라미터를 완전히 명시** — name, subagent_type, prompt, run_in_background, model
319: 4. **파일 경로는 기준이 명확하게** — 프로젝트 루트 기준 경로로 통일(`_workspace/...`·`.claude/...`·`.agents/...`). 현재 디렉토리에 의존하는 모호한 상대 경로만 금지
320: 5. **Phase 간 의존성 명시** — 어떤 Phase가 어떤 Phase의 결과에 의존하는지. 하이브리드는 모드 전환 지점을 특히 강조
321: 6. **에러 핸들링은 현실적으로** — "모든 것이 성공한다"고 가정하지 않음
322: 7. **테스트 시나리오 필수** — 정상 1 + 에러 1 이상
323: 
324: ## description 작성 시 후속 작업 키워드
325: 
326: 오케스트레이터 description은 초기 실행 키워드만으로는 부족하다. 다음 후속 작업 표현을 반드시 포함하라:
327: 
328: - 재실행/다시 실행/업데이트/수정/보완
329: - "{도메인}의 {부분}만 다시"
330: - "이전 결과 기반으로", "결과 개선"
331: - 도메인 관련 일상적 요청 (예: 런치 전략 하네스라면 "런치", "홍보", "트렌딩" 등)
332: 
333: 후속 키워드가 없으면 첫 실행 후 하네스가 사실상 죽은 코드가 된다.
334: 
335: ## 실제 오케스트레이터 참고
336: 
337: 팬아웃/팬인 패턴의 오케스트레이터 기본 구조:
338: 준비 → Phase 0(컨텍스트 확인) → TeamCreate + TaskCreate → N개 팀원 병렬 실행 → Read + 통합 → 정리.
339: `references/team-examples.md`의 리서치 팀 예시를 참조.
340: 

## references/skill-testing-guide.md
75: ## 3. 실행 테스트: With-skill vs Baseline
76: 
77: ### 3-1. 비교 실행 구조
78: 
79: 각 테스트 프롬프트에 대해 두 개의 서브에이전트를 **동시에** 스폰한다:
80: 
81: **With-skill 실행:**
82: ```
83: 프롬프트: "{테스트 프롬프트}"
84: 스킬 경로: {스킬 경로}
85: 출력 경로: _workspace/iteration-N/eval-{id}/with_skill/outputs/
86: ```
87: 
88: **Baseline 실행:**
89: ```
90: 프롬프트: "{테스트 프롬프트}"  (동일)
91: 스킬: 없음
92: 출력 경로: _workspace/iteration-N/eval-{id}/without_skill/outputs/
93: ```
94: 
95: ### 3-2. Baseline 선택
212: ### 6-3. 반복 절차
213: 
214: ```
215: 1. 스킬 수정
216: 2. 새 iteration-N+1/ 디렉토리에 모든 테스트 케이스 재실행
217: 3. 사용자에게 결과 제시 (이전 iteration과 비교)
218: 4. 피드백 수집
219: 5. 다시 수정 → 반복
220: ```
221: 
222: **종료 조건:**
223: - 사용자가 만족
224: - 피드백이 모두 비어 있음 (모든 산출물 이상 없음)
225: - 의미 있는 개선이 더 이상 없음
226: 
227: ### 6-4. 초안 → 재검토 패턴
228: 
229: 스킬 수정 시, 초안을 작성한 후 **새로운 시각으로 다시 읽고** 개선한다. 한 번에 완벽하게 쓰려 하지 말고, 초안-검토 사이클을 거친다.
230: 
231: ---
232: 
233: ## 7. Description 트리거 검증
234: 
235: ### 7-1. 트리거 Eval 쿼리 작성
236: 
237: 20개의 eval 쿼리를 작성한다 — should-trigger 10개 + should-NOT-trigger 10개.
238: 
239: **쿼리 품질 기준:**
240: - 실제 사용자가 입력할 법한 구체적이고 자연스러운 문장
241: - 파일 경로, 개인적 맥락, 열 이름, 회사명 등 구체적 디테일 포함
242: - 길이, 톤, 형식 다양하게 혼합
243: - 명확한 정답보다 **경계 케이스(edge case)**에 집중
244: 
245: **Should-trigger 쿼리 (8~10개):**
246: - 다양한 표현의 같은 의도 (공식적/캐주얼)
247: - 스킬/파일 유형을 명시적으로 말하지 않지만 분명히 필요한 경우
248: - 비주류 사용 사례
249: - 다른 스킬과 경쟁하지만 이 스킬이 이겨야 하는 경우
250: 
251: **Should-NOT-trigger 쿼리 (8~10개):**
252: - **Near-miss가 핵심** — 키워드가 유사하지만 다른 도구/스킬이 적합한 쿼리
253: - 명백히 무관한 쿼리("피보나치 함수 작성")는 테스트 가치 없음
254: - 인접 도메인, 모호한 표현, 키워드 겹침 but 맥락이 다른 경우
255: 
256: ### 7-2. 기존 스킬 충돌 검증
257: 
258: 새 스킬의 description이 기존 스킬의 트리거 영역과 겹치지 않는지 확인한다:
259: 
260: 1. 기존 스킬 목록의 description을 수집
261: 2. 새 스킬의 should-trigger 쿼리가 기존 스킬을 잘못 트리거하지 않는지 확인
262: 3. 충돌 발견 시 description의 경계 조건을 더 명확히 기술
263: 
264: ### 7-3. 자동 최적화 (선택적 고급 기능)
265: 
266: description 최적화가 필요한 경우:
267: 
268: 1. 20개 eval 쿼리를 Train(60%) / Test(40%) split
269: 2. 현재 description으로 트리거 정확도 측정
270: 3. 실패 케이스를 분석하여 개선된 description 생성
271: 4. Test set 기준으로 best description 선택 (Train set 기준이 아님 — 과적합 방지)
272: 5. 최대 5회 반복
273: 
274: > 이 과정은 `claude -p`를 사용하는 자동화 스크립트로 수행한다. 토큰 비용이 높으므로 스킬이 충분히 안정화된 후 최종 단계에서 실행한다.
275: 
276: ---

## references/agent-design-patterns.md
1: # Agent Team Design Patterns
2: 
3: ## 실행 모드: 에이전트 팀 vs 서브 에이전트
4: 
5: 두 가지 실행 모드의 핵심 차이를 이해하고 적합한 모드를 선택한다.
6: 
7: ### 에이전트 팀 (Agent Teams) — 기본 모드
8: 
9: 팀 리더가 `TeamCreate`로 팀을 구성하고, 팀원들은 독립적인 Claude Code 인스턴스로 실행된다. 팀원들은 `SendMessage`로 직접 통신하고, 공유 작업 목록(`TaskCreate`/`TaskUpdate`)으로 자체 조율한다.
10: 
11: ```
12: [리더] ←→ [팀원A] ←→ [팀원B]
13:   ↕          ↕          ↕
14:   └──── 공유 작업 목록 ────┘
15: ```
16: 
17: **핵심 도구:**
18: - `TeamCreate`: 팀 생성 + 팀원 스폰
19: - `SendMessage({to: name})`: 특정 팀원에게 메시지
20: - `SendMessage({to: "all"})`: 브로드캐스트 (비용 높음, 드물게)
21: - `TaskCreate`/`TaskUpdate`: 공유 작업 목록 관리
22: 
23: **특징:**
24: - 팀원끼리 직접 대화, 도전, 검증 가능
25: - 리더가 거치지 않고 팀원 간 정보 교환
26: - 공유 작업 목록으로 자체 조율 (자체 작업 요청 가능)
27: - 팀원이 유휴 상태가 되면 자동으로 리더에게 알림
28: - 계획 승인 모드로 위험한 작업 전 검토 가능
29: 
30: **제약:**
31: - 세션당 한 팀만 **활성화** 가능 (단, Phase 간에 팀을 해체하고 새 팀 구성은 가능)
32: - 중첩 팀 불가 (팀원이 자신의 팀 생성 불가)
33: - 리더 고정 (이전 불가)
34: - 토큰 비용 높음
35: 
36: **팀 재구성 패턴:**
121: ### 4. 생성-검증 (Producer-Reviewer)
122: 생성 에이전트와 검증 에이전트가 쌍으로 동작.
123: 
124: ```
125: [생성] → [검증] → (문제시) → [생성] 재실행
126: ```
127: 
128: **적합한 경우:** 산출물의 품질 보장이 중요하고 객관적 검증 기준이 존재
129: **예시:** 웹툰 — artist 생성 → reviewer 검수 → 문제 패널 재생성
130: **주의:** 무한 루프 방지를 위해 최대 재시도 횟수(2~3회) 설정 필수.
131: **팀 모드 적합성:** 에이전트 팀이 유용. SendMessage로 생성자↔검증자 간 실시간 피드백 교환.
132: 
133: ### 5. 감독자 (Supervisor)
134: 중앙 에이전트가 작업 상태를 관리하며 하위 에이전트에 동적으로 작업을 분배.
135: 
136: ```
137:          ┌→ [워커A]
138: [감독자] ─┼→ [워커B]    ← 감독자가 상태를 보고 동적 분배
139:          └→ [워커C]
140: ```
141: 
142: **적합한 경우:** 작업량이 가변적이거나 런타임에 작업 분배를 결정해야 할 때
143: **예시:** 대규모 코드 마이그레이션 — 감독자가 파일 목록을 분석하고 워커들에게 배치 할당
144: **팬아웃과의 차이:** 팬아웃은 사전에 작업을 고정 분배, 감독자는 진행 상황을 보며 동적 조정
145: **주의:** 감독자가 병목이 되지 않도록 위임 단위를 충분히 크게 설정.
146: **팀 모드 적합성:** 에이전트 팀의 공유 작업 목록이 감독자 패턴과 자연스럽게 매칭. TaskCreate로 작업 등록, 팀원들이 자체 요청.
147: 
148: ### 6. 계층적 위임 (Hierarchical Delegation)
149: 상위 에이전트가 하위 에이전트에 재귀적으로 위임. 복잡한 문제를 단계적으로 분해.
150: 
151: ```
152: [총괄] → [팀장A] → [실무자A1]
153:                   → [실무자A2]
154:        → [팀장B] → [실무자B1]
155: ```
156: 
157: **적합한 경우:** 문제가 자연스럽게 계층적으로 분해되는 구조
158: **예시:** 풀스택 앱 개발 — 총괄 → 프론트엔드팀장 → (UI/로직/테스트) + 백엔드팀장 → (API/DB/테스트)
159: **주의:** 깊이 3단계 이상은 지연과 컨텍스트 손실이 커짐. 2단계 이내 권장.
160: **팀 모드 적합성:** 에이전트 팀은 중첩 불가 (팀원이 팀 생성 불가). 1단계는 팀, 2단계는 서브 에이전트로 구현하거나, 평탄화하여 단일 팀으로 구성.
161: 
213: **모델:** 모든 에이전트는 `model: "opus"`를 사용한다. Agent 도구 호출 시 반드시 `model: "opus"` 파라미터를 명시한다.
214: 
215: ## 에이전트 정의 구조
216: 
217: ```markdown
218: ---
219: name: agent-name
220: description: "1-2문장 역할 설명. 트리거 키워드 나열."
221: ---
222: 
223: # Agent Name — 역할 한줄 요약
224: 
225: 당신은 [도메인]의 [역할] 전문가입니다.
226: 
227: ## 핵심 역할
228: 1. 역할1
229: 2. 역할2
230: 
231: ## 작업 원칙
232: - 원칙1
233: - 원칙2
234: 
235: ## 입력/출력 프로토콜
236: - 입력: [어디서 무엇을 받는지]
237: - 출력: [어디에 무엇을 쓰는지]
238: - 형식: [파일 포맷, 구조]
239: 
240: ## 팀 통신 프로토콜 (에이전트 팀 모드)
241: - 메시지 수신: [누구로부터 어떤 메시지를 받는지]
242: - 메시지 발신: [누구에게 어떤 메시지를 보내는지]
243: - 작업 요청: [공유 작업 목록에서 어떤 유형의 작업을 요청하는지]
244: 
245: ## 에러 핸들링
246: - [실패 시 행동]
247: - [타임아웃 시 행동]
248: 
249: ## 협업
250: - 다른 에이전트와의 관계
251: ```
252: 
253: ## 에이전트 분리 기준
254: 
255: | 기준 | 분리 | 통합 |
256: |------|------|------|
257: | 전문성 | 영역이 다르면 분리 | 영역이 겹치면 통합 |
258: | 병렬성 | 독립 실행 가능하면 분리 | 순차 종속이면 통합 고려 |
259: | 컨텍스트 | 컨텍스트 부담이 크면 분리 | 가볍고 빠르면 통합 |
260: | 재사용성 | 다른 팀에서도 쓰면 분리 | 이 팀에서만 쓰면 통합 고려 |
261: 
262: ## 에이전트 재사용 설계
263: 
264: 신규 에이전트 생성 전, 기존 에이전트와의 중복을 확인한다. 하네스를 반복 구축하다 보면 역할이 겹치는 에이전트가 다른 이름으로 누적되기 쉽다.
265: 
266: | 상황 | 조치 |
267: |------|------|
268: | 기존 에이전트가 신규 역할을 완전히 포함 | 신규 생성 금지 — 기존 에이전트 재사용 |
269: | 기존 에이전트가 부분 포함이고 일반화 가능 | 기존 에이전트를 일반화하여 확장 |
270: | 도메인 특화가 의도된 부분 포함 | 신규 생성 진행 — 별개 에이전트로 유지 |
271: | 역할 범위가 완전히 다름 | 신규 생성 진행 |
272: 
273: **원칙:** 하나의 에이전트가 하나의 역할에 집중할수록 재사용성이 높고 중복이 줄어든다. 역할이 두 가지 이상이면 분리할 수 있는지 먼저 검토한다.
274: 
275: **기존 에이전트 일반화 시:** 해당 에이전트에 의존하는 오케스트레이터·팀 구성의 동작이 변경될 수 있다. 확장 전 의존성을 확인하고, 일반화 후 드라이런으로 기존 동작 유지를 확인한다.
276: 
277: ## 스킬 vs 에이전트 구분
278: 
279: | 구분 | 스킬 (Skill) | 에이전트 (Agent) |
280: |------|-------------|-----------------|
281: | 정의 | 절차적 지식 + 도구 번들 | 전문가 페르소나 + 행동 원칙 |
282: | 위치 | `.claude/skills/` | `.claude/agents/` |
283: | 트리거 | 사용자 요청 키워드 매칭 | Agent 도구로 명시적 호출 |

## references/skill-writing-guide.md
139: ## 5. Progressive Disclosure 패턴
140: 
141: ### 패턴 1: 도메인별 분리
142: 
143: ```
144: bigquery-skill/
145: ├── SKILL.md (개요 + 도메인 선택 가이드)
146: └── references/
147:     ├── finance.md (매출, 빌링 메트릭)
148:     ├── sales.md (기회, 파이프라인)
149:     └── product.md (API 사용량, 기능)
150: ```
151: 
152: 사용자가 매출에 대해 물으면 finance.md만 로드.
153: 
154: ### 패턴 2: 조건부 상세
155: 
156: (아래는 가상 예시 — `docx-js.md`·`redlining.md`는 실제 파일이 아니라 작성 패턴 설명용.)
157: 
158: ```markdown
159: # DOCX 처리
160: 
161: ## 문서 생성
162: docx-js로 새 문서를 생성한다. → [DOCX-JS.md](references/docx-js.md) 참조.
163: 
164: ## 문서 편집
165: 단순 편집은 XML을 직접 수정.
166: **추적 변경이 필요하면**: [REDLINING.md](references/redlining.md) 참조
167: ```
168: 
169: ### 패턴 3: 대형 레퍼런스 파일 구조
251: 실행 시간/토큰 측정:
252: 
253: ```json
254: {
255:   "total_tokens": 84852,
256:   "duration_ms": 23332,
257:   "total_duration_seconds": 23.3
258: }
259: ```
260: 
261: 서브에이전트 완료 알림에서 `total_tokens`와 `duration_ms`를 즉시 저장한다. 이 데이터는 알림 시점에만 접근 가능하고 이후 복구 불가.
262: 
263: ---
264: 
265: ## 8. 스킬에 포함하지 않을 것
266: 
267: - README.md, CHANGELOG.md, INSTALLATION_GUIDE.md 등 부가 문서
268: - 스킬 생성 과정의 메타 정보 (테스트 결과, 반복 이력)
269: - 사용자 대상 설명서 (스킬은 AI 에이전트를 위한 지시서)
270: - 이미 Claude가 알고 있는 일반적 지식
271: 
272: ---
273: 
274: ## 9. 스킬 재사용 설계

## scripts/check-review-tools.sh
1: #!/usr/bin/env bash
2: # 외부 리뷰 도구(codex·gemini CLI) 연동 점검.
3: # 용도: 하네스 생성 시 external-review-loop 스킬을 만들지 결정 + 생성 스킬의 런타임 폴백.
4: # 사용: bash check-review-tools.sh
5: # 출력 끝줄: AVAILABLE: <codex|gemini 공백구분 | none>
6: # 종료코드: 0 = 1개 이상 사용가능, 1 = 전무.
7: set -uo pipefail
8: 
9: avail=()
10: for t in codex gemini; do
11:   if command -v "$t" >/dev/null 2>&1; then
12:     echo "$t: ✓ 연동됨 ($(command -v "$t"))"
13:     avail+=("$t")
14:   else
15:     echo "$t: ✗ 미설치"
16:   fi
17: done
18: 
19: # 상태는 끝줄 AVAILABLE로만 전달한다. 항상 exit 0 — set -e/자동화 파이프라인이
20: # 출력 파싱 전에 중단되는 것을 막기 위함(none도 정상 신호).
21: if [ "${#avail[@]}" -eq 0 ]; then
22:   echo "AVAILABLE: none"
23: else
24:   echo "AVAILABLE: ${avail[*]}"
25: fi
26: exit 0
27: 

## references/runtime-adapters.md
20: | 인스트럭션 | `CLAUDE.md` | `AGENTS.md` (글로벌 `~/.codex` → 레포 루트→cwd concat, **가까운 쪽 우선**, 32KiB cap) | ✅ 듀얼 출력 |
21: | 스킬 | `.claude/skills/{n}/SKILL.md` (desc 자동 트리거) | `.agents/skills/{n}/SKILL.md` (desc 기반 implicit activation, `/skills`·`$name` 명시) | ✅ **포맷 동일** |
22: | 에이전트 정의 | `.claude/agents/{n}.md` | `.codex/agents/{n}.toml` (커스텀) + 내장 `default`/`worker`/`explorer` | 🟡 포맷 변환(md→toml) |
23: | 멀티 에이전트 | `TeamCreate`/`SendMessage`/`TaskCreate` | **네이티브 subagents**(병렬 spawn) 또는 `codex exec` subprocess | 🟡 어댑터 |
24: | 플러그인/배포 | `.claude-plugin/plugin.json` + marketplace | 플러그인 번들(skills+commands+MCP+hooks+marketplace) | 🟡 별도 매니페스트 |
25: | 설정 | settings.json | `.codex/config.toml`(프로젝트, trusted) + `~/.codex/config.toml` | 🟡 |
26: | MCP | settings/플러그인 | `config.toml`의 `mcp_servers.<id>` | ✅ |
27: | 커스텀 슬래시 | `commands/*.md` | ❌ `~/.codex/prompts/*.md`·`$ARGUMENTS` 0.137.0 미지원 | 🔴 생략 |
28: | 외부 리뷰(codex/gemini 호출) | subprocess | subprocess (동일) | ✅ 공짜 |
29: | 스크립트(scripts/) | bash | bash | ✅ |
30: 
31: 핵심: 스킬 본문은 **포맷 동일** → 거의 그대로 공유. 진짜 변환이 필요한 건 에이전트 정의(md→toml)와 오케스트레이션뿐.
32: 
33: ## 2. 진입점 어댑터
34: - **Claude Code:** `.claude-plugin/plugin.json` + `skills/` 자동 발견 + `CLAUDE.md`. (현행)
35: - **Codex:** 레포 루트 `AGENTS.md` 자동 로드(루트→cwd concat, 가까운 쪽 우선). AGENTS.md 역할: 하네스 포인터 + "하네스 만들/고치려면 `skills/myharness/SKILL.md`를 따르라" + 오케스트레이션은 §4 어댑터. (Codex 스킬 auto-activation이 있으므로, 스킬을 `.agents/skills/`에 두면 AGENTS.md는 얇게 가능.)
36: 
37: ## 3. 스킬·에이전트 어댑터
38: - **스킬:** SKILL.md(name+description+본문) 포맷이 양쪽 동일. 생성 시 `.claude/skills/{n}/`와 `.agents/skills/{n}/` **양쪽에 출력**(또는 한쪽을 심링크). references/scripts도 동봉.
39: - **에이전트:** Claude는 `.claude/agents/{n}.md`. Codex는 `.codex/agents/{n}.toml`(커스텀) — 같은 역할/원칙/프로토콜을 TOML로 변환하거나, 단순 역할은 내장 `worker`/`explorer`에 프롬프트로 매핑. 교리 주입(dev-rules/tdd-doctrine) 실경로는 런타임별 스킬 경로로 맞춘다.
40: 
41: ## 4. 오케스트레이션 어댑터
42: 오케스트레이터 상단에 "런타임 감지 후 분기" 명시.
43: - **Claude Code:** `TeamCreate`+`SendMessage`+`TaskCreate` (템플릿 A).
44: - **Codex:** 네이티브 subagents로 병렬 specialized agents spawn(`/agent` 전환, `.codex/agents/*.toml`), 또는 독립 병렬이 필요하면 `codex exec` subprocess. 데이터는 `_workspace/` 파일 기반(템플릿 D).
45:   - `codex exec` 베스트 프랙티스(검증): 기본 read-only / 쓰기 작업만 `--sandbox workspace-write` / 스크립트 소비는 `--json` / 최종 메시지만 `-o`(`--output-last-message`) / 격리는 `--ignore-user-config` / stdin은 `< /dev/null`.
46: - external-review-loop 게이트는 양쪽 동일(이미 subprocess).

hook: PostToolUse
hook: PostToolUse Completed
codex
정책이 이미 개선한 부분도 있습니다: 외부 리뷰는 병렬 실행, stdin 폐쇄, 600초 timeout, 1회 재시도, 도구 부재 폴백을 명시합니다. 남은 문제는 상한·동시성·비용 예산이 “정책 문장” 수준이고 실행 가능한 제한값이 약한 지점입니다.
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc "node -e 'const fs=require(\"fs\"),path=require(\"path\");const root=\"/Users/junghojang/Developments/myProject/myHarness/skills/myharness\";for(const rel of [\"SKILL.md\",\"references/agent-design-patterns.md\",\"references/orchestrator-template.md\",\"references/skill-writing-guide.md\",\"references/skill-testing-guide.md\",\"references/team-examples.md\"]){const s=fs.readFileSync(path.join(root,rel),\"utf8\");const lines=s.split(/\\r?\\n/);const hasToc=/목차|Table of Contents|## 목차|\\[.*\\]\\(#/.test(s.slice(0,2000));console.log("'`${rel}: ${lines.length} lines, top2KB_ToC=${hasToc}`)}'"'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
SKILL.md: 500 lines, top2KB_ToC=false
references/agent-design-patterns.md: 301 lines, top2KB_ToC=false
references/orchestrator-template.md: 340 lines, top2KB_ToC=false
references/skill-writing-guide.md: 301 lines, top2KB_ToC=true
references/skill-testing-guide.md: 308 lines, top2KB_ToC=true
references/team-examples.md: 329 lines, top2KB_ToC=false

hook: PostToolUse
hook: PostToolUse Completed
codex
마지막으로 `SKILL.md`의 정책 원문 라인만 더 확인합니다. 최종 보고서는 사용자 지정 형식으로 severity별 정렬해 제출하겠습니다.
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc "node -e 'const fs=require(\"fs\"),path=require(\"path\");const f=\"/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md\";const lines=fs.readFileSync(f,\"utf8\").split(/\\r?\\n/);for(const [a,b] of [[151,171],[221,237],[239,256],[333,352],[365,392],[466,497]]){console.log("'`'"\\n## SKILL.md "'${a}-${b}`);for(let i=a;i<=b&&i<=lines.length;i++)console.log(`${i}: ${lines[i-1]}`)}'"'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:

## SKILL.md 151-171
151: | **Lean하게 유지** | 컨텍스트 윈도우는 공공재다. SKILL.md 본문은 500줄 이내를 목표로, 무게를 벌지 않는 내용은 삭제하거나 references/로 이동한다. |
152: | **일반화하라** | 특정 예시에만 맞는 좁은 규칙보다, 원리를 설명하여 다양한 입력에 대응할 수 있게 한다. 오버피팅 금지. |
153: | **반복 코드는 번들링** | 테스트 실행에서 에이전트들이 공통으로 작성하는 스크립트가 발견되면 `scripts/`에 미리 번들링한다. |
154: | **명령형으로 작성** | "~한다", "~하라" 형태의 명령형/지시형 어조를 사용한다. |
155: 
156: #### 4-4. Progressive Disclosure (단계적 정보 공개)
157: 
158: 스킬은 3단계 로딩 시스템으로 컨텍스트를 관리한다:
159: 
160: | 단계 | 로딩 시점 | 크기 목표 |
161: |------|----------|----------|
162: | **Metadata** (name + description) | 항상 컨텍스트에 존재 | ~100단어 |
163: | **SKILL.md 본문** | 스킬 트리거 시 | <500줄 |
164: | **references/** | 필요할 때만 | 무제한 (스크립트는 로딩 없이 실행 가능) |
165: 
166: **크기 관리 규칙:**
167: - SKILL.md가 500줄에 근접하면 세부 내용을 references/로 분리하고, 본문에 "언제 이 파일을 읽으라"는 포인터를 남긴다
168: - 300줄 이상의 reference 파일에는 상단에 **목차(ToC)**를 포함한다
169: - 도메인/프레임워크별 변형이 있으면 references/ 하위에 도메인별로 분리하여, 관련 파일만 로드한다
170: 
171: ```

## SKILL.md 221-237
221: [오케스트레이터]
222:     ├── Agent(agent-1, run_in_background=true)
223:     ├── Agent(agent-2, run_in_background=true)
224:     ├── 결과 대기 및 수집
225:     └── 통합 산출물 생성
226: ```
227: 
228: **하이브리드 패턴:**
229: Phase마다 다른 모드를 섞어 구성한다. 자주 쓰이는 조합:
230: - **병렬 수집(서브) → 합의 통합(팀)**: Phase 2에서 서브 에이전트로 독립 자료를 병렬 수집 → Phase 3에서 팀을 만들어 토론·합의 기반 통합
231: - **팀 생성(팀) → 검증(서브)**: Phase 2에서 팀이 초안 생성 → Phase 3에서 단일 서브 에이전트가 독립 검증
232: - **Phase 간 팀 재구성**: 각 Phase마다 `TeamDelete` 후 새 `TeamCreate`, 사이에 서브 에이전트 호출 삽입
233: 
234: 하이브리드 선택 시 오케스트레이터의 각 Phase 섹션 상단에 해당 Phase의 실행 모드를 명시한다 (예: `**실행 모드:** 에이전트 팀`).
235: 
236: #### 5-1. 데이터 전달 프로토콜
237: 

## SKILL.md 239-256
239: 
240: | 전략 | 방식 | 적용 모드 | 적합한 경우 |
241: |------|------|----------|-----------|
242: | **메시지 기반** | `SendMessage`로 팀원 간 직접 통신 | 팀 | 실시간 조율, 피드백 교환, 가벼운 상태 전달 |
243: | **태스크 기반** | `TaskCreate`/`TaskUpdate`로 작업 상태 공유 | 팀 | 진행상황 추적, 의존 관계 관리, 작업 자체 요청 |
244: | **파일 기반** | 약속된 경로에 파일을 쓰고 읽음 | 팀 + 서브 | 대용량 데이터, 구조화된 산출물, 감사 추적 필요 |
245: | **반환값 기반** | `Agent` 도구의 반환 메시지 | 서브 | 서브 에이전트 결과를 메인이 직접 수집 |
246: 
247: **권장 조합 (팀 모드):** 태스크 기반(조율) + 파일 기반(산출물) + 메시지 기반(실시간 소통)
248: **권장 조합 (서브 모드):** 반환값 기반(결과 수집) + 파일 기반(대용량 산출물)
249: **하이브리드:** 각 Phase의 실행 모드에 맞춰 해당 조합 적용
250: 
251: 파일 기반 전달 시 규칙:
252: - 작업 디렉토리 하위에 `_workspace/` 폴더를 만들어 중간 산출물 저장
253: - 파일명 컨벤션: `{phase}_{agent}_{artifact}.{ext}` (예: `01_analyst_requirements.md`)
254: - 최종 산출물만 사용자 지정 경로에 출력, 중간 파일(`_workspace/`)은 보존 (사후 검증·감사 추적용)
255: - **결과서-RAG 연속성:** 각 결과서 상단에 `## 다음 단계 참조` 블록 의무 — 미해결 이슈·핵심 결정과 이유·다음 단계 안내. 다음 단계 사전작업은 직전 결과서의 이 블록을 **먼저 읽고** 시작한다(판단 연속성, 맥락 단절 방지, 비용 ~0).
256: 

## SKILL.md 333-352
333: - **자율 노브:** `프로젝트/_workspace/.autonomous` 마커(또는 "자율로"·"승인 생략" 발화) 시 승인 자동 통과 → 커밋. 권한모드(bypassPermissions)는 스킬이 못 읽으므로 마커/발화로 명시. 마커 ON이어도 외부리뷰·판정·게이트는 그대로(인간 승인 한 스텝만 생략).
334: - **push는 자율이어도 기본 대기**(외부 송출·되돌리기 어려움) — `_workspace/.autonomous-push` 마커 시만 자동.
335: 
336: ### Phase 6: 검증 및 테스트
337: 
338: 생성된 하네스를 검증한다. 상세 테스트 방법론은 `references/skill-testing-guide.md` 참조.
339: 
340: #### 6-1. 구조 검증
341: 
342: - 모든 에이전트 파일이 올바른 위치에 있는지 확인
343: - 스킬의 frontmatter(name, description) 검증
344: - 에이전트 간 참조 일관성 확인
345: - 커맨드가 생성되지 않았는지 확인
346: 
347: #### 6-2. 실행 모드별 검증
348: 
349: - **에이전트 팀**: 팀원 간 통신 경로, 작업 의존성, 팀 크기 적정성 확인
350: - **서브 에이전트**: 각 에이전트의 입출력 연결, `run_in_background` 설정, 반환값 수집 로직 확인
351: - **하이브리드**: 각 Phase의 실행 모드가 오케스트레이터에 명시되었는지, Phase 경계에서 데이터 전달이 끊기지 않는지 확인 (팀 → 서브 전환 시 팀의 산출물이 서브의 입력으로 연결되는지)
352: 

## SKILL.md 365-392
365: 4. **반복 개선 루프** — 테스트 결과에서 문제가 발견되면:
366:    - 피드백을 **일반화**하여 스킬을 수정한다 (특정 예시에만 맞는 좁은 수정 금지)
367:    - 수정 후 재테스트한다
368:    - 사용자가 만족하거나 의미 있는 개선이 더 이상 없을 때까지 반복한다
369: 
370: 5. **반복 패턴 번들링** — 테스트 실행에서 에이전트들이 공통으로 작성하는 코드(예: 모든 테스트에서 동일한 헬퍼 스크립트를 생성)가 발견되면, 해당 코드를 `scripts/`에 미리 번들링한다.
371: 
372: #### 6-4. 트리거 검증
373: 
374: 각 스킬의 description이 올바르게 트리거되는지 검증한다:
375: 
376: 1. **Should-trigger 쿼리** (8~10개) — 스킬을 트리거해야 하는 다양한 표현 (공식적/캐주얼, 명시적/암시적)
377: 2. **Should-NOT-trigger 쿼리** (8~10개) — 키워드가 유사하지만 이 스킬이 아닌 다른 도구/스킬이 적합한 "near-miss" 쿼리
378: 
379: **near-miss 작성 핵심:** "피보나치 함수 작성" 같이 명백히 무관한 쿼리는 테스트 가치가 없다. "이 엑셀 파일의 차트를 PNG로 추출해줘" (xlsx 스킬 vs 이미지 변환)처럼 **경계가 모호한 쿼리**가 좋은 테스트 케이스다.
380: 
381: 기존 스킬과의 트리거 충돌도 이 단계에서 확인한다.
382: 
383: #### 6-5. 드라이런 테스트
384: 
385: - 오케스트레이터 스킬의 Phase 순서가 논리적인지 검토
386: - 데이터 전달 경로에 빈 구간(dead link)이 없는지 확인
387: - 모든 에이전트의 입력이 이전 Phase의 출력과 매칭되는지 확인
388: - 에러 시나리오별 폴백 경로가 실행 가능한지 확인
389: 
390: #### 6-6. 테스트 시나리오 작성
391: 
392: - 오케스트레이터 스킬에 `## 테스트 시나리오` 섹션 추가

## SKILL.md 466-497
466: ## 산출물 체크리스트
467: 
468: 생성 완료 후 확인:
469: 
470: - [ ] `.claude/agents/`(정의 파일, 빌트인 타입도 필수) + `.claude/skills/`(SKILL.md + references/) 생성
471: - [ ] 오케스트레이터 스킬 1개 (데이터 흐름 + 에러 핸들링 + 테스트 시나리오 포함)
472: - [ ] 실행 모드 명시 (에이전트 팀 / 서브 에이전트 / 하이브리드 중 선택, 하이브리드면 Phase별 모드 기재)
473: - [ ] Claude Agent 호출에 `model: "opus"` 명시 (Codex는 런타임 모델/설정)
474: - [ ] 신규 에이전트·스킬 생성 전 기존 중복 검토 완료 (Phase 3-0, 4-0)
475: - [ ] `.claude/commands/` — 아무것도 생성하지 않음
476: - [ ] 기존 에이전트/스킬과 충돌 없음
477: - [ ] 스킬 description이 적극적("pushy")으로 작성됨 — **후속 작업 키워드 포함**
478: - [ ] SKILL.md 본문이 500줄 이내, 초과 시 references/ 분리
479: - [ ] 테스트 프롬프트 2~3개 실행 검증 + 트리거 검증(should/should-NOT) 완료
480: - [ ] **CLAUDE.md 포인터 등록 + 변경 이력에 에이전트/스킬 추가·삭제·수정 기록**
481: - [ ] **오케스트레이터 Phase 0에 컨텍스트 확인 단계** (초기/후속/부분 재실행 판별)
482: - [ ] (듀얼 런타임) `.codex/agents/*.toml` 생성 + `.claude`↔`.codex` 역할 동등성 + `.agents/skills/` references/scripts 동봉 검증
483: - [ ] (코드/설계) 코드/수정 에이전트에 dev-rules·tdd-doctrine **타겟상대 실경로** 주입 (`[[ ]]` 금지) + 교리 파일 타겟 복사 (Phase 3-1)
484: - [ ] (코드/설계) **codex/gemini 연동 점검**(`check-review-tools.sh`) 후 `external-review-loop` 스킬 생성 — 도구 전무면 생략(불필요 스킬 방지) + 단계 게이트 배선, 단계마다 리스크 등급 판정 (Phase 4-6, 5-6)
485: - [ ] (코드/설계) 커밋 순서·자율 노브(`_workspace/.autonomous`)·push 별도 게이트 반영
486: - [ ] 결과서에 `## 다음 단계 참조` 블록 (연속성)
487: - [ ] **듀얼 런타임:** 루트 `AGENTS.md` + 스킬 `.agents/skills/` 출력, 오케스트레이터에 어댑터(TeamCreate / Codex subagents·subprocess) 명시 (`references/runtime-adapters.md`)
488: 
489: ## 참고
490: 
491: - 하네스 패턴: `references/agent-design-patterns.md`
492: - 기존 하네스 예시 (실제 파일 전문 포함): `references/team-examples.md`
493: - 오케스트레이터 템플릿: `references/orchestrator-template.md`
494: - **스킬 작성 가이드**: `references/skill-writing-guide.md` — 작성 패턴, 예시, 데이터 스키마 표준
495: - **스킬 테스트 가이드**: `references/skill-testing-guide.md` — 테스트/평가/반복 개선 방법론
496: - **QA 에이전트 가이드**: `references/qa-agent-guide.md` — 빌드 하네스에 QA 에이전트를 포함할 때 참조. 통합 정합성 검증 방법론, 경계면 버그 패턴, QA 에이전트 정의 템플릿 포함. 실제 프로젝트에서 발견된 7개 버그 사례 기반.
497: - **외부 리뷰 루프**: `references/external-review-loop.md` — 코드/설계 도메인 하네스에 codex/gemini 독립 검증 단계 게이트를 넣을 때 참조. 방법론 겸 생성 템플릿. 전건 판정·기각 사유표·커밋 순서·자율 노브 포함.

hook: PostToolUse
hook: PostToolUse Completed
codex
리뷰 기준: commit `f2af5bb`, 대상 `skills/myharness/`. Critical은 없음. 성능/속도/안정성 관점 주요 이슈는 아래.

1. [high] Codex 병렬 subprocess timeout 누락
- 현황: 외부 리뷰 루프는 `timeout 600s`를 명시하지만, Codex 어댑터 템플릿의 일반 `codex exec` 병렬 예시는 `wait`만 사용한다. [orchestrator-template.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/orchestrator-template.md:292)
- 이슈: 일반 병렬 작업에서 `codex exec`가 stdin/도구/네트워크 대기로 멈추면 전체 오케스트레이션 무한 대기 가능.
- 권고: 모든 `codex exec` 예시에 `timeout`, PID 수집, exit code 수집, 실패별 1회 재시도, 잔여 프로세스 kill 정책을 넣어라.

2. [high] 병렬 fan-out 상한·백프레셔 없음
- 현황: 팀 크기는 대규모 5~7명 가이드만 있고, Codex subagents/`codex exec` 병렬 spawn 수 제한은 없다. [SKILL.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md:221), [runtime-adapters.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/runtime-adapters.md:44)
- 이슈: 대규모 도메인에서 에이전트 7개 + QA + 외부 리뷰가 겹치면 CPU, file I/O, API quota, 토큰 비용이 급증한다.
- 권고: 기본 동시 실행 cap `3`, 최대 `5`, 초과는 큐잉. 외부 리뷰는 별도 cap `2`. `_workspace/status/*.json` 기반 lease/claim 정책 추가.

3. [high] 외부 리뷰 게이트 비용·지연 상한 불명확
- 현황: 표준은 단계 끝 외부리뷰 1회, 중대는 단계마다 외부리뷰 + 승인 사다리다. 외부 리뷰는 codex/gemini 병렬, 각 600초, 1회 재시도. [SKILL.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md:484), [external-review-loop.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/external-review-loop.md:41)
- 이슈: 중대 플로우가 PRD→계획→실행마다 최대 20분 리뷰 대기 + 수정 반복이 될 수 있다. 단계 수·리뷰 횟수·총 wall-clock 예산 제한 없음.
- 권고: risk별 `max_external_reviews_per_run`, `max_total_review_minutes`, `skip_when_no_code_delta`, `batch_review_at_phase_boundary` 정책 추가.

4. [high] `model: "opus"` 강제 비용 폭증
- 현황: Claude Agent 호출에 전부 `model: "opus"`를 요구한다. [SKILL.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md:97), [agent-design-patterns.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/agent-design-patterns.md:213)
- 이슈: 리서치, 구조 검증, 파일 목록 감사, 트리거 eval 같은 저위험 작업까지 고비용 모델로 실행될 수 있다.
- 권고: 모델 라우팅 표 추가. 예: 설계/판정만 high-reasoning, grep/구조검증/format/eval 생성은 기본 모델. 체크리스트의 opus 강제 문구 완화.

5. [med] SKILL.md 500줄 천장에 정확히 닿아 확장 여유 없음
- 현황: `SKILL.md`는 500 lines. 정책상 본문 목표는 `<500줄`이고 500줄 근접 시 references 분리. [SKILL.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md:163)
- 이슈: 이미 천장에 닿아 다음 정책 추가가 즉시 규칙 위반. 또한 트리거 시 500줄 전체가 로드되어 “lean” 효과가 제한됨.
- 권고: Phase 6/7 상세, 산출물 체크리스트 일부를 reference로 이동. 본문 목표를 350~400줄 hard budget으로 낮춰라.

6. [med] 300줄+ reference ToC 규칙 미준수
- 현황: 300줄 이상 reference에는 ToC를 요구한다. [SKILL.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md:168)
- 이슈: `agent-design-patterns.md` 301줄, `orchestrator-template.md` 340줄, `team-examples.md` 329줄은 상단 ToC가 없다. 필요한 섹션만 찾기 어려워 파일 전체 로드 가능성이 커진다.
- 권고: 세 파일 상단에 ToC와 “언제 어떤 섹션만 읽을지” 라우팅 표 추가.

7. [med] 실행 테스트가 에이전트 수를 곱셈으로 늘림
- 현황: 각 테스트 프롬프트마다 with-skill/baseline 두 서브에이전트를 동시에 스폰한다. 트리거 검증은 20개 eval, description 최적화는 최대 5회 반복. [skill-testing-guide.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/skill-testing-guide.md:79), [skill-testing-guide.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/skill-testing-guide.md:272)
- 이슈: 스킬 5개면 최소 20~30개 agent run + trigger eval 반복으로 번진다. CI/검증 단계가 주 작업보다 비싸질 수 있음.
- 권고: smoke/full 모드 분리. 기본은 대표 prompt 1개 + static trigger lint. full eval은 명시 요청 또는 release gate에서만.

8. [med] 에러 핸들링이 선언적이고 실행 명세 부족
- 현황: “팀원 실패 시 재시작”, “타임아웃 시 부분 결과 사용”, “미완료 팀원 종료”가 표로만 있다. [orchestrator-template.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/orchestrator-template.md:141)
- 이슈: 어떤 상태 파일을 보고 실패를 감지하는지, 재시작 idempotency, 부분 산출물 유효성 기준, 종료 확인 방법이 없다.
- 권고: `_workspace/status/{agent}.json` schema, heartbeat, stale threshold, retry counter, partial artifact validity check를 템플릿에 포함.

9. [med] 파일 기반 전달이 컨텍스트 절약과 충돌 가능
- 현황: Codex 어댑터는 메시지 대신 `_workspace/` 파일 전달, 다음 단계가 Read한다. 결과서에는 `## 다음 단계 참조` 블록을 의무화한다. [orchestrator-template.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/orchestrator-template.md:286), [SKILL.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md:255)
- 이슈: “다음 단계 참조”만 먼저 읽으라는 규칙은 좋지만, 통합 단계가 산출물 전체를 Read하면 대규모 실행에서 컨텍스트가 다시 터진다.
- 권고: 각 artifact에 `summary`, `decisions`, `open_issues`, `full_body_path`를 분리. 통합은 summary 우선, 필요 시 section 단위 검색/추출.

10. [low] `check-review-tools.sh` 종료코드 주석 불일치
- 현황: 주석은 “0 = 1개 이상, 1 = 전무”라고 하지만 실제로는 항상 `exit 0`. [check-review-tools.sh](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/scripts/check-review-tools.sh:6)
- 이슈: 자동화 작성자가 exit code를 믿으면 도구 없음 상태를 성공으로 오판할 수 있다.
- 권고: 주석을 “항상 0, 끝줄 AVAILABLE만 신뢰”로 고치거나 `--strict` 옵션에서 none이면 exit 1 제공.

11. [low] `references/` 무제한 정책이 오용 여지
- 현황: Progressive Disclosure 표에서 references 크기는 “무제한”이다. [SKILL.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md:164)
- 이슈: 무제한이라는 표현이 대형 reference 덤프를 정당화할 수 있다. 실제 컨텍스트 절약은 “조건부 로딩 + 섹션 라우팅”이 있어야 성립.
- 권고: reference도 파일당 권장 300줄, 초과 시 ToC 필수 + 섹션 라우팅 필수 + scripts 우선 원칙으로 바꿔라.
hook: Stop
hook: Stop Completed
tokens used
116,249
리뷰 기준: commit `f2af5bb`, 대상 `skills/myharness/`. Critical은 없음. 성능/속도/안정성 관점 주요 이슈는 아래.

1. [high] Codex 병렬 subprocess timeout 누락
- 현황: 외부 리뷰 루프는 `timeout 600s`를 명시하지만, Codex 어댑터 템플릿의 일반 `codex exec` 병렬 예시는 `wait`만 사용한다. [orchestrator-template.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/orchestrator-template.md:292)
- 이슈: 일반 병렬 작업에서 `codex exec`가 stdin/도구/네트워크 대기로 멈추면 전체 오케스트레이션 무한 대기 가능.
- 권고: 모든 `codex exec` 예시에 `timeout`, PID 수집, exit code 수집, 실패별 1회 재시도, 잔여 프로세스 kill 정책을 넣어라.

2. [high] 병렬 fan-out 상한·백프레셔 없음
- 현황: 팀 크기는 대규모 5~7명 가이드만 있고, Codex subagents/`codex exec` 병렬 spawn 수 제한은 없다. [SKILL.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md:221), [runtime-adapters.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/runtime-adapters.md:44)
- 이슈: 대규모 도메인에서 에이전트 7개 + QA + 외부 리뷰가 겹치면 CPU, file I/O, API quota, 토큰 비용이 급증한다.
- 권고: 기본 동시 실행 cap `3`, 최대 `5`, 초과는 큐잉. 외부 리뷰는 별도 cap `2`. `_workspace/status/*.json` 기반 lease/claim 정책 추가.

3. [high] 외부 리뷰 게이트 비용·지연 상한 불명확
- 현황: 표준은 단계 끝 외부리뷰 1회, 중대는 단계마다 외부리뷰 + 승인 사다리다. 외부 리뷰는 codex/gemini 병렬, 각 600초, 1회 재시도. [SKILL.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md:484), [external-review-loop.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/external-review-loop.md:41)
- 이슈: 중대 플로우가 PRD→계획→실행마다 최대 20분 리뷰 대기 + 수정 반복이 될 수 있다. 단계 수·리뷰 횟수·총 wall-clock 예산 제한 없음.
- 권고: risk별 `max_external_reviews_per_run`, `max_total_review_minutes`, `skip_when_no_code_delta`, `batch_review_at_phase_boundary` 정책 추가.

4. [high] `model: "opus"` 강제 비용 폭증
- 현황: Claude Agent 호출에 전부 `model: "opus"`를 요구한다. [SKILL.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md:97), [agent-design-patterns.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/agent-design-patterns.md:213)
- 이슈: 리서치, 구조 검증, 파일 목록 감사, 트리거 eval 같은 저위험 작업까지 고비용 모델로 실행될 수 있다.
- 권고: 모델 라우팅 표 추가. 예: 설계/판정만 high-reasoning, grep/구조검증/format/eval 생성은 기본 모델. 체크리스트의 opus 강제 문구 완화.

5. [med] SKILL.md 500줄 천장에 정확히 닿아 확장 여유 없음
- 현황: `SKILL.md`는 500 lines. 정책상 본문 목표는 `<500줄`이고 500줄 근접 시 references 분리. [SKILL.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md:163)
- 이슈: 이미 천장에 닿아 다음 정책 추가가 즉시 규칙 위반. 또한 트리거 시 500줄 전체가 로드되어 “lean” 효과가 제한됨.
- 권고: Phase 6/7 상세, 산출물 체크리스트 일부를 reference로 이동. 본문 목표를 350~400줄 hard budget으로 낮춰라.

6. [med] 300줄+ reference ToC 규칙 미준수
- 현황: 300줄 이상 reference에는 ToC를 요구한다. [SKILL.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md:168)
- 이슈: `agent-design-patterns.md` 301줄, `orchestrator-template.md` 340줄, `team-examples.md` 329줄은 상단 ToC가 없다. 필요한 섹션만 찾기 어려워 파일 전체 로드 가능성이 커진다.
- 권고: 세 파일 상단에 ToC와 “언제 어떤 섹션만 읽을지” 라우팅 표 추가.

7. [med] 실행 테스트가 에이전트 수를 곱셈으로 늘림
- 현황: 각 테스트 프롬프트마다 with-skill/baseline 두 서브에이전트를 동시에 스폰한다. 트리거 검증은 20개 eval, description 최적화는 최대 5회 반복. [skill-testing-guide.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/skill-testing-guide.md:79), [skill-testing-guide.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/skill-testing-guide.md:272)
- 이슈: 스킬 5개면 최소 20~30개 agent run + trigger eval 반복으로 번진다. CI/검증 단계가 주 작업보다 비싸질 수 있음.
- 권고: smoke/full 모드 분리. 기본은 대표 prompt 1개 + static trigger lint. full eval은 명시 요청 또는 release gate에서만.

8. [med] 에러 핸들링이 선언적이고 실행 명세 부족
- 현황: “팀원 실패 시 재시작”, “타임아웃 시 부분 결과 사용”, “미완료 팀원 종료”가 표로만 있다. [orchestrator-template.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/orchestrator-template.md:141)
- 이슈: 어떤 상태 파일을 보고 실패를 감지하는지, 재시작 idempotency, 부분 산출물 유효성 기준, 종료 확인 방법이 없다.
- 권고: `_workspace/status/{agent}.json` schema, heartbeat, stale threshold, retry counter, partial artifact validity check를 템플릿에 포함.

9. [med] 파일 기반 전달이 컨텍스트 절약과 충돌 가능
- 현황: Codex 어댑터는 메시지 대신 `_workspace/` 파일 전달, 다음 단계가 Read한다. 결과서에는 `## 다음 단계 참조` 블록을 의무화한다. [orchestrator-template.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/orchestrator-template.md:286), [SKILL.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md:255)
- 이슈: “다음 단계 참조”만 먼저 읽으라는 규칙은 좋지만, 통합 단계가 산출물 전체를 Read하면 대규모 실행에서 컨텍스트가 다시 터진다.
- 권고: 각 artifact에 `summary`, `decisions`, `open_issues`, `full_body_path`를 분리. 통합은 summary 우선, 필요 시 section 단위 검색/추출.

10. [low] `check-review-tools.sh` 종료코드 주석 불일치
- 현황: 주석은 “0 = 1개 이상, 1 = 전무”라고 하지만 실제로는 항상 `exit 0`. [check-review-tools.sh](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/scripts/check-review-tools.sh:6)
- 이슈: 자동화 작성자가 exit code를 믿으면 도구 없음 상태를 성공으로 오판할 수 있다.
- 권고: 주석을 “항상 0, 끝줄 AVAILABLE만 신뢰”로 고치거나 `--strict` 옵션에서 none이면 exit 1 제공.

11. [low] `references/` 무제한 정책이 오용 여지
- 현황: Progressive Disclosure 표에서 references 크기는 “무제한”이다. [SKILL.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md:164)
- 이슈: 무제한이라는 표현이 대형 reference 덤프를 정당화할 수 있다. 실제 컨텍스트 절약은 “조건부 로딩 + 섹션 라우팅”이 있어야 성립.
- 권고: reference도 파일당 권장 300줄, 초과 시 ToC 필수 + 섹션 라우팅 필수 + scripts 우선 원칙으로 바꿔라.
