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
session id: 019eb6ea-8017-7781-91c7-2c2eb84a74ac
--------
user
리뷰 대상: 이 레포의 skills/myharness/ (Claude Code+Codex 하네스 팩토리 메타스킬 — SKILL.md + references/*.md + scripts/). 관련 commit id: 2713094.
이 팩토리의 "정책/워크플로우 문서"를 리뷰하여 발생 가능한 이슈를 모두 찾아 보고하라. 코드가 아니라 메타스킬 정책 문서임에 유의. 점검 항목:
- 내부 모순(원칙 간, Phase 간, 체크리스트 간)
- dead link / 잘못된 references 포인터 / 잘못된 파일경로
- 누락된 단계나 미정의 절차
- 과명세/소명세, 플레이스홀더({name},{harness-name} 등) 일관성
- Phase 번호·매트릭스·체크리스트 정합성
- description 트리거 품질(KO/EN/JA)
- 듀얼런타임(Claude/Codex) 어댑터·external-review-loop 게이트 정책의 빈틈
<이슈 작성 방법>
1. [레벨(critical/high/med/low)] 제목
- 현황: / - 이슈: / - 권고:
</이슈 작성 방법>
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
`myharness` 스킬을 사용합니다. 요청이 하네스 메타스킬 문서 감사라서 해당 워크플로우 지침을 먼저 확인합니다.
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
/bin/zsh -lc pwd in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
/Users/junghojang/Developments/myProject/myHarness

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

1. `프로젝트/.claude/agents/`, `프로젝트/.claude/skills/`, `프로젝트/CLAUDE.md`를 읽는다
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

#### 3-0. 기존 에이전트 중복 검토

신규 에이전트 생성 전, `프로젝트/.claude/agents/`의 기존 에이전트와 중복 여부를 확인한다. 하네스를 반복 구축하다 보면 역할이 겹치는 에이전트가 다른 이름으로 누적되기 쉽다.

> 중복 분류 기준과 재사용 설계는 `references/agent-design-patterns.md`의 "에이전트 재사용 설계" 참조.

**모든 에이전트는 반드시 `프로젝트/.claude/agents/{name}.md` 파일로 정의한다.** 에이전트 정의 파일 없이 Agent 도구의 prompt에 역할을 직접 넣는 것은 금지한다. 이유:
- 에이전트 정의가 파일로 존재해야 다음 세션에서 재사용 가능
- 팀 통신 프로토콜이 명시되어야 에이전트 간 협업 품질 보장
- 하네스의 핵심 가치는 에이전트(누가)와 스킬(어떻게)의 분리

빌트인 타입(`general-purpose`, `Explore`, `Plan`)을 사용하더라도 에이전트 정의 파일은 생성한다. 빌트인 타입은 Agent 도구의 `subagent_type` 파라미터로 지정하고, 에이전트 정의 파일에는 역할·원칙·프로토콜을 담는다.

**모델 설정:** 모든 에이전트는 `model: "opus"`를 사용한다. Agent 도구 호출 시 반드시 `model: "opus"` 파라미터를 명시한다. 하네스의 품질은 에이전트의 추론 능력에 직결되며, opus가 최고 품질을 보장한다.

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
1. `references/dev-rules.md`, `references/tdd-doctrine.md`를 타겟 하네스의 `프로젝트/.claude/skills/{harness-name}/references/`로 **복사**한다.
2. 에이전트 정의에 **타겟상대 실경로** 한 줄씩 넣는다 — `> 개발 규칙: \`.claude/skills/{harness-name}/references/dev-rules.md\` 준수.` / `> TDD 규율: \`.claude/skills/{harness-name}/references/tdd-doctrine.md\` 준수.`
3. `[[ ]]`나 플러그인 내부 경로는 서브에이전트가 해소 못 하므로 금지. 본문 복붙도 금지(DRY).
- 비코드 에이전트(문서·리서치)는 dev-rules만 선택 적용(TDD 제외).

### Phase 4: 스킬 생성

각 에이전트가 사용할 스킬을 `프로젝트/.claude/skills/{name}/SKILL.md`에 생성한다. 상세 작성 가이드는 `references/skill-writing-guide.md` 참조.

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

description은 스킬의 유일한 트리거 메커니즘이다. Claude는 트리거를 보수적으로 판단하는 경향이 있으므로, description을 **적극적("pushy")**으로 작성한다.

**나쁜 예:** `"PDF 문서를 처리하는 스킬"`
**좋은 예:** `"PDF 파일 읽기, 텍스트/테이블 추출, 병합, 분할, 회전, 워터마크, 암호화, OCR 등 모든 PDF 작업을 수행. .pdf 파일을 언급하거나 PDF 산출물을 요청하면 반드시 이 스킬을 사용할 것."`

핵심: 스킬이 하는 일 + 구체적 트리거 상황을 모두 기술하고, 유사하지만 트리거하면 안 되는 경우와 구분되도록 작성.

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
2. **생성:** `references/external-review-loop.md`(방법론 겸 템플릿)를 타겟 `.claude/skills/external-review-loop/SKILL.md`로 생성(frontmatter 포함). `check-review-tools.sh`도 그 스킬 `scripts/`로 복사(런타임 폴백).
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

hook: PostToolUse
hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
codex
초기 지침 확인 완료. 이제 문서와 참조 경로를 기계적으로 대조해서 링크, Phase 번호, 플레이스홀더, 런타임 정책 충돌을 좁힙니다.
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
/bin/zsh -lc "sed -n '261,620p' /Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:

오케스트레이터 내에 에러 처리 방침을 포함한다. 핵심 원칙: 1회 재시도 후 재실패 시 해당 결과 없이 진행(보고서에 누락 명시), 상충 데이터는 삭제하지 않고 출처 병기.

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

**2. 오케스트레이터 Phase 1에 컨텍스트 확인 단계 추가:**
워크플로우 시작 시 기존 산출물 존재 여부를 확인하여 실행 모드를 결정한다:
- `_workspace/` 존재 + 사용자가 부분 수정 요청 → **부분 재실행** (해당 에이전트만 재호출)
- `_workspace/` 존재 + 사용자가 새 입력 제공 → **새 실행** (기존 _workspace를 `_workspace_prev/`로 이동)
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
| 중대 | 계약 변경·비가역·다도메인 | **단계마다** 외부리뷰 + 승인 사다리(PRD→계획서→실행) |

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

## 산출물 체크리스트

생성 완료 후 확인:

- [ ] `.claude/agents/`(정의 파일, 빌트인 타입도 필수) + `.claude/skills/`(SKILL.md + references/) 생성
- [ ] 오케스트레이터 스킬 1개 (데이터 흐름 + 에러 핸들링 + 테스트 시나리오 포함)
- [ ] 실행 모드 명시 (에이전트 팀 / 서브 에이전트 / 하이브리드 중 선택, 하이브리드면 Phase별 모드 기재)
- [ ] 모든 Agent 호출에 `model: "opus"` 파라미터 명시
- [ ] 신규 에이전트·스킬 생성 전 기존 중복 검토 완료 (Phase 3-0, 4-0)
- [ ] `.claude/commands/` — 아무것도 생성하지 않음
- [ ] 기존 에이전트/스킬과 충돌 없음
- [ ] 스킬 description이 적극적("pushy")으로 작성됨 — **후속 작업 키워드 포함**
- [ ] SKILL.md 본문이 500줄 이내, 초과 시 references/ 분리
- [ ] 테스트 프롬프트 2~3개 실행 검증 + 트리거 검증(should/should-NOT) 완료
- [ ] **CLAUDE.md 포인터 등록 + 변경 이력에 에이전트/스킬 추가·삭제·수정 기록**
- [ ] **오케스트레이터 Phase 1에 컨텍스트 확인 단계** (초기/후속/부분 재실행 판별)
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
exec
/bin/zsh -lc 'git show --stat --oneline --decorate 2713094 -- skills/myharness' in /Users/junghojang/Developments/myProject/myHarness
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse
 succeeded in 2374ms:
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-MHlhCW1q' (errno=Operation not permitted)
2713094 (HEAD -> main, origin/main) docs(factory): policy review fixes P1+P2
 skills/myharness/SKILL.md                   | 12 +++++-------
 skills/myharness/references/dev-rules.md    |  2 +-
 skills/myharness/references/tdd-doctrine.md |  2 +-
 3 files changed, 7 insertions(+), 9 deletions(-)

hook: PostToolUse Completed
codex
context-mode 도구가 로드됐습니다. 원문 대량 출력 대신 디렉터리를 색인하고, 스크립트로 링크/번호/플레이스홀더 후보만 뽑겠습니다.
mcp: context-mode/ctx_index started
mcp: context-mode/ctx_index (failed)
user cancelled MCP tool call
codex
색인 호출이 취소됐습니다. 원문을 읽지 않고 `ctx_execute`로 파일 목록과 정합성 후보만 산출하는 쪽으로 진행합니다.
mcp: context-mode/ctx_execute started
mcp: context-mode/ctx_execute (failed)
user cancelled MCP tool call
codex
context-mode 실행도 취소되어 사용 불가 상태입니다. 출력 크기를 제한한 로컬 스크립트/검색으로 동일한 감사 항목을 확인합니다.
hook: PreToolUse
hook: PreToolUse Completed
hook: PostToolUse
hook: PostToolUse Completed
codex
읽기 전용 샌드박스라 heredoc 임시 파일 생성도 막힙니다. 임시 파일 없이 `node -e` 한 줄 실행으로 감사 데이터를 추출합니다.
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc "node -e \"const fs=require('fs'),path=require('path');const root='/Users/junghojang/Developments/myProject/myHarness/skills/myharness';function walk(d){let out=[];for(const ent of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,ent.name);if(ent.isDirectory())out=out.concat(walk(p));else out.push(p)}return out}const files=walk(root).filter(f=>/\\\\.(md|sh)"'$/.test(f)).sort();const existing=new Set(files.map(f=>path.relative(root,f)));console.log('"'FILES='+files.map(f=>path.relative(root,f)).join('|'));let broken=[],placeholders=[],phases=[],heads=[];for(const f of files){const rel=path.relative(root,f),txt=fs.readFileSync(f,'utf8'),lines=txt.split(/\\\\r?\\\\n/);for(let i=0;i<lines.length;i++){const line=lines[i];let mh=line.match(/"'^(#{1,6})'"\\\\s+(.+)/);if(mh)heads.push("'`${rel}:${i+1}:${mh[1]} ${mh[2]}`);for(const m of line.matchAll(/(?:`([''^`]+)`|'"\\\\]\\\\((["'^)]+)'"\\\\)|\\\\b(references\\\\/[\\\\w.\\\\/-]+|scripts\\\\/[\\\\w.\\\\/-]+)\\\\b)/g)){const s=m[1]||m[2]||m[3];if("'!s)continue;if((s.startsWith('"'references/')||s.startsWith('scripts/'))&&"'!existing.has(s))broken.push(`${rel}:${i+1}:${s}`)}}for(const m of txt.matchAll(/'"\\\\{["'^}'"\\\\n]{1,40}\\\\}/g))placeholders.push("'`${rel}:${m[0]}`);for(const m of txt.matchAll(/Phase'"\\\\s+\\\\d+(?:-\\\\d+)?/g))phases.push("'`${rel}:${m[0]}`)}console.log('"'\\\\nBROKEN');console.log(broken.length?broken.join('\\\\n'):'none');console.log('\\\\nHEADINGS');console.log(heads.join('\\\\n'));console.log('\\\\nPLACEHOLDERS');console.log([...new Set(placeholders)].join('\\\\n'));console.log('\\\\nPHASES');console.log([...new Set(phases)].join('\\\\n'));\"" in /Users/junghojang/Developments/myProject/myHarness
 exited 1 in 0ms:
zsh:1: unmatched "

hook: PostToolUse
hook: PostToolUse Completed
codex
인용 때문에 한 줄 스크립트가 깨졌습니다. 더 단순한 `rg` 질의 여러 개로 분리해 후보를 확인합니다.
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
/bin/zsh -lc 'find skills/myharness -maxdepth 3 -type f | sort' in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
skills/myharness/SKILL.md
skills/myharness/references/agent-design-patterns.md
skills/myharness/references/dev-rules.md
skills/myharness/references/external-review-loop.md
skills/myharness/references/orchestrator-template.md
skills/myharness/references/qa-agent-guide.md
skills/myharness/references/runtime-adapters.md
skills/myharness/references/skill-testing-guide.md
skills/myharness/references/skill-writing-guide.md
skills/myharness/references/tdd-doctrine.md
skills/myharness/references/team-examples.md
skills/myharness/scripts/check-review-tools.sh

hook: PostToolUse
exec
/bin/zsh -lc "rg -n \"TODO|FIXME|TBD|\\{name\\}|\\{harness-name\\}|\\{도메인|\\{domain|\\{YYYY|placeholder|플레이스홀더|미정|TODO\" skills/myharness/SKILL.md skills/myharness/references skills/myharness/scripts" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
skills/myharness/SKILL.md:88:**모든 에이전트는 반드시 `프로젝트/.claude/agents/{name}.md` 파일로 정의한다.** 에이전트 정의 파일 없이 Agent 도구의 prompt에 역할을 직접 넣는 것은 금지한다. 이유:
skills/myharness/SKILL.md:99:각 에이전트를 `프로젝트/.claude/agents/{name}.md`에 정의한다. 필수 섹션: 핵심 역할, 작업 원칙, 입력/출력 프로토콜, 에러 핸들링, 협업. 에이전트 팀 모드에서는 `## 팀 통신 프로토콜` 섹션을 추가하여 메시지 수신/발신 대상과 작업 요청 범위를 명시한다.
skills/myharness/SKILL.md:112:1. `references/dev-rules.md`, `references/tdd-doctrine.md`를 타겟 하네스의 `프로젝트/.claude/skills/{harness-name}/references/`로 **복사**한다.
skills/myharness/SKILL.md:113:2. 에이전트 정의에 **타겟상대 실경로** 한 줄씩 넣는다 — `> 개발 규칙: \`.claude/skills/{harness-name}/references/dev-rules.md\` 준수.` / `> TDD 규율: \`.claude/skills/{harness-name}/references/tdd-doctrine.md\` 준수.`
skills/myharness/SKILL.md:119:각 에이전트가 사용할 스킬을 `프로젝트/.claude/skills/{name}/SKILL.md`에 생성한다. 상세 작성 가이드는 `references/skill-writing-guide.md` 참조.
skills/myharness/SKILL.md:283:## 하네스: {도메인명}
skills/myharness/SKILL.md:287:**트리거:** {도메인} 관련 작업 요청 시 `{orchestrator-skill-name}` 스킬을 사용하라. 단순 질문은 직접 응답 가능.
skills/myharness/SKILL.md:292:| {YYYY-MM-DD} | 초기 구성 | 전체 | - |
skills/myharness/SKILL.md:306:- "{도메인}의 {부분작업}만 다시"
skills/myharness/references/external-review-loop.md:17:## 입력 (플레이스홀더)
skills/myharness/references/team-examples.md:29:> 리서치 에이전트는 `general-purpose` 빌트인 타입을 사용하되, 반드시 `.claude/agents/{name}.md` 파일로 정의한다. 파일에는 역할·조사 범위·팀 통신 프로토콜을 명시하여 재사용성과 협업 품질을 보장한다.
skills/myharness/references/tdd-doctrine.md:27:팩토리는 이 파일을 타겟 하네스의 `.claude/skills/{harness-name}/references/tdd-doctrine.md`로 **복사**한 뒤, 코드 에이전트 정의 `## 작업 원칙`에 **타겟 실경로** 한 줄을 넣는다: `> TDD 규율: \`.claude/skills/{harness-name}/references/tdd-doctrine.md\` 준수.` 서브에이전트는 `[[ ]]`·플러그인 내부 경로를 해소 못 하므로 타겟상대 실경로 필수. 본문 복붙 금지(DRY).
skills/myharness/references/dev-rules.md:28:팩토리는 이 파일을 타겟 하네스의 `.claude/skills/{harness-name}/references/dev-rules.md`로 **복사**한 뒤, 에이전트 정의 `## 작업 원칙`에 **타겟 실경로** 한 줄을 넣는다: `> 개발 규칙: \`.claude/skills/{harness-name}/references/dev-rules.md\` 준수.` 서브에이전트는 `[[ ]]`·플러그인 내부 경로를 해소 못 하므로 타겟상대 실경로 필수. 본문 복붙 금지(DRY). 비코드 에이전트(문서·리서치)는 dev-rules만 선택 적용(TDD 제외).
skills/myharness/references/agent-design-patterns.md:199:`.claude/agents/{name}.md`에 에이전트를 정의하면 `subagent_type: "{name}"`으로 호출할 수 있다. 커스텀 에이전트는 전체 도구에 접근 가능.
skills/myharness/references/agent-design-patterns.md:211:**원칙:** 모든 에이전트는 반드시 `.claude/agents/{name}.md` 파일로 정의한다. 빌트인 타입이라도 에이전트 정의 파일을 생성하여 역할·원칙·프로토콜을 명시한다. 파일로 존재해야 다음 세션에서 재사용 가능하고, 팀 통신 프로토콜이 명시되어야 협업 품질이 보장된다.
skills/myharness/references/orchestrator-template.md:20:name: {domain}-orchestrator
skills/myharness/references/orchestrator-template.md:21:description: "{도메인} 에이전트 팀을 조율하는 오케스트레이터. {초기 실행 키워드}. 후속 작업: {도메인} 결과 수정, 부분 재실행, 업데이트, 보완, 다시 실행, 이전 결과 개선 요청 시에도 반드시 이 스킬을 사용."
skills/myharness/references/orchestrator-template.md:26:{도메인}의 에이전트 팀을 조율하여 {최종 산출물}을 생성하는 통합 스킬.
skills/myharness/references/orchestrator-template.md:48:   - **`_workspace/` 존재 + 새 입력 제공** → 새 실행. 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동한 뒤 Phase 1 진행
skills/myharness/references/orchestrator-template.md:55:   - **새 실행**: 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동한 직후 새 `_workspace/` 재생성
skills/myharness/references/orchestrator-template.md:63:     team_name: "{domain}-team",
skills/myharness/references/orchestrator-template.md:175:name: {domain}-orchestrator
skills/myharness/references/orchestrator-template.md:176:description: "{도메인} 에이전트를 조율하는 오케스트레이터. {초기 실행 키워드}. 후속 작업 키워드 포함."
skills/myharness/references/orchestrator-template.md:228:name: {domain}-orchestrator
skills/myharness/references/orchestrator-template.md:229:description: "{도메인} 오케스트레이터 (하이브리드). {키워드}. 후속 작업 키워드 포함."
skills/myharness/references/orchestrator-template.md:329:- "{도메인}의 {부분}만 다시"

hook: PostToolUse
exec
/bin/zsh -lc "rg -n \"TeamCreate|SendMessage|TaskCreate|TeamDelete|Agent 도구|run_in_background|subprocess|subagents|\\.codex|Codex|Claude|opus|bypassPermissions|AVAILABLE|external-review-loop|자율|승인|push\" skills/myharness/SKILL.md skills/myharness/references" in /Users/junghojang/Developments/myProject/myHarness
exec
/bin/zsh -lc "rg -n \"references/|scripts/|\\.claude/|\\.agents/|AGENTS\\.md|CLAUDE\\.md|Phase [0-9]|\\{["'^}]+'"\\}\" skills/myharness/SKILL.md skills/myharness/references skills/myharness/scripts" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
skills/myharness/SKILL.md:11:3. **CLAUDE.md(+ Codex는 AGENTS.md)에 하네스 포인터를 등록한다.** — 새 세션에서 오케스트레이터 스킬이 트리거되도록 최소한의 포인터(트리거 규칙 + 변경 이력)만 기록한다. (듀얼 출력은 원칙 8·Phase 5-4)
skills/myharness/SKILL.md:13:5. **품질 게이트 2층 (코드/설계 도메인).** *내부* 생성-검증(같은 세션 QA)과 *외부* 리뷰 루프(codex/gemini 독립 검증)를 병행한다. 같은 컨텍스트 QA는 같은 맹점을 공유하므로 외부 독립 관점이 추가 결함을 잡는다. 단 합의=정답 아님 — 판정 권위는 오케스트레이터. 상세: `references/external-review-loop.md`.
skills/myharness/SKILL.md:16:8. **듀얼 런타임 (Claude Code + Codex).** 두 런타임 거의 대칭(둘 다 skills·agents·MCP·hooks). SKILL.md 포맷 동일이라 정본 공유, 어댑터로 분기할 것만: 진입점(plugin.json+CLAUDE.md / AGENTS.md), 스킬 경로(`.claude/skills/` / `.agents/skills/`), 에이전트(`.md` / `.codex/agents/*.toml`), 오케스트레이션(TeamCreate / Codex subagents·subprocess). 생성 시 양쪽 출력. 상세·검증: `references/runtime-adapters.md`.
skills/myharness/SKILL.md:50:**에이전트 팀이 최우선 기본값이다.** 2개 이상의 에이전트가 협업할 때는 반드시 에이전트 팀을 먼저 검토한다. 팀원 간 직접 통신(SendMessage)과 공유 작업 목록(TaskCreate)으로 자체 조율하며, 발견 공유·상충 토론·누락 보완이 결과 품질을 높인다.
skills/myharness/SKILL.md:54:| **에이전트 팀** (기본) | 2명 이상 협업, 실시간 조율·피드백 교환이 필요, 중간 산출물 상호 참조 | `TeamCreate` + `SendMessage` + `TaskCreate`로 자체 조율 |
skills/myharness/SKILL.md:55:| **서브 에이전트** (대안) | 단일 에이전트 작업, 결과만 메인에 반환하면 충분, 팀 통신 오버헤드가 과할 때 | `Agent` 도구 직접 호출, `run_in_background`로 병렬 |
skills/myharness/SKILL.md:88:**모든 에이전트는 반드시 `프로젝트/.claude/agents/{name}.md` 파일로 정의한다.** 에이전트 정의 파일 없이 Agent 도구의 prompt에 역할을 직접 넣는 것은 금지한다. 이유:
skills/myharness/SKILL.md:93:빌트인 타입(`general-purpose`, `Explore`, `Plan`)을 사용하더라도 에이전트 정의 파일은 생성한다. 빌트인 타입은 Agent 도구의 `subagent_type` 파라미터로 지정하고, 에이전트 정의 파일에는 역할·원칙·프로토콜을 담는다.
skills/myharness/SKILL.md:95:**모델 설정:** 모든 에이전트는 `model: "opus"`를 사용한다. Agent 도구 호출 시 반드시 `model: "opus"` 파라미터를 명시한다. 하네스의 품질은 에이전트의 추론 능력에 직결되며, opus가 최고 품질을 보장한다.
skills/myharness/SKILL.md:142:description은 스킬의 유일한 트리거 메커니즘이다. Claude는 트리거를 보수적으로 판단하는 경향이 있으므로, description을 **적극적("pushy")**으로 작성한다.
skills/myharness/SKILL.md:194:1. **점검:** `bash skills/myharness/scripts/check-review-tools.sh` → 끝줄 `AVAILABLE:`. **none**=스킬 생성 안 함(내부 QA만, 보고서·CLAUDE.md에 "도구 미연동 생략" 명시) / **하나만**=그 도구만 쓰는 저하 모드 생성 / **둘 다**=풀 생성.
skills/myharness/SKILL.md:195:2. **생성:** `references/external-review-loop.md`(방법론 겸 템플릿)를 타겟 `.claude/skills/external-review-loop/SKILL.md`로 생성(frontmatter 포함). `check-review-tools.sh`도 그 스킬 `scripts/`로 복사(런타임 폴백).
skills/myharness/SKILL.md:209:오케스트레이터가 `TeamCreate`로 팀을 구성하고, `TaskCreate`로 작업을 할당한다. 팀원들은 `SendMessage`로 직접 통신하며 자체 조율한다. 리더(오케스트레이터)는 진행 상황을 모니터링하고 결과를 종합한다.
skills/myharness/SKILL.md:213:    ├── TeamCreate(team_name, members)
skills/myharness/SKILL.md:214:    ├── TaskCreate(tasks with dependencies)
skills/myharness/SKILL.md:215:    ├── 팀원들이 자체 조율 (SendMessage)
skills/myharness/SKILL.md:221:오케스트레이터가 `Agent` 도구로 서브 에이전트를 직접 호출한다. 병렬 실행은 `run_in_background: true`, 결과는 메인에게만 반환된다. 팀 통신이 불필요하고 오버헤드를 줄이고 싶을 때 사용.
skills/myharness/SKILL.md:225:    ├── Agent(agent-1, run_in_background=true)
skills/myharness/SKILL.md:226:    ├── Agent(agent-2, run_in_background=true)
skills/myharness/SKILL.md:235:- **Phase 간 팀 재구성**: 각 Phase마다 `TeamDelete` 후 새 `TeamCreate`, 사이에 서브 에이전트 호출 삽입
skills/myharness/SKILL.md:245:| **메시지 기반** | `SendMessage`로 팀원 간 직접 통신 | 팀 | 실시간 조율, 피드백 교환, 가벼운 상태 전달 |
skills/myharness/SKILL.md:246:| **태스크 기반** | `TaskCreate`/`TaskUpdate`로 작업 상태 공유 | 팀 | 진행상황 추적, 의존 관계 관리, 작업 자체 요청 |
skills/myharness/SKILL.md:295:**듀얼 런타임 포인터:** Codex용으로 레포 루트 `AGENTS.md`에도 같은 포인터 + Codex 오케스트레이션 어댑터(subagents/subprocess) 주석을 출력한다(Codex 자동 로드). 둘 다 같은 정본을 가리킴. 한쪽만 갱신=drift. 상세: `references/runtime-adapters.md`.
skills/myharness/SKILL.md:330:| 중대 | 계약 변경·비가역·다도메인 | **단계마다** 외부리뷰 + 승인 사다리(PRD→계획서→실행) |
skills/myharness/SKILL.md:332:**단계 마감 게이트(표준·중대):** 오케스트레이터가 `external-review-loop` 스킬 호출 — codex/gemini 병렬 → 전건 판정(확인/부분/이월/기각) → 확인분만 TDD 수정 → 게이트 PASS. 판정 권위는 오케스트레이터(위임 금지). 상세: `references/external-review-loop.md`.
skills/myharness/SKILL.md:334:**커밋 순서(순환 제거):** 리뷰→판정→수정→게이트 PASS → **승인 관문** → 단일 커밋. (리뷰는 커밋 *전* 작업트리/스테이지 대상 — "커밋 직후 리뷰" 아님.)
skills/myharness/SKILL.md:335:- 승인 관문 기본: 사용자 승인 대기.
skills/myharness/SKILL.md:336:- **자율 노브:** `프로젝트/_workspace/.autonomous` 마커(또는 "자율로"·"승인 생략" 발화) 시 승인 자동 통과 → 커밋. 권한모드(bypassPermissions)는 스킬이 못 읽으므로 마커/발화로 명시. 마커 ON이어도 외부리뷰·판정·게이트는 그대로(인간 승인 한 스텝만 생략).
skills/myharness/SKILL.md:337:- **push는 자율이어도 기본 대기**(외부 송출·되돌리기 어려움) — `_workspace/.autonomous-push` 마커 시만 자동.
skills/myharness/SKILL.md:353:- **서브 에이전트**: 각 에이전트의 입출력 연결, `run_in_background` 설정, 반환값 수집 로직 확인
skills/myharness/SKILL.md:473:- [ ] 모든 Agent 호출에 `model: "opus"` 파라미터 명시
skills/myharness/SKILL.md:477:- [ ] 스킬 description이 적극적("pushy")으로 작성됨 — **후속 작업 키워드 포함**
skills/myharness/SKILL.md:483:- [ ] (코드/설계) **codex/gemini 연동 점검**(`check-review-tools.sh`) 후 `external-review-loop` 스킬 생성 — 도구 전무면 생략(불필요 스킬 방지) + 단계 게이트 배선, 단계마다 리스크 등급 판정 (Phase 4-6, 5-6)
skills/myharness/SKILL.md:484:- [ ] (코드/설계) 커밋 순서·자율 노브(`_workspace/.autonomous`)·push 별도 게이트 반영
skills/myharness/SKILL.md:486:- [ ] **듀얼 런타임:** 루트 `AGENTS.md` + 스킬 `.agents/skills/` 출력, 오케스트레이터에 어댑터(TeamCreate / Codex subagents·subprocess) 명시 (`references/runtime-adapters.md`)
skills/myharness/SKILL.md:496:- **외부 리뷰 루프**: `references/external-review-loop.md` — 코드/설계 도메인 하네스에 codex/gemini 독립 검증 단계 게이트를 넣을 때 참조. 방법론 겸 생성 템플릿. 전건 판정·기각 사유표·커밋 순서·자율 노브 포함.
skills/myharness/SKILL.md:498:- **런타임 어댑터**: `references/runtime-adapters.md` — Claude Code/Codex 듀얼 런타임 설계. 진입점·오케스트레이션 매핑, AGENTS.md·`.agents/skills/` 생성, 설치(Codex 공식 docs 검증).
skills/myharness/references/external-review-loop.md:5:2. **생성 템플릿** — 코드/설계 도메인 하네스를 만들 때, 이 내용을 타겟 프로젝트의 `.claude/skills/external-review-loop/SKILL.md`로 생성한다(아래 frontmatter 포함). **단, 생성 전 `check-review-tools.sh`로 codex/gemini 연동을 확인**하고, 둘 다 미설치면 스킬을 만들지 않는다(Phase 4-6). 생성 시 `check-review-tools.sh`를 스킬의 `scripts/`로 함께 번들한다.
skills/myharness/references/external-review-loop.md:12:name: external-review-loop
skills/myharness/references/external-review-loop.md:37:먼저 `bash scripts/check-review-tools.sh`로 사용가능 도구 재확인(끝줄 `AVAILABLE:`). 사용가능 도구만 실행한다. 루트에서 백그라운드 병렬·읽기전용. 프롬프트·출력 모두 `_workspace/reviews/`에 보존(감사 — /tmp 금지).
skills/myharness/references/external-review-loop.md:46:- Bash `run_in_background` + timeout 600s.
skills/myharness/references/external-review-loop.md:71:## Step 7 — 기록·커밋 (커밋 순서·자율 노브)
skills/myharness/references/external-review-loop.md:73:2. 순서: 게이트 PASS → **승인 관문** → 단일 커밋(`fix: 외부 리뷰 {k}건 — {요지}`, Co-Authored-By).
skills/myharness/references/external-review-loop.md:74:   - 승인 관문 기본: 사용자 대기. `_workspace/.autonomous` 마커(또는 "자율로" 발화) 시 자동 통과.
skills/myharness/references/external-review-loop.md:75:   - **push는 자율이어도 기본 대기** — `_workspace/.autonomous-push` 마커 시만 자동.
skills/myharness/references/external-review-loop.md:76:   - 권한모드(bypassPermissions)는 스킬이 못 읽으므로 마커/발화로 명시. 마커 ON이어도 리뷰·판정·게이트는 그대로(인간 승인 한 스텝만 생략).
skills/myharness/references/tdd-doctrine.md:3:생성된 빌더/수정/QA 에이전트의 작업 원칙에 주입하는 표준 교리. Kent Beck TDD + Tidy First 기반. `external-review-loop.md` Step 5의 수정 규율이 이 문서를 따른다.
skills/myharness/references/tdd-doctrine.md:18:커밋 조건(전부 충족): ① 모든 테스트 통과 ② 린터 경고 0 ③ 단일 논리 단위 ④ 메시지에 구조/행위 명시. 작고 잦은 커밋. **에이전트는 커밋·브랜치 금지** — 오케스트레이터가 게이트·승인 후 단일 커밋(승인 순서는 `external-review-loop.md` Step 7).
skills/myharness/references/team-examples.md:12:    ├── TeamCreate(research-team)
skills/myharness/references/team-examples.md:13:    ├── TaskCreate(4개 조사 작업)
skills/myharness/references/team-examples.md:14:    ├── 팀원들이 자체 조율 (SendMessage)
skills/myharness/references/team-examples.md:39:  - TeamCreate(team_name: "research-team", members: [
skills/myharness/references/team-examples.md:45:  - TaskCreate(tasks: [
skills/myharness/references/team-examples.md:54:  - 흥미로운 발견이 있으면 팀원 간 SendMessage로 공유
skills/myharness/references/team-examples.md:73:official ──SendMessage──→ background  (관련 공식 발표 공유)
skills/myharness/references/team-examples.md:74:media ────SendMessage──→ background  (투자/인수 정보 공유)
skills/myharness/references/team-examples.md:75:community ─SendMessage──→ media      (커뮤니티 반응 중 미디어 관련 정보)
skills/myharness/references/team-examples.md:89:  → 서로 SendMessage로 일관성 조율
skills/myharness/references/team-examples.md:92:  → 서로 SendMessage로 발견 공유
skills/myharness/references/team-examples.md:136:- character-designer에게: 사회 구조, 계급 시스템, 직업군 정보 SendMessage
skills/myharness/references/team-examples.md:137:- plot-architect에게: 세계의 주요 갈등 구조, 위기 요소 SendMessage
skills/myharness/references/team-examples.md:154:Phase 1: TeamCreate(team_name: "novel-team", members: [worldbuilder, character-designer, plot-architect])
skills/myharness/references/team-examples.md:155:         TaskCreate([세계관 구축, 캐릭터 설계, 플롯 구조])
skills/myharness/references/team-examples.md:157:         → worldbuilder가 사회 구조 완성 시 character-designer에게 SendMessage
skills/myharness/references/team-examples.md:158:         → character-designer가 주인공 설정 시 plot-architect에게 SendMessage
skills/myharness/references/team-examples.md:164:Phase 3: 새 팀 생성 — TeamCreate(team_name: "review-team", members: [science-consultant, continuity-manager])
skills/myharness/references/team-examples.md:257:[리더] → TeamCreate(review-team)
skills/myharness/references/team-examples.md:261:    → 리뷰어들이 서로 발견 공유 (SendMessage)
skills/myharness/references/team-examples.md:268:security ──SendMessage──→ performance  ("이 SQL 쿼리 주입 가능, 성능 측면에서도 확인 필요")
skills/myharness/references/team-examples.md:269:performance ──SendMessage──→ test      ("N+1 쿼리 발견, 관련 테스트 있는지 확인 부탁")
skills/myharness/references/team-examples.md:270:test ────SendMessage──→ security      ("인증 모듈 테스트 없음, 보안 관점에서 우선순위 의견?")
skills/myharness/references/team-examples.md:302:3. TaskCreate로 파일 배치를 작업으로 등록 (의존성 포함)
skills/myharness/references/team-examples.md:306:   - 실패 → 리더가 SendMessage로 원인 확인 → 재할당 또는 다른 팀원에게 배정
skills/myharness/references/agent-design-patterns.md:9:팀 리더가 `TeamCreate`로 팀을 구성하고, 팀원들은 독립적인 Claude Code 인스턴스로 실행된다. 팀원들은 `SendMessage`로 직접 통신하고, 공유 작업 목록(`TaskCreate`/`TaskUpdate`)으로 자체 조율한다.
skills/myharness/references/agent-design-patterns.md:18:- `TeamCreate`: 팀 생성 + 팀원 스폰
skills/myharness/references/agent-design-patterns.md:19:- `SendMessage({to: name})`: 특정 팀원에게 메시지
skills/myharness/references/agent-design-patterns.md:20:- `SendMessage({to: "all"})`: 브로드캐스트 (비용 높음, 드물게)
skills/myharness/references/agent-design-patterns.md:21:- `TaskCreate`/`TaskUpdate`: 공유 작업 목록 관리
skills/myharness/references/agent-design-patterns.md:28:- 계획 승인 모드로 위험한 작업 전 검토 가능
skills/myharness/references/agent-design-patterns.md:50:- `Agent(prompt, subagent_type, run_in_background)`: 서브 에이전트 생성
skills/myharness/references/agent-design-patterns.md:131:**팀 모드 적합성:** 에이전트 팀이 유용. SendMessage로 생성자↔검증자 간 실시간 피드백 교환.
skills/myharness/references/agent-design-patterns.md:146:**팀 모드 적합성:** 에이전트 팀의 공유 작업 목록이 감독자 패턴과 자연스럽게 매칭. TaskCreate로 작업 등록, 팀원들이 자체 요청.
skills/myharness/references/agent-design-patterns.md:187:에이전트를 호출할 때 Agent 도구의 `subagent_type` 파라미터로 타입을 지정한다. 에이전트 팀의 팀원도 커스텀 에이전트 정의를 사용할 수 있다.
skills/myharness/references/agent-design-patterns.md:213:**모델:** 모든 에이전트는 `model: "opus"`를 사용한다. Agent 도구 호출 시 반드시 `model: "opus"` 파라미터를 명시한다.
skills/myharness/references/agent-design-patterns.md:283:| 트리거 | 사용자 요청 키워드 매칭 | Agent 도구로 명시적 호출 |
skills/myharness/references/skill-writing-guide.md:22:Description은 스킬의 유일한 트리거 메커니즘이다. Claude는 `available_skills` 목록에서 name + description만 보고 스킬 사용 여부를 결정한다.
skills/myharness/references/skill-writing-guide.md:26:Claude는 자신의 기본 도구로 쉽게 처리할 수 있는 단순 작업에는 스킬을 호출하지 않는 경향이 있다. "이 PDF 읽어줘" 같은 단순 요청은 description이 완벽해도 트리거되지 않을 수 있다. 복잡하고 다단계이며 전문적인 작업일수록 스킬 트리거 확률이 높다.
skills/myharness/references/skill-writing-guide.md:32:3. 약간 "pushy"하게 — Claude가 트리거를 보수적으로 판단하는 경향을 보상
skills/myharness/references/skill-writing-guide.md:97:- "Claude가 이미 알고 있는 내용인가?" → 삭제
skills/myharness/references/skill-writing-guide.md:98:- "이 설명이 없으면 Claude가 실수하는가?" → 유지
skills/myharness/references/skill-writing-guide.md:268:- 이미 Claude가 알고 있는 일반적 지식
skills/myharness/references/qa-agent-guide.md:63:**방법**: `src/app/` 하위 page 파일의 URL 경로를 추출하고, 코드 내 모든 `href`, `router.push()`, `redirect()` 값과 대조.
skills/myharness/references/qa-agent-guide.md:70:2. 코드 내 모든 href=, router.push(, redirect( 값 수집
skills/myharness/references/qa-agent-guide.md:156:- [ ] 코드 내 모든 href/router.push 값이 실제 page 파일 경로와 매칭
skills/myharness/references/qa-agent-guide.md:203:| 라우팅 | src/app/ page 파일 경로 | href, router.push 값 |
skills/myharness/references/orchestrator-template.md:8:- **템플릿 D: Codex 런타임 어댑터** — Codex CLI에서 실행 시(팀 도구 부재). A/B를 순차·subprocess로 매핑
skills/myharness/references/orchestrator-template.md:10:> 듀얼 런타임(Claude Code + Codex) 설계 전반은 `references/runtime-adapters.md` 참조. 오케스트레이터 상단에 "런타임 감지 후 분기" 한 줄을 넣고, 팀 도구 가용 시 A, 부재 시 D를 따른다.
skills/myharness/references/orchestrator-template.md:16:2명 이상의 에이전트가 협업할 때 **가장 먼저 검토하는 기본 모드**. `TeamCreate`로 팀을 구성하고, 공유 작업 목록과 `SendMessage`로 조율한다.
skills/myharness/references/orchestrator-template.md:62:   TeamCreate(
skills/myharness/references/orchestrator-template.md:65:       { name: "{teammate-1}", agent_type: "{type}", model: "opus", prompt: "{역할 설명 및 작업 지시}" },
skills/myharness/references/orchestrator-template.md:66:       { name: "{teammate-2}", agent_type: "{type}", model: "opus", prompt: "{역할 설명 및 작업 지시}" },
skills/myharness/references/orchestrator-template.md:74:   TaskCreate(tasks: [
skills/myharness/references/orchestrator-template.md:92:- {teammate-1}은 {teammate-2}에게 {어떤 정보}를 SendMessage로 전달
skills/myharness/references/orchestrator-template.md:94:- 팀원이 다른 팀원의 결과가 필요하면 SendMessage로 요청
skills/myharness/references/orchestrator-template.md:105:- 특정 팀원이 막혔을 때 SendMessage로 지시 또는 작업 재할당
skills/myharness/references/orchestrator-template.md:115:1. 팀원들에게 종료 요청 (SendMessage)
skills/myharness/references/orchestrator-template.md:116:2. 팀 정리 (TeamDelete)
skills/myharness/references/orchestrator-template.md:120:> **팀 재구성이 필요한 경우:** Phase별로 다른 전문가 조합이 필요하면, 현재 팀을 TeamDelete로 정리한 뒤 새 TeamCreate로 다음 Phase의 팀을 구성한다. 이전 팀의 산출물은 `_workspace/`에 보존되므로 새 팀이 Read로 접근 가능.
skills/myharness/references/orchestrator-template.md:125:[리더] → TeamCreate → [teammate-1] ←SendMessage→ [teammate-2]
skills/myharness/references/orchestrator-template.md:141:| 팀원 1명 실패/중지 | 리더가 감지 → SendMessage로 상태 확인 → 재시작 또는 대체 팀원 생성 |
skills/myharness/references/orchestrator-template.md:161:3. SendMessage로 상태 확인 → 재시작 시도
skills/myharness/references/orchestrator-template.md:198:단일 메시지에서 N개 Agent 도구를 동시 호출:
skills/myharness/references/orchestrator-template.md:200:| 에이전트 | 입력 | 출력 | model | run_in_background |
skills/myharness/references/orchestrator-template.md:202:| {agent-1} | {소스} | `_workspace/{phase}_{agent}_{artifact}.md` | opus | true |
skills/myharness/references/orchestrator-template.md:203:| {agent-2} | {소스} | `_workspace/{phase}_{agent}_{artifact}.md` | opus | true |
skills/myharness/references/orchestrator-template.md:245:단일 메시지에서 Agent 도구로 N개 에이전트 병렬 호출 (`run_in_background: true`).
skills/myharness/references/orchestrator-template.md:251:1. `TeamCreate`로 통합 팀 구성 (editor + fact-checker + synthesizer)
skills/myharness/references/orchestrator-template.md:252:2. `TaskCreate`로 작업 분배 — 모두 Phase 2의 `_workspace/02_*` 파일을 Read
skills/myharness/references/orchestrator-template.md:253:3. 팀원들이 `SendMessage`로 상충 데이터를 논의, 파일 기반으로 합의안 도출
skills/myharness/references/orchestrator-template.md:255:5. `TeamDelete`로 팀 정리
skills/myharness/references/orchestrator-template.md:264:- 팀 → 서브: 팀을 반드시 `TeamDelete`로 정리한 후 Agent 도구 호출
skills/myharness/references/orchestrator-template.md:266:- 팀 → 팀: 이전 팀을 정리한 후 새 `TeamCreate` (세션당 1팀만 활성 가능)
skills/myharness/references/orchestrator-template.md:272:## 템플릿 D: Codex 런타임 어댑터
skills/myharness/references/orchestrator-template.md:274:Codex엔 `TeamCreate`/`SendMessage`는 없지만 **네이티브 subagents**(내장 `default`/`worker`/`explorer` + 커스텀 `.codex/agents/*.toml`)가 있다. 정본 스킬(`.agents/skills/`, SKILL.md 동일 포맷)은 공유하고, **조율 도구만** 매핑한다. (검증: 공식 Codex docs + 0.137.0)
skills/myharness/references/orchestrator-template.md:277:## 실행 모드: Codex 어댑터 (런타임 감지 후 분기)
skills/myharness/references/orchestrator-template.md:279:> 팀 도구(TeamCreate 등) 가용 시 템플릿 A. 부재 시(=Codex) 아래.
skills/myharness/references/orchestrator-template.md:282:| 팀 모드(A) | Codex 어댑터(D) |
skills/myharness/references/orchestrator-template.md:284:| TeamCreate(members) | Codex subagents 병렬 spawn(`.codex/agents/*.toml` 또는 내장 worker/explorer), `/agent`로 전환 |
skills/myharness/references/orchestrator-template.md:285:| TaskCreate/depends_on | 단계 순서 실행(의존 = 선행 단계 산출물 파일 존재 확인) |
skills/myharness/references/orchestrator-template.md:286:| SendMessage(팀원 통신) | `_workspace/` 파일로 전달 — 다음 단계가 Read |
skills/myharness/references/orchestrator-template.md:287:| 완전 독립 병렬(CI 등) | `codex exec` subprocess 백그라운드 |
skills/myharness/references/orchestrator-template.md:290:subagents 병렬 또는 순차. 각 산출물 `_workspace/{phase}_{agent}_{artifact}.md` 저장 → 다음 단계가 Read로 입력(메시지 대신 파일).
skills/myharness/references/orchestrator-template.md:292:### codex exec subprocess (독립 병렬·CI)
skills/myharness/references/orchestrator-template.md:301:- 외부 리뷰 게이트(external-review-loop)는 양쪽 동일 — 이미 subprocess.
skills/myharness/references/orchestrator-template.md:307:[오케스트레이터] → subagents/순차/codex exec → `_workspace/*.md` → Read 통합 → 최종 산출물
skills/myharness/references/orchestrator-template.md:310:> Codex 진입점(AGENTS.md)·스킬 경로(`.agents/skills/`)·설치·한계는 `references/runtime-adapters.md`.
skills/myharness/references/orchestrator-template.md:316:1. **실행 모드를 먼저 명시** — 오케스트레이터 상단에 "에이전트 팀" / "서브 에이전트" / "하이브리드" / "Codex 어댑터" 중 하나 명시. 듀얼 런타임이면 "런타임 감지 후 A 또는 D" 명시. 하이브리드면 Phase별 모드 표 필수
skills/myharness/references/orchestrator-template.md:317:2. **팀 모드는 TeamCreate/SendMessage/TaskCreate 사용법을 구체적으로** — 팀 구성, 작업 등록, 통신 규칙
skills/myharness/references/orchestrator-template.md:318:3. **서브 모드는 Agent 도구 파라미터를 완전히 명시** — name, subagent_type, prompt, run_in_background, model
skills/myharness/references/orchestrator-template.md:338:준비 → Phase 0(컨텍스트 확인) → TeamCreate + TaskCreate → N개 팀원 병렬 실행 → Read + 통합 → 정리.
skills/myharness/references/runtime-adapters.md:1:# 런타임 어댑터 — Claude Code / Codex 듀얼 런타임
skills/myharness/references/runtime-adapters.md:3:하네스 정본(스킬 본문·references·스크립트)은 **런타임 무관 마크다운**이다. Claude Code와 Codex는 커스터마이징 모델이 **거의 대칭**이다(둘 다 skills·agents·plugin·MCP·hooks 보유). 차이는 진입점 파일명·에이전트 정의 포맷·오케스트레이션 도구뿐. 그 셋만 어댑터로 흡수한다.
skills/myharness/references/runtime-adapters.md:5:> 본 문서의 Codex 사실관계는 공식 Codex docs(developers.openai.com/codex) + `codex-cli 0.137.0` 기준 검증됨.
skills/myharness/references/runtime-adapters.md:18:| 관심사 | Claude Code | Codex CLI | 이식성 |
skills/myharness/references/runtime-adapters.md:20:| 인스트럭션 | `CLAUDE.md` | `AGENTS.md` (글로벌 `~/.codex` → 레포 루트→cwd concat, **가까운 쪽 우선**, 32KiB cap) | ✅ 듀얼 출력 |
skills/myharness/references/runtime-adapters.md:22:| 에이전트 정의 | `.claude/agents/{n}.md` | `.codex/agents/{n}.toml` (커스텀) + 내장 `default`/`worker`/`explorer` | 🟡 포맷 변환(md→toml) |
skills/myharness/references/runtime-adapters.md:23:| 멀티 에이전트 | `TeamCreate`/`SendMessage`/`TaskCreate` | **네이티브 subagents**(병렬 spawn) 또는 `codex exec` subprocess | 🟡 어댑터 |
skills/myharness/references/runtime-adapters.md:25:| 설정 | settings.json | `.codex/config.toml`(프로젝트, trusted) + `~/.codex/config.toml` | 🟡 |
skills/myharness/references/runtime-adapters.md:27:| 커스텀 슬래시 | `commands/*.md` | ❌ `~/.codex/prompts/*.md`·`$ARGUMENTS` 0.137.0 미지원 | 🔴 생략 |
skills/myharness/references/runtime-adapters.md:28:| 외부 리뷰(codex/gemini 호출) | subprocess | subprocess (동일) | ✅ 공짜 |
skills/myharness/references/runtime-adapters.md:34:- **Claude Code:** `.claude-plugin/plugin.json` + `skills/` 자동 발견 + `CLAUDE.md`. (현행)
skills/myharness/references/runtime-adapters.md:35:- **Codex:** 레포 루트 `AGENTS.md` 자동 로드(루트→cwd concat, 가까운 쪽 우선). AGENTS.md 역할: 하네스 포인터 + "하네스 만들/고치려면 `skills/myharness/SKILL.md`를 따르라" + 오케스트레이션은 §4 어댑터. (Codex 스킬 auto-activation이 있으므로, 스킬을 `.agents/skills/`에 두면 AGENTS.md는 얇게 가능.)
skills/myharness/references/runtime-adapters.md:39:- **에이전트:** Claude는 `.claude/agents/{n}.md`. Codex는 `.codex/agents/{n}.toml`(커스텀) — 같은 역할/원칙/프로토콜을 TOML로 변환하거나, 단순 역할은 내장 `worker`/`explorer`에 프롬프트로 매핑. 교리 주입(dev-rules/tdd-doctrine) 실경로는 런타임별 스킬 경로로 맞춘다.
skills/myharness/references/runtime-adapters.md:43:- **Claude Code:** `TeamCreate`+`SendMessage`+`TaskCreate` (템플릿 A).
skills/myharness/references/runtime-adapters.md:44:- **Codex:** 네이티브 subagents로 병렬 specialized agents spawn(`/agent` 전환, `.codex/agents/*.toml`), 또는 독립 병렬이 필요하면 `codex exec` subprocess. 데이터는 `_workspace/` 파일 기반(템플릿 D).
skills/myharness/references/runtime-adapters.md:46:- external-review-loop 게이트는 양쪽 동일(이미 subprocess).
skills/myharness/references/runtime-adapters.md:52:- 에이전트 → `.claude/agents/{n}.md` + `.codex/agents/{n}.toml`
skills/myharness/references/runtime-adapters.md:53:- (선택) MCP 필요 시 `.codex/config.toml`의 `mcp_servers.<id>` 동봉
skills/myharness/references/runtime-adapters.md:56:- **Claude Code:** 플러그인 추가(`/plugin` 또는 marketplace.json). `skills/` 자동 인식.
skills/myharness/references/runtime-adapters.md:57:- **Codex:** 레포 루트 `AGENTS.md`·`.agents/skills/`·`.codex/`는 trusted 프로젝트에서 자동 인식 — 별도 설치 최소. MCP는 `.codex/config.toml`에 동봉(trusted 한정, auth/telemetry 등 machine-local 키는 project-local 무시됨).
skills/myharness/references/runtime-adapters.md:61:- **커스텀 슬래시 프롬프트는 Codex 0.137.0 미지원** — Claude의 `commands/`에 1:1 대응 없음(애초에 하네스는 커맨드 안 만드니 영향 작음).
skills/myharness/references/runtime-adapters.md:63:- **팀 통신 시맨틱 차이** — Claude의 SendMessage 실시간 토론 ↔ Codex subagents/파일 기반. 합의 중심 하네스는 Claude가 더 매끄러움.
skills/myharness/references/runtime-adapters.md:64:- 결론(codex 자문): 듀얼 포팅 단위는 "AGENTS.md 인라인"만이 아니라 **plugin + skills + (선택)subagents + 프로젝트 `.codex/config.toml`**. 정본·리뷰·스크립트는 공유, 변환은 에이전트 포맷·오케스트레이션뿐.

hook: PostToolUse
 succeeded in 0ms:
skills/myharness/SKILL.md:9:1. 에이전트 정의(`.claude/agents/`)와 스킬(`.claude/skills/`)을 생성한다.
skills/myharness/SKILL.md:11:3. **CLAUDE.md(+ Codex는 AGENTS.md)에 하네스 포인터를 등록한다.** — 새 세션에서 오케스트레이터 스킬이 트리거되도록 최소한의 포인터(트리거 규칙 + 변경 이력)만 기록한다. (듀얼 출력은 원칙 8·Phase 5-4)
skills/myharness/SKILL.md:12:4. **하네스는 고정물이 아니라 진화하는 시스템이다.** — 매 실행 후 피드백을 반영하고, 에이전트·스킬·CLAUDE.md를 지속 갱신한다.
skills/myharness/SKILL.md:13:5. **품질 게이트 2층 (코드/설계 도메인).** *내부* 생성-검증(같은 세션 QA)과 *외부* 리뷰 루프(codex/gemini 독립 검증)를 병행한다. 같은 컨텍스트 QA는 같은 맹점을 공유하므로 외부 독립 관점이 추가 결함을 잡는다. 단 합의=정답 아님 — 판정 권위는 오케스트레이터. 상세: `references/external-review-loop.md`.
skills/myharness/SKILL.md:14:6. **생성물에 교리 주입.** 빌더·수정·QA 에이전트의 작업 원칙에 개발 규칙·TDD 교리를 **타겟상대 실경로**로 주입한다(`[[ ]]`·플러그인 내부 경로 금지 — 서브에이전트가 해소 못 함). 상세: `references/dev-rules.md`, `references/tdd-doctrine.md`.
skills/myharness/SKILL.md:15:7. **리스크 등급으로 게이트 강도 조절.** 무차별 게이트는 과의식이다. 단계마다 경량/표준/중대 등급을 정해 게이트 강도를 맞춘다 (Phase 5-6).
skills/myharness/SKILL.md:16:8. **듀얼 런타임 (Claude Code + Codex).** 두 런타임 거의 대칭(둘 다 skills·agents·MCP·hooks). SKILL.md 포맷 동일이라 정본 공유, 어댑터로 분기할 것만: 진입점(plugin.json+CLAUDE.md / AGENTS.md), 스킬 경로(`.claude/skills/` / `.agents/skills/`), 에이전트(`.md` / `.codex/agents/*.toml`), 오케스트레이션(TeamCreate / Codex subagents·subprocess). 생성 시 양쪽 출력. 상세·검증: `references/runtime-adapters.md`.
skills/myharness/SKILL.md:20:### Phase 0: 현황 감사
skills/myharness/SKILL.md:24:1. `프로젝트/.claude/agents/`, `프로젝트/.claude/skills/`, `프로젝트/CLAUDE.md`를 읽는다
skills/myharness/SKILL.md:26:   - **신규 구축**: 에이전트/스킬 디렉토리가 없거나 비어있음 → Phase 1부터 전체 실행
skills/myharness/SKILL.md:28:   - **운영/유지보수**: 기존 하네스의 감사·수정·동기화 요청 → Phase 7-5 운영/유지보수 워크플로우로 이동
skills/myharness/SKILL.md:31:   | 변경 유형 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 |
skills/myharness/SKILL.md:33:   | 에이전트 추가 | 건너뜀 (Phase 0 결과 활용) | 배치 결정만 | 필수 (3-0 포함) | 전용 스킬 필요 시 (4-0 포함) | 오케스트레이터 수정 | 필수 |
skills/myharness/SKILL.md:36:3. 기존 에이전트/스킬 목록과 CLAUDE.md 기록을 대조하여 불일치(drift)를 감지한다
skills/myharness/SKILL.md:39:### Phase 1: 도메인 분석
skills/myharness/SKILL.md:42:3. Phase 0 감사 결과를 기반으로 기존 에이전트/스킬과의 충돌/중복 분석
skills/myharness/SKILL.md:46:### Phase 2: 팀 아키텍처 설계
skills/myharness/SKILL.md:63:> 상세 비교표와 패턴별 의사결정 트리는 `references/agent-design-patterns.md`의 "실행 모드" 참조.
skills/myharness/SKILL.md:68:2. 에이전트 팀 구조 결정 (아키텍처 패턴은 `references/agent-design-patterns.md` 참조)
skills/myharness/SKILL.md:78:전문성·병렬성·컨텍스트·재사용성 4축으로 판단한다. 상세 기준표는 `references/agent-design-patterns.md`의 "에이전트 분리 기준" 참조. 기존 에이전트와의 중복·재사용 검토는 Phase 3-0에서 다룬다.
skills/myharness/SKILL.md:80:### Phase 3: 에이전트 정의 생성
skills/myharness/SKILL.md:84:신규 에이전트 생성 전, `프로젝트/.claude/agents/`의 기존 에이전트와 중복 여부를 확인한다. 하네스를 반복 구축하다 보면 역할이 겹치는 에이전트가 다른 이름으로 누적되기 쉽다.
skills/myharness/SKILL.md:86:> 중복 분류 기준과 재사용 설계는 `references/agent-design-patterns.md`의 "에이전트 재사용 설계" 참조.
skills/myharness/SKILL.md:88:**모든 에이전트는 반드시 `프로젝트/.claude/agents/{name}.md` 파일로 정의한다.** 에이전트 정의 파일 없이 Agent 도구의 prompt에 역할을 직접 넣는 것은 금지한다. 이유:
skills/myharness/SKILL.md:99:각 에이전트를 `프로젝트/.claude/agents/{name}.md`에 정의한다. 필수 섹션: 핵심 역할, 작업 원칙, 입력/출력 프로토콜, 에러 핸들링, 협업. 에이전트 팀 모드에서는 `## 팀 통신 프로토콜` 섹션을 추가하여 메시지 수신/발신 대상과 작업 요청 범위를 명시한다.
skills/myharness/SKILL.md:101:> 정의 템플릿과 실제 파일 전문은 `references/agent-design-patterns.md`의 "에이전트 정의 구조" + `references/team-examples.md` 참조.
skills/myharness/SKILL.md:107:- 상세 가이드: `references/qa-agent-guide.md` 참조
skills/myharness/SKILL.md:112:1. `references/dev-rules.md`, `references/tdd-doctrine.md`를 타겟 하네스의 `프로젝트/.claude/skills/{harness-name}/references/`로 **복사**한다.
skills/myharness/SKILL.md:113:2. 에이전트 정의에 **타겟상대 실경로** 한 줄씩 넣는다 — `> 개발 규칙: \`.claude/skills/{harness-name}/references/dev-rules.md\` 준수.` / `> TDD 규율: \`.claude/skills/{harness-name}/references/tdd-doctrine.md\` 준수.`
skills/myharness/SKILL.md:117:### Phase 4: 스킬 생성
skills/myharness/SKILL.md:119:각 에이전트가 사용할 스킬을 `프로젝트/.claude/skills/{name}/SKILL.md`에 생성한다. 상세 작성 가이드는 `references/skill-writing-guide.md` 참조.
skills/myharness/SKILL.md:123:신규 스킬 생성 전, `프로젝트/.claude/skills/`의 기존 스킬과 중복 여부를 확인한다. 하네스를 반복 구축하다 보면 기능이 겹치는 스킬이 다른 이름으로 누적되기 쉽다.
skills/myharness/SKILL.md:125:> 중복 분류 기준과 일반화 패턴은 `references/skill-writing-guide.md`의 "스킬 재사용 설계" 참조.
skills/myharness/SKILL.md:135:    ├── scripts/    - 반복/결정적 작업용 실행 코드
skills/myharness/SKILL.md:136:    ├── references/ - 조건부 로딩하는 참조 문서
skills/myharness/SKILL.md:154:| **Lean하게 유지** | 컨텍스트 윈도우는 공공재다. SKILL.md 본문은 500줄 이내를 목표로, 무게를 벌지 않는 내용은 삭제하거나 references/로 이동한다. |
skills/myharness/SKILL.md:156:| **반복 코드는 번들링** | 테스트 실행에서 에이전트들이 공통으로 작성하는 스크립트가 발견되면 `scripts/`에 미리 번들링한다. |
skills/myharness/SKILL.md:167:| **references/** | 필요할 때만 | 무제한 (스크립트는 로딩 없이 실행 가능) |
skills/myharness/SKILL.md:170:- SKILL.md가 500줄에 근접하면 세부 내용을 references/로 분리하고, 본문에 "언제 이 파일을 읽으라"는 포인터를 남긴다
skills/myharness/SKILL.md:172:- 도메인/프레임워크별 변형이 있으면 references/ 하위에 도메인별로 분리하여, 관련 파일만 로드한다
skills/myharness/SKILL.md:177:└── references/
skills/myharness/SKILL.md:189:> 상세 작성 패턴, 예시, 데이터 스키마 표준은 `references/skill-writing-guide.md` 참조.
skills/myharness/SKILL.md:194:1. **점검:** `bash skills/myharness/scripts/check-review-tools.sh` → 끝줄 `AVAILABLE:`. **none**=스킬 생성 안 함(내부 QA만, 보고서·CLAUDE.md에 "도구 미연동 생략" 명시) / **하나만**=그 도구만 쓰는 저하 모드 생성 / **둘 다**=풀 생성.
skills/myharness/SKILL.md:195:2. **생성:** `references/external-review-loop.md`(방법론 겸 템플릿)를 타겟 `.claude/skills/external-review-loop/SKILL.md`로 생성(frontmatter 포함). `check-review-tools.sh`도 그 스킬 `scripts/`로 복사(런타임 폴백).
skills/myharness/SKILL.md:198:### Phase 5: 통합 및 오케스트레이션
skills/myharness/SKILL.md:200:오케스트레이터는 스킬의 특수한 형태로, 개별 에이전트와 스킬을 하나의 워크플로우로 엮어 팀 전체를 조율한다. Phase 4에서 생성한 개별 스킬이 "각 에이전트가 무엇을 어떻게 하는가"를 정의한다면, 오케스트레이터는 "누가 언제 어떤 순서로 협업하는가"를 정의한다. 구체적 템플릿은 `references/orchestrator-template.md` 참조.
skills/myharness/SKILL.md:204:Phase 2-1에서 선택한 실행 모드에 따라 오케스트레이터 패턴이 달라진다:
skills/myharness/SKILL.md:233:- **병렬 수집(서브) → 합의 통합(팀)**: Phase 2에서 서브 에이전트로 독립 자료를 병렬 수집 → Phase 3에서 팀을 만들어 토론·합의 기반 통합
skills/myharness/SKILL.md:234:- **팀 생성(팀) → 검증(서브)**: Phase 2에서 팀이 초안 생성 → Phase 3에서 단일 서브 에이전트가 독립 검증
skills/myharness/SKILL.md:256:- 파일명 컨벤션: `{phase}_{agent}_{artifact}.{ext}` (예: `01_analyst_requirements.md`)
skills/myharness/SKILL.md:264:> 에러 유형별 전략표와 구현 상세는 `references/orchestrator-template.md`의 "에러 핸들링" 참조.
skills/myharness/SKILL.md:276:#### 5-4. CLAUDE.md 하네스 포인터 등록
skills/myharness/SKILL.md:278:하네스 구성 완료 후, 프로젝트의 `CLAUDE.md`에 최소한의 포인터를 등록한다. CLAUDE.md는 새 세션마다 로딩되므로, 하네스 존재와 트리거 규칙만 기록하면 오케스트레이터 스킬이 나머지를 처리한다.
skills/myharness/SKILL.md:280:**CLAUDE.md 템플릿:**
skills/myharness/SKILL.md:283:## 하네스: {도메인명}
skills/myharness/SKILL.md:285:**목표:** {하네스의 핵심 목표 한 줄}
skills/myharness/SKILL.md:287:**트리거:** {도메인} 관련 작업 요청 시 `{orchestrator-skill-name}` 스킬을 사용하라. 단순 질문은 직접 응답 가능.
skills/myharness/SKILL.md:292:| {YYYY-MM-DD} | 초기 구성 | 전체 | - |
skills/myharness/SKILL.md:295:**듀얼 런타임 포인터:** Codex용으로 레포 루트 `AGENTS.md`에도 같은 포인터 + Codex 오케스트레이션 어댑터(subagents/subprocess) 주석을 출력한다(Codex 자동 로드). 둘 다 같은 정본을 가리킴. 한쪽만 갱신=drift. 상세: `references/runtime-adapters.md`.
skills/myharness/SKILL.md:297:**CLAUDE.md에 넣지 않는 것:** 에이전트 목록, 스킬 목록, 디렉토리 구조, 실행 규칙 상세. 이유: 에이전트/스킬 목록은 오케스트레이터 스킬과 `.claude/agents/`, `.claude/skills/`에서 관리하므로 중복이다. 디렉토리 구조는 파일 시스템에서 직접 확인 가능하다. CLAUDE.md는 **포인터(트리거 규칙) + 변경 이력**만 담는다.
skills/myharness/SKILL.md:306:- "{도메인}의 {부분작업}만 다시"
skills/myharness/SKILL.md:309:**2. 오케스트레이터 Phase 1에 컨텍스트 확인 단계 추가:**
skills/myharness/SKILL.md:320:> 오케스트레이터 템플릿의 "Phase 0: 컨텍스트 확인" 섹션 참조: `references/orchestrator-template.md`
skills/myharness/SKILL.md:332:**단계 마감 게이트(표준·중대):** 오케스트레이터가 `external-review-loop` 스킬 호출 — codex/gemini 병렬 → 전건 판정(확인/부분/이월/기각) → 확인분만 TDD 수정 → 게이트 PASS. 판정 권위는 오케스트레이터(위임 금지). 상세: `references/external-review-loop.md`.
skills/myharness/SKILL.md:339:### Phase 6: 검증 및 테스트
skills/myharness/SKILL.md:341:생성된 하네스를 검증한다. 상세 테스트 방법론은 `references/skill-testing-guide.md` 참조.
skills/myharness/SKILL.md:373:5. **반복 패턴 번들링** — 테스트 실행에서 에이전트들이 공통으로 작성하는 코드(예: 모든 테스트에서 동일한 헬퍼 스크립트를 생성)가 발견되면, 해당 코드를 `scripts/`에 미리 번들링한다.
skills/myharness/SKILL.md:398:### Phase 7: 하네스 진화
skills/myharness/SKILL.md:424:모든 변경은 CLAUDE.md의 **변경 이력** 테이블에 기록한다 (Phase 5-4 템플릿의 "변경 이력" 섹션과 동일 테이블):
skills/myharness/SKILL.md:446:기존 하네스의 점검·수정·동기화를 체계적으로 수행한다. Phase 0에서 "운영/유지보수" 분기로 진입했을 때 이 워크플로우를 따른다.
skills/myharness/SKILL.md:449:- `.claude/agents/` 파일 목록과 오케스트레이터 스킬의 에이전트 구성 비교 → 불일치 목록 생성
skills/myharness/SKILL.md:450:- `.claude/skills/` 디렉토리 목록과 오케스트레이터 스킬의 스킬 구성 비교 → 불일치 목록 생성
skills/myharness/SKILL.md:457:**Step 3: CLAUDE.md 변경 이력 갱신**
skills/myharness/SKILL.md:461:- 수정된 에이전트/스킬의 구조 검증 (Phase 6-1 기준)
skills/myharness/SKILL.md:462:- 수정 범위가 트리거에 영향을 주면 트리거 검증 (Phase 6-4 기준)
skills/myharness/SKILL.md:463:- 대규모 변경(아키텍처 변경, 에이전트 3개 이상 추가/삭제) 시 Phase 6-3(실행 테스트), 6-5(드라이런)까지 수행
skills/myharness/SKILL.md:464:- CLAUDE.md와 실제 파일의 일치 여부 최종 확인
skills/myharness/SKILL.md:470:- [ ] `.claude/agents/`(정의 파일, 빌트인 타입도 필수) + `.claude/skills/`(SKILL.md + references/) 생성
skills/myharness/SKILL.md:474:- [ ] 신규 에이전트·스킬 생성 전 기존 중복 검토 완료 (Phase 3-0, 4-0)
skills/myharness/SKILL.md:475:- [ ] `.claude/commands/` — 아무것도 생성하지 않음
skills/myharness/SKILL.md:478:- [ ] SKILL.md 본문이 500줄 이내, 초과 시 references/ 분리
skills/myharness/SKILL.md:480:- [ ] **CLAUDE.md 포인터 등록 + 변경 이력에 에이전트/스킬 추가·삭제·수정 기록**
skills/myharness/SKILL.md:481:- [ ] **오케스트레이터 Phase 1에 컨텍스트 확인 단계** (초기/후속/부분 재실행 판별)
skills/myharness/SKILL.md:482:- [ ] (코드/설계) 코드/수정 에이전트에 dev-rules·tdd-doctrine **타겟상대 실경로** 주입 (`[[ ]]` 금지) + 교리 파일 타겟 복사 (Phase 3-1)
skills/myharness/SKILL.md:483:- [ ] (코드/설계) **codex/gemini 연동 점검**(`check-review-tools.sh`) 후 `external-review-loop` 스킬 생성 — 도구 전무면 생략(불필요 스킬 방지) + 단계 게이트 배선, 단계마다 리스크 등급 판정 (Phase 4-6, 5-6)
skills/myharness/SKILL.md:486:- [ ] **듀얼 런타임:** 루트 `AGENTS.md` + 스킬 `.agents/skills/` 출력, 오케스트레이터에 어댑터(TeamCreate / Codex subagents·subprocess) 명시 (`references/runtime-adapters.md`)
skills/myharness/SKILL.md:490:- 하네스 패턴: `references/agent-design-patterns.md`
skills/myharness/SKILL.md:491:- 기존 하네스 예시 (실제 파일 전문 포함): `references/team-examples.md`
skills/myharness/SKILL.md:492:- 오케스트레이터 템플릿: `references/orchestrator-template.md`
skills/myharness/SKILL.md:493:- **스킬 작성 가이드**: `references/skill-writing-guide.md` — 작성 패턴, 예시, 데이터 스키마 표준
skills/myharness/SKILL.md:494:- **스킬 테스트 가이드**: `references/skill-testing-guide.md` — 테스트/평가/반복 개선 방법론
skills/myharness/SKILL.md:495:- **QA 에이전트 가이드**: `references/qa-agent-guide.md` — 빌드 하네스에 QA 에이전트를 포함할 때 참조. 통합 정합성 검증 방법론, 경계면 버그 패턴, QA 에이전트 정의 템플릿 포함. 실제 프로젝트에서 발견된 7개 버그 사례 기반.
skills/myharness/SKILL.md:496:- **외부 리뷰 루프**: `references/external-review-loop.md` — 코드/설계 도메인 하네스에 codex/gemini 독립 검증 단계 게이트를 넣을 때 참조. 방법론 겸 생성 템플릿. 전건 판정·기각 사유표·커밋 순서·자율 노브 포함.
skills/myharness/SKILL.md:497:- **TDD 교리 / 개발 규칙**: `references/tdd-doctrine.md`, `references/dev-rules.md` — 코드/수정 에이전트 작업 원칙 주입용.
skills/myharness/SKILL.md:498:- **런타임 어댑터**: `references/runtime-adapters.md` — Claude Code/Codex 듀얼 런타임 설계. 진입점·오케스트레이션 매핑, AGENTS.md·`.agents/skills/` 생성, 설치(Codex 공식 docs 검증).
skills/myharness/scripts/check-review-tools.sh:19:if [ "${#avail[@]}" -eq 0 ]; then
skills/myharness/scripts/check-review-tools.sh:23:echo "AVAILABLE: ${avail[*]}"
skills/myharness/references/external-review-loop.md:5:2. **생성 템플릿** — 코드/설계 도메인 하네스를 만들 때, 이 내용을 타겟 프로젝트의 `.claude/skills/external-review-loop/SKILL.md`로 생성한다(아래 frontmatter 포함). **단, 생성 전 `check-review-tools.sh`로 codex/gemini 연동을 확인**하고, 둘 다 미설치면 스킬을 만들지 않는다(Phase 4-6). 생성 시 `check-review-tools.sh`를 스킬의 `scripts/`로 함께 번들한다.
skills/myharness/references/external-review-loop.md:18:- `{산출물}`: 리뷰 대상 — 설계서/코드 디렉토리/문서
skills/myharness/references/external-review-loop.md:19:- `{단계ID}`: 임의 단계 식별자 (예: `design-auth`, `feat-login`)
skills/myharness/references/external-review-loop.md:20:- `{커밋id}`: 해당 시 `git rev-parse HEAD`, 아니면 생략
skills/myharness/references/external-review-loop.md:21:- `{게이트명령}`: 프로젝트 테스트/린트 게이트 (예: `npm test && tsc --noEmit` / 없으면 생략)
skills/myharness/references/external-review-loop.md:26:리뷰 대상 : {산출물}
skills/myharness/references/external-review-loop.md:27:관련 commit id : {커밋id}   # 없으면 생략
skills/myharness/references/external-review-loop.md:30:1. [{이슈레벨}] {타이틀}
skills/myharness/references/external-review-loop.md:31:- 현황: {상황}  - 이슈: {상세}  - 권고: {대응방안}
skills/myharness/references/external-review-loop.md:37:먼저 `bash scripts/check-review-tools.sh`로 사용가능 도구 재확인(끝줄 `AVAILABLE:`). 사용가능 도구만 실행한다. 루트에서 백그라운드 병렬·읽기전용. 프롬프트·출력 모두 `_workspace/reviews/`에 보존(감사 — /tmp 금지).
skills/myharness/references/external-review-loop.md:41:codex exec --sandbox read-only "$(cat _workspace/reviews/{단계ID}_prompt_general.md)" < /dev/null \
skills/myharness/references/external-review-loop.md:42:  > _workspace/reviews/{단계ID}_codex.md 2>&1 &
skills/myharness/references/external-review-loop.md:43:gemini -p "$(cat _workspace/reviews/{단계ID}_prompt_perf.md)" < /dev/null \
skills/myharness/references/external-review-loop.md:44:  > _workspace/reviews/{단계ID}_gemini.md 2>&1 &
skills/myharness/references/external-review-loop.md:69:`{게이트명령}` 실행 → PASS. 게이트 없으면(설계서) 정본 정합성 재확인으로 대체. 테스트 리소스 간섭 게이트는 동시 실행 금지.
skills/myharness/references/external-review-loop.md:72:1. 결과서에 `## 외부 리뷰 반영 ({일자} — {단계ID} {k}건)` § — 판정표·게이트 수치·출처(codex/gemini).
skills/myharness/references/external-review-loop.md:73:2. 순서: 게이트 PASS → **승인 관문** → 단일 커밋(`fix: 외부 리뷰 {k}건 — {요지}`, Co-Authored-By).
skills/myharness/references/team-examples.md:29:> 리서치 에이전트는 `general-purpose` 빌트인 타입을 사용하되, 반드시 `.claude/agents/{name}.md` 파일로 정의한다. 파일에는 역할·조사 범위·팀 통신 프로토콜을 명시하여 재사용성과 협업 품질을 보장한다.
skills/myharness/references/team-examples.md:34:Phase 1: 준비
skills/myharness/references/team-examples.md:38:Phase 2: 팀 구성
skills/myharness/references/team-examples.md:40:      { name: "official", prompt: "공식 채널 조사..." },
skills/myharness/references/team-examples.md:41:      { name: "media", prompt: "미디어/투자 동향 조사..." },
skills/myharness/references/team-examples.md:42:      { name: "community", prompt: "커뮤니티 반응 조사..." },
skills/myharness/references/team-examples.md:43:      { name: "background", prompt: "배경/경쟁 환경 조사..." }
skills/myharness/references/team-examples.md:46:      { title: "공식 채널 조사", assignee: "official" },
skills/myharness/references/team-examples.md:47:      { title: "미디어 동향 조사", assignee: "media" },
skills/myharness/references/team-examples.md:48:      { title: "커뮤니티 반응 조사", assignee: "community" },
skills/myharness/references/team-examples.md:49:      { title: "배경 환경 조사", assignee: "background" }
skills/myharness/references/team-examples.md:52:Phase 3: 조사 수행
skills/myharness/references/team-examples.md:59:Phase 4: 통합
skills/myharness/references/team-examples.md:64:Phase 5: 정리
skills/myharness/references/team-examples.md:88:Phase 1 (병렬 — 에이전트 팀): worldbuilder + character-designer + plot-architect
skills/myharness/references/team-examples.md:90:Phase 2 (순차): prose-stylist (집필)
skills/myharness/references/team-examples.md:91:Phase 3 (병렬 — 에이전트 팀): science-consultant + continuity-manager (리뷰)
skills/myharness/references/team-examples.md:93:Phase 4 (순차): prose-stylist (리뷰 반영 수정)
skills/myharness/references/team-examples.md:154:Phase 1: TeamCreate(team_name: "novel-team", members: [worldbuilder, character-designer, plot-architect])
skills/myharness/references/team-examples.md:160:Phase 2: Phase 1 팀 정리 → prose-stylist를 서브 에이전트로 호출 (단독 집필이므로 팀 불필요)
skills/myharness/references/team-examples.md:164:Phase 3: 새 팀 생성 — TeamCreate(team_name: "review-team", members: [science-consultant, continuity-manager])
skills/myharness/references/team-examples.md:165:         (세션당 한 팀만 활성이지만, Phase 1 팀을 정리했으므로 새 팀 생성 가능)
skills/myharness/references/team-examples.md:170:Phase 4: prose-stylist를 서브 에이전트로 호출, 리뷰 결과 반영하여 최종 수정
skills/myharness/references/team-examples.md:183:Phase 1: Agent(webtoon-artist) → 패널 생성
skills/myharness/references/team-examples.md:184:Phase 2: Agent(webtoon-reviewer) → 검수
skills/myharness/references/team-examples.md:185:Phase 3: Agent(webtoon-artist) → 문제 패널 재생성 (최대 2회)
skills/myharness/references/team-examples.md:223:  ## Panel {N}
skills/myharness/references/team-examples.md:317:위치: `프로젝트/.claude/agents/{agent-name}.md`
skills/myharness/references/team-examples.md:322:위치: `프로젝트/.claude/skills/{skill-name}/SKILL.md` (프로젝트 레벨)
skills/myharness/references/team-examples.md:323:또는: `~/.claude/skills/{skill-name}/SKILL.md` (글로벌 레벨)
skills/myharness/references/team-examples.md:327:템플릿: `references/orchestrator-template.md` 참조.
skills/myharness/references/tdd-doctrine.md:27:팩토리는 이 파일을 타겟 하네스의 `.claude/skills/{harness-name}/references/tdd-doctrine.md`로 **복사**한 뒤, 코드 에이전트 정의 `## 작업 원칙`에 **타겟 실경로** 한 줄을 넣는다: `> TDD 규율: \`.claude/skills/{harness-name}/references/tdd-doctrine.md\` 준수.` 서브에이전트는 `[[ ]]`·플러그인 내부 경로를 해소 못 하므로 타겟상대 실경로 필수. 본문 복붙 금지(DRY).
skills/myharness/references/dev-rules.md:28:팩토리는 이 파일을 타겟 하네스의 `.claude/skills/{harness-name}/references/dev-rules.md`로 **복사**한 뒤, 에이전트 정의 `## 작업 원칙`에 **타겟 실경로** 한 줄을 넣는다: `> 개발 규칙: \`.claude/skills/{harness-name}/references/dev-rules.md\` 준수.` 서브에이전트는 `[[ ]]`·플러그인 내부 경로를 해소 못 하므로 타겟상대 실경로 필수. 본문 복붙 금지(DRY). 비코드 에이전트(문서·리서치)는 dev-rules만 선택 적용(TDD 제외).
skills/myharness/references/skill-testing-guide.md:3:하네스에서 생성한 스킬의 품질을 검증하고 반복적으로 개선하는 방법론. SKILL.md Phase 6의 보충 레퍼런스.
skills/myharness/references/skill-testing-guide.md:83:프롬프트: "{테스트 프롬프트}"
skills/myharness/references/skill-testing-guide.md:84:스킬 경로: {스킬 경로}
skills/myharness/references/skill-testing-guide.md:85:출력 경로: _workspace/iteration-N/eval-{id}/with_skill/outputs/
skills/myharness/references/skill-testing-guide.md:90:프롬프트: "{테스트 프롬프트}"  (동일)
skills/myharness/references/skill-testing-guide.md:92:출력 경로: _workspace/iteration-N/eval-{id}/without_skill/outputs/
skills/myharness/references/skill-testing-guide.md:210:4. **반복 작업은 번들링하라** — 모든 테스트 실행에서 동일한 헬퍼 스크립트가 생성되면, `scripts/`에 미리 포함한다.
skills/myharness/references/skill-testing-guide.md:283:{skill-name}-workspace/
skills/myharness/references/agent-design-patterns.md:19:- `SendMessage({to: name})`: 특정 팀원에게 메시지
skills/myharness/references/agent-design-patterns.md:20:- `SendMessage({to: "all"})`: 브로드캐스트 (비용 높음, 드물게)
skills/myharness/references/agent-design-patterns.md:113:[라우터] → { 전문가A | 전문가B | 전문가C }
skills/myharness/references/agent-design-patterns.md:199:`.claude/agents/{name}.md`에 에이전트를 정의하면 `subagent_type: "{name}"`으로 호출할 수 있다. 커스텀 에이전트는 전체 도구에 접근 가능.
skills/myharness/references/agent-design-patterns.md:205:| 역할이 복잡하고 여러 세션에서 재사용 | **커스텀 타입** (`.claude/agents/`) | 페르소나와 작업 원칙을 파일로 관리 |
skills/myharness/references/agent-design-patterns.md:211:**원칙:** 모든 에이전트는 반드시 `.claude/agents/{name}.md` 파일로 정의한다. 빌트인 타입이라도 에이전트 정의 파일을 생성하여 역할·원칙·프로토콜을 명시한다. 파일로 존재해야 다음 세션에서 재사용 가능하고, 팀 통신 프로토콜이 명시되어야 협업 품질이 보장된다.
skills/myharness/references/agent-design-patterns.md:282:| 위치 | `.claude/skills/` | `.claude/agents/` |
skills/myharness/references/agent-design-patterns.md:298:| **레퍼런스 로드** | `Read`로 스킬의 references/ 파일을 필요 시 로드 | 스킬 내용이 크고 조건부로만 필요한 경우 |
skills/myharness/references/skill-writing-guide.md:3:하네스에서 생성하는 스킬의 품질을 높이기 위한 상세 작성 가이드. SKILL.md Phase 4의 보충 레퍼런스.
skills/myharness/references/skill-writing-guide.md:146:└── references/
skills/myharness/references/skill-writing-guide.md:160:docx-js로 새 문서를 생성한다. → [DOCX-JS.md](references/docx-js.md) 참조.
skills/myharness/references/skill-writing-guide.md:164:**추적 변경이 필요하면**: [REDLINING.md](references/redlining.md) 참조
skills/myharness/references/skill-writing-guide.md:194:| 3개 테스트 중 3개에서 동일한 헬퍼 스크립트 생성 | `scripts/`에 번들링 |
skills/myharness/references/qa-agent-guide.md:25:| API 응답 → 프론트 훅 | API가 `{ projects: [...] }` 반환, 훅이 `SlideProject[]` 기대 | 각각 개별 검증하면 정상, 교차 비교 안 함 |
skills/myharness/references/qa-agent-guide.md:30:| 즉시 응답 → 비동기 결과 | API가 즉시 `{ status }` 반환, 프론트가 `data.failedIndices` 접근 | 동기/비동기 응답 구분 없이 타입만 확인 |
skills/myharness/references/qa-agent-guide.md:34:- **TypeScript 제네릭의 한계**: `fetchJson<SlideProject[]>()` — 런타임 응답이 `{ projects: [...] }`여도 컴파일 통과
skills/myharness/references/qa-agent-guide.md:53:4. 래핑 여부 확인 (API가 { data: [...] }를 반환하면 훅이 .data를 꺼내는지)
skills/myharness/references/qa-agent-guide.md:57:- 페이지네이션 API: `{ items: [], total, page }` vs 프론트가 배열 기대
skills/myharness/references/qa-agent-guide.md:82:2. 모든 API route에서 .update({ status: "..." }) 패턴 검색
skills/myharness/references/qa-agent-guide.md:133:오케스트레이터에서 QA를 "Phase 4: 전체 완성 후"에만 배치하면:
skills/myharness/references/qa-agent-guide.md:150:- [ ] 래핑된 응답({ items: [...] })은 훅에서 unwrap하는지 확인
skills/myharness/references/qa-agent-guide.md:204:| 상태 전이 | STATE_TRANSITIONS 맵 | .update({ status }) 코드 |
skills/myharness/references/qa-agent-guide.md:222:| `projects?.filter is not a function` | API→훅 | API가 `{projects:[]}` 반환, 훅이 배열 기대 |
skills/myharness/references/orchestrator-template.md:10:> 듀얼 런타임(Claude Code + Codex) 설계 전반은 `references/runtime-adapters.md` 참조. 오케스트레이터 상단에 "런타임 감지 후 분기" 한 줄을 넣고, 팀 도구 가용 시 A, 부재 시 D를 따른다.
skills/myharness/references/orchestrator-template.md:20:name: {domain}-orchestrator
skills/myharness/references/orchestrator-template.md:21:description: "{도메인} 에이전트 팀을 조율하는 오케스트레이터. {초기 실행 키워드}. 후속 작업: {도메인} 결과 수정, 부분 재실행, 업데이트, 보완, 다시 실행, 이전 결과 개선 요청 시에도 반드시 이 스킬을 사용."
skills/myharness/references/orchestrator-template.md:24:# {Domain} Orchestrator
skills/myharness/references/orchestrator-template.md:26:{도메인}의 에이전트 팀을 조율하여 {최종 산출물}을 생성하는 통합 스킬.
skills/myharness/references/orchestrator-template.md:34:| {teammate-1} | {커스텀 또는 빌트인} | {역할} | {skill} | {output-file} |
skills/myharness/references/orchestrator-template.md:35:| {teammate-2} | {커스텀 또는 빌트인} | {역할} | {skill} | {output-file} |
skills/myharness/references/orchestrator-template.md:40:### Phase 0: 컨텍스트 확인 (후속 작업 지원)
skills/myharness/references/orchestrator-template.md:46:   - **`_workspace/` 미존재** → 초기 실행. Phase 1로 진행
skills/myharness/references/orchestrator-template.md:48:   - **`_workspace/` 존재 + 새 입력 제공** → 새 실행. 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동한 뒤 Phase 1 진행
skills/myharness/references/orchestrator-template.md:51:### Phase 1: 준비
skills/myharness/references/orchestrator-template.md:52:1. 사용자 입력 분석 — {무엇을 파악하는지}
skills/myharness/references/orchestrator-template.md:55:   - **새 실행**: 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동한 직후 새 `_workspace/` 재생성
skills/myharness/references/orchestrator-template.md:58:### Phase 2: 팀 구성
skills/myharness/references/orchestrator-template.md:63:     team_name: "{domain}-team",
skills/myharness/references/orchestrator-template.md:65:       { name: "{teammate-1}", agent_type: "{type}", model: "opus", prompt: "{역할 설명 및 작업 지시}" },
skills/myharness/references/orchestrator-template.md:66:       { name: "{teammate-2}", agent_type: "{type}", model: "opus", prompt: "{역할 설명 및 작업 지시}" },
skills/myharness/references/orchestrator-template.md:75:     { title: "{작업1}", description: "{상세}", assignee: "{teammate-1}" },
skills/myharness/references/orchestrator-template.md:76:     { title: "{작업2}", description: "{상세}", assignee: "{teammate-2}" },
skills/myharness/references/orchestrator-template.md:77:     { title: "{작업3}", description: "{상세}", depends_on: ["{작업1}"] },
skills/myharness/references/orchestrator-template.md:84:### Phase 3: {주요 작업 — 예: 조사/생성/분석}
skills/myharness/references/orchestrator-template.md:92:- {teammate-1}은 {teammate-2}에게 {어떤 정보}를 SendMessage로 전달
skills/myharness/references/orchestrator-template.md:93:- {teammate-2}는 작업 완료 시 결과를 파일로 저장하고 리더에게 알림
skills/myharness/references/orchestrator-template.md:100:| {teammate-1} | `_workspace/{phase}_{teammate-1}_{artifact}.md` |
skills/myharness/references/orchestrator-template.md:101:| {teammate-2} | `_workspace/{phase}_{teammate-2}_{artifact}.md` |
skills/myharness/references/orchestrator-template.md:108:### Phase 4: {후속 작업 — 예: 검증/통합}
skills/myharness/references/orchestrator-template.md:111:3. {통합/검증 로직}
skills/myharness/references/orchestrator-template.md:112:4. 최종 산출물 생성: `{output-path}/{filename}`
skills/myharness/references/orchestrator-template.md:114:### Phase 5: 정리
skills/myharness/references/orchestrator-template.md:150:1. 사용자가 {입력}을 제공
skills/myharness/references/orchestrator-template.md:151:2. Phase 1에서 {분석 결과} 도출
skills/myharness/references/orchestrator-template.md:152:3. Phase 2에서 팀 구성 ({N}명 팀원 + {M}개 작업)
skills/myharness/references/orchestrator-template.md:153:4. Phase 3에서 팀원들이 자체 조율하며 작업 수행
skills/myharness/references/orchestrator-template.md:154:5. Phase 4에서 산출물 통합하여 최종 결과 생성
skills/myharness/references/orchestrator-template.md:155:6. Phase 5에서 팀 정리
skills/myharness/references/orchestrator-template.md:156:7. 예상 결과: `{output-path}/{filename}` 생성
skills/myharness/references/orchestrator-template.md:159:1. Phase 3에서 {teammate-2}가 에러로 중지
skills/myharness/references/orchestrator-template.md:162:4. 재시작 실패 시 {teammate-2} 작업을 {teammate-1}에게 재할당
skills/myharness/references/orchestrator-template.md:163:5. 나머지 결과로 Phase 4 진행
skills/myharness/references/orchestrator-template.md:164:6. 최종 보고서에 "{teammate-2} 영역 일부 미수집" 명시
skills/myharness/references/orchestrator-template.md:175:name: {domain}-orchestrator
skills/myharness/references/orchestrator-template.md:176:description: "{도메인} 에이전트를 조율하는 오케스트레이터. {초기 실행 키워드}. 후속 작업 키워드 포함."
skills/myharness/references/orchestrator-template.md:185:| {agent-1} | {빌트인 또는 커스텀} | {역할} | {skill} | {output-file} |
skills/myharness/references/orchestrator-template.md:186:| {agent-2} | ... | ... | ... | ... |
skills/myharness/references/orchestrator-template.md:190:### Phase 0: 컨텍스트 확인
skills/myharness/references/orchestrator-template.md:193:### Phase 1: 준비
skills/myharness/references/orchestrator-template.md:197:### Phase 2: 병렬 실행
skills/myharness/references/orchestrator-template.md:202:| {agent-1} | {소스} | `_workspace/{phase}_{agent}_{artifact}.md` | opus | true |
skills/myharness/references/orchestrator-template.md:203:| {agent-2} | {소스} | `_workspace/{phase}_{agent}_{artifact}.md` | opus | true |
skills/myharness/references/orchestrator-template.md:205:### Phase 3: 통합
skills/myharness/references/orchestrator-template.md:210:### Phase 4: 정리
skills/myharness/references/orchestrator-template.md:224:Phase마다 다른 실행 모드를 사용한다. 각 Phase 상단에 `**실행 모드:** {팀 | 서브}`를 명시한다.
skills/myharness/references/orchestrator-template.md:228:name: {domain}-orchestrator
skills/myharness/references/orchestrator-template.md:229:description: "{도메인} 오케스트레이터 (하이브리드). {키워드}. 후속 작업 키워드 포함."
skills/myharness/references/orchestrator-template.md:236:| Phase 2 (병렬 수집) | 서브 에이전트 | 독립 자료 수집, 팀 통신 불필요 |
skills/myharness/references/orchestrator-template.md:237:| Phase 3 (합의 통합) | 에이전트 팀 | 상충 데이터 토론·합의 필요 |
skills/myharness/references/orchestrator-template.md:238:| Phase 4 (독립 검증) | 서브 에이전트 | QA 에이전트 1명이 객관 검증 |
skills/myharness/references/orchestrator-template.md:242:### Phase 2: 병렬 자료 수집
skills/myharness/references/orchestrator-template.md:246:각 결과는 `_workspace/02_{agent}_raw.md`에 저장.
skills/myharness/references/orchestrator-template.md:248:### Phase 3: 합의 기반 통합
skills/myharness/references/orchestrator-template.md:252:2. `TaskCreate`로 작업 분배 — 모두 Phase 2의 `_workspace/02_*` 파일을 Read
skills/myharness/references/orchestrator-template.md:257:### Phase 4: 독립 검증
skills/myharness/references/orchestrator-template.md:274:Codex엔 `TeamCreate`/`SendMessage`는 없지만 **네이티브 subagents**(내장 `default`/`worker`/`explorer` + 커스텀 `.codex/agents/*.toml`)가 있다. 정본 스킬(`.agents/skills/`, SKILL.md 동일 포맷)은 공유하고, **조율 도구만** 매핑한다. (검증: 공식 Codex docs + 0.137.0)
skills/myharness/references/orchestrator-template.md:289:### Phase 2: 실행
skills/myharness/references/orchestrator-template.md:290:subagents 병렬 또는 순차. 각 산출물 `_workspace/{phase}_{agent}_{artifact}.md` 저장 → 다음 단계가 Read로 입력(메시지 대신 파일).
skills/myharness/references/orchestrator-template.md:296:codex exec --sandbox read-only --json -o _workspace/{phase}_{agent}.md \
skills/myharness/references/orchestrator-template.md:297:  "$(cat _workspace/{agent}_prompt.md)" < /dev/null &
skills/myharness/references/orchestrator-template.md:310:> Codex 진입점(AGENTS.md)·스킬 경로(`.agents/skills/`)·설치·한계는 `references/runtime-adapters.md`.
skills/myharness/references/orchestrator-template.md:329:- "{도메인}의 {부분}만 다시"
skills/myharness/references/orchestrator-template.md:338:준비 → Phase 0(컨텍스트 확인) → TeamCreate + TaskCreate → N개 팀원 병렬 실행 → Read + 통합 → 정리.
skills/myharness/references/orchestrator-template.md:339:`references/team-examples.md`의 리서치 팀 예시를 참조.
skills/myharness/references/runtime-adapters.md:20:| 인스트럭션 | `CLAUDE.md` | `AGENTS.md` (글로벌 `~/.codex` → 레포 루트→cwd concat, **가까운 쪽 우선**, 32KiB cap) | ✅ 듀얼 출력 |
skills/myharness/references/runtime-adapters.md:21:| 스킬 | `.claude/skills/{n}/SKILL.md` (desc 자동 트리거) | `.agents/skills/{n}/SKILL.md` (desc 기반 implicit activation, `/skills`·`$name` 명시) | ✅ **포맷 동일** |
skills/myharness/references/runtime-adapters.md:22:| 에이전트 정의 | `.claude/agents/{n}.md` | `.codex/agents/{n}.toml` (커스텀) + 내장 `default`/`worker`/`explorer` | 🟡 포맷 변환(md→toml) |
skills/myharness/references/runtime-adapters.md:29:| 스크립트(scripts/) | bash | bash | ✅ |
skills/myharness/references/runtime-adapters.md:34:- **Claude Code:** `.claude-plugin/plugin.json` + `skills/` 자동 발견 + `CLAUDE.md`. (현행)
skills/myharness/references/runtime-adapters.md:35:- **Codex:** 레포 루트 `AGENTS.md` 자동 로드(루트→cwd concat, 가까운 쪽 우선). AGENTS.md 역할: 하네스 포인터 + "하네스 만들/고치려면 `skills/myharness/SKILL.md`를 따르라" + 오케스트레이션은 §4 어댑터. (Codex 스킬 auto-activation이 있으므로, 스킬을 `.agents/skills/`에 두면 AGENTS.md는 얇게 가능.)
skills/myharness/references/runtime-adapters.md:38:- **스킬:** SKILL.md(name+description+본문) 포맷이 양쪽 동일. 생성 시 `.claude/skills/{n}/`와 `.agents/skills/{n}/` **양쪽에 출력**(또는 한쪽을 심링크). references/scripts도 동봉.
skills/myharness/references/runtime-adapters.md:39:- **에이전트:** Claude는 `.claude/agents/{n}.md`. Codex는 `.codex/agents/{n}.toml`(커스텀) — 같은 역할/원칙/프로토콜을 TOML로 변환하거나, 단순 역할은 내장 `worker`/`explorer`에 프롬프트로 매핑. 교리 주입(dev-rules/tdd-doctrine) 실경로는 런타임별 스킬 경로로 맞춘다.
skills/myharness/references/runtime-adapters.md:48:## 5. 생성 하네스의 듀얼 출력 (Phase 5-4)
skills/myharness/references/runtime-adapters.md:50:- `프로젝트/CLAUDE.md` + `프로젝트/AGENTS.md` (같은 포인터·같은 변경 이력. 한쪽만 갱신 = drift)
skills/myharness/references/runtime-adapters.md:51:- 스킬 → `.claude/skills/` + `.agents/skills/`
skills/myharness/references/runtime-adapters.md:52:- 에이전트 → `.claude/agents/{n}.md` + `.codex/agents/{n}.toml`
skills/myharness/references/runtime-adapters.md:57:- **Codex:** 레포 루트 `AGENTS.md`·`.agents/skills/`·`.codex/`는 trusted 프로젝트에서 자동 인식 — 별도 설치 최소. MCP는 `.codex/config.toml`에 동봉(trusted 한정, auth/telemetry 등 machine-local 키는 project-local 무시됨).
skills/myharness/references/runtime-adapters.md:64:- 결론(codex 자문): 듀얼 포팅 단위는 "AGENTS.md 인라인"만이 아니라 **plugin + skills + (선택)subagents + 프로젝트 `.codex/config.toml`**. 정본·리뷰·스크립트는 공유, 변환은 에이전트 포맷·오케스트레이션뿐.

hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
codex
1차 후보에서 핵심 충돌은 Claude 전용 경로와 듀얼 출력, 모델/에이전트 타입 정책, 외부리뷰 게이트 쪽입니다. 각 참조 문서의 해당 구간만 좁혀 읽어 사실관계를 확인합니다.
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
/bin/zsh -lc "sed -n '1,120p;180,225p;270,325p' skills/myharness/references/agent-design-patterns.md" in /Users/junghojang/Developments/myProject/myHarness
exec
/bin/zsh -lc "sed -n '1,120p;130,180p' skills/myharness/references/external-review-loop.md" in /Users/junghojang/Developments/myProject/myHarness
exec
/bin/zsh -lc "sed -n '1,120p' skills/myharness/references/runtime-adapters.md" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
# 외부 리뷰 루프 (External Review Loop) — 방법론 & 생성 템플릿

이 파일은 두 역할을 한다:
1. **방법론 정본** — 단계 산출물 마감 게이트(외부 독립 AI 리뷰)의 표준 절차.
2. **생성 템플릿** — 코드/설계 도메인 하네스를 만들 때, 이 내용을 타겟 프로젝트의 `.claude/skills/external-review-loop/SKILL.md`로 생성한다(아래 frontmatter 포함). **단, 생성 전 `check-review-tools.sh`로 codex/gemini 연동을 확인**하고, 둘 다 미설치면 스킬을 만들지 않는다(Phase 4-6). 생성 시 `check-review-tools.sh`를 스킬의 `scripts/`로 함께 번들한다.

**왜 외부 리뷰인가**: 내부 생성-검증/QA는 같은 세션·같은 컨텍스트라 *동일한 맹점*을 공유한다. 외부 독립 AI(codex/gemini)는 다른 관점으로 결함을 잡는다. 단, **합의=정답이 아니다** — 두 AI가 같은 답을 내도 공유 학습데이터로 인한 상관 오류일 수 있다. 합의는 약한 증거이며, **판정 권위는 오케스트레이터(실코드/실문서 대조)에 있다. 위임 금지.**

## 생성 시 frontmatter
```yaml
---
name: external-review-loop
description: 작업 단계 산출물(설계서·코드·문서)마다 외부 독립 AI(codex/gemini)에 리뷰 요청 → 오케스트레이터가 실코드 대조 전건 판정(확인/부분/이월/기각) → 확인분만 TDD 수정·커밋하는 단계 마감 게이트. "외부 리뷰", "codex/gemini 리뷰", "리뷰 게이트", "설계서/코드 리뷰해서 검증·수정", "이슈 검증하고 수정" 요청 시 반드시 사용. 사용자 수동 이슈 제출에도 Step4~7 적용. 내부 QA와 별개의 독립 관점 게이트.
---
```

## 입력 (플레이스홀더)
- `{산출물}`: 리뷰 대상 — 설계서/코드 디렉토리/문서
- `{단계ID}`: 임의 단계 식별자 (예: `design-auth`, `feat-login`)
- `{커밋id}`: 해당 시 `git rev-parse HEAD`, 아니면 생략
- `{게이트명령}`: 프로젝트 테스트/린트 게이트 (예: `npm test && tsc --noEmit` / 없으면 생략)

## Step 1 — 리뷰 요청 프롬프트
2종 분담: **codex = 일반/정합성**, **gemini = 성능·안정성**. 산출물 유형에 맞게 "소스코드"→"설계서/문서" 치환.
```text
리뷰 대상 : {산출물}
관련 commit id : {커밋id}   # 없으면 생략
위 산출물과 관련 자료를 리뷰·검토하여 발생 가능한 이슈를 모두 찾아 보고해줘.
<이슈 작성 방법>
1. [{이슈레벨}] {타이틀}
- 현황: {상황}  - 이슈: {상세}  - 권고: {대응방안}
</이슈 작성 방법>
```
gemini는 동일 틀 + "성능/속도·안정성 중심으로" 추가.

## Step 2 — 병렬 비대화 실행
먼저 `bash scripts/check-review-tools.sh`로 사용가능 도구 재확인(끝줄 `AVAILABLE:`). 사용가능 도구만 실행한다. 루트에서 백그라운드 병렬·읽기전용. 프롬프트·출력 모두 `_workspace/reviews/`에 보존(감사 — /tmp 금지).
```bash
mkdir -p _workspace/reviews
# 주의: codex exec는 stdin 열려 있으면 무한 대기 → 반드시 < /dev/null
codex exec --sandbox read-only "$(cat _workspace/reviews/{단계ID}_prompt_general.md)" < /dev/null \
  > _workspace/reviews/{단계ID}_codex.md 2>&1 &
gemini -p "$(cat _workspace/reviews/{단계ID}_prompt_perf.md)" < /dev/null \
  > _workspace/reviews/{단계ID}_gemini.md 2>&1 &
```
- Bash `run_in_background` + timeout 600s.
- 실패/타임아웃 → 1회 재시도 → 재실패 시 해당 도구 누락 명시 후 단일 출처로 진행(**루프 차단 금지**).
- **도구 부재 폴백:** codex/gemini 미설치면 그 사실을 결과서에 명시하고 내부 QA만으로 진행.

## Step 3 — 이슈 통합
두 출력에서 이슈 추출 → 중복 병합(동일 대상·동일 결함=1건, 출처 병기) → 번호 재부여. 0건이면 "외부 리뷰 — 이슈 0건" 기록 후 종료.

## Step 4 — 전건 판정 (오케스트레이터 직접, 위임 금지)
이슈마다 실코드/실문서 대조(grep/Read) 후 판정.

| 판정 | 기준 | 처리 |
|------|------|------|
| **확인** | 결함 재현/실재 | Step 5 수정 |
| **부분 확인** | 지적 실재하나 권고 과잉/계약 위배 | 비파괴 범위만 + 잔여 기각 근거 |
| **이월** | 타당하나 본 단계 범위 외 | 백로그 위치 명기 — 기각과 구분 |
| **기각** | 사유표 | 근거 명시(코드/정본 인용) — 삭제 금지 |

**기각 사유표:** 동결 계약 위배 · 설계 정본 명시 결정 · 기구현 오판(호출 형태만 보고 오판) · YAGNI/과설계 · 리뷰어 자인 비병목 · 기존 설계와 상충(멱등·격리 등).

## Step 5 — 확인분 TDD 수정
`tdd-doctrine.md` 규율(Red→Green→Refactor, 구조/행위 분리). 다중 에이전트 병렬 시 파일권 명시 분리(병렬 충돌 = 1차 실패 주원인). 에이전트는 커밋·브랜치 금지, status는 `_workspace/status/`.

## Step 6 — 통합 게이트
`{게이트명령}` 실행 → PASS. 게이트 없으면(설계서) 정본 정합성 재확인으로 대체. 테스트 리소스 간섭 게이트는 동시 실행 금지.

## Step 7 — 기록·커밋 (커밋 순서·자율 노브)
1. 결과서에 `## 외부 리뷰 반영 ({일자} — {단계ID} {k}건)` § — 판정표·게이트 수치·출처(codex/gemini).
2. 순서: 게이트 PASS → **승인 관문** → 단일 커밋(`fix: 외부 리뷰 {k}건 — {요지}`, Co-Authored-By).
   - 승인 관문 기본: 사용자 대기. `_workspace/.autonomous` 마커(또는 "자율로" 발화) 시 자동 통과.
   - **push는 자율이어도 기본 대기** — `_workspace/.autonomous-push` 마커 시만 자동.
   - 권한모드(bypassPermissions)는 스킬이 못 읽으므로 마커/발화로 명시. 마커 ON이어도 리뷰·판정·게이트는 그대로(인간 승인 한 스텝만 생략).

## 재진입
동일 단계 2차 리뷰(재제출 포함): 기수정 항목은 재작업 금지 — 수정 커밋 코드 인용 + 게이트 재실행으로 "기수정 확인" 응답.

## 테스트 시나리오
- **정상**: 설계서 커밋 → codex 8 + gemini 3 → 중복 1 병합 → 10건 판정(확인6/부분2/이월1/기각1) → TDD 수정 → 게이트 PASS → 기록·커밋
- **에러**: gemini 타임아웃 ×2 → "gemini 미수집" 명시, codex 단독 진행 — 루프 완료

 succeeded in 0ms:
# Agent Team Design Patterns

## 실행 모드: 에이전트 팀 vs 서브 에이전트

두 가지 실행 모드의 핵심 차이를 이해하고 적합한 모드를 선택한다.

### 에이전트 팀 (Agent Teams) — 기본 모드

팀 리더가 `TeamCreate`로 팀을 구성하고, 팀원들은 독립적인 Claude Code 인스턴스로 실행된다. 팀원들은 `SendMessage`로 직접 통신하고, 공유 작업 목록(`TaskCreate`/`TaskUpdate`)으로 자체 조율한다.

```
[리더] ←→ [팀원A] ←→ [팀원B]
  ↕          ↕          ↕
  └──── 공유 작업 목록 ────┘
```

**핵심 도구:**
- `TeamCreate`: 팀 생성 + 팀원 스폰
- `SendMessage({to: name})`: 특정 팀원에게 메시지
- `SendMessage({to: "all"})`: 브로드캐스트 (비용 높음, 드물게)
- `TaskCreate`/`TaskUpdate`: 공유 작업 목록 관리

**특징:**
- 팀원끼리 직접 대화, 도전, 검증 가능
- 리더가 거치지 않고 팀원 간 정보 교환
- 공유 작업 목록으로 자체 조율 (자체 작업 요청 가능)
- 팀원이 유휴 상태가 되면 자동으로 리더에게 알림
- 계획 승인 모드로 위험한 작업 전 검토 가능

**제약:**
- 세션당 한 팀만 **활성화** 가능 (단, Phase 간에 팀을 해체하고 새 팀 구성은 가능)
- 중첩 팀 불가 (팀원이 자신의 팀 생성 불가)
- 리더 고정 (이전 불가)
- 토큰 비용 높음

**팀 재구성 패턴:**
Phase별로 다른 전문가 조합이 필요하면, 이전 팀의 산출물을 파일로 저장 → 팀 정리 → 새 팀 생성 순서로 진행한다. 이전 팀의 산출물은 `_workspace/` 에 보존되므로 새 팀이 Read로 접근 가능하다.

### 서브 에이전트 (Sub-agents) — 경량 모드

메인 에이전트가 `Agent` 도구로 서브 에이전트를 생성한다. 서브 에이전트는 작업 결과를 메인에게만 반환하고 서로 통신하지 않는다.

```
[메인] → [서브A] → 결과 반환
      → [서브B] → 결과 반환
      → [서브C] → 결과 반환
```

**핵심 도구:**
- `Agent(prompt, subagent_type, run_in_background)`: 서브 에이전트 생성

**특징:**
- 가볍고 빠름
- 결과가 메인 컨텍스트로 요약 반환
- 토큰 효율적

**제약:**
- 서브 에이전트 간 통신 불가
- 메인이 모든 조율 담당
- 실시간 협업/도전 불가

### 모드 선택 의사결정 트리

```
에이전트가 2개 이상인가?
├── Yes → 에이전트 간 통신이 필요한가?
│         ├── Yes → 에이전트 팀 (기본값)
│         │         교차 검증·발견 공유·실시간 피드백으로 품질 향상.
│         │
│         └── No → 서브 에이전트도 가능
│                  결과 전달만 필요한 생성-검증, 전문가 풀 등.
│
└── No (1개) → 서브 에이전트
              단일 에이전트는 팀 구성 불필요.
```

> **핵심 원칙:** 에이전트 팀이 기본이다. 서브 에이전트를 선택할 때는 "팀원 간 통신이 정말 불필요한가?"를 자문한다.

---

## 에이전트 팀 아키텍처 유형

### 1. 파이프라인 (Pipeline)
순차적 작업 흐름. 이전 에이전트의 출력이 다음 에이전트의 입력.

```
[분석] → [설계] → [구현] → [검증]
```

**적합한 경우:** 각 단계가 이전 단계의 산출물에 강하게 의존
**예시:** 소설 집필 — 세계관 → 캐릭터 → 플롯 → 집필 → 편집
**주의:** 병목이 전체 파이프라인을 지연시킴. 각 단계를 가능한 독립적으로 설계할 것.
**팀 모드 적합성:** 순차 의존이 강해 팀 모드의 이점이 제한적. 단, 파이프라인 내 병렬 구간이 있으면 팀 모드 유용.

### 2. 팬아웃/팬인 (Fan-out/Fan-in)
병렬 처리 후 결과 통합. 독립적 작업을 동시 수행.

```
         ┌→ [전문가A] ─┐
[분배] → ├→ [전문가B] ─┼→ [통합]
         └→ [전문가C] ─┘
```

**적합한 경우:** 동일 입력에 대해 서로 다른 관점/영역의 분석이 필요
**예시:** 종합 리서치 — 공식/미디어/커뮤니티/배경 동시 조사 → 통합 보고
**주의:** 통합 단계의 품질이 전체 품질을 결정.
**팀 모드 적합성:** 에이전트 팀의 가장 자연스러운 패턴. **반드시 에이전트 팀으로 구성해야 한다.** 팀원들이 서로 발견을 공유하고 도전하며, 한 에이전트의 발견이 다른 에이전트의 조사 방향을 실시간으로 수정할 수 있어 단독 조사 대비 품질이 크게 향상된다.

### 3. 전문가 풀 (Expert Pool)
상황에 따라 적절한 전문가를 선택 호출.

```
[라우터] → { 전문가A | 전문가B | 전문가C }
```

**적합한 경우:** 입력 유형에 따라 다른 처리가 필요
**예시:** 코드 리뷰 — 보안/성능/아키텍처 전문가 중 해당 영역만 호출
**주의:** 라우터의 분류 정확도가 핵심.
**팀 모드 적합성:** 서브 에이전트가 더 적합. 필요한 전문가만 호출하므로 상시 팀이 불필요.

| **감독자 + 워커** | 에이전트 팀 | 공유 작업 목록으로 동적 할당, 워커 간 진행률 공유 |
| **생성 + 검증** | 에이전트 팀 | 생성자↔검증자 간 실시간 피드백으로 재작업 최소화 |

> 서브 에이전트로의 혼합은 단일 에이전트가 완전히 격리된 단발성 작업을 수행할 때만 고려한다.

## 에이전트 타입 선택

에이전트를 호출할 때 Agent 도구의 `subagent_type` 파라미터로 타입을 지정한다. 에이전트 팀의 팀원도 커스텀 에이전트 정의를 사용할 수 있다.

### 빌트인 타입

| 타입 | 도구 접근 | 적합한 용도 |
|------|----------|-----------|
| `general-purpose` | 전체 (WebSearch, WebFetch 포함) | 웹 조사, 범용 작업 |
| `Explore` | 읽기 전용 (Edit/Write 없음) | 코드베이스 탐색, 분석 |
| `Plan` | 읽기 전용 (Edit/Write 없음) | 아키텍처 설계, 계획 수립 |

### 커스텀 타입

`.claude/agents/{name}.md`에 에이전트를 정의하면 `subagent_type: "{name}"`으로 호출할 수 있다. 커스텀 에이전트는 전체 도구에 접근 가능.

### 선택 기준

| 상황 | 권장 | 이유 |
|------|------|------|
| 역할이 복잡하고 여러 세션에서 재사용 | **커스텀 타입** (`.claude/agents/`) | 페르소나와 작업 원칙을 파일로 관리 |
| 단순 조사/수집이고 프롬프트만으로 충분 | **`general-purpose`** + 상세 프롬프트 | 에이전트 파일 불필요, 프롬프트에 지시 포함 |
| 코드 읽기만 필요 (분석/리뷰) | **`Explore`** | 실수로 파일 수정하는 것을 방지 |
| 설계/계획만 필요 | **`Plan`** | 분석에 집중, 코드 변경 방지 |
| 파일 수정이 필요한 구현 작업 | **커스텀 타입** | 전체 도구 접근 + 전문 지시 |

**원칙:** 모든 에이전트는 반드시 `.claude/agents/{name}.md` 파일로 정의한다. 빌트인 타입이라도 에이전트 정의 파일을 생성하여 역할·원칙·프로토콜을 명시한다. 파일로 존재해야 다음 세션에서 재사용 가능하고, 팀 통신 프로토콜이 명시되어야 협업 품질이 보장된다.

**모델:** 모든 에이전트는 `model: "opus"`를 사용한다. Agent 도구 호출 시 반드시 `model: "opus"` 파라미터를 명시한다.

## 에이전트 정의 구조

```markdown
---
name: agent-name
description: "1-2문장 역할 설명. 트리거 키워드 나열."
---

# Agent Name — 역할 한줄 요약

당신은 [도메인]의 [역할] 전문가입니다.
| 도메인 특화가 의도된 부분 포함 | 신규 생성 진행 — 별개 에이전트로 유지 |
| 역할 범위가 완전히 다름 | 신규 생성 진행 |

**원칙:** 하나의 에이전트가 하나의 역할에 집중할수록 재사용성이 높고 중복이 줄어든다. 역할이 두 가지 이상이면 분리할 수 있는지 먼저 검토한다.

**기존 에이전트 일반화 시:** 해당 에이전트에 의존하는 오케스트레이터·팀 구성의 동작이 변경될 수 있다. 확장 전 의존성을 확인하고, 일반화 후 드라이런으로 기존 동작 유지를 확인한다.

## 스킬 vs 에이전트 구분

| 구분 | 스킬 (Skill) | 에이전트 (Agent) |
|------|-------------|-----------------|
| 정의 | 절차적 지식 + 도구 번들 | 전문가 페르소나 + 행동 원칙 |
| 위치 | `.claude/skills/` | `.claude/agents/` |
| 트리거 | 사용자 요청 키워드 매칭 | Agent 도구로 명시적 호출 |
| 크기 | 작은~큰 (워크플로우) | 작은 (역할 정의) |
| 용도 | "어떻게 하는가" | "누가 하는가" |

스킬은 에이전트가 작업을 수행할 때 참조하는 **절차적 가이드**.
에이전트는 스킬을 활용하는 **전문가 역할 정의**.

## 스킬 ↔ 에이전트 연결 방식

에이전트가 스킬을 활용하는 3가지 방식:

| 방식 | 구현 | 적합한 경우 |
|------|------|-----------|
| **Skill 도구 호출** | 에이전트 프롬프트에 `Skill 도구로 /skill-name 호출` 명시 | 스킬이 독립 워크플로우이고 사용자 호출 가능한 경우 |
| **프롬프트 내 인라인** | 에이전트 정의 내에 스킬 내용을 직접 포함 | 스킬이 짧고(50줄 이하) 이 에이전트 전용인 경우 |
| **레퍼런스 로드** | `Read`로 스킬의 references/ 파일을 필요 시 로드 | 스킬 내용이 크고 조건부로만 필요한 경우 |

권장: 재사용성이 높으면 Skill 도구, 전용이면 인라인, 대용량이면 레퍼런스 로드.

 succeeded in 0ms:
# 런타임 어댑터 — Claude Code / Codex 듀얼 런타임

하네스 정본(스킬 본문·references·스크립트)은 **런타임 무관 마크다운**이다. Claude Code와 Codex는 커스터마이징 모델이 **거의 대칭**이다(둘 다 skills·agents·plugin·MCP·hooks 보유). 차이는 진입점 파일명·에이전트 정의 포맷·오케스트레이션 도구뿐. 그 셋만 어댑터로 흡수한다.

> 본 문서의 Codex 사실관계는 공식 Codex docs(developers.openai.com/codex) + `codex-cli 0.137.0` 기준 검증됨.

## 목차
1. 런타임 매핑표 (검증)
2. 진입점 어댑터
3. 스킬·에이전트 어댑터
4. 오케스트레이션 어댑터
5. 생성 하네스의 듀얼 출력
6. 설치 방법
7. 한계

## 1. 런타임 매핑표 (검증)

| 관심사 | Claude Code | Codex CLI | 이식성 |
|--------|-------------|-----------|--------|
| 인스트럭션 | `CLAUDE.md` | `AGENTS.md` (글로벌 `~/.codex` → 레포 루트→cwd concat, **가까운 쪽 우선**, 32KiB cap) | ✅ 듀얼 출력 |
| 스킬 | `.claude/skills/{n}/SKILL.md` (desc 자동 트리거) | `.agents/skills/{n}/SKILL.md` (desc 기반 implicit activation, `/skills`·`$name` 명시) | ✅ **포맷 동일** |
| 에이전트 정의 | `.claude/agents/{n}.md` | `.codex/agents/{n}.toml` (커스텀) + 내장 `default`/`worker`/`explorer` | 🟡 포맷 변환(md→toml) |
| 멀티 에이전트 | `TeamCreate`/`SendMessage`/`TaskCreate` | **네이티브 subagents**(병렬 spawn) 또는 `codex exec` subprocess | 🟡 어댑터 |
| 플러그인/배포 | `.claude-plugin/plugin.json` + marketplace | 플러그인 번들(skills+commands+MCP+hooks+marketplace) | 🟡 별도 매니페스트 |
| 설정 | settings.json | `.codex/config.toml`(프로젝트, trusted) + `~/.codex/config.toml` | 🟡 |
| MCP | settings/플러그인 | `config.toml`의 `mcp_servers.<id>` | ✅ |
| 커스텀 슬래시 | `commands/*.md` | ❌ `~/.codex/prompts/*.md`·`$ARGUMENTS` 0.137.0 미지원 | 🔴 생략 |
| 외부 리뷰(codex/gemini 호출) | subprocess | subprocess (동일) | ✅ 공짜 |
| 스크립트(scripts/) | bash | bash | ✅ |

핵심: 스킬 본문은 **포맷 동일** → 거의 그대로 공유. 진짜 변환이 필요한 건 에이전트 정의(md→toml)와 오케스트레이션뿐.

## 2. 진입점 어댑터
- **Claude Code:** `.claude-plugin/plugin.json` + `skills/` 자동 발견 + `CLAUDE.md`. (현행)
- **Codex:** 레포 루트 `AGENTS.md` 자동 로드(루트→cwd concat, 가까운 쪽 우선). AGENTS.md 역할: 하네스 포인터 + "하네스 만들/고치려면 `skills/myharness/SKILL.md`를 따르라" + 오케스트레이션은 §4 어댑터. (Codex 스킬 auto-activation이 있으므로, 스킬을 `.agents/skills/`에 두면 AGENTS.md는 얇게 가능.)

## 3. 스킬·에이전트 어댑터
- **스킬:** SKILL.md(name+description+본문) 포맷이 양쪽 동일. 생성 시 `.claude/skills/{n}/`와 `.agents/skills/{n}/` **양쪽에 출력**(또는 한쪽을 심링크). references/scripts도 동봉.
- **에이전트:** Claude는 `.claude/agents/{n}.md`. Codex는 `.codex/agents/{n}.toml`(커스텀) — 같은 역할/원칙/프로토콜을 TOML로 변환하거나, 단순 역할은 내장 `worker`/`explorer`에 프롬프트로 매핑. 교리 주입(dev-rules/tdd-doctrine) 실경로는 런타임별 스킬 경로로 맞춘다.

## 4. 오케스트레이션 어댑터
오케스트레이터 상단에 "런타임 감지 후 분기" 명시.
- **Claude Code:** `TeamCreate`+`SendMessage`+`TaskCreate` (템플릿 A).
- **Codex:** 네이티브 subagents로 병렬 specialized agents spawn(`/agent` 전환, `.codex/agents/*.toml`), 또는 독립 병렬이 필요하면 `codex exec` subprocess. 데이터는 `_workspace/` 파일 기반(템플릿 D).
  - `codex exec` 베스트 프랙티스(검증): 기본 read-only / 쓰기 작업만 `--sandbox workspace-write` / 스크립트 소비는 `--json` / 최종 메시지만 `-o`(`--output-last-message`) / 격리는 `--ignore-user-config` / stdin은 `< /dev/null`.
- external-review-loop 게이트는 양쪽 동일(이미 subprocess).

## 5. 생성 하네스의 듀얼 출력 (Phase 5-4)
팩토리가 하네스 생성 시:
- `프로젝트/CLAUDE.md` + `프로젝트/AGENTS.md` (같은 포인터·같은 변경 이력. 한쪽만 갱신 = drift)
- 스킬 → `.claude/skills/` + `.agents/skills/`
- 에이전트 → `.claude/agents/{n}.md` + `.codex/agents/{n}.toml`
- (선택) MCP 필요 시 `.codex/config.toml`의 `mcp_servers.<id>` 동봉

## 6. 설치 방법
- **Claude Code:** 플러그인 추가(`/plugin` 또는 marketplace.json). `skills/` 자동 인식.
- **Codex:** 레포 루트 `AGENTS.md`·`.agents/skills/`·`.codex/`는 trusted 프로젝트에서 자동 인식 — 별도 설치 최소. MCP는 `.codex/config.toml`에 동봉(trusted 한정, auth/telemetry 등 machine-local 키는 project-local 무시됨).
- 양쪽 자동화는 레포 루트 `install.sh` 참조. codex/gemini는 `check-review-tools.sh`로 점검.

## 7. 한계 (정직)
- **커스텀 슬래시 프롬프트는 Codex 0.137.0 미지원** — Claude의 `commands/`에 1:1 대응 없음(애초에 하네스는 커맨드 안 만드니 영향 작음).
- **에이전트 정의 포맷 불일치**(md vs toml) — 변환 필요. 자동 변환 스크립트화 여지.
- **팀 통신 시맨틱 차이** — Claude의 SendMessage 실시간 토론 ↔ Codex subagents/파일 기반. 합의 중심 하네스는 Claude가 더 매끄러움.
- 결론(codex 자문): 듀얼 포팅 단위는 "AGENTS.md 인라인"만이 아니라 **plugin + skills + (선택)subagents + 프로젝트 `.codex/config.toml`**. 정본·리뷰·스크립트는 공유, 변환은 에이전트 포맷·오케스트레이션뿐.

hook: PostToolUse
hook: PostToolUse
hook: PostToolUse
exec
/bin/zsh -lc "sed -n '1,130p;170,315p;315,345p' skills/myharness/references/orchestrator-template.md" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
# 오케스트레이터 스킬 템플릿

오케스트레이터는 팀 전체를 조율하는 상위 스킬이다. 실행 모드별로 3가지 템플릿을 제공한다:

- **템플릿 A: 에이전트 팀 모드 (기본)** — 2명 이상 협업 시 최우선 선택
- **템플릿 B: 서브 에이전트 모드 (대안)** — 팀 통신이 불필요한 경우
- **템플릿 C: 하이브리드 모드** — Phase마다 모드를 섞어 구성
- **템플릿 D: Codex 런타임 어댑터** — Codex CLI에서 실행 시(팀 도구 부재). A/B를 순차·subprocess로 매핑

> 듀얼 런타임(Claude Code + Codex) 설계 전반은 `references/runtime-adapters.md` 참조. 오케스트레이터 상단에 "런타임 감지 후 분기" 한 줄을 넣고, 팀 도구 가용 시 A, 부재 시 D를 따른다.

---

## 템플릿 A: 에이전트 팀 모드 (기본 · 최우선 선택)

2명 이상의 에이전트가 협업할 때 **가장 먼저 검토하는 기본 모드**. `TeamCreate`로 팀을 구성하고, 공유 작업 목록과 `SendMessage`로 조율한다.

```markdown
---
name: {domain}-orchestrator
description: "{도메인} 에이전트 팀을 조율하는 오케스트레이터. {초기 실행 키워드}. 후속 작업: {도메인} 결과 수정, 부분 재실행, 업데이트, 보완, 다시 실행, 이전 결과 개선 요청 시에도 반드시 이 스킬을 사용."
---

# {Domain} Orchestrator

{도메인}의 에이전트 팀을 조율하여 {최종 산출물}을 생성하는 통합 스킬.

## 실행 모드: 에이전트 팀

## 에이전트 구성

| 팀원 | 에이전트 타입 | 역할 | 스킬 | 출력 |
|------|-------------|------|------|------|
| {teammate-1} | {커스텀 또는 빌트인} | {역할} | {skill} | {output-file} |
| {teammate-2} | {커스텀 또는 빌트인} | {역할} | {skill} | {output-file} |
| ... | | | | |

## 워크플로우

### Phase 0: 컨텍스트 확인 (후속 작업 지원)

기존 산출물 존재 여부를 확인하여 실행 모드를 결정한다:

1. `_workspace/` 디렉토리 존재 여부 확인
2. 실행 모드 결정:
   - **`_workspace/` 미존재** → 초기 실행. Phase 1로 진행
   - **`_workspace/` 존재 + 사용자가 부분 수정 요청** → 부분 재실행. 해당 에이전트만 재호출하고, 기존 산출물 중 수정 대상만 덮어쓴다
   - **`_workspace/` 존재 + 새 입력 제공** → 새 실행. 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동한 뒤 Phase 1 진행
3. 부분 재실행 시: 이전 산출물 경로를 에이전트 프롬프트에 포함하여, 에이전트가 기존 결과를 읽고 피드백을 반영하도록 지시

### Phase 1: 준비
1. 사용자 입력 분석 — {무엇을 파악하는지}
2. 작업 디렉토리에 `_workspace/` 생성
   - **초기 실행**: 새 `_workspace/` 생성
   - **새 실행**: 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동한 직후 새 `_workspace/` 재생성
3. 입력 데이터를 `_workspace/00_input/`에 저장

### Phase 2: 팀 구성

1. 팀 생성:
   ```
   TeamCreate(
     team_name: "{domain}-team",
     members: [
       { name: "{teammate-1}", agent_type: "{type}", model: "opus", prompt: "{역할 설명 및 작업 지시}" },
       { name: "{teammate-2}", agent_type: "{type}", model: "opus", prompt: "{역할 설명 및 작업 지시}" },
       ...
     ]
   )
   ```

2. 작업 등록:
   ```
   TaskCreate(tasks: [
     { title: "{작업1}", description: "{상세}", assignee: "{teammate-1}" },
     { title: "{작업2}", description: "{상세}", assignee: "{teammate-2}" },
     { title: "{작업3}", description: "{상세}", depends_on: ["{작업1}"] },
     ...
   ])
   ```

   > 팀원당 5~6개 작업이 적정. 의존성이 있는 작업은 `depends_on`으로 명시.

### Phase 3: {주요 작업 — 예: 조사/생성/분석}

**실행 방식:** 팀원들이 자체 조율

팀원들은 공유 작업 목록에서 작업을 요청(claim)하고 독립적으로 수행한다.
리더는 진행 상황을 모니터링하며 필요 시 개입한다.

**팀원 간 통신 규칙:**
- {teammate-1}은 {teammate-2}에게 {어떤 정보}를 SendMessage로 전달
- {teammate-2}는 작업 완료 시 결과를 파일로 저장하고 리더에게 알림
- 팀원이 다른 팀원의 결과가 필요하면 SendMessage로 요청

**산출물 저장:**

| 팀원 | 출력 경로 |
|------|----------|
| {teammate-1} | `_workspace/{phase}_{teammate-1}_{artifact}.md` |
| {teammate-2} | `_workspace/{phase}_{teammate-2}_{artifact}.md` |

**리더 모니터링:**
- 팀원이 유휴 상태가 되면 자동 알림 수신
- 특정 팀원이 막혔을 때 SendMessage로 지시 또는 작업 재할당
- 전체 진행률은 TaskGet으로 확인

### Phase 4: {후속 작업 — 예: 검증/통합}
1. 모든 팀원의 작업 완료 대기 (TaskGet으로 상태 확인)
2. 각 팀원의 산출물을 Read로 수집
3. {통합/검증 로직}
4. 최종 산출물 생성: `{output-path}/{filename}`

### Phase 5: 정리
1. 팀원들에게 종료 요청 (SendMessage)
2. 팀 정리 (TeamDelete)
3. `_workspace/` 디렉토리 보존 (중간 산출물은 삭제하지 않음 — 사후 검증·감사 추적용)
4. 사용자에게 결과 요약 보고

> **팀 재구성이 필요한 경우:** Phase별로 다른 전문가 조합이 필요하면, 현재 팀을 TeamDelete로 정리한 뒤 새 TeamCreate로 다음 Phase의 팀을 구성한다. 이전 팀의 산출물은 `_workspace/`에 보존되므로 새 팀이 Read로 접근 가능.

## 데이터 흐름

```
[리더] → TeamCreate → [teammate-1] ←SendMessage→ [teammate-2]
                          │                           │
                          ↓                           ↓
                    artifact-1.md              artifact-2.md
                          │                           │
                          └───────── Read ────────────┘

팀 통신 오버헤드가 불필요한 경우. `Agent` 도구로 직접 호출하고 반환값으로 결과를 수집한다.

```markdown
---
name: {domain}-orchestrator
description: "{도메인} 에이전트를 조율하는 오케스트레이터. {초기 실행 키워드}. 후속 작업 키워드 포함."
---

## 실행 모드: 서브 에이전트

## 에이전트 구성

| 에이전트 | subagent_type | 역할 | 스킬 | 출력 |
|---------|--------------|------|------|------|
| {agent-1} | {빌트인 또는 커스텀} | {역할} | {skill} | {output-file} |
| {agent-2} | ... | ... | ... | ... |

## 워크플로우

### Phase 0: 컨텍스트 확인
(Template A와 동일 — `_workspace/` 존재 여부 분기)

### Phase 1: 준비
1. 입력 분석
2. `_workspace/` 생성 (초기 실행 시, 또는 새 실행에서 기존 `_workspace/`를 보관 디렉토리로 이동한 직후)

### Phase 2: 병렬 실행
단일 메시지에서 N개 Agent 도구를 동시 호출:

| 에이전트 | 입력 | 출력 | model | run_in_background |
|---------|------|------|-------|-------------------|
| {agent-1} | {소스} | `_workspace/{phase}_{agent}_{artifact}.md` | opus | true |
| {agent-2} | {소스} | `_workspace/{phase}_{agent}_{artifact}.md` | opus | true |

### Phase 3: 통합
1. 각 에이전트의 반환값 수집
2. 파일 기반 산출물은 Read로 수집
3. 통합 로직 적용 → 최종 산출물

### Phase 4: 정리
1. `_workspace/` 보존
2. 결과 요약 보고

## 에러 핸들링
- 에이전트 1개 실패: 1회 재시도. 재실패 시 누락 명시하고 진행
- 과반 실패: 사용자에게 알리고 진행 여부 확인
- 타임아웃: 현재까지 수집된 부분 결과 사용
```

---

## 템플릿 C: 하이브리드 모드

Phase마다 다른 실행 모드를 사용한다. 각 Phase 상단에 `**실행 모드:** {팀 | 서브}`를 명시한다.

```markdown
---
name: {domain}-orchestrator
description: "{도메인} 오케스트레이터 (하이브리드). {키워드}. 후속 작업 키워드 포함."
---

## 실행 모드: 하이브리드

| Phase | 모드 | 이유 |
|-------|------|------|
| Phase 2 (병렬 수집) | 서브 에이전트 | 독립 자료 수집, 팀 통신 불필요 |
| Phase 3 (합의 통합) | 에이전트 팀 | 상충 데이터 토론·합의 필요 |
| Phase 4 (독립 검증) | 서브 에이전트 | QA 에이전트 1명이 객관 검증 |

## 워크플로우

### Phase 2: 병렬 자료 수집
**실행 모드:** 서브 에이전트

단일 메시지에서 Agent 도구로 N개 에이전트 병렬 호출 (`run_in_background: true`).
각 결과는 `_workspace/02_{agent}_raw.md`에 저장.

### Phase 3: 합의 기반 통합
**실행 모드:** 에이전트 팀

1. `TeamCreate`로 통합 팀 구성 (editor + fact-checker + synthesizer)
2. `TaskCreate`로 작업 분배 — 모두 Phase 2의 `_workspace/02_*` 파일을 Read
3. 팀원들이 `SendMessage`로 상충 데이터를 논의, 파일 기반으로 합의안 도출
4. 최종 통합본 `_workspace/03_integrated.md` 생성
5. `TeamDelete`로 팀 정리

### Phase 4: 독립 검증
**실행 모드:** 서브 에이전트

단일 QA 서브 에이전트가 `_workspace/03_integrated.md`를 입력으로 받아 검증 보고서 생성.
```

**하이브리드 전환 규칙:**
- 팀 → 서브: 팀을 반드시 `TeamDelete`로 정리한 후 Agent 도구 호출
- 서브 → 팀: 서브 에이전트의 파일 산출물을 팀원들에게 Read 경로로 전달
- 팀 → 팀: 이전 팀을 정리한 후 새 `TeamCreate` (세션당 1팀만 활성 가능)

---

---

## 템플릿 D: Codex 런타임 어댑터

Codex엔 `TeamCreate`/`SendMessage`는 없지만 **네이티브 subagents**(내장 `default`/`worker`/`explorer` + 커스텀 `.codex/agents/*.toml`)가 있다. 정본 스킬(`.agents/skills/`, SKILL.md 동일 포맷)은 공유하고, **조율 도구만** 매핑한다. (검증: 공식 Codex docs + 0.137.0)

```markdown
## 실행 모드: Codex 어댑터 (런타임 감지 후 분기)

> 팀 도구(TeamCreate 등) 가용 시 템플릿 A. 부재 시(=Codex) 아래.

### 매핑 규칙
| 팀 모드(A) | Codex 어댑터(D) |
|-----------|----------------|
| TeamCreate(members) | Codex subagents 병렬 spawn(`.codex/agents/*.toml` 또는 내장 worker/explorer), `/agent`로 전환 |
| TaskCreate/depends_on | 단계 순서 실행(의존 = 선행 단계 산출물 파일 존재 확인) |
| SendMessage(팀원 통신) | `_workspace/` 파일로 전달 — 다음 단계가 Read |
| 완전 독립 병렬(CI 등) | `codex exec` subprocess 백그라운드 |

### Phase 2: 실행
subagents 병렬 또는 순차. 각 산출물 `_workspace/{phase}_{agent}_{artifact}.md` 저장 → 다음 단계가 Read로 입력(메시지 대신 파일).

### codex exec subprocess (독립 병렬·CI)
```bash
mkdir -p _workspace
# stdin 폐쇄 필수(< /dev/null) — 안 하면 codex exec 무한 대기
codex exec --sandbox read-only --json -o _workspace/{phase}_{agent}.md \
  "$(cat _workspace/{agent}_prompt.md)" < /dev/null &
wait   # 여러 개 띄운 뒤
```
- 베스트 프랙티스(검증): 기본 `read-only` / 쓰기만 `--sandbox workspace-write` / 스크립트 소비 `--json` / 최종 메시지만 `-o`(`--output-last-message`) / 격리 `--ignore-user-config`.
- 외부 리뷰 게이트(external-review-loop)는 양쪽 동일 — 이미 subprocess.

### 에러 핸들링
- 실패 작업 1회 재시도 → 누락 명시 후 진행. 산출물 충돌: 출처 병기, 삭제 금지(A와 동일).

### 데이터 흐름
[오케스트레이터] → subagents/순차/codex exec → `_workspace/*.md` → Read 통합 → 최종 산출물
```

> Codex 진입점(AGENTS.md)·스킬 경로(`.agents/skills/`)·설치·한계는 `references/runtime-adapters.md`.

---

## 작성 원칙


1. **실행 모드를 먼저 명시** — 오케스트레이터 상단에 "에이전트 팀" / "서브 에이전트" / "하이브리드" / "Codex 어댑터" 중 하나 명시. 듀얼 런타임이면 "런타임 감지 후 A 또는 D" 명시. 하이브리드면 Phase별 모드 표 필수
2. **팀 모드는 TeamCreate/SendMessage/TaskCreate 사용법을 구체적으로** — 팀 구성, 작업 등록, 통신 규칙
3. **서브 모드는 Agent 도구 파라미터를 완전히 명시** — name, subagent_type, prompt, run_in_background, model
4. **파일 경로는 절대적으로** — 상대 경로 금지, `_workspace/` 기준 명확한 경로
5. **Phase 간 의존성 명시** — 어떤 Phase가 어떤 Phase의 결과에 의존하는지. 하이브리드는 모드 전환 지점을 특히 강조
6. **에러 핸들링은 현실적으로** — "모든 것이 성공한다"고 가정하지 않음
7. **테스트 시나리오 필수** — 정상 1 + 에러 1 이상

## description 작성 시 후속 작업 키워드

오케스트레이터 description은 초기 실행 키워드만으로는 부족하다. 다음 후속 작업 표현을 반드시 포함하라:

- 재실행/다시 실행/업데이트/수정/보완
- "{도메인}의 {부분}만 다시"
- "이전 결과 기반으로", "결과 개선"
- 도메인 관련 일상적 요청 (예: 런치 전략 하네스라면 "런치", "홍보", "트렌딩" 등)

후속 키워드가 없으면 첫 실행 후 하네스가 사실상 죽은 코드가 된다.

## 실제 오케스트레이터 참고

팬아웃/팬인 패턴의 오케스트레이터 기본 구조:
준비 → Phase 0(컨텍스트 확인) → TeamCreate + TaskCreate → N개 팀원 병렬 실행 → Read + 통합 → 정리.
`references/team-examples.md`의 리서치 팀 예시를 참조.

hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc "sed -n '120,190p' skills/myharness/references/orchestrator-template.md" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
> **팀 재구성이 필요한 경우:** Phase별로 다른 전문가 조합이 필요하면, 현재 팀을 TeamDelete로 정리한 뒤 새 TeamCreate로 다음 Phase의 팀을 구성한다. 이전 팀의 산출물은 `_workspace/`에 보존되므로 새 팀이 Read로 접근 가능.

## 데이터 흐름

```
[리더] → TeamCreate → [teammate-1] ←SendMessage→ [teammate-2]
                          │                           │
                          ↓                           ↓
                    artifact-1.md              artifact-2.md
                          │                           │
                          └───────── Read ────────────┘
                                     ↓
                              [리더: 통합]
                                     ↓
                              최종 산출물
```

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| 팀원 1명 실패/중지 | 리더가 감지 → SendMessage로 상태 확인 → 재시작 또는 대체 팀원 생성 |
| 팀원 과반 실패 | 사용자에게 알리고 진행 여부 확인 |
| 타임아웃 | 현재까지 수집된 부분 결과 사용, 미완료 팀원 종료 |
| 팀원 간 데이터 충돌 | 출처 명시 후 병기, 삭제하지 않음 |
| 작업 상태 지연 | 리더가 TaskGet으로 확인 후 수동으로 TaskUpdate |

## 테스트 시나리오

### 정상 흐름
1. 사용자가 {입력}을 제공
2. Phase 1에서 {분석 결과} 도출
3. Phase 2에서 팀 구성 ({N}명 팀원 + {M}개 작업)
4. Phase 3에서 팀원들이 자체 조율하며 작업 수행
5. Phase 4에서 산출물 통합하여 최종 결과 생성
6. Phase 5에서 팀 정리
7. 예상 결과: `{output-path}/{filename}` 생성

### 에러 흐름
1. Phase 3에서 {teammate-2}가 에러로 중지
2. 리더가 유휴 알림 수신
3. SendMessage로 상태 확인 → 재시작 시도
4. 재시작 실패 시 {teammate-2} 작업을 {teammate-1}에게 재할당
5. 나머지 결과로 Phase 4 진행
6. 최종 보고서에 "{teammate-2} 영역 일부 미수집" 명시
```

---

## 템플릿 B: 서브 에이전트 모드 (대안)

팀 통신 오버헤드가 불필요한 경우. `Agent` 도구로 직접 호출하고 반환값으로 결과를 수집한다.

```markdown
---
name: {domain}-orchestrator
description: "{도메인} 에이전트를 조율하는 오케스트레이터. {초기 실행 키워드}. 후속 작업 키워드 포함."
---

## 실행 모드: 서브 에이전트

## 에이전트 구성

| 에이전트 | subagent_type | 역할 | 스킬 | 출력 |
|---------|--------------|------|------|------|
| {agent-1} | {빌트인 또는 커스텀} | {역할} | {skill} | {output-file} |
| {agent-2} | ... | ... | ... | ... |

## 워크플로우

### Phase 0: 컨텍스트 확인

hook: PostToolUse
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc "sed -n '130,175p;245,285p' skills/myharness/references/skill-writing-guide.md && sed -n '1,110p;250,330p' skills/myharness/references/skill-testing-guide.md && sed -n '1,70p;120,170p' skills/myharness/references/qa-agent-guide.md" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
출력: feat(auth): JWT 기반 인증 구현

**예시 2:**
입력: 로그인 페이지에서 비밀번호 표시 버튼이 동작하지 않는 버그 수정
출력: fix(login): 비밀번호 표시 토글 버튼 동작 수정
```

---

## 5. Progressive Disclosure 패턴

### 패턴 1: 도메인별 분리

```
bigquery-skill/
├── SKILL.md (개요 + 도메인 선택 가이드)
└── references/
    ├── finance.md (매출, 빌링 메트릭)
    ├── sales.md (기회, 파이프라인)
    └── product.md (API 사용량, 기능)
```

사용자가 매출에 대해 물으면 finance.md만 로드.

### 패턴 2: 조건부 상세

```markdown
# DOCX 처리

## 문서 생성
docx-js로 새 문서를 생성한다. → [DOCX-JS.md](references/docx-js.md) 참조.

## 문서 편집
단순 편집은 XML을 직접 수정.
**추적 변경이 필요하면**: [REDLINING.md](references/redlining.md) 참조
```

### 패턴 3: 대형 레퍼런스 파일 구조

300줄 이상의 reference 파일은 상단에 목차를 포함한다:

```markdown
# API 레퍼런스

## 목차
1. [인증](#인증)
**필드명 주의:** `text`, `passed`, `evidence`를 정확히 사용한다 (`name`/`met`/`details` 등 변형 금지).

### timing.json

실행 시간/토큰 측정:

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3
}
```

서브에이전트 완료 알림에서 `total_tokens`와 `duration_ms`를 즉시 저장한다. 이 데이터는 알림 시점에만 접근 가능하고 이후 복구 불가.

---

## 8. 스킬에 포함하지 않을 것

- README.md, CHANGELOG.md, INSTALLATION_GUIDE.md 등 부가 문서
- 스킬 생성 과정의 메타 정보 (테스트 결과, 반복 이력)
- 사용자 대상 설명서 (스킬은 AI 에이전트를 위한 지시서)
- 이미 Claude가 알고 있는 일반적 지식

---

## 9. 스킬 재사용 설계

신규 스킬 생성 전, 기존 스킬과의 중복을 확인한다. 하네스를 반복 구축하다 보면 기능이 겹치는 스킬이 다른 이름으로 누적되기 쉽다.

| 상황 | 조치 |
|------|------|
| 기존 스킬이 신규 기능을 완전히 포함 | 신규 생성 금지 — 기존 스킬을 에이전트에 연결 |
| 기존 스킬이 부분 포함이고 일반화 가능 | 기존 스킬을 일반화하여 확장 |
| 도메인 특화가 의도된 부분 포함 | 신규 생성 진행 — 별개 스킬로 유지 |
| 기능 범위가 완전히 다름 | 신규 생성 진행 |

**원칙:** 하나의 스킬이 하나의 역할에 집중할수록 재사용성이 높고 중복이 줄어든다. 역할이 두 가지 이상이면 분리할 수 있는지 먼저 검토한다.

### 어디까지 일반화할지
# 스킬 테스트 & 반복 개선 가이드

하네스에서 생성한 스킬의 품질을 검증하고 반복적으로 개선하는 방법론. SKILL.md Phase 6의 보충 레퍼런스.

---

## 목차

1. [테스트 프레임워크 개요](#1-테스트-프레임워크-개요)
2. [테스트 프롬프트 작성법](#2-테스트-프롬프트-작성법)
3. [실행 테스트: With-skill vs Baseline](#3-실행-테스트-with-skill-vs-baseline)
4. [정량적 평가: Assertion 기반 채점](#4-정량적-평가-assertion-기반-채점)
5. [전문 에이전트 활용](#5-전문-에이전트-활용)
6. [반복 개선 루프](#6-반복-개선-루프)
7. [Description 트리거 검증](#7-description-트리거-검증)
8. [워크스페이스 구조](#8-워크스페이스-구조)

---

## 1. 테스트 프레임워크 개요

스킬 품질 검증은 **정성적 평가**와 **정량적 평가**의 조합이다.

| 평가 유형 | 방법 | 적합한 스킬 |
|----------|------|-----------|
| **정성적** | 사용자가 산출물을 직접 리뷰 | 문체, 디자인, 창작물 등 주관적 품질 |
| **정량적** | assertion 기반 자동 채점 | 파일 생성, 데이터 추출, 코드 생성 등 객관적 검증 가능 |

핵심 루프: **작성 → 테스트 실행 → 평가 → 개선 → 재테스트**

---

## 2. 테스트 프롬프트 작성법

### 원칙

테스트 프롬프트는 **실제 사용자가 입력할 법한 구체적이고 자연스러운 문장**이어야 한다. 추상적이거나 인공적인 프롬프트는 테스트 가치가 낮다.

### 나쁜 예

```
"PDF를 처리하라"
"데이터를 추출하라"
"차트를 생성하라"
```

### 좋은 예

```
"다운로드 폴더에 있는 'Q4_매출_최종_v2.xlsx'에서 C열(매출)과 D열(비용)을
사용해서 이익률(%) 열을 추가해줘. 그리고 이익률 기준으로 내림차순 정렬."
```

```
"이 PDF에서 3페이지 표를 추출해서 CSV로 변환해줘. 표 헤더가 2줄로
되어 있어서 첫 번째 줄은 카테고리, 두 번째 줄이 실제 열 이름이야."
```

### 프롬프트 다양성

- **공식적 / 캐주얼** 톤 혼합
- **명시적 / 암시적** 의도 혼합 (파일 형식을 직접 말하는 경우 vs 맥락으로 추론해야 하는 경우)
- **단순 / 복잡** 작업 혼합
- 일부는 약어, 오타, 캐주얼한 표현 포함

### 커버리지

2~3개 프롬프트로 시작하되, 다음을 커버하도록 설계:
- 핵심 사용 사례 1개
- 엣지 케이스 1개
- (선택) 복합 작업 1개

---

## 3. 실행 테스트: With-skill vs Baseline

### 3-1. 비교 실행 구조

각 테스트 프롬프트에 대해 두 개의 서브에이전트를 **동시에** 스폰한다:

**With-skill 실행:**
```
프롬프트: "{테스트 프롬프트}"
스킬 경로: {스킬 경로}
출력 경로: _workspace/iteration-N/eval-{id}/with_skill/outputs/
```

**Baseline 실행:**
```
프롬프트: "{테스트 프롬프트}"  (동일)
스킬: 없음
출력 경로: _workspace/iteration-N/eval-{id}/without_skill/outputs/
```

### 3-2. Baseline 선택

| 상황 | Baseline |
|------|----------|
| 새 스킬 생성 | 스킬 없이 같은 프롬프트 실행 |
| 기존 스킬 개선 | 수정 전 스킬 버전 (스냅샷 보존) |

### 3-3. 타이밍 데이터 캡처

서브에이전트 완료 알림에서 `total_tokens`와 `duration_ms`를 **즉시** 저장한다. 이 데이터는 알림 시점에만 접근 가능하고 이후 복구할 수 없다.

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3

**Should-NOT-trigger 쿼리 (8~10개):**
- **Near-miss가 핵심** — 키워드가 유사하지만 다른 도구/스킬이 적합한 쿼리
- 명백히 무관한 쿼리("피보나치 함수 작성")는 테스트 가치 없음
- 인접 도메인, 모호한 표현, 키워드 겹침 but 맥락이 다른 경우

### 7-2. 기존 스킬 충돌 검증

새 스킬의 description이 기존 스킬의 트리거 영역과 겹치지 않는지 확인한다:

1. 기존 스킬 목록의 description을 수집
2. 새 스킬의 should-trigger 쿼리가 기존 스킬을 잘못 트리거하지 않는지 확인
3. 충돌 발견 시 description의 경계 조건을 더 명확히 기술

### 7-3. 자동 최적화 (선택적 고급 기능)

description 최적화가 필요한 경우:

1. 20개 eval 쿼리를 Train(60%) / Test(40%) split
2. 현재 description으로 트리거 정확도 측정
3. 실패 케이스를 분석하여 개선된 description 생성
4. Test set 기준으로 best description 선택 (Train set 기준이 아님 — 과적합 방지)
5. 최대 5회 반복

> 이 과정은 `claude -p`를 사용하는 자동화 스크립트로 수행한다. 토큰 비용이 높으므로 스킬이 충분히 안정화된 후 최종 단계에서 실행한다.

---

## 8. 워크스페이스 구조

테스트/평가 결과를 체계적으로 관리하는 디렉토리 구조:

```
{skill-name}-workspace/
├── iteration-1/
│   ├── eval-descriptive-name-1/
│   │   ├── eval_metadata.json
│   │   ├── with_skill/
│   │   │   ├── outputs/
│   │   │   ├── timing.json
│   │   │   └── grading.json
│   │   └── without_skill/
│   │       ├── outputs/
│   │       ├── timing.json
│   │       └── grading.json
│   ├── eval-descriptive-name-2/
│   │   └── ...
│   └── benchmark.json
├── iteration-2/
│   └── ...
└── evals/
    └── evals.json
```

**규칙:**
- eval 디렉토리는 숫자가 아닌 **서술적 이름** 사용 (예: `eval-multi-page-table-extraction`)
- 각 iteration은 독립 디렉토리에 보존 (이전 iteration 덮어쓰기 금지)
- `_workspace/`는 삭제하지 않음 — 사후 검증 및 감사 추적용
# QA 에이전트 설계 가이드

빌드 하네스에 QA 에이전트를 포함할 때 참고하는 가이드. 실제 프로젝트(SatangSlide)에서 발견된 버그 패턴과 그 근본 원인 분석을 바탕으로, QA가 놓치기 쉬운 결함을 체계적으로 잡는 검증 방법론을 제공한다.

---

## 목차

1. QA 에이전트가 놓치는 결함의 패턴
2. 통합 정합성 검증 (Integration Coherence Verification)
3. QA 에이전트 설계 원칙
4. 검증 체크리스트 템플릿
5. QA 에이전트 정의 템플릿

---

## 1. QA 에이전트가 놓치는 결함의 패턴

### 1-1. 경계면 불일치 (Boundary Mismatch)

가장 빈번한 결함. 두 컴포넌트가 각각 "올바르게" 구현되어 있지만, 연결 지점에서 계약이 어긋남.

| 경계면 | 불일치 예시 | 놓치는 이유 |
|--------|-----------|-----------|
| API 응답 → 프론트 훅 | API가 `{ projects: [...] }` 반환, 훅이 `SlideProject[]` 기대 | 각각 개별 검증하면 정상, 교차 비교 안 함 |
| API 응답 필드명 → 타입 정의 | API가 `thumbnailUrl`(camelCase), 타입이 `thumbnail_url`(snake_case) | TypeScript 제네릭으로 캐스팅하면 컴파일러가 못 잡음 |
| 파일 경로 → 링크 href | 페이지가 `/dashboard/create`에 있는데 링크가 `/create`로 지정 | 파일 구조와 href를 교차 비교하지 않음 |
| 상태 전이 맵 → 실제 status 업데이트 | 맵에 `generating_template → template_approved` 정의, 코드에서 전환 누락 | 맵 존재 확인만 하고, 모든 업데이트 코드를 추적하지 않음 |
| API 엔드포인트 → 프론트 훅 | API 존재하지만 대응 훅 없음 (호출 안 됨) | API 목록과 훅 목록을 1:1 매핑하지 않음 |
| 즉시 응답 → 비동기 결과 | API가 즉시 `{ status }` 반환, 프론트가 `data.failedIndices` 접근 | 동기/비동기 응답 구분 없이 타입만 확인 |

### 1-2. 왜 정적 코드 리뷰로 못 잡나

- **TypeScript 제네릭의 한계**: `fetchJson<SlideProject[]>()` — 런타임 응답이 `{ projects: [...] }`여도 컴파일 통과
- **`npm run build` 통과 ≠ 정상 동작**: 타입 캐스팅, `any`, 제네릭이 사용되면 빌드는 성공하지만 런타임에 실패
- **존재 검증 vs 연결 검증의 차이**: "API가 있는가?"와 "API의 응답이 호출측의 기대와 일치하는가?"는 전혀 다른 검증

---

## 2. 통합 정합성 검증 (Integration Coherence Verification)

QA 에이전트에 반드시 포함해야 하는 **교차 비교 검증** 영역.

### 2-1. API 응답 ↔ 프론트 훅 타입 교차 검증

**방법**: 각 API route의 `NextResponse.json()` 호출부와 대응 훅의 `fetchJson<T>` 타입 파라미터를 비교.

```
검증 단계:
1. API route에서 NextResponse.json()에 전달하는 객체의 shape 추출
2. 대응 훅에서 fetchJson<T>의 T 타입 확인
3. shape과 T가 일치하는지 비교
4. 래핑 여부 확인 (API가 { data: [...] }를 반환하면 훅이 .data를 꺼내는지)
```

**특히 주의할 패턴:**
- 페이지네이션 API: `{ items: [], total, page }` vs 프론트가 배열 기대
- snake_case DB 필드 → camelCase API 응답 → 프론트 타입 정의 간 불일치
- 즉시 응답 (202 Accepted) vs 최종 결과의 shape 차이

### 2-2. 파일 경로 ↔ 링크/라우터 경로 매핑

**방법**: `src/app/` 하위 page 파일의 URL 경로를 추출하고, 코드 내 모든 `href`, `router.push()`, `redirect()` 값과 대조.

```
검증 단계:
1. src/app/ 하위 page.tsx 파일 경로에서 URL 패턴 추출
   - (group) → URL에서 제거
   - [param] → 동적 세그먼트
2. 코드 내 모든 href=, router.push(, redirect( 값 수집
| TypeScript strict mode인가? | 제네릭 캐스팅으로 우회된 타입 안전성이 없는가? |

### 3-3. "양쪽을 동시에 읽어라" 원칙

QA가 경계면 버그를 잡으려면, 한쪽만 읽어선 안 된다. 반드시:
- API route **와** 대응 훅을 **같이** 읽고
- 상태 전이 맵 **와** 실제 업데이트 코드를 **같이** 읽고
- 파일 구조 **와** 링크 경로를 **같이** 읽어야 한다

에이전트 정의에 이 원칙을 명시적으로 기재하라.

### 3-4. QA는 빌드 후가 아니라, 각 모듈 완성 직후에 실행하라

오케스트레이터에서 QA를 "Phase 4: 전체 완성 후"에만 배치하면:
- 버그가 누적되어 수정 비용이 높아짐
- 초기 경계면 불일치가 후속 모듈에 전파됨

**권장 패턴**: 각 백엔드 API 완성 시 즉시 해당 API + 대응 훅의 교차 검증 수행 (incremental QA).

---

## 4. 검증 체크리스트 템플릿

QA 에이전트 정의에 포함할 웹 애플리케이션용 통합 정합성 체크리스트.

```markdown
### 통합 정합성 검증 (웹 앱)

#### API ↔ 프론트엔드 연결
- [ ] 모든 API route의 응답 shape과 대응 훅의 제네릭 타입이 일치
- [ ] 래핑된 응답({ items: [...] })은 훅에서 unwrap하는지 확인
- [ ] snake_case ↔ camelCase 변환이 일관되게 적용
- [ ] 즉시 응답(202)과 최종 결과의 shape이 프론트에서 구분되는지 확인
- [ ] 모든 API 엔드포인트에 대응하는 프론트 훅이 존재하고 실제로 호출됨

#### 라우팅 정합성
- [ ] 코드 내 모든 href/router.push 값이 실제 page 파일 경로와 매칭
- [ ] route group ((group))이 URL에서 제거되는 것을 고려한 경로 검증
- [ ] 동적 세그먼트([id])가 올바른 파라미터로 채워지는지 확인

#### 상태 머신 정합성
- [ ] 정의된 모든 상태 전이가 코드에서 실행됨 (죽은 전이 없음)
- [ ] 코드의 모든 status 업데이트가 전이 맵에 정의됨 (무단 전이 없음)
- [ ] 중간 상태에서 최종 상태로의 전환이 누락되지 않음
- [ ] 프론트에서 상태 기반 분기(if status === "X")의 X가 실제 도달 가능

#### 데이터 흐름 정합성
- [ ] DB 스키마 필드명과 API 응답 필드명의 매핑이 일관됨
- [ ] 프론트 타입 정의와 API 응답의 필드명이 일치
- [ ] 옵셔널 필드에 대한 null/undefined 처리가 양쪽에서 일관됨
```

hook: PostToolUse
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
/bin/zsh -lc "nl -ba skills/myharness/references/agent-design-patterns.md | sed -n '180,220p;260,305p'" in /Users/junghojang/Developments/myProject/myHarness
exec
/bin/zsh -lc "nl -ba skills/myharness/references/skill-testing-guide.md | sed -n '70,130p;240,310p'" in /Users/junghojang/Developments/myProject/myHarness
exec
/bin/zsh -lc "nl -ba skills/myharness/references/skill-writing-guide.md | sed -n '150,170p;250,310p'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
    70	- 엣지 케이스 1개
    71	- (선택) 복합 작업 1개
    72	
    73	---
    74	
    75	## 3. 실행 테스트: With-skill vs Baseline
    76	
    77	### 3-1. 비교 실행 구조
    78	
    79	각 테스트 프롬프트에 대해 두 개의 서브에이전트를 **동시에** 스폰한다:
    80	
    81	**With-skill 실행:**
    82	```
    83	프롬프트: "{테스트 프롬프트}"
    84	스킬 경로: {스킬 경로}
    85	출력 경로: _workspace/iteration-N/eval-{id}/with_skill/outputs/
    86	```
    87	
    88	**Baseline 실행:**
    89	```
    90	프롬프트: "{테스트 프롬프트}"  (동일)
    91	스킬: 없음
    92	출력 경로: _workspace/iteration-N/eval-{id}/without_skill/outputs/
    93	```
    94	
    95	### 3-2. Baseline 선택
    96	
    97	| 상황 | Baseline |
    98	|------|----------|
    99	| 새 스킬 생성 | 스킬 없이 같은 프롬프트 실행 |
   100	| 기존 스킬 개선 | 수정 전 스킬 버전 (스냅샷 보존) |
   101	
   102	### 3-3. 타이밍 데이터 캡처
   103	
   104	서브에이전트 완료 알림에서 `total_tokens`와 `duration_ms`를 **즉시** 저장한다. 이 데이터는 알림 시점에만 접근 가능하고 이후 복구할 수 없다.
   105	
   106	```json
   107	{
   108	  "total_tokens": 84852,
   109	  "duration_ms": 23332,
   110	  "total_duration_seconds": 23.3
   111	}
   112	```
   113	
   114	---
   115	
   116	## 4. 정량적 평가: Assertion 기반 채점
   117	
   118	### 4-1. Assertion 작성
   119	
   120	산출물이 객관적으로 검증 가능한 경우, 자동 채점을 위한 assertion을 정의한다.
   121	
   122	**좋은 assertion:**
   123	- 객관적으로 참/거짓 판별 가능
   124	- 서술적인 이름으로 결과만 봐도 무엇을 검사하는지 명확
   125	- 스킬의 핵심 가치를 검증
   126	
   127	**나쁜 assertion:**
   128	- 스킬 유무와 무관하게 항상 통과하는 것 (예: "출력이 존재한다")
   129	- 주관적 판단이 필요한 것 (예: "잘 작성되었다")
   130	
   240	- 실제 사용자가 입력할 법한 구체적이고 자연스러운 문장
   241	- 파일 경로, 개인적 맥락, 열 이름, 회사명 등 구체적 디테일 포함
   242	- 길이, 톤, 형식 다양하게 혼합
   243	- 명확한 정답보다 **경계 케이스(edge case)**에 집중
   244	
   245	**Should-trigger 쿼리 (8~10개):**
   246	- 다양한 표현의 같은 의도 (공식적/캐주얼)
   247	- 스킬/파일 유형을 명시적으로 말하지 않지만 분명히 필요한 경우
   248	- 비주류 사용 사례
   249	- 다른 스킬과 경쟁하지만 이 스킬이 이겨야 하는 경우
   250	
   251	**Should-NOT-trigger 쿼리 (8~10개):**
   252	- **Near-miss가 핵심** — 키워드가 유사하지만 다른 도구/스킬이 적합한 쿼리
   253	- 명백히 무관한 쿼리("피보나치 함수 작성")는 테스트 가치 없음
   254	- 인접 도메인, 모호한 표현, 키워드 겹침 but 맥락이 다른 경우
   255	
   256	### 7-2. 기존 스킬 충돌 검증
   257	
   258	새 스킬의 description이 기존 스킬의 트리거 영역과 겹치지 않는지 확인한다:
   259	
   260	1. 기존 스킬 목록의 description을 수집
   261	2. 새 스킬의 should-trigger 쿼리가 기존 스킬을 잘못 트리거하지 않는지 확인
   262	3. 충돌 발견 시 description의 경계 조건을 더 명확히 기술
   263	
   264	### 7-3. 자동 최적화 (선택적 고급 기능)
   265	
   266	description 최적화가 필요한 경우:
   267	
   268	1. 20개 eval 쿼리를 Train(60%) / Test(40%) split
   269	2. 현재 description으로 트리거 정확도 측정
   270	3. 실패 케이스를 분석하여 개선된 description 생성
   271	4. Test set 기준으로 best description 선택 (Train set 기준이 아님 — 과적합 방지)
   272	5. 최대 5회 반복
   273	
   274	> 이 과정은 `claude -p`를 사용하는 자동화 스크립트로 수행한다. 토큰 비용이 높으므로 스킬이 충분히 안정화된 후 최종 단계에서 실행한다.
   275	
   276	---
   277	
   278	## 8. 워크스페이스 구조
   279	
   280	테스트/평가 결과를 체계적으로 관리하는 디렉토리 구조:
   281	
   282	```
   283	{skill-name}-workspace/
   284	├── iteration-1/
   285	│   ├── eval-descriptive-name-1/
   286	│   │   ├── eval_metadata.json
   287	│   │   ├── with_skill/
   288	│   │   │   ├── outputs/
   289	│   │   │   ├── timing.json
   290	│   │   │   └── grading.json
   291	│   │   └── without_skill/
   292	│   │       ├── outputs/
   293	│   │       ├── timing.json
   294	│   │       └── grading.json
   295	│   ├── eval-descriptive-name-2/
   296	│   │   └── ...
   297	│   └── benchmark.json
   298	├── iteration-2/
   299	│   └── ...
   300	└── evals/
   301	    └── evals.json
   302	```
   303	
   304	**규칙:**
   305	- eval 디렉토리는 숫자가 아닌 **서술적 이름** 사용 (예: `eval-multi-page-table-extraction`)
   306	- 각 iteration은 독립 디렉토리에 보존 (이전 iteration 덮어쓰기 금지)
   307	- `_workspace/`는 삭제하지 않음 — 사후 검증 및 감사 추적용

 succeeded in 0ms:
   180	| **감독자 + 워커** | 에이전트 팀 | 공유 작업 목록으로 동적 할당, 워커 간 진행률 공유 |
   181	| **생성 + 검증** | 에이전트 팀 | 생성자↔검증자 간 실시간 피드백으로 재작업 최소화 |
   182	
   183	> 서브 에이전트로의 혼합은 단일 에이전트가 완전히 격리된 단발성 작업을 수행할 때만 고려한다.
   184	
   185	## 에이전트 타입 선택
   186	
   187	에이전트를 호출할 때 Agent 도구의 `subagent_type` 파라미터로 타입을 지정한다. 에이전트 팀의 팀원도 커스텀 에이전트 정의를 사용할 수 있다.
   188	
   189	### 빌트인 타입
   190	
   191	| 타입 | 도구 접근 | 적합한 용도 |
   192	|------|----------|-----------|
   193	| `general-purpose` | 전체 (WebSearch, WebFetch 포함) | 웹 조사, 범용 작업 |
   194	| `Explore` | 읽기 전용 (Edit/Write 없음) | 코드베이스 탐색, 분석 |
   195	| `Plan` | 읽기 전용 (Edit/Write 없음) | 아키텍처 설계, 계획 수립 |
   196	
   197	### 커스텀 타입
   198	
   199	`.claude/agents/{name}.md`에 에이전트를 정의하면 `subagent_type: "{name}"`으로 호출할 수 있다. 커스텀 에이전트는 전체 도구에 접근 가능.
   200	
   201	### 선택 기준
   202	
   203	| 상황 | 권장 | 이유 |
   204	|------|------|------|
   205	| 역할이 복잡하고 여러 세션에서 재사용 | **커스텀 타입** (`.claude/agents/`) | 페르소나와 작업 원칙을 파일로 관리 |
   206	| 단순 조사/수집이고 프롬프트만으로 충분 | **`general-purpose`** + 상세 프롬프트 | 에이전트 파일 불필요, 프롬프트에 지시 포함 |
   207	| 코드 읽기만 필요 (분석/리뷰) | **`Explore`** | 실수로 파일 수정하는 것을 방지 |
   208	| 설계/계획만 필요 | **`Plan`** | 분석에 집중, 코드 변경 방지 |
   209	| 파일 수정이 필요한 구현 작업 | **커스텀 타입** | 전체 도구 접근 + 전문 지시 |
   210	
   211	**원칙:** 모든 에이전트는 반드시 `.claude/agents/{name}.md` 파일로 정의한다. 빌트인 타입이라도 에이전트 정의 파일을 생성하여 역할·원칙·프로토콜을 명시한다. 파일로 존재해야 다음 세션에서 재사용 가능하고, 팀 통신 프로토콜이 명시되어야 협업 품질이 보장된다.
   212	
   213	**모델:** 모든 에이전트는 `model: "opus"`를 사용한다. Agent 도구 호출 시 반드시 `model: "opus"` 파라미터를 명시한다.
   214	
   215	## 에이전트 정의 구조
   216	
   217	```markdown
   218	---
   219	name: agent-name
   220	description: "1-2문장 역할 설명. 트리거 키워드 나열."
   260	| 재사용성 | 다른 팀에서도 쓰면 분리 | 이 팀에서만 쓰면 통합 고려 |
   261	
   262	## 에이전트 재사용 설계
   263	
   264	신규 에이전트 생성 전, 기존 에이전트와의 중복을 확인한다. 하네스를 반복 구축하다 보면 역할이 겹치는 에이전트가 다른 이름으로 누적되기 쉽다.
   265	
   266	| 상황 | 조치 |
   267	|------|------|
   268	| 기존 에이전트가 신규 역할을 완전히 포함 | 신규 생성 금지 — 기존 에이전트 재사용 |
   269	| 기존 에이전트가 부분 포함이고 일반화 가능 | 기존 에이전트를 일반화하여 확장 |
   270	| 도메인 특화가 의도된 부분 포함 | 신규 생성 진행 — 별개 에이전트로 유지 |
   271	| 역할 범위가 완전히 다름 | 신규 생성 진행 |
   272	
   273	**원칙:** 하나의 에이전트가 하나의 역할에 집중할수록 재사용성이 높고 중복이 줄어든다. 역할이 두 가지 이상이면 분리할 수 있는지 먼저 검토한다.
   274	
   275	**기존 에이전트 일반화 시:** 해당 에이전트에 의존하는 오케스트레이터·팀 구성의 동작이 변경될 수 있다. 확장 전 의존성을 확인하고, 일반화 후 드라이런으로 기존 동작 유지를 확인한다.
   276	
   277	## 스킬 vs 에이전트 구분
   278	
   279	| 구분 | 스킬 (Skill) | 에이전트 (Agent) |
   280	|------|-------------|-----------------|
   281	| 정의 | 절차적 지식 + 도구 번들 | 전문가 페르소나 + 행동 원칙 |
   282	| 위치 | `.claude/skills/` | `.claude/agents/` |
   283	| 트리거 | 사용자 요청 키워드 매칭 | Agent 도구로 명시적 호출 |
   284	| 크기 | 작은~큰 (워크플로우) | 작은 (역할 정의) |
   285	| 용도 | "어떻게 하는가" | "누가 하는가" |
   286	
   287	스킬은 에이전트가 작업을 수행할 때 참조하는 **절차적 가이드**.
   288	에이전트는 스킬을 활용하는 **전문가 역할 정의**.
   289	
   290	## 스킬 ↔ 에이전트 연결 방식
   291	
   292	에이전트가 스킬을 활용하는 3가지 방식:
   293	
   294	| 방식 | 구현 | 적합한 경우 |
   295	|------|------|-----------|
   296	| **Skill 도구 호출** | 에이전트 프롬프트에 `Skill 도구로 /skill-name 호출` 명시 | 스킬이 독립 워크플로우이고 사용자 호출 가능한 경우 |
   297	| **프롬프트 내 인라인** | 에이전트 정의 내에 스킬 내용을 직접 포함 | 스킬이 짧고(50줄 이하) 이 에이전트 전용인 경우 |
   298	| **레퍼런스 로드** | `Read`로 스킬의 references/ 파일을 필요 시 로드 | 스킬 내용이 크고 조건부로만 필요한 경우 |
   299	
   300	권장: 재사용성이 높으면 Skill 도구, 전용이면 인라인, 대용량이면 레퍼런스 로드.

 succeeded in 0ms:
   150	```
   151	
   152	사용자가 매출에 대해 물으면 finance.md만 로드.
   153	
   154	### 패턴 2: 조건부 상세
   155	
   156	```markdown
   157	# DOCX 처리
   158	
   159	## 문서 생성
   160	docx-js로 새 문서를 생성한다. → [DOCX-JS.md](references/docx-js.md) 참조.
   161	
   162	## 문서 편집
   163	단순 편집은 XML을 직접 수정.
   164	**추적 변경이 필요하면**: [REDLINING.md](references/redlining.md) 참조
   165	```
   166	
   167	### 패턴 3: 대형 레퍼런스 파일 구조
   168	
   169	300줄 이상의 reference 파일은 상단에 목차를 포함한다:
   170	
   250	
   251	```json
   252	{
   253	  "total_tokens": 84852,
   254	  "duration_ms": 23332,
   255	  "total_duration_seconds": 23.3
   256	}
   257	```
   258	
   259	서브에이전트 완료 알림에서 `total_tokens`와 `duration_ms`를 즉시 저장한다. 이 데이터는 알림 시점에만 접근 가능하고 이후 복구 불가.
   260	
   261	---
   262	
   263	## 8. 스킬에 포함하지 않을 것
   264	
   265	- README.md, CHANGELOG.md, INSTALLATION_GUIDE.md 등 부가 문서
   266	- 스킬 생성 과정의 메타 정보 (테스트 결과, 반복 이력)
   267	- 사용자 대상 설명서 (스킬은 AI 에이전트를 위한 지시서)
   268	- 이미 Claude가 알고 있는 일반적 지식
   269	
   270	---
   271	
   272	## 9. 스킬 재사용 설계
   273	
   274	신규 스킬 생성 전, 기존 스킬과의 중복을 확인한다. 하네스를 반복 구축하다 보면 기능이 겹치는 스킬이 다른 이름으로 누적되기 쉽다.
   275	
   276	| 상황 | 조치 |
   277	|------|------|
   278	| 기존 스킬이 신규 기능을 완전히 포함 | 신규 생성 금지 — 기존 스킬을 에이전트에 연결 |
   279	| 기존 스킬이 부분 포함이고 일반화 가능 | 기존 스킬을 일반화하여 확장 |
   280	| 도메인 특화가 의도된 부분 포함 | 신규 생성 진행 — 별개 스킬로 유지 |
   281	| 기능 범위가 완전히 다름 | 신규 생성 진행 |
   282	
   283	**원칙:** 하나의 스킬이 하나의 역할에 집중할수록 재사용성이 높고 중복이 줄어든다. 역할이 두 가지 이상이면 분리할 수 있는지 먼저 검토한다.
   284	
   285	### 어디까지 일반화할지
   286	
   287	일반화는 무한히 가능하므로 **의도된 책임 범위**에서 멈춘다. 의도된 도메인 특화는 유지하고, 우연한 종속만 제거한다.
   288	
   289	예: "fintech 리스크 평가 PDF" 스킬
   290	
   291	| 단계 | 결과 |
   292	|------|------|
   293	| fintech 종속 제거 | "평가 결과 PDF" — 책임 범위가 평가 리포트면 여기서 멈춤 |
   294	| 평가 종속 제거 | "PDF 포매팅" — 이미 존재한다면 별개 스킬 생성하지 말고 재사용 |
   295	
   296	책임 범위가 "fintech 리스크 평가"로 의도된 특화라면 일반화하지 않고 별개 스킬로 유지한다.
   297	
   298	해당 스킬에 의존하는 에이전트의 동작이 변경될 수 있다. 확장 전 의존성을 확인하고, description에 확장된 사용 범위를 반영한다.

hook: PostToolUse
hook: PostToolUse
hook: PostToolUse
exec
/bin/zsh -lc "nl -ba skills/myharness/SKILL.md | sed -n '20,40p;80,120p;188,198p;276,338p;468,488p'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
    20	### Phase 0: 현황 감사
    21	
    22	하네스 스킬이 트리거되면 가장 먼저 기존 하네스 현황을 확인한다.
    23	
    24	1. `프로젝트/.claude/agents/`, `프로젝트/.claude/skills/`, `프로젝트/CLAUDE.md`를 읽는다
    25	2. 현황에 따라 실행 모드를 분기한다:
    26	   - **신규 구축**: 에이전트/스킬 디렉토리가 없거나 비어있음 → Phase 1부터 전체 실행
    27	   - **기존 확장**: 기존 하네스가 있고 새 에이전트/스킬 추가 요청 → 아래 Phase 선택 매트릭스에 따라 필요한 Phase만 실행
    28	   - **운영/유지보수**: 기존 하네스의 감사·수정·동기화 요청 → Phase 7-5 운영/유지보수 워크플로우로 이동
    29	
    30	   **기존 확장 시 Phase 선택 매트릭스:**
    31	   | 변경 유형 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 |
    32	   |----------|---------|---------|---------|---------|---------|---------|
    33	   | 에이전트 추가 | 건너뜀 (Phase 0 결과 활용) | 배치 결정만 | 필수 (3-0 포함) | 전용 스킬 필요 시 (4-0 포함) | 오케스트레이터 수정 | 필수 |
    34	   | 스킬 추가/수정 | 건너뜀 | 건너뜀 | 건너뜀 | 필수 (4-0 포함) | 연결 변경 시 | 필수 |
    35	   | 아키텍처 변경 | 건너뜀 | 필수 | 영향받는 에이전트만 (3-0 포함) | 영향받는 스킬만 (4-0 포함) | 필수 | 필수 |
    36	3. 기존 에이전트/스킬 목록과 CLAUDE.md 기록을 대조하여 불일치(drift)를 감지한다
    37	4. 감사 결과를 사용자에게 요약 보고하고, 실행 계획을 확인받는다
    38	
    39	### Phase 1: 도메인 분석
    40	1. 사용자 요청에서 도메인/프로젝트 파악
    80	### Phase 3: 에이전트 정의 생성
    81	
    82	#### 3-0. 기존 에이전트 중복 검토
    83	
    84	신규 에이전트 생성 전, `프로젝트/.claude/agents/`의 기존 에이전트와 중복 여부를 확인한다. 하네스를 반복 구축하다 보면 역할이 겹치는 에이전트가 다른 이름으로 누적되기 쉽다.
    85	
    86	> 중복 분류 기준과 재사용 설계는 `references/agent-design-patterns.md`의 "에이전트 재사용 설계" 참조.
    87	
    88	**모든 에이전트는 반드시 `프로젝트/.claude/agents/{name}.md` 파일로 정의한다.** 에이전트 정의 파일 없이 Agent 도구의 prompt에 역할을 직접 넣는 것은 금지한다. 이유:
    89	- 에이전트 정의가 파일로 존재해야 다음 세션에서 재사용 가능
    90	- 팀 통신 프로토콜이 명시되어야 에이전트 간 협업 품질 보장
    91	- 하네스의 핵심 가치는 에이전트(누가)와 스킬(어떻게)의 분리
    92	
    93	빌트인 타입(`general-purpose`, `Explore`, `Plan`)을 사용하더라도 에이전트 정의 파일은 생성한다. 빌트인 타입은 Agent 도구의 `subagent_type` 파라미터로 지정하고, 에이전트 정의 파일에는 역할·원칙·프로토콜을 담는다.
    94	
    95	**모델 설정:** 모든 에이전트는 `model: "opus"`를 사용한다. Agent 도구 호출 시 반드시 `model: "opus"` 파라미터를 명시한다. 하네스의 품질은 에이전트의 추론 능력에 직결되며, opus가 최고 품질을 보장한다.
    96	
    97	**팀 재구성:** 에이전트 팀은 세션당 한 팀만 활성화할 수 있지만, Phase 간에 팀을 해체하고 새 팀을 구성할 수 있다. 파이프라인 패턴처럼 Phase별로 다른 전문가 조합이 필요하면, 이전 팀의 산출물을 파일로 저장한 뒤 팀을 정리하고 새 팀을 생성한다.
    98	
    99	각 에이전트를 `프로젝트/.claude/agents/{name}.md`에 정의한다. 필수 섹션: 핵심 역할, 작업 원칙, 입력/출력 프로토콜, 에러 핸들링, 협업. 에이전트 팀 모드에서는 `## 팀 통신 프로토콜` 섹션을 추가하여 메시지 수신/발신 대상과 작업 요청 범위를 명시한다.
   100	
   101	> 정의 템플릿과 실제 파일 전문은 `references/agent-design-patterns.md`의 "에이전트 정의 구조" + `references/team-examples.md` 참조.
   102	
   103	**QA 에이전트 포함 시 필수 사항:**
   104	- QA 에이전트는 `general-purpose` 타입을 사용하라 (`Explore`는 읽기 전용이므로 검증 스크립트 실행 불가)
   105	- QA의 핵심은 "존재 확인"이 아니라 **"경계면 교차 비교"** — API 응답과 프론트 훅을 동시에 읽고 shape을 비교
   106	- QA는 전체 완성 후 1회가 아니라, **각 모듈 완성 직후 점진적으로 실행** (incremental QA)
   107	- 상세 가이드: `references/qa-agent-guide.md` 참조
   108	
   109	#### 3-1. 교리 주입 (코드/수정 에이전트)
   110	
   111	코드를 쓰거나 고치는 에이전트(빌더·수정·QA)의 `## 작업 원칙`에 개발 규칙·TDD 교리를 주입한다. 절차:
   112	1. `references/dev-rules.md`, `references/tdd-doctrine.md`를 타겟 하네스의 `프로젝트/.claude/skills/{harness-name}/references/`로 **복사**한다.
   113	2. 에이전트 정의에 **타겟상대 실경로** 한 줄씩 넣는다 — `> 개발 규칙: \`.claude/skills/{harness-name}/references/dev-rules.md\` 준수.` / `> TDD 규율: \`.claude/skills/{harness-name}/references/tdd-doctrine.md\` 준수.`
   114	3. `[[ ]]`나 플러그인 내부 경로는 서브에이전트가 해소 못 하므로 금지. 본문 복붙도 금지(DRY).
   115	- 비코드 에이전트(문서·리서치)는 dev-rules만 선택 적용(TDD 제외).
   116	
   117	### Phase 4: 스킬 생성
   118	
   119	각 에이전트가 사용할 스킬을 `프로젝트/.claude/skills/{name}/SKILL.md`에 생성한다. 상세 작성 가이드는 `references/skill-writing-guide.md` 참조.
   120	
   188	
   189	> 상세 작성 패턴, 예시, 데이터 스키마 표준은 `references/skill-writing-guide.md` 참조.
   190	
   191	#### 4-6. 외부 리뷰 스킬 생성 (코드/설계 — 도구 연동 확인 후)
   192	
   193	코드/설계 도메인이어도 **codex/gemini 연동 시에만** 만든다(작동 불가 스킬 방지).
   194	1. **점검:** `bash skills/myharness/scripts/check-review-tools.sh` → 끝줄 `AVAILABLE:`. **none**=스킬 생성 안 함(내부 QA만, 보고서·CLAUDE.md에 "도구 미연동 생략" 명시) / **하나만**=그 도구만 쓰는 저하 모드 생성 / **둘 다**=풀 생성.
   195	2. **생성:** `references/external-review-loop.md`(방법론 겸 템플릿)를 타겟 `.claude/skills/external-review-loop/SKILL.md`로 생성(frontmatter 포함). `check-review-tools.sh`도 그 스킬 `scripts/`로 복사(런타임 폴백).
   196	3. 오케스트레이터가 단계 마감 시 호출(5-6). 스킬 없으면 게이트는 내부 QA로 축소. 비코드 도메인은 점검 없이 생략.
   197	
   198	### Phase 5: 통합 및 오케스트레이션
   276	#### 5-4. CLAUDE.md 하네스 포인터 등록
   277	
   278	하네스 구성 완료 후, 프로젝트의 `CLAUDE.md`에 최소한의 포인터를 등록한다. CLAUDE.md는 새 세션마다 로딩되므로, 하네스 존재와 트리거 규칙만 기록하면 오케스트레이터 스킬이 나머지를 처리한다.
   279	
   280	**CLAUDE.md 템플릿:**
   281	
   282	````markdown
   283	## 하네스: {도메인명}
   284	
   285	**목표:** {하네스의 핵심 목표 한 줄}
   286	
   287	**트리거:** {도메인} 관련 작업 요청 시 `{orchestrator-skill-name}` 스킬을 사용하라. 단순 질문은 직접 응답 가능.
   288	
   289	**변경 이력:**
   290	| 날짜 | 변경 내용 | 대상 | 사유 |
   291	|------|----------|------|------|
   292	| {YYYY-MM-DD} | 초기 구성 | 전체 | - |
   293	````
   294	
   295	**듀얼 런타임 포인터:** Codex용으로 레포 루트 `AGENTS.md`에도 같은 포인터 + Codex 오케스트레이션 어댑터(subagents/subprocess) 주석을 출력한다(Codex 자동 로드). 둘 다 같은 정본을 가리킴. 한쪽만 갱신=drift. 상세: `references/runtime-adapters.md`.
   296	
   297	**CLAUDE.md에 넣지 않는 것:** 에이전트 목록, 스킬 목록, 디렉토리 구조, 실행 규칙 상세. 이유: 에이전트/스킬 목록은 오케스트레이터 스킬과 `.claude/agents/`, `.claude/skills/`에서 관리하므로 중복이다. 디렉토리 구조는 파일 시스템에서 직접 확인 가능하다. CLAUDE.md는 **포인터(트리거 규칙) + 변경 이력**만 담는다.
   298	
   299	#### 5-5. 후속 작업 지원
   300	
   301	오케스트레이터는 초기 실행뿐 아니라 후속 작업도 처리해야 한다. 다음 세 가지를 보장하라:
   302	
   303	**1. 오케스트레이터 description에 후속 키워드 포함:**
   304	초기 생성 키워드만으로는 후속 요청이 트리거되지 않는다. description에 반드시 포함할 후속 표현:
   305	- "다시 실행", "재실행", "업데이트", "수정", "보완"
   306	- "{도메인}의 {부분작업}만 다시"
   307	- "이전 결과 기반으로", "결과 개선"
   308	
   309	**2. 오케스트레이터 Phase 1에 컨텍스트 확인 단계 추가:**
   310	워크플로우 시작 시 기존 산출물 존재 여부를 확인하여 실행 모드를 결정한다:
   311	- `_workspace/` 존재 + 사용자가 부분 수정 요청 → **부분 재실행** (해당 에이전트만 재호출)
   312	- `_workspace/` 존재 + 사용자가 새 입력 제공 → **새 실행** (기존 _workspace를 `_workspace_prev/`로 이동)
   313	- `_workspace/` 미존재 → **초기 실행**
   314	
   315	**3. 에이전트 정의에 재호출 지침 포함:**
   316	각 에이전트 `.md` 파일에 "이전 산출물이 있을 때의 행동"을 명시한다:
   317	- 이전 결과 파일이 존재하면 읽고 개선점을 반영
   318	- 사용자 피드백이 주어지면 해당 부분만 수정
   319	
   320	> 오케스트레이터 템플릿의 "Phase 0: 컨텍스트 확인" 섹션 참조: `references/orchestrator-template.md`
   321	
   322	#### 5-6. 품질 게이트 (코드/설계 도메인)
   323	
   324	내부 생성-검증(QA 에이전트)에 더해, 단계 산출물마다 외부 리뷰 게이트를 건다. 무차별 적용은 과의식이므로 **리스크 등급으로 강도를 맞춘다.**
   325	
   326	| 등급 | 조건 | 게이트 |
   327	|------|------|--------|
   328	| 경량 | 1파일·가역·테스트 無 (오타·문구·설정) | 내부 QA만 |
   329	| 표준 | 다파일·기능 추가 | 내부 QA + 외부리뷰 **1회**(단계 끝) |
   330	| 중대 | 계약 변경·비가역·다도메인 | **단계마다** 외부리뷰 + 승인 사다리(PRD→계획서→실행) |
   331	
   332	**단계 마감 게이트(표준·중대):** 오케스트레이터가 `external-review-loop` 스킬 호출 — codex/gemini 병렬 → 전건 판정(확인/부분/이월/기각) → 확인분만 TDD 수정 → 게이트 PASS. 판정 권위는 오케스트레이터(위임 금지). 상세: `references/external-review-loop.md`.
   333	
   334	**커밋 순서(순환 제거):** 리뷰→판정→수정→게이트 PASS → **승인 관문** → 단일 커밋. (리뷰는 커밋 *전* 작업트리/스테이지 대상 — "커밋 직후 리뷰" 아님.)
   335	- 승인 관문 기본: 사용자 승인 대기.
   336	- **자율 노브:** `프로젝트/_workspace/.autonomous` 마커(또는 "자율로"·"승인 생략" 발화) 시 승인 자동 통과 → 커밋. 권한모드(bypassPermissions)는 스킬이 못 읽으므로 마커/발화로 명시. 마커 ON이어도 외부리뷰·판정·게이트는 그대로(인간 승인 한 스텝만 생략).
   337	- **push는 자율이어도 기본 대기**(외부 송출·되돌리기 어려움) — `_workspace/.autonomous-push` 마커 시만 자동.
   338	
   468	생성 완료 후 확인:
   469	
   470	- [ ] `.claude/agents/`(정의 파일, 빌트인 타입도 필수) + `.claude/skills/`(SKILL.md + references/) 생성
   471	- [ ] 오케스트레이터 스킬 1개 (데이터 흐름 + 에러 핸들링 + 테스트 시나리오 포함)
   472	- [ ] 실행 모드 명시 (에이전트 팀 / 서브 에이전트 / 하이브리드 중 선택, 하이브리드면 Phase별 모드 기재)
   473	- [ ] 모든 Agent 호출에 `model: "opus"` 파라미터 명시
   474	- [ ] 신규 에이전트·스킬 생성 전 기존 중복 검토 완료 (Phase 3-0, 4-0)
   475	- [ ] `.claude/commands/` — 아무것도 생성하지 않음
   476	- [ ] 기존 에이전트/스킬과 충돌 없음
   477	- [ ] 스킬 description이 적극적("pushy")으로 작성됨 — **후속 작업 키워드 포함**
   478	- [ ] SKILL.md 본문이 500줄 이내, 초과 시 references/ 분리
   479	- [ ] 테스트 프롬프트 2~3개 실행 검증 + 트리거 검증(should/should-NOT) 완료
   480	- [ ] **CLAUDE.md 포인터 등록 + 변경 이력에 에이전트/스킬 추가·삭제·수정 기록**
   481	- [ ] **오케스트레이터 Phase 1에 컨텍스트 확인 단계** (초기/후속/부분 재실행 판별)
   482	- [ ] (코드/설계) 코드/수정 에이전트에 dev-rules·tdd-doctrine **타겟상대 실경로** 주입 (`[[ ]]` 금지) + 교리 파일 타겟 복사 (Phase 3-1)
   483	- [ ] (코드/설계) **codex/gemini 연동 점검**(`check-review-tools.sh`) 후 `external-review-loop` 스킬 생성 — 도구 전무면 생략(불필요 스킬 방지) + 단계 게이트 배선, 단계마다 리스크 등급 판정 (Phase 4-6, 5-6)
   484	- [ ] (코드/설계) 커밋 순서·자율 노브(`_workspace/.autonomous`)·push 별도 게이트 반영
   485	- [ ] 결과서에 `## 다음 단계 참조` 블록 (연속성)
   486	- [ ] **듀얼 런타임:** 루트 `AGENTS.md` + 스킬 `.agents/skills/` 출력, 오케스트레이터에 어댑터(TeamCreate / Codex subagents·subprocess) 명시 (`references/runtime-adapters.md`)
   487	
   488	## 참고

hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
codex
문서 구조 자체도 확인합니다. 특히 fenced code block 닫힘, 헤딩 순서, 템플릿 B/C/D의 누락 여부를 자동 검사합니다.
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc "ruby -e 'root=\"skills/myharness\"; Dir[\"#{root}/**/*.{md,sh}\"].sort.each do |f|; txt=File.read(f); fences=txt.lines.each_with_index.select{|l,i| l.start_with?(\""'```") || l.start_with?("````")}.map{|l,i| i+1}; puts "#{f}: odd fences #{fences.join(",")}" if fences.length.odd?; hs=txt.lines.each_with_index.map{|l,i| l[/''^(#+)'"\\s+(.+)/] ? [i+1,"'$1.length,$2] : nil}.compact; puts "#{f}: #{hs.map{|h| h.join(":")}.join(" | ")}" if f.include?("orchestrator-template") || f.end_with?("SKILL.md"); end'"'" in /Users/junghojang/Developments/myProject/myHarness
hook: PostToolUse
 succeeded in 860ms:
/opt/homebrew/Cellar/rbenv/1.3.2/libexec/rbenv-version-name: line 11: cannot create temp file for here document: Operation not permitted
/opt/homebrew/Cellar/rbenv/1.3.2/libexec/rbenv-which: line 50: cannot create temp file for here document: Operation not permitted
/opt/homebrew/Cellar/rbenv/1.3.2/libexec/rbenv-exec: line 36: cannot create temp file for here document: Operation not permitted
skills/myharness/SKILL.md: 6:1:Harness — The Team-Architecture Factory | 18:2:워크플로우 | 20:3:Phase 0: 현황 감사 | 39:3:Phase 1: 도메인 분석 | 46:3:Phase 2: 팀 아키텍처 설계 | 48:4:2-1. 실행 모드 선택 | 65:4:2-2. 아키텍처 패턴 선택 | 76:4:2-3. 에이전트 분리 기준 | 80:3:Phase 3: 에이전트 정의 생성 | 82:4:3-0. 기존 에이전트 중복 검토 | 109:4:3-1. 교리 주입 (코드/수정 에이전트) | 117:3:Phase 4: 스킬 생성 | 121:4:4-0. 기존 스킬 중복 검토 | 127:4:4-1. 스킬 구조 | 140:4:4-2. Description 작성 — 적극적 트리거 유도 | 149:4:4-3. 본문 작성 원칙 | 159:4:4-4. Progressive Disclosure (단계적 정보 공개) | 183:4:4-5. 스킬-에이전트 연결 원칙 | 191:4:4-6. 외부 리뷰 스킬 생성 (코드/설계 — 도구 연동 확인 후) | 198:3:Phase 5: 통합 및 오케스트레이션 | 206:4:5-0. 오케스트레이터 패턴 (모드별) | 239:4:5-1. 데이터 전달 프로토콜 | 260:4:5-2. 에러 핸들링 | 266:4:5-3. 팀 크기 가이드라인 | 276:4:5-4. CLAUDE.md 하네스 포인터 등록 | 283:2:하네스: {도메인명} | 299:4:5-5. 후속 작업 지원 | 322:4:5-6. 품질 게이트 (코드/설계 도메인) | 339:3:Phase 6: 검증 및 테스트 | 343:4:6-1. 구조 검증 | 350:4:6-2. 실행 모드별 검증 | 356:4:6-3. 스킬 실행 테스트 | 375:4:6-4. 트리거 검증 | 386:4:6-5. 드라이런 테스트 | 393:4:6-6. 테스트 시나리오 작성 | 398:3:Phase 7: 하네스 진화 | 402:4:7-1. 실행 후 피드백 수집 | 410:4:7-2. 피드백 반영 경로 | 422:4:7-3. 변경 이력 | 437:4:7-4. 진화 트리거 | 444:4:7-5. 운영/유지보수 워크플로우 | 466:2:산출물 체크리스트 | 488:2:참고
skills/myharness/references/orchestrator-template.md: 1:1:오케스트레이터 스킬 템플릿 | 14:2:템플릿 A: 에이전트 팀 모드 (기본 · 최우선 선택) | 24:1:{Domain} Orchestrator | 28:2:실행 모드: 에이전트 팀 | 30:2:에이전트 구성 | 38:2:워크플로우 | 40:3:Phase 0: 컨텍스트 확인 (후속 작업 지원) | 51:3:Phase 1: 준비 | 58:3:Phase 2: 팀 구성 | 84:3:Phase 3: {주요 작업 — 예: 조사/생성/분석} | 108:3:Phase 4: {후속 작업 — 예: 검증/통합} | 114:3:Phase 5: 정리 | 122:2:데이터 흐름 | 137:2:에러 핸들링 | 147:2:테스트 시나리오 | 149:3:정상 흐름 | 158:3:에러 흐름 | 169:2:템플릿 B: 서브 에이전트 모드 (대안) | 179:2:실행 모드: 서브 에이전트 | 181:2:에이전트 구성 | 188:2:워크플로우 | 190:3:Phase 0: 컨텍스트 확인 | 193:3:Phase 1: 준비 | 197:3:Phase 2: 병렬 실행 | 205:3:Phase 3: 통합 | 210:3:Phase 4: 정리 | 214:2:에러 핸들링 | 222:2:템플릿 C: 하이브리드 모드 | 232:2:실행 모드: 하이브리드 | 240:2:워크플로우 | 242:3:Phase 2: 병렬 자료 수집 | 248:3:Phase 3: 합의 기반 통합 | 257:3:Phase 4: 독립 검증 | 272:2:템플릿 D: Codex 런타임 어댑터 | 277:2:실행 모드: Codex 어댑터 (런타임 감지 후 분기) | 281:3:매핑 규칙 | 289:3:Phase 2: 실행 | 292:3:codex exec subprocess (독립 병렬·CI) | 295:1:stdin 폐쇄 필수(< /dev/null) — 안 하면 codex exec 무한 대기 | 303:3:에러 핸들링 | 306:3:데이터 흐름 | 314:2:작성 원칙 | 324:2:description 작성 시 후속 작업 키워드 | 335:2:실제 오케스트레이터 참고

hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc 'nl -ba skills/myharness/scripts/check-review-tools.sh' in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
     1	#!/usr/bin/env bash
     2	# 외부 리뷰 도구(codex·gemini CLI) 연동 점검.
     3	# 용도: 하네스 생성 시 external-review-loop 스킬을 만들지 결정 + 생성 스킬의 런타임 폴백.
     4	# 사용: bash check-review-tools.sh
     5	# 출력 끝줄: AVAILABLE: <codex|gemini 공백구분 | none>
     6	# 종료코드: 0 = 1개 이상 사용가능, 1 = 전무.
     7	set -uo pipefail
     8	
     9	avail=()
    10	for t in codex gemini; do
    11	  if command -v "$t" >/dev/null 2>&1; then
    12	    echo "$t: ✓ 연동됨 ($(command -v "$t"))"
    13	    avail+=("$t")
    14	  else
    15	    echo "$t: ✗ 미설치"
    16	  fi
    17	done
    18	
    19	if [ "${#avail[@]}" -eq 0 ]; then
    20	  echo "AVAILABLE: none"
    21	  exit 1
    22	fi
    23	echo "AVAILABLE: ${avail[*]}"
    24	exit 0

hook: PostToolUse
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
/bin/zsh -lc "nl -ba skills/myharness/references/runtime-adapters.md | sed -n '18,64p'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
    18	| 관심사 | Claude Code | Codex CLI | 이식성 |
    19	|--------|-------------|-----------|--------|
    20	| 인스트럭션 | `CLAUDE.md` | `AGENTS.md` (글로벌 `~/.codex` → 레포 루트→cwd concat, **가까운 쪽 우선**, 32KiB cap) | ✅ 듀얼 출력 |
    21	| 스킬 | `.claude/skills/{n}/SKILL.md` (desc 자동 트리거) | `.agents/skills/{n}/SKILL.md` (desc 기반 implicit activation, `/skills`·`$name` 명시) | ✅ **포맷 동일** |
    22	| 에이전트 정의 | `.claude/agents/{n}.md` | `.codex/agents/{n}.toml` (커스텀) + 내장 `default`/`worker`/`explorer` | 🟡 포맷 변환(md→toml) |
    23	| 멀티 에이전트 | `TeamCreate`/`SendMessage`/`TaskCreate` | **네이티브 subagents**(병렬 spawn) 또는 `codex exec` subprocess | 🟡 어댑터 |
    24	| 플러그인/배포 | `.claude-plugin/plugin.json` + marketplace | 플러그인 번들(skills+commands+MCP+hooks+marketplace) | 🟡 별도 매니페스트 |
    25	| 설정 | settings.json | `.codex/config.toml`(프로젝트, trusted) + `~/.codex/config.toml` | 🟡 |
    26	| MCP | settings/플러그인 | `config.toml`의 `mcp_servers.<id>` | ✅ |
    27	| 커스텀 슬래시 | `commands/*.md` | ❌ `~/.codex/prompts/*.md`·`$ARGUMENTS` 0.137.0 미지원 | 🔴 생략 |
    28	| 외부 리뷰(codex/gemini 호출) | subprocess | subprocess (동일) | ✅ 공짜 |
    29	| 스크립트(scripts/) | bash | bash | ✅ |
    30	
    31	핵심: 스킬 본문은 **포맷 동일** → 거의 그대로 공유. 진짜 변환이 필요한 건 에이전트 정의(md→toml)와 오케스트레이션뿐.
    32	
    33	## 2. 진입점 어댑터
    34	- **Claude Code:** `.claude-plugin/plugin.json` + `skills/` 자동 발견 + `CLAUDE.md`. (현행)
    35	- **Codex:** 레포 루트 `AGENTS.md` 자동 로드(루트→cwd concat, 가까운 쪽 우선). AGENTS.md 역할: 하네스 포인터 + "하네스 만들/고치려면 `skills/myharness/SKILL.md`를 따르라" + 오케스트레이션은 §4 어댑터. (Codex 스킬 auto-activation이 있으므로, 스킬을 `.agents/skills/`에 두면 AGENTS.md는 얇게 가능.)
    36	
    37	## 3. 스킬·에이전트 어댑터
    38	- **스킬:** SKILL.md(name+description+본문) 포맷이 양쪽 동일. 생성 시 `.claude/skills/{n}/`와 `.agents/skills/{n}/` **양쪽에 출력**(또는 한쪽을 심링크). references/scripts도 동봉.
    39	- **에이전트:** Claude는 `.claude/agents/{n}.md`. Codex는 `.codex/agents/{n}.toml`(커스텀) — 같은 역할/원칙/프로토콜을 TOML로 변환하거나, 단순 역할은 내장 `worker`/`explorer`에 프롬프트로 매핑. 교리 주입(dev-rules/tdd-doctrine) 실경로는 런타임별 스킬 경로로 맞춘다.
    40	
    41	## 4. 오케스트레이션 어댑터
    42	오케스트레이터 상단에 "런타임 감지 후 분기" 명시.
    43	- **Claude Code:** `TeamCreate`+`SendMessage`+`TaskCreate` (템플릿 A).
    44	- **Codex:** 네이티브 subagents로 병렬 specialized agents spawn(`/agent` 전환, `.codex/agents/*.toml`), 또는 독립 병렬이 필요하면 `codex exec` subprocess. 데이터는 `_workspace/` 파일 기반(템플릿 D).
    45	  - `codex exec` 베스트 프랙티스(검증): 기본 read-only / 쓰기 작업만 `--sandbox workspace-write` / 스크립트 소비는 `--json` / 최종 메시지만 `-o`(`--output-last-message`) / 격리는 `--ignore-user-config` / stdin은 `< /dev/null`.
    46	- external-review-loop 게이트는 양쪽 동일(이미 subprocess).
    47	
    48	## 5. 생성 하네스의 듀얼 출력 (Phase 5-4)
    49	팩토리가 하네스 생성 시:
    50	- `프로젝트/CLAUDE.md` + `프로젝트/AGENTS.md` (같은 포인터·같은 변경 이력. 한쪽만 갱신 = drift)
    51	- 스킬 → `.claude/skills/` + `.agents/skills/`
    52	- 에이전트 → `.claude/agents/{n}.md` + `.codex/agents/{n}.toml`
    53	- (선택) MCP 필요 시 `.codex/config.toml`의 `mcp_servers.<id>` 동봉
    54	
    55	## 6. 설치 방법
    56	- **Claude Code:** 플러그인 추가(`/plugin` 또는 marketplace.json). `skills/` 자동 인식.
    57	- **Codex:** 레포 루트 `AGENTS.md`·`.agents/skills/`·`.codex/`는 trusted 프로젝트에서 자동 인식 — 별도 설치 최소. MCP는 `.codex/config.toml`에 동봉(trusted 한정, auth/telemetry 등 machine-local 키는 project-local 무시됨).
    58	- 양쪽 자동화는 레포 루트 `install.sh` 참조. codex/gemini는 `check-review-tools.sh`로 점검.
    59	
    60	## 7. 한계 (정직)
    61	- **커스텀 슬래시 프롬프트는 Codex 0.137.0 미지원** — Claude의 `commands/`에 1:1 대응 없음(애초에 하네스는 커맨드 안 만드니 영향 작음).
    62	- **에이전트 정의 포맷 불일치**(md vs toml) — 변환 필요. 자동 변환 스크립트화 여지.
    63	- **팀 통신 시맨틱 차이** — Claude의 SendMessage 실시간 토론 ↔ Codex subagents/파일 기반. 합의 중심 하네스는 Claude가 더 매끄러움.
    64	- 결론(codex 자문): 듀얼 포팅 단위는 "AGENTS.md 인라인"만이 아니라 **plugin + skills + (선택)subagents + 프로젝트 `.codex/config.toml`**. 정본·리뷰·스크립트는 공유, 변환은 에이전트 포맷·오케스트레이션뿐.

hook: PostToolUse
exec
/bin/zsh -lc "nl -ba skills/myharness/references/orchestrator-template.md | sed -n '40,60p;272,304p;314,330p'" in /Users/junghojang/Developments/myProject/myHarness
exec
/bin/zsh -lc "nl -ba skills/myharness/references/external-review-loop.md | sed -n '1,80p'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
    40	### Phase 0: 컨텍스트 확인 (후속 작업 지원)
    41	
    42	기존 산출물 존재 여부를 확인하여 실행 모드를 결정한다:
    43	
    44	1. `_workspace/` 디렉토리 존재 여부 확인
    45	2. 실행 모드 결정:
    46	   - **`_workspace/` 미존재** → 초기 실행. Phase 1로 진행
    47	   - **`_workspace/` 존재 + 사용자가 부분 수정 요청** → 부분 재실행. 해당 에이전트만 재호출하고, 기존 산출물 중 수정 대상만 덮어쓴다
    48	   - **`_workspace/` 존재 + 새 입력 제공** → 새 실행. 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동한 뒤 Phase 1 진행
    49	3. 부분 재실행 시: 이전 산출물 경로를 에이전트 프롬프트에 포함하여, 에이전트가 기존 결과를 읽고 피드백을 반영하도록 지시
    50	
    51	### Phase 1: 준비
    52	1. 사용자 입력 분석 — {무엇을 파악하는지}
    53	2. 작업 디렉토리에 `_workspace/` 생성
    54	   - **초기 실행**: 새 `_workspace/` 생성
    55	   - **새 실행**: 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동한 직후 새 `_workspace/` 재생성
    56	3. 입력 데이터를 `_workspace/00_input/`에 저장
    57	
    58	### Phase 2: 팀 구성
    59	
    60	1. 팀 생성:
   272	## 템플릿 D: Codex 런타임 어댑터
   273	
   274	Codex엔 `TeamCreate`/`SendMessage`는 없지만 **네이티브 subagents**(내장 `default`/`worker`/`explorer` + 커스텀 `.codex/agents/*.toml`)가 있다. 정본 스킬(`.agents/skills/`, SKILL.md 동일 포맷)은 공유하고, **조율 도구만** 매핑한다. (검증: 공식 Codex docs + 0.137.0)
   275	
   276	```markdown
   277	## 실행 모드: Codex 어댑터 (런타임 감지 후 분기)
   278	
   279	> 팀 도구(TeamCreate 등) 가용 시 템플릿 A. 부재 시(=Codex) 아래.
   280	
   281	### 매핑 규칙
   282	| 팀 모드(A) | Codex 어댑터(D) |
   283	|-----------|----------------|
   284	| TeamCreate(members) | Codex subagents 병렬 spawn(`.codex/agents/*.toml` 또는 내장 worker/explorer), `/agent`로 전환 |
   285	| TaskCreate/depends_on | 단계 순서 실행(의존 = 선행 단계 산출물 파일 존재 확인) |
   286	| SendMessage(팀원 통신) | `_workspace/` 파일로 전달 — 다음 단계가 Read |
   287	| 완전 독립 병렬(CI 등) | `codex exec` subprocess 백그라운드 |
   288	
   289	### Phase 2: 실행
   290	subagents 병렬 또는 순차. 각 산출물 `_workspace/{phase}_{agent}_{artifact}.md` 저장 → 다음 단계가 Read로 입력(메시지 대신 파일).
   291	
   292	### codex exec subprocess (독립 병렬·CI)
   293	```bash
   294	mkdir -p _workspace
   295	# stdin 폐쇄 필수(< /dev/null) — 안 하면 codex exec 무한 대기
   296	codex exec --sandbox read-only --json -o _workspace/{phase}_{agent}.md \
   297	  "$(cat _workspace/{agent}_prompt.md)" < /dev/null &
   298	wait   # 여러 개 띄운 뒤
   299	```
   300	- 베스트 프랙티스(검증): 기본 `read-only` / 쓰기만 `--sandbox workspace-write` / 스크립트 소비 `--json` / 최종 메시지만 `-o`(`--output-last-message`) / 격리 `--ignore-user-config`.
   301	- 외부 리뷰 게이트(external-review-loop)는 양쪽 동일 — 이미 subprocess.
   302	
   303	### 에러 핸들링
   304	- 실패 작업 1회 재시도 → 누락 명시 후 진행. 산출물 충돌: 출처 병기, 삭제 금지(A와 동일).
   314	## 작성 원칙
   315	
   316	1. **실행 모드를 먼저 명시** — 오케스트레이터 상단에 "에이전트 팀" / "서브 에이전트" / "하이브리드" / "Codex 어댑터" 중 하나 명시. 듀얼 런타임이면 "런타임 감지 후 A 또는 D" 명시. 하이브리드면 Phase별 모드 표 필수
   317	2. **팀 모드는 TeamCreate/SendMessage/TaskCreate 사용법을 구체적으로** — 팀 구성, 작업 등록, 통신 규칙
   318	3. **서브 모드는 Agent 도구 파라미터를 완전히 명시** — name, subagent_type, prompt, run_in_background, model
   319	4. **파일 경로는 절대적으로** — 상대 경로 금지, `_workspace/` 기준 명확한 경로
   320	5. **Phase 간 의존성 명시** — 어떤 Phase가 어떤 Phase의 결과에 의존하는지. 하이브리드는 모드 전환 지점을 특히 강조
   321	6. **에러 핸들링은 현실적으로** — "모든 것이 성공한다"고 가정하지 않음
   322	7. **테스트 시나리오 필수** — 정상 1 + 에러 1 이상
   323	
   324	## description 작성 시 후속 작업 키워드
   325	
   326	오케스트레이터 description은 초기 실행 키워드만으로는 부족하다. 다음 후속 작업 표현을 반드시 포함하라:
   327	
   328	- 재실행/다시 실행/업데이트/수정/보완
   329	- "{도메인}의 {부분}만 다시"
   330	- "이전 결과 기반으로", "결과 개선"

 succeeded in 0ms:
     1	# 외부 리뷰 루프 (External Review Loop) — 방법론 & 생성 템플릿
     2	
     3	이 파일은 두 역할을 한다:
     4	1. **방법론 정본** — 단계 산출물 마감 게이트(외부 독립 AI 리뷰)의 표준 절차.
     5	2. **생성 템플릿** — 코드/설계 도메인 하네스를 만들 때, 이 내용을 타겟 프로젝트의 `.claude/skills/external-review-loop/SKILL.md`로 생성한다(아래 frontmatter 포함). **단, 생성 전 `check-review-tools.sh`로 codex/gemini 연동을 확인**하고, 둘 다 미설치면 스킬을 만들지 않는다(Phase 4-6). 생성 시 `check-review-tools.sh`를 스킬의 `scripts/`로 함께 번들한다.
     6	
     7	**왜 외부 리뷰인가**: 내부 생성-검증/QA는 같은 세션·같은 컨텍스트라 *동일한 맹점*을 공유한다. 외부 독립 AI(codex/gemini)는 다른 관점으로 결함을 잡는다. 단, **합의=정답이 아니다** — 두 AI가 같은 답을 내도 공유 학습데이터로 인한 상관 오류일 수 있다. 합의는 약한 증거이며, **판정 권위는 오케스트레이터(실코드/실문서 대조)에 있다. 위임 금지.**
     8	
     9	## 생성 시 frontmatter
    10	```yaml
    11	---
    12	name: external-review-loop
    13	description: 작업 단계 산출물(설계서·코드·문서)마다 외부 독립 AI(codex/gemini)에 리뷰 요청 → 오케스트레이터가 실코드 대조 전건 판정(확인/부분/이월/기각) → 확인분만 TDD 수정·커밋하는 단계 마감 게이트. "외부 리뷰", "codex/gemini 리뷰", "리뷰 게이트", "설계서/코드 리뷰해서 검증·수정", "이슈 검증하고 수정" 요청 시 반드시 사용. 사용자 수동 이슈 제출에도 Step4~7 적용. 내부 QA와 별개의 독립 관점 게이트.
    14	---
    15	```
    16	
    17	## 입력 (플레이스홀더)
    18	- `{산출물}`: 리뷰 대상 — 설계서/코드 디렉토리/문서
    19	- `{단계ID}`: 임의 단계 식별자 (예: `design-auth`, `feat-login`)
    20	- `{커밋id}`: 해당 시 `git rev-parse HEAD`, 아니면 생략
    21	- `{게이트명령}`: 프로젝트 테스트/린트 게이트 (예: `npm test && tsc --noEmit` / 없으면 생략)
    22	
    23	## Step 1 — 리뷰 요청 프롬프트
    24	2종 분담: **codex = 일반/정합성**, **gemini = 성능·안정성**. 산출물 유형에 맞게 "소스코드"→"설계서/문서" 치환.
    25	```text
    26	리뷰 대상 : {산출물}
    27	관련 commit id : {커밋id}   # 없으면 생략
    28	위 산출물과 관련 자료를 리뷰·검토하여 발생 가능한 이슈를 모두 찾아 보고해줘.
    29	<이슈 작성 방법>
    30	1. [{이슈레벨}] {타이틀}
    31	- 현황: {상황}  - 이슈: {상세}  - 권고: {대응방안}
    32	</이슈 작성 방법>
    33	```
    34	gemini는 동일 틀 + "성능/속도·안정성 중심으로" 추가.
    35	
    36	## Step 2 — 병렬 비대화 실행
    37	먼저 `bash scripts/check-review-tools.sh`로 사용가능 도구 재확인(끝줄 `AVAILABLE:`). 사용가능 도구만 실행한다. 루트에서 백그라운드 병렬·읽기전용. 프롬프트·출력 모두 `_workspace/reviews/`에 보존(감사 — /tmp 금지).
    38	```bash
    39	mkdir -p _workspace/reviews
    40	# 주의: codex exec는 stdin 열려 있으면 무한 대기 → 반드시 < /dev/null
    41	codex exec --sandbox read-only "$(cat _workspace/reviews/{단계ID}_prompt_general.md)" < /dev/null \
    42	  > _workspace/reviews/{단계ID}_codex.md 2>&1 &
    43	gemini -p "$(cat _workspace/reviews/{단계ID}_prompt_perf.md)" < /dev/null \
    44	  > _workspace/reviews/{단계ID}_gemini.md 2>&1 &
    45	```
    46	- Bash `run_in_background` + timeout 600s.
    47	- 실패/타임아웃 → 1회 재시도 → 재실패 시 해당 도구 누락 명시 후 단일 출처로 진행(**루프 차단 금지**).
    48	- **도구 부재 폴백:** codex/gemini 미설치면 그 사실을 결과서에 명시하고 내부 QA만으로 진행.
    49	
    50	## Step 3 — 이슈 통합
    51	두 출력에서 이슈 추출 → 중복 병합(동일 대상·동일 결함=1건, 출처 병기) → 번호 재부여. 0건이면 "외부 리뷰 — 이슈 0건" 기록 후 종료.
    52	
    53	## Step 4 — 전건 판정 (오케스트레이터 직접, 위임 금지)
    54	이슈마다 실코드/실문서 대조(grep/Read) 후 판정.
    55	
    56	| 판정 | 기준 | 처리 |
    57	|------|------|------|
    58	| **확인** | 결함 재현/실재 | Step 5 수정 |
    59	| **부분 확인** | 지적 실재하나 권고 과잉/계약 위배 | 비파괴 범위만 + 잔여 기각 근거 |
    60	| **이월** | 타당하나 본 단계 범위 외 | 백로그 위치 명기 — 기각과 구분 |
    61	| **기각** | 사유표 | 근거 명시(코드/정본 인용) — 삭제 금지 |
    62	
    63	**기각 사유표:** 동결 계약 위배 · 설계 정본 명시 결정 · 기구현 오판(호출 형태만 보고 오판) · YAGNI/과설계 · 리뷰어 자인 비병목 · 기존 설계와 상충(멱등·격리 등).
    64	
    65	## Step 5 — 확인분 TDD 수정
    66	`tdd-doctrine.md` 규율(Red→Green→Refactor, 구조/행위 분리). 다중 에이전트 병렬 시 파일권 명시 분리(병렬 충돌 = 1차 실패 주원인). 에이전트는 커밋·브랜치 금지, status는 `_workspace/status/`.
    67	
    68	## Step 6 — 통합 게이트
    69	`{게이트명령}` 실행 → PASS. 게이트 없으면(설계서) 정본 정합성 재확인으로 대체. 테스트 리소스 간섭 게이트는 동시 실행 금지.
    70	
    71	## Step 7 — 기록·커밋 (커밋 순서·자율 노브)
    72	1. 결과서에 `## 외부 리뷰 반영 ({일자} — {단계ID} {k}건)` § — 판정표·게이트 수치·출처(codex/gemini).
    73	2. 순서: 게이트 PASS → **승인 관문** → 단일 커밋(`fix: 외부 리뷰 {k}건 — {요지}`, Co-Authored-By).
    74	   - 승인 관문 기본: 사용자 대기. `_workspace/.autonomous` 마커(또는 "자율로" 발화) 시 자동 통과.
    75	   - **push는 자율이어도 기본 대기** — `_workspace/.autonomous-push` 마커 시만 자동.
    76	   - 권한모드(bypassPermissions)는 스킬이 못 읽으므로 마커/발화로 명시. 마커 ON이어도 리뷰·판정·게이트는 그대로(인간 승인 한 스텝만 생략).
    77	
    78	## 재진입
    79	동일 단계 2차 리뷰(재제출 포함): 기수정 항목은 재작업 금지 — 수정 커밋 코드 인용 + 게이트 재실행으로 "기수정 확인" 응답.
    80	

hook: PostToolUse
hook: PostToolUse
exec
/bin/zsh -lc "nl -ba skills/myharness/references/dev-rules.md | sed -n '24,30p'; nl -ba skills/myharness/references/tdd-doctrine.md | sed -n '24,30p'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
    24	- "검증 추가"→"잘못된 입력 테스트 작성 후 통과". "버그 수정"→"재현 테스트 후 통과". "리팩토링"→"전후 테스트 통과 보장".
    25	- 다단계는 간단 계획: `[단계] → 검증: [확인]`.
    26	
    27	## 주입 방법 (F1 — 실경로)
    28	팩토리는 이 파일을 타겟 하네스의 `.claude/skills/{harness-name}/references/dev-rules.md`로 **복사**한 뒤, 에이전트 정의 `## 작업 원칙`에 **타겟 실경로** 한 줄을 넣는다: `> 개발 규칙: \`.claude/skills/{harness-name}/references/dev-rules.md\` 준수.` 서브에이전트는 `[[ ]]`·플러그인 내부 경로를 해소 못 하므로 타겟상대 실경로 필수. 본문 복붙 금지(DRY). 비코드 에이전트(문서·리서치)는 dev-rules만 선택 적용(TDD 제외).
    24	테스트 가능한 동작이 있는 **코드**에만. 설계서·인프라·탐색/리서치·UI 감각엔 TDD 강제 X — 그땐 `dev-rules.md`의 목표 주도(성공 기준 정의)로 대체.
    25	
    26	## 주입 방법 (F1 — 실경로)
    27	팩토리는 이 파일을 타겟 하네스의 `.claude/skills/{harness-name}/references/tdd-doctrine.md`로 **복사**한 뒤, 코드 에이전트 정의 `## 작업 원칙`에 **타겟 실경로** 한 줄을 넣는다: `> TDD 규율: \`.claude/skills/{harness-name}/references/tdd-doctrine.md\` 준수.` 서브에이전트는 `[[ ]]`·플러그인 내부 경로를 해소 못 하므로 타겟상대 실경로 필수. 본문 복붙 금지(DRY).

hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
codex
검토 범위: `skills/myharness/` at `2713094`.

1. [high] Phase 0 감사가 Claude 런타임만 검사
- 현황: `SKILL.md:24,36`은 `.claude/agents/`, `.claude/skills/`, `CLAUDE.md`만 읽고 drift를 감지한다.
- 이슈: 듀얼 런타임 정본은 `AGENTS.md`, `.agents/skills/`, `.codex/agents/*.toml`까지 포함한다고 `runtime-adapters.md:48-52`가 말한다. Codex 쪽 drift가 누락된다.
- 권고: Phase 0 감사 대상에 `AGENTS.md`, `.agents/skills/`, `.codex/agents/`, 선택적 `.codex/config.toml`을 추가하고 drift 기준을 양쪽으로 확장.

2. [high] 에이전트/스킬 생성 Phase가 Claude 경로로만 명세됨
- 현황: `SKILL.md:88,99,119`은 생성 위치를 `프로젝트/.claude/...`로만 지정한다.
- 이슈: `runtime-adapters.md:38,52`는 스킬은 `.claude/skills/`와 `.agents/skills/`, 에이전트는 `.claude/agents/*.md`와 `.codex/agents/*.toml` 양쪽 출력이 필요하다고 한다.
- 권고: Phase 3/4 본문에 런타임별 산출물 표를 넣고, Claude 전용 문장을 “Claude 출력”으로 한정.

3. [high] 체크리스트가 Codex 에이전트 산출물을 빠뜨림
- 현황: `SKILL.md:470`은 `.claude/agents/`와 `.claude/skills/`만 체크하고, `SKILL.md:486`은 `AGENTS.md`와 `.agents/skills/`만 언급한다.
- 이슈: `.codex/agents/{n}.toml` 생성 검증이 빠져 듀얼 런타임 완료 판정이 거짓 양성이 될 수 있다.
- 권고: 체크리스트에 `.codex/agents/*.toml` 생성, `.claude`↔`.codex` 역할 동등성, `.agents/skills/` references/scripts 동봉 검증을 추가.

4. [high] dev-rules/TDD 교리 주입 경로가 Codex와 충돌
- 현황: `SKILL.md:112-113`, `dev-rules.md:28`, `tdd-doctrine.md:27`은 `.claude/skills/{harness-name}/references/...`만 복사·참조한다.
- 이슈: `runtime-adapters.md:39`는 교리 실경로를 런타임별 스킬 경로로 맞추라고 한다. Codex 에이전트는 `.agents/skills/...` 경로가 필요하다.
- 권고: Claude용 `.claude/...`, Codex용 `.agents/...` 주입 문구를 별도 생성하도록 명시.

5. [high] external-review-loop 생성이 Claude 전용
- 현황: `SKILL.md:195`, `external-review-loop.md:5`는 타겟 `.claude/skills/external-review-loop/SKILL.md`만 생성한다고 한다.
- 이슈: Codex에서는 `.agents/skills/external-review-loop/SKILL.md`가 없으면 스킬 기반 게이트가 자동/명시 호출되지 않는다.
- 권고: 외부 리뷰 스킬도 듀얼 출력 대상으로 지정하고, 생성 스크립트 복사 경로도 양쪽에 명시.

6. [high] 외부 리뷰 “읽기전용” 보장이 gemini에 없음
- 현황: `external-review-loop.md:37`은 병렬 실행을 읽기전용이라고 설명하지만, 실제 명령은 `codex exec --sandbox read-only`만 있고 `gemini -p ...`에는 격리 옵션이 없다(`external-review-loop.md:41-44`).
- 이슈: 정책상 읽기전용 게이트인데 한 리뷰어는 파일 수정 가능성이 남는다.
- 권고: gemini는 읽기전용 worktree copy/container에서 실행하거나, 명령을 “읽기전용 보장 불가, 프롬프트 제약”으로 낮춰 쓰고 보호 절차를 추가.

7. [med] 후속 작업 컨텍스트 Phase 번호가 불일치
- 현황: `SKILL.md:309,481`은 “오케스트레이터 Phase 1에 컨텍스트 확인 단계”를 요구한다. 템플릿은 `Phase 0: 컨텍스트 확인`이다(`orchestrator-template.md:40-49`).
- 이슈: 생성자가 Phase 0/1 중 어디에 넣을지 혼동한다.
- 권고: 전부 “Phase 0”으로 통일하거나, Phase 1 안에 넣는 정책으로 템플릿을 바꾼다.

8. [med] `_workspace` 보관 경로 정책 불일치
- 현황: `SKILL.md:312`는 기존 `_workspace`를 `_workspace_prev/`로 이동한다고 한다. 템플릿은 `_workspace_{YYYYMMDD_HHMMSS}/`를 사용한다(`orchestrator-template.md:48,55`).
- 이슈: `_workspace_prev/`는 반복 실행 시 덮어쓰기 위험이 있고, 템플릿과 다르다.
- 권고: 타임스탬프 보관 경로 하나로 통일.

9. [med] 기존 확장 매트릭스가 변경 이력/듀얼 동기화 Phase를 누락
- 현황: `SKILL.md:31-35`의 기존 확장 매트릭스는 Phase 1~6만 다룬다.
- 이슈: 변경 이력은 Phase 7-3, 운영 동기화는 Phase 7-5에 있는데 확장 흐름에서 항상 실행된다는 보장이 없다.
- 권고: 매트릭스에 “Phase 7-3 변경 이력 + 듀얼 drift 최종 확인” 열을 추가하거나 Phase 6 완료 조건에 포함.

10. [med] 승인 사다리 절차가 이름만 있음
- 현황: 중대 등급 게이트는 “승인 사다리(PRD→계획서→실행)”를 요구한다(`SKILL.md:330`).
- 이슈: PRD 작성 기준, 승인 주체, 산출물 위치, 실패/반려 흐름이 정의되지 않았다.
- 권고: 중대 등급 전용 절차를 external-review-loop 또는 별도 reference에 정의.

11. [med] 빌트인 에이전트 파일 필요 여부가 서로 충돌
- 현황: `agent-design-patterns.md:206`은 단순 조사/수집은 `general-purpose` + 상세 프롬프트로 “에이전트 파일 불필요”라고 한다. 같은 문서 `:211`과 `SKILL.md:88,93`은 빌트인도 반드시 파일을 만들라고 한다.
- 이슈: 생성자가 파일 없이 프롬프트 호출해도 되는지 판단이 갈린다.
- 권고: “파일 불필요” 문구를 제거하거나 “일회성 테스트에서만 예외”처럼 범위를 제한.

12. [med] `model: "opus"` 전역 강제가 Codex 어댑터와 맞지 않음
- 현황: `SKILL.md:95,473`, `agent-design-patterns.md:213`은 모든 Agent 호출에 `opus`를 강제한다.
- 이슈: Codex adapter는 `.codex/agents/*.toml`, 내장 `worker/explorer`, `codex exec`를 쓰며 `opus` 모델 파라미터와 동일하지 않다.
- 권고: 모델 정책을 런타임별 추상값으로 분리. 예: Claude 기본 `opus`, Codex 기본 “현재 Codex 모델/설정값”.

13. [med] 외부 리뷰 도구 점검 스크립트의 실패 종료코드가 정책 실행을 깨뜨릴 수 있음
- 현황: `check-review-tools.sh:19-21`은 도구가 없으면 `AVAILABLE: none` 출력 후 exit 1.
- 이슈: 문서는 “끝줄 AVAILABLE을 읽고 none이면 생략” 흐름인데, `set -e` 환경이나 자동화 스크립트에서는 출력 파싱 전에 중단될 수 있다.
- 권고: 항상 exit 0으로 두고 `AVAILABLE: none`으로만 상태를 전달하거나, 호출 예시를 `... || true`로 고정.

14. [low] 예시 링크가 실제 파일처럼 보이는 dead link
- 현황: `skill-writing-guide.md:160,164` 예시 코드블록에 `[DOCX-JS.md](references/docx-js.md)`, `[REDLINING.md](references/redlining.md)`가 있다.
- 이슈: 예시 내부지만 링크 체커나 생성자가 실제 `skills/myharness/references/` 포인터로 오해할 수 있다. 해당 파일은 없다.
- 권고: 예시임을 명시하거나 `<skill>/references/docx-js.md` 같은 가상 경로로 바꾼다.

15. [low] “절대 경로” 작성 원칙과 `_workspace/` 상대 경로가 충돌
- 현황: `orchestrator-template.md:319`은 “상대 경로 금지”라면서 동시에 `_workspace/` 기준 경로를 요구한다.
- 이슈: 전체 문서는 `_workspace/...`, `.claude/...`, `.agents/...` 상대 경로를 표준으로 사용한다.
- 권고: “절대 경로”를 “프로젝트 루트 기준 상대 경로” 또는 “기준 디렉토리가 명확한 경로”로 수정.

필수 reference 파일 자체(`references/*.md`, `scripts/check-review-tools.sh`)의 실제 파일 누락은 발견하지 못했다. 주요 문제는 링크 부재보다 Claude 전용 본문과 듀얼 런타임 어댑터 사이의 정책 drift다.
hook: Stop
hook: Stop Completed
tokens used
103,507
검토 범위: `skills/myharness/` at `2713094`.

1. [high] Phase 0 감사가 Claude 런타임만 검사
- 현황: `SKILL.md:24,36`은 `.claude/agents/`, `.claude/skills/`, `CLAUDE.md`만 읽고 drift를 감지한다.
- 이슈: 듀얼 런타임 정본은 `AGENTS.md`, `.agents/skills/`, `.codex/agents/*.toml`까지 포함한다고 `runtime-adapters.md:48-52`가 말한다. Codex 쪽 drift가 누락된다.
- 권고: Phase 0 감사 대상에 `AGENTS.md`, `.agents/skills/`, `.codex/agents/`, 선택적 `.codex/config.toml`을 추가하고 drift 기준을 양쪽으로 확장.

2. [high] 에이전트/스킬 생성 Phase가 Claude 경로로만 명세됨
- 현황: `SKILL.md:88,99,119`은 생성 위치를 `프로젝트/.claude/...`로만 지정한다.
- 이슈: `runtime-adapters.md:38,52`는 스킬은 `.claude/skills/`와 `.agents/skills/`, 에이전트는 `.claude/agents/*.md`와 `.codex/agents/*.toml` 양쪽 출력이 필요하다고 한다.
- 권고: Phase 3/4 본문에 런타임별 산출물 표를 넣고, Claude 전용 문장을 “Claude 출력”으로 한정.

3. [high] 체크리스트가 Codex 에이전트 산출물을 빠뜨림
- 현황: `SKILL.md:470`은 `.claude/agents/`와 `.claude/skills/`만 체크하고, `SKILL.md:486`은 `AGENTS.md`와 `.agents/skills/`만 언급한다.
- 이슈: `.codex/agents/{n}.toml` 생성 검증이 빠져 듀얼 런타임 완료 판정이 거짓 양성이 될 수 있다.
- 권고: 체크리스트에 `.codex/agents/*.toml` 생성, `.claude`↔`.codex` 역할 동등성, `.agents/skills/` references/scripts 동봉 검증을 추가.

4. [high] dev-rules/TDD 교리 주입 경로가 Codex와 충돌
- 현황: `SKILL.md:112-113`, `dev-rules.md:28`, `tdd-doctrine.md:27`은 `.claude/skills/{harness-name}/references/...`만 복사·참조한다.
- 이슈: `runtime-adapters.md:39`는 교리 실경로를 런타임별 스킬 경로로 맞추라고 한다. Codex 에이전트는 `.agents/skills/...` 경로가 필요하다.
- 권고: Claude용 `.claude/...`, Codex용 `.agents/...` 주입 문구를 별도 생성하도록 명시.

5. [high] external-review-loop 생성이 Claude 전용
- 현황: `SKILL.md:195`, `external-review-loop.md:5`는 타겟 `.claude/skills/external-review-loop/SKILL.md`만 생성한다고 한다.
- 이슈: Codex에서는 `.agents/skills/external-review-loop/SKILL.md`가 없으면 스킬 기반 게이트가 자동/명시 호출되지 않는다.
- 권고: 외부 리뷰 스킬도 듀얼 출력 대상으로 지정하고, 생성 스크립트 복사 경로도 양쪽에 명시.

6. [high] 외부 리뷰 “읽기전용” 보장이 gemini에 없음
- 현황: `external-review-loop.md:37`은 병렬 실행을 읽기전용이라고 설명하지만, 실제 명령은 `codex exec --sandbox read-only`만 있고 `gemini -p ...`에는 격리 옵션이 없다(`external-review-loop.md:41-44`).
- 이슈: 정책상 읽기전용 게이트인데 한 리뷰어는 파일 수정 가능성이 남는다.
- 권고: gemini는 읽기전용 worktree copy/container에서 실행하거나, 명령을 “읽기전용 보장 불가, 프롬프트 제약”으로 낮춰 쓰고 보호 절차를 추가.

7. [med] 후속 작업 컨텍스트 Phase 번호가 불일치
- 현황: `SKILL.md:309,481`은 “오케스트레이터 Phase 1에 컨텍스트 확인 단계”를 요구한다. 템플릿은 `Phase 0: 컨텍스트 확인`이다(`orchestrator-template.md:40-49`).
- 이슈: 생성자가 Phase 0/1 중 어디에 넣을지 혼동한다.
- 권고: 전부 “Phase 0”으로 통일하거나, Phase 1 안에 넣는 정책으로 템플릿을 바꾼다.

8. [med] `_workspace` 보관 경로 정책 불일치
- 현황: `SKILL.md:312`는 기존 `_workspace`를 `_workspace_prev/`로 이동한다고 한다. 템플릿은 `_workspace_{YYYYMMDD_HHMMSS}/`를 사용한다(`orchestrator-template.md:48,55`).
- 이슈: `_workspace_prev/`는 반복 실행 시 덮어쓰기 위험이 있고, 템플릿과 다르다.
- 권고: 타임스탬프 보관 경로 하나로 통일.

9. [med] 기존 확장 매트릭스가 변경 이력/듀얼 동기화 Phase를 누락
- 현황: `SKILL.md:31-35`의 기존 확장 매트릭스는 Phase 1~6만 다룬다.
- 이슈: 변경 이력은 Phase 7-3, 운영 동기화는 Phase 7-5에 있는데 확장 흐름에서 항상 실행된다는 보장이 없다.
- 권고: 매트릭스에 “Phase 7-3 변경 이력 + 듀얼 drift 최종 확인” 열을 추가하거나 Phase 6 완료 조건에 포함.

10. [med] 승인 사다리 절차가 이름만 있음
- 현황: 중대 등급 게이트는 “승인 사다리(PRD→계획서→실행)”를 요구한다(`SKILL.md:330`).
- 이슈: PRD 작성 기준, 승인 주체, 산출물 위치, 실패/반려 흐름이 정의되지 않았다.
- 권고: 중대 등급 전용 절차를 external-review-loop 또는 별도 reference에 정의.

11. [med] 빌트인 에이전트 파일 필요 여부가 서로 충돌
- 현황: `agent-design-patterns.md:206`은 단순 조사/수집은 `general-purpose` + 상세 프롬프트로 “에이전트 파일 불필요”라고 한다. 같은 문서 `:211`과 `SKILL.md:88,93`은 빌트인도 반드시 파일을 만들라고 한다.
- 이슈: 생성자가 파일 없이 프롬프트 호출해도 되는지 판단이 갈린다.
- 권고: “파일 불필요” 문구를 제거하거나 “일회성 테스트에서만 예외”처럼 범위를 제한.

12. [med] `model: "opus"` 전역 강제가 Codex 어댑터와 맞지 않음
- 현황: `SKILL.md:95,473`, `agent-design-patterns.md:213`은 모든 Agent 호출에 `opus`를 강제한다.
- 이슈: Codex adapter는 `.codex/agents/*.toml`, 내장 `worker/explorer`, `codex exec`를 쓰며 `opus` 모델 파라미터와 동일하지 않다.
- 권고: 모델 정책을 런타임별 추상값으로 분리. 예: Claude 기본 `opus`, Codex 기본 “현재 Codex 모델/설정값”.

13. [med] 외부 리뷰 도구 점검 스크립트의 실패 종료코드가 정책 실행을 깨뜨릴 수 있음
- 현황: `check-review-tools.sh:19-21`은 도구가 없으면 `AVAILABLE: none` 출력 후 exit 1.
- 이슈: 문서는 “끝줄 AVAILABLE을 읽고 none이면 생략” 흐름인데, `set -e` 환경이나 자동화 스크립트에서는 출력 파싱 전에 중단될 수 있다.
- 권고: 항상 exit 0으로 두고 `AVAILABLE: none`으로만 상태를 전달하거나, 호출 예시를 `... || true`로 고정.

14. [low] 예시 링크가 실제 파일처럼 보이는 dead link
- 현황: `skill-writing-guide.md:160,164` 예시 코드블록에 `[DOCX-JS.md](references/docx-js.md)`, `[REDLINING.md](references/redlining.md)`가 있다.
- 이슈: 예시 내부지만 링크 체커나 생성자가 실제 `skills/myharness/references/` 포인터로 오해할 수 있다. 해당 파일은 없다.
- 권고: 예시임을 명시하거나 `<skill>/references/docx-js.md` 같은 가상 경로로 바꾼다.

15. [low] “절대 경로” 작성 원칙과 `_workspace/` 상대 경로가 충돌
- 현황: `orchestrator-template.md:319`은 “상대 경로 금지”라면서 동시에 `_workspace/` 기준 경로를 요구한다.
- 이슈: 전체 문서는 `_workspace/...`, `.claude/...`, `.agents/...` 상대 경로를 표준으로 사용한다.
- 권고: “절대 경로”를 “프로젝트 루트 기준 상대 경로” 또는 “기준 디렉토리가 명확한 경로”로 수정.

필수 reference 파일 자체(`references/*.md`, `scripts/check-review-tools.sh`)의 실제 파일 누락은 발견하지 못했다. 주요 문제는 링크 부재보다 Claude 전용 본문과 듀얼 런타임 어댑터 사이의 정책 drift다.
