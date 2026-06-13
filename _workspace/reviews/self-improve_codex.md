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
session id: 019ebeca-7ac8-70f3-8529-63a8b4a55225
--------
user
리뷰 대상(설계 정본): skills/myharness/references/self-improvement-loop.md — 하네스 팩토리가 생성한 스킬/에이전트를 벤치마크로 측정→제안→holdout 검증→승인→채택하는 자기개선 루프 설계.
관련: skill-testing-guide.md, loop-self-eval.md, external-review-loop.md, SKILL.md(Phase 6/7).
타당성·정합성·실현성을 리뷰해 이슈를 모두 보고하라:
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
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
`myharness` 스킬과 context-mode 라우팅을 적용한다. 먼저 관련 문서 구조와 필요한 참조만 색인해서 설계 간 충돌 지점을 보겠다.
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
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

**모델 설정(라우팅 — 비용 통제):** 설계·판정·구현 등 **고추론** 작업만 `model: "opus"`(Claude). 단순 작업(grep·구조 검증·트리거 eval·파일 감사)은 **경량 모델**로 라우팅해 비용 절감. 대규모 팀 실행 전 예상 토큰/비용을 보고·승인받는다. Codex 런타임은 `.codex/agents/*.toml`·내장 `worker`/`explorer`의 현재 모델/설정값을 사용.

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
| **references/** | 필요할 때만(조건부) | 파일당 권장 300줄, 초과 시 ToC+섹션 라우팅 필수 (스크립트는 로딩 없이 실행) |

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

흐름: `TeamCreate(members)` → `TaskCreate(의존성)` → 팀원 자체 조율(`SendMessage`) → 결과 수집·종합 → 팀 정리. (상세: `references/orchestrator-template.md` 템플릿 A)

**서브 에이전트 패턴 (대안):**
오케스트레이터가 `Agent` 도구로 서브 에이전트를 직접 호출한다(`run_in_background: true` 병렬, 결과는 메인 반환). 팀 통신이 불필요할 때. (템플릿 B)

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

> 에러 유형별 전략표와 구현 상세는 `references/orchestrator-template.md`의 "에러 핸들링" 참조.

#### 5-3. 팀 크기 가이드라인

| 작업 규모 | 권장 팀원 수 | 팀원당 작업 수 |
|----------|------------|--------------|
| 소규모 (5~10개 작업) | 2~3명 | 3~5개 |
| 중규모 (10~20개 작업) | 3~5명 | 4~6개 |
| 대규모 (20개+ 작업) | 5~7명 | 4~5개 |

> 팀원이 많을수록 조율 오버헤드가 커진다. 3명의 집중된 팀원이 5명의 산만한 팀원보다 낫다.
> **동시성 cap(백프레셔):** 동시 실행 기본 3·최대 5, 외부 리뷰는 별도 2. 초과는 큐잉. 대규모 fan-out의 리소스·API quota·토큰 폭증 방지 (`references/orchestrator-template.md` 동시성 정책).

#### 5-4. CLAUDE.md 하네스 포인터 등록


hook: PostToolUse
exec
/bin/zsh -lc "pwd && rg --files skills/myharness | rg '("'^|/)(SKILL.md|self-improvement-loop.md|skill-testing-guide.md|loop-self-eval.md|external-review-loop.md|runtime-adapters.md)$'"'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
/Users/junghojang/Developments/myProject/myHarness
skills/myharness/SKILL.md
skills/myharness/references/self-improvement-loop.md
skills/myharness/references/runtime-adapters.md
skills/myharness/references/external-review-loop.md
skills/myharness/references/loop-self-eval.md
skills/myharness/references/skill-testing-guide.md

hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
codex
관련 참조 문서를 context-mode에 색인한다. 원문 전체를 대화로 끌어오지 않고, Goodhart·holdout·baseline·assertion·Phase 6/7 관련 절만 검색한다.
mcp: context-mode/ctx_index started
mcp: context-mode/ctx_index (failed)
user cancelled MCP tool call
codex
context-mode 호출이 취소됐다. 짧은 정밀 추출만 shell로 수행해서 리뷰 근거를 확보하겠다.
mcp: context-mode/ctx_batch_execute started
mcp: context-mode/ctx_batch_execute (failed)
user cancelled MCP tool call
codex
MCP가 계속 취소되어 로컬 읽기 전용 명령으로 전환한다. 출력은 매칭 라인 중심으로 제한한다.
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
/bin/zsh -lc "awk '/"'^#|독립|external|review|codex|gemini|consensus|합의|gate|승인|echo|blind/{print NR ":" $0}'"' skills/myharness/references/external-review-loop.md" in /Users/junghojang/Developments/myProject/myHarness
exec
/bin/zsh -lc "awk '/"'^#|Goodhart|holdout|baseline|approval|rollback|Phase|self|eval|metric|gate|승인|채택|제안/{print NR ":" $0}'"' skills/myharness/references/loop-self-eval.md" in /Users/junghojang/Developments/myProject/myHarness
exec
/bin/zsh -lc "awk '/"'^#|assertion|holdout|baseline|runner|non-discriminating|golden|테스트|벤치|누수|LLM|eval/{print NR ":" $0}'"' skills/myharness/references/skill-testing-guide.md" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
1:# 루프 자체 평가 (Loop Self-Evaluation) — scorecard & 단계적 도입
5:## 핵심 경계 (먼저 읽을 것)
7:- **측정과 자동화를 분리한다.** 측정은 안전, 자동 흐름 변경은 고위험(Goodhart·플래핑). **단계적 도입**으로 측정부터.
9:## 단계적 도입 (한 번에 다 넣지 말 것)
14:| 3 (실험) | 수치 트리거가 **개선안 "제안"**만 emit | 제안 holdout 통과율 ≥ θ + 명시 승인 | 제안만 + 승인 게이트 |
15:| 4 (실험) | holdout 검증 후 자동 흐름 개선 | — | 최후, 승인 필수 |
17:> **수치(10/30/θ)는 "관찰 시작 최소치"이지 통계적 확정 임계가 아니다** — LLM 평가 노이즈상 비율 지표는 표본이 더 필요할 수 있다. 리스크/단계/리뷰어가 섞이면 신뢰구간을 함께 보고, θ는 리스크 등급별 기본값으로 둔다. 3·4단계는 롤링윈도우·3회 연속 하락 시에만, 단일 실행 노이즈로 흐름을 바꾸지 않는다(플래핑 방지). **2단계까지가 실용 권장 — 3·4(자동 환류)는 실험적**, 데이터 충분+holdout 후에만.
19:## 읽기 경로 (1단계에도 소비자 필수 — write-only 방지)
21:- `scripts/build-scorecard.sh`가 매 루프 종료 시 scorecard 발행 + `_workspace/evals/{loop}/summary.jsonl`에 최근 N회 집계(append).
22:- 오케스트레이터는 **Phase 0(현황 감사)·Phase 7(진화) 진입 시 `summary.jsonl` 1줄 요약만** 읽는다(원본 JSON 미로드 — Lean). 악화 추세가 보이면 사람에게 보고(2단계 수동 검토).
24:## loop_scorecard.json 스키마 (신규 — grading.json 재사용 아님)
25:실행 단위 디렉터리에 발행: `_workspace/evals/{loop}/{stage_id}/{run_id}/scorecard.json`.
33:  "termination_reason": "converged-good | exhausted | max-rounds | failed-quality-gate",
44:  "quality_label": "gate_pass | failed-quality-gate | converged | n/a",  // 설계단계 품질 자기단정 금지
54:- **Lean:** 원본 JSON을 세션에 상시 로드하지 않는다. 파일로만 보존, **Phase 시작 시 요약본만** 읽는다.
57:## 메트릭 정의 (교정본)
65:## 종료 사유 라벨 (P2 — 종료조건 아님, 라벨)
66:gate/assertion은 **코드/테스트 단계 전용**. 설계·문서 리뷰엔 측정값이 없으므로 종료조건에 넣지 않는다.
70:- `failed-quality-gate`: (코드 단계) 품질 θ 미달 명백 → **루프 중단**(MAX_ROUNDS 헛돌지 않게).
71:- **설계/문서 단계 품질은 라벨로 자기단정하지 않는다.** verdicts 완료 + 정본 대조 체크리스트는 종료 *조건*일 뿐, "양호" 단정(`design-ok` 같은)은 같은 오케스트레이터의 자기채점이 된다 → 금지. 품질 보증이 필요하면 독립 리뷰어 표본 감사·사용자 승인 같은 외부 신호를 별도로 받는다.
73:## 판정 보정 (P5 — Ground Truth만)
74:같은 오케스트레이터·같은 근거수집으로 재점검하면 편향 반복(에코체임버). 보정은 **독립 신호가 있을 때만** 발화: 사용자 반박 / 후속 결함 발견 / 독립 리뷰어 표본 감사. 결과는 `overturned_rejection_rate`로 기록하고, 임계 초과 시 기각 사유표·리뷰어 신뢰도를 *제안* 형태로 조정(자동 적용 금지).
76:## 환류(P3/P4) 안전장치 — 3·4단계에서만
77:- 자동 **"적용" 금지 → "제안"**만. 적용 전 사용자 또는 독립 검토 게이트.
80:- 변경 후 holdout 시나리오·기존 회귀 케이스로 검증.

 succeeded in 0ms:
1:# 외부 리뷰 루프 (External Review Loop) — 방법론 & 생성 템플릿
4:1. **방법론 정본** — 단계 산출물 마감 게이트(외부 독립 AI 리뷰)의 표준 절차.
5:2. **생성 템플릿** — 코드/설계 도메인 하네스를 만들 때, 이 내용을 타겟 프로젝트의 `.claude/skills/external-review-loop/SKILL.md`로 생성한다(아래 frontmatter 포함). **단, 생성 전 `check-review-tools.sh`로 codex/gemini 연동을 확인**하고, 둘 다 미설치면 스킬을 만들지 않는다(Phase 4-6). 생성 시 `check-review-tools.sh`를 스킬의 `scripts/`로 함께 번들한다.
7:**왜 외부 리뷰인가**: 내부 생성-검증/QA는 같은 세션·같은 컨텍스트라 *동일한 맹점*을 공유한다. 외부 독립 AI(codex/gemini)는 다른 관점으로 결함을 잡는다. 단, **합의=정답이 아니다** — 두 AI가 같은 답을 내도 공유 학습데이터로 인한 상관 오류일 수 있다. 합의는 약한 증거이며, **판정 권위는 오케스트레이터에 있다 — 근거 수집(실코드 대조)은 보조 에이전트에 위임 가능하나, 최종 확정(confirm)은 비위임.**
9:## 생성 시 frontmatter
12:name: external-review-loop
13:description: 작업 단계 산출물(설계서·코드·문서)마다 외부 독립 AI(codex/gemini)에 리뷰 요청 → 오케스트레이터가 실코드 대조 전건 판정(확인/부분/이월/기각) → 확인분만 TDD 수정·커밋하는 단계 마감 게이트. "외부 리뷰", "codex/gemini 리뷰", "리뷰 게이트", "설계서/코드 리뷰해서 검증·수정", "이슈 검증하고 수정" 요청 시 반드시 사용. 사용자 수동 이슈 제출에도 Step4~7 적용. 내부 QA와 별개의 독립 관점 게이트.
17:## 입력 (플레이스홀더)
23:## 루프 제어 (수렴·종료 — 무한 루프/미검증 방지)
37:- **K회 연속 신규 확인 0건**이면 수렴 종료. **MAX_ROUNDS 도달 시 강제 종료 + 미수렴 이슈 보고**(무한 루프 차단). **품질 θ 미달이 명백하면 `failed-quality-gate`로 즉시 중단**(MAX_ROUNDS 헛돌지 않게). 종료 사유는 `converged-good`/`exhausted`/`max-rounds`/`failed-quality-gate` 라벨로 기록. (gate/assertion은 코드 단계 전용 — 설계·문서는 `verdicts.json` 완료+정본 대조로 종료. 상세: `loop-self-eval.md`)
39:- **판정 원장(req)**: `_workspace/reviews/{단계ID}_verdicts.json` — 이슈지문(파일+결함요지 해시)→ 판정·라운드·근거. 매 라운드 **seen 대조로 신규만 판정**(기각 이슈 재부상 방지, dedup vs seen).
41:## Step 1 — 리뷰 요청 프롬프트
42:2종 분담: **codex = 일반/정합성**, **gemini = 성능·안정성**. 산출물 유형에 맞게 "소스코드"→"설계서/문서" 치환.
52:gemini는 동일 틀 + "성능/속도·안정성 중심으로" 추가.
54:## Step 2 — 병렬 비대화 실행
55:먼저 `bash scripts/check-review-tools.sh`로 사용가능 도구 재확인(끝줄 `AVAILABLE:`). 사용가능 도구만 실행한다. 루트에서 백그라운드 병렬·읽기전용. 프롬프트·출력 모두 `_workspace/reviews/`에 보존(감사 — /tmp 금지).
57:mkdir -p _workspace/reviews
59:# timeout은 GNU coreutils — macOS엔 없을 수 있다(gtimeout). 이식성 위해 탐지 후 적용.
61:# 주의: codex exec는 stdin 열려 있으면 무한 대기 → 반드시 < /dev/null
62:${TO:+$TO 600s} codex exec --sandbox read-only "$(cat _workspace/reviews/{단계ID}_prompt_general.md)" < /dev/null \
63:  > _workspace/reviews/{단계ID}_codex.md 2>&1 &
64:# gemini는 자체 sandbox 옵션이 없다(읽기전용 보장 불가). 프롬프트로만 "읽기 전용 리뷰"를 제약하고,
65:# 쓰기 위험이 우려되면 read-only 권한 셸/복제본에서 실행할 것.
66:${TO:+$TO 600s} gemini -p "$(cat _workspace/reviews/{단계ID}_prompt_perf.md)" < /dev/null \
67:  > _workspace/reviews/{단계ID}_gemini.md 2>&1 &
72:- gemini `-p` 플래그가 없는 버전이면 `cat prompt.md | gemini` 또는 `gemini "$(cat prompt.md)"`로 대체.
73:- **도구 부재 폴백:** codex/gemini 미설치면 그 사실을 결과서에 명시하고 내부 QA만으로 진행.
75:## Step 3 — 이슈 통합 + 원장 대조
78:## Step 4 — 전건 판정 (근거수집 위임 가능 · 최종 확정 비위임)
90:## Step 5 — 확인분 TDD 수정 (확인 0건이면 생략)
93:## Step 6 — 통합 게이트
96:## Step 7 — 기록·커밋 (커밋 순서·자율 노브)
97:1. 결과서에 `## 외부 리뷰 반영 ({일자} — {단계ID} {k}건)` § — 판정표·게이트 수치·출처(codex/gemini).
98:2. 순서: 게이트 PASS → **승인 관문** → 단일 커밋(`fix: 외부 리뷰 {k}건 — {요지}`, Co-Authored-By).
99:   - 승인 관문 기본: 사용자 대기. `_workspace/.autonomous` 마커(또는 "자율로" 발화) 시 자동 통과.
101:   - 권한모드(bypassPermissions)는 스킬이 못 읽으므로 마커/발화로 명시. 마커 ON이어도 리뷰·판정·게이트는 그대로(인간 승인 한 스텝만 생략).
103:## Step 8 — 자체 평가 (1단계: 측정 로깅만, 계산 도출)
104:루프 종료 시 **`bash scripts/build-scorecard.sh {단계ID}_verdicts.json _workspace/evals/external-review/{단계ID}/{run_id}/scorecard.json [timing.json]`** 실행 — verdict_counts·rounds·`alignment_score`(정밀도 아님)·`*_rate`·cost·**`regression_catch_rate`**(round>1 재리뷰가 잡은 회귀/누출 — 전체 recall 아님)를 **스크립트가 verdicts.json에서 기계 계산**(LLM 자기보고 아님). 라벨(`converged-good`/`converged`/`max-rounds`/...)만 오케스트레이터가 해석. **측정·기록만**, 자동 흐름 변경 없음.
105:- `verdicts.json` 각 이슈에 `round`·`source` 기록(round>1 재리뷰분은 `source:"re-review"`)해야 regression_catch_rate 계산됨.
108:## 재진입 (루프 라운드 = 재진입)
111:## 테스트 시나리오
112:- **정상(수렴)**: round1 — codex 8+gemini 3→중복 1 병합→10건 판정(확인6/부분2/이월1/기각1)→수정·게이트 PASS·기록. round2 — 수정 diff 재리뷰, 신규 확인 0 → dry_streak 1=K → 종료.
115:- **도구 에러**: gemini 타임아웃 ×2 → "gemini 미수집" 명시, codex 단독 진행 — 라운드 완료.

 succeeded in 0ms:
1:# 스킬 테스트 & 반복 개선 가이드
7:## 목차
9:1. [테스트 프레임워크 개요](#1-테스트-프레임워크-개요)
10:2. [테스트 프롬프트 작성법](#2-테스트-프롬프트-작성법)
11:3. [실행 테스트: With-skill vs Baseline](#3-실행-테스트-with-skill-vs-baseline)
12:4. [정량적 평가: Assertion 기반 채점](#4-정량적-평가-assertion-기반-채점)
20:## 1. 테스트 프레임워크 개요
27:| **정량적** | assertion 기반 자동 채점 | 파일 생성, 데이터 추출, 코드 생성 등 객관적 검증 가능 |
29:핵심 루프: **작성 → 테스트 실행 → 평가 → 개선 → 재테스트**
33:## 2. 테스트 프롬프트 작성법
35:### 원칙
37:테스트 프롬프트는 **실제 사용자가 입력할 법한 구체적이고 자연스러운 문장**이어야 한다. 추상적이거나 인공적인 프롬프트는 테스트 가치가 낮다.
39:### 나쁜 예
47:### 좋은 예
59:### 프롬프트 다양성
66:### 커버리지
75:## 3. 실행 테스트: With-skill vs Baseline
77:### 3-1. 비교 실행 구조
79:각 테스트 프롬프트에 대해 두 개의 서브에이전트를 **동시에** 스폰한다:
83:프롬프트: "{테스트 프롬프트}"
85:출력 경로: _workspace/iteration-N/eval-{id}/with_skill/outputs/
90:프롬프트: "{테스트 프롬프트}"  (동일)
92:출력 경로: _workspace/iteration-N/eval-{id}/without_skill/outputs/
95:### 3-2. Baseline 선택
102:### 3-3. 타이밍 데이터 캡처
116:## 4. 정량적 평가: Assertion 기반 채점
118:### 4-1. Assertion 작성
120:산출물이 객관적으로 검증 가능한 경우, 자동 채점을 위한 assertion을 정의한다.
122:**좋은 assertion:**
127:**나쁜 assertion:**
131:### 4-2. 프로그래밍 가능한 검증
133:assertion이 코드로 검증 가능하면 스크립트로 작성한다. 눈으로 확인하는 것보다 빠르고 신뢰성 있으며, iteration마다 재사용 가능.
135:### 4-3. Non-discriminating assertion 주의
137:"두 구성 모두에서 100% 통과"하는 assertion은 스킬의 차별적 가치를 측정하지 못한다. 이런 assertion을 발견하면 제거하거나, 더 도전적인 assertion으로 교체한다.
139:### 4-4. 채점 결과 스키마
166:## 5. 전문 에이전트 활용
168:테스트/평가 과정에서 전문 역할의 에이전트를 활용하면 품질이 향상된다.
170:### 5-1. Grader (채점자)
172:assertion 기반 채점을 수행하고, 산출물에서 검증 가능한 주장(claim)을 추출하여 교차 검증한다.
175:- assertion별 통과/실패 판정 + 근거 제시
177:- eval 자체의 품질에 대한 피드백 (assertion이 너무 쉽거나 모호한 경우 제안)
179:### 5-2. Comparator (블라인드 비교자)
190:### 5-3. Analyzer (분석자)
192:벤치마크 데이터에서 통계적 패턴을 분석한다:
193:- Non-discriminating assertion (두 구성 모두 통과 → 차별력 없음)
194:- 고분산 eval (결과가 실행마다 크게 달라짐 → 불안정)
199:## 6. 반복 개선 루프
201:### 6-1. 피드백 수집
205:### 6-2. 개선 원칙
207:1. **피드백을 일반화하라** — 테스트 예시에만 맞는 좁은 수정은 오버피팅이다. 원리 수준에서 수정한다.
210:4. **반복 작업은 번들링하라** — 모든 테스트 실행에서 동일한 헬퍼 스크립트가 생성되면, `scripts/`에 미리 포함한다.
212:### 6-3. 반복 절차
216:2. 새 iteration-N+1/ 디렉토리에 모든 테스트 케이스 재실행
227:### 6-4. 초안 → 재검토 패턴
233:## 7. Description 트리거 검증
235:### 7-1. 트리거 Eval 쿼리 작성
237:20개의 eval 쿼리를 작성한다 — should-trigger 10개 + should-NOT-trigger 10개.
253:- 명백히 무관한 쿼리("피보나치 함수 작성")는 테스트 가치 없음
256:### 7-2. 기존 스킬 충돌 검증
264:### 7-3. 자동 최적화 (선택적 고급 기능)
268:1. 20개 eval 쿼리를 Train(60%) / Test(40%) split
278:## 8. 워크스페이스 구조
280:테스트/평가 결과를 체계적으로 관리하는 디렉토리 구조:
285:│   ├── eval-descriptive-name-1/
286:│   │   ├── eval_metadata.json
295:│   ├── eval-descriptive-name-2/
300:└── evals/
301:    └── evals.json
305:- eval 디렉토리는 숫자가 아닌 **서술적 이름** 사용 (예: `eval-multi-page-table-extraction`)

hook: PostToolUse
hook: PostToolUse
hook: PostToolUse
exec
/bin/zsh -lc "awk '/"'^#|Goodhart|holdout|baseline|assertion|approval|rollback|re-baseline|non-discriminating|runner|flapping|overfit|echo|leak|누수|승인|롤백|단계|GT|golden|자기측정|미구현/{print NR ":" $0}'"' skills/myharness/references/self-improvement-loop.md" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
1:# 자기개선 루프 (Self-Improvement Loop) — 벤치마크 앵커 자기개선 (설계 정본)
3:생성된 스킬·에이전트를 **벤치마크로 측정 → 개정안 제안 → holdout 검증 → 사람 승인 → 채택**하는 닫힌 고리. `loop-self-eval.md`(루프 자체 평가)의 확장 — 측정 대상이 *루프*가 아니라 *생성 산출물(스킬/에이전트)*. **자동 적용 아님. 코드 자동화 0의 설계 단계.**
5:## 왜 — 그리고 왜 위험한가 (먼저 읽을 것)
7:- **Goodhart/과적합** — 지표만 올리려 실제 품질과 무관한 방향으로 튠.
12:→ 그래서 이 루프의 **모든 결정은 4개 앵커에 묶인다**: (1) Ground-Truth assertion, (2) Holdout 분리, (3) 제안+사람 승인, (4) 단계적.
14:## 메커니즘
16:[측정] 생성 스킬/에이전트 → with/without A/B + assertion 채점 → grading.json + scorecard
18:[감지] holdout baseline 대비 하락  OR  특정 스킬 underperform  OR  반복 실패 패턴
22:[holdout 검증] ★ 튜닝에 안 쓴 held-out 과제로 재벤치 → baseline을 margin δ 이상 이겨야 후보
24:[승인] 사람 게이트 (자동 채택 금지)
26:[채택 + re-baseline] baseline 레지스트리 갱신, 이전 baseline 보존(롤백용)
29:## 데이터 구조
30:- **벤치마크 케이스:** 스킬당 `_workspace/evals/cases/{skill}/` — 과제 프롬프트 + assertion. **train/holdout 분리 필수**(예: 70/30, 도메인 누수 없이).
31:- **baseline 레지스트리:** `_workspace/evals/baselines/{skill}.json` — `{holdout_score, n_holdout, assertions_version, adopted_at, prev_baseline_path}`. 채택 시 갱신, 이전본 보존.
32:- **점수:** `grading.json`의 `summary.pass_rate`(objective assertion) 우선. judge 점수는 보조(단독 결정 금지).
34:## 4개 앵커 (위반 시 자기개선 금지)
35:1. **Ground-Truth assertion 앵커** — 채택 결정은 *객관 검증 가능한* assertion 통과율에 묶는다(파일 생성·데이터 추출·코드 동작 등). 자기 judge 점수만으로 채택 금지. assertion이 없는 영역(창작·문체·설계 감각)은 **자동개선 비대상** → 사람 평가 유지.
36:2. **Holdout 분리** — 개정안은 *튜닝에 쓰지 않은* holdout 과제로만 평가. train 점수 향상은 채택 근거가 아니다(과적합 차단). holdout 누수(같은 과제·동일 패턴) 금지.
37:3. **제안 + 사람 승인** — 루프는 후보를 *제안*만. 채택은 사람 게이트. 자동 적용은 단계 4 이후·충분 데이터·명시 승인 시만.
38:4. **단계적 도입** (loop-self-eval 단계표 준용):
39:   | 단계 | 내용 | 자동화 |
41:   | 1 | 벤치마크 측정·baseline 기록만 | 없음 |
42:   | 2 | holdout 하락/underperform을 사람에게 리포트 | 없음 |
43:   | 3 (실험) | 개정안 *제안* + holdout 검증 결과 제시 | 제안만+승인 |
44:   | 4 (실험) | 승인 기반 채택·re-baseline | 사람 승인 필수 |
46:## non-discriminating 방지
47:`skill-testing-guide §4-3` 준용 — with/without 양쪽 100% 통과하는 assertion은 차별 가치를 못 재므로 제거/강화. 벤치마크가 "스킬의 부가가치"를 실제로 측정하도록.
49:## 안티-Goodhart 추가 장치
50:- **margin δ + min n** — holdout 향상이 δ 미만이거나 holdout n이 작으면 채택 보류(노이즈 채택 방지).
51:- **회귀 게이트** — 채택 후보는 기존 holdout 회귀 케이스(과거 실패→수정분)도 통과해야 함.
53:- **주기적 baseline 재검증** — assertion 노후화 감지(전부 통과 = 무의미해짐 → 갱신).
55:## 정직한 한계
56:- 자체측정 벤치 = 약증거. 외부 인용 시 n·측정자·holdout·assertion 버전 명시.
57:- assertion 가능 영역만 자동개선. 주관 품질은 사람.
60:## 통합 지점
63:- 채택·re-baseline·진화 트리거: Phase 7(진화) — 수치 트리거는 `loop-self-eval` 단계 3·4 가드 준용.
64:- 러너(미구현): `run-benchmark.sh`(with/without 실행→grading→baseline 비교)는 별도 구현 대상.

hook: PostToolUse
exec
/bin/zsh -lc "awk 'NR>=220 && NR<=430 { if ("'$0 ~ /''^#|Phase 6|Phase 7|self|improve|loop|gate|품질|검증|운영|유지|외부|리뷰|테스트/) print NR ":" $0 }'"' skills/myharness/SKILL.md" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
221:#### 5-1. 데이터 전달 프로토콜
239:- 최종 산출물만 사용자 지정 경로에 출력, 중간 파일(`_workspace/`)은 보존 (사후 검증·감사 추적용)
242:#### 5-2. 에러 핸들링
248:#### 5-3. 팀 크기 가이드라인
257:> **동시성 cap(백프레셔):** 동시 실행 기본 3·최대 5, 외부 리뷰는 별도 2. 초과는 큐잉. 대규모 fan-out의 리소스·API quota·토큰 폭증 방지 (`references/orchestrator-template.md` 동시성 정책).
259:#### 5-4. CLAUDE.md 하네스 포인터 등록
266:## 하네스: {도메인명}
282:#### 5-5. 후속 작업 지원
305:#### 5-6. 품질 게이트 (코드/설계 도메인)
307:내부 생성-검증(QA 에이전트)에 더해, 단계 산출물마다 외부 리뷰 게이트를 건다. 무차별 적용은 과의식이므로 **리스크 등급으로 강도를 맞춘다.**
311:| 경량 | 1파일·가역·테스트 無 (오타·문구·설정) | 내부 QA만 |
312:| 표준 | 다파일·기능 추가 | 내부 QA + 외부리뷰 **1회**(단계 끝) |
313:| 중대 | 계약 변경·비가역·다도메인 | **단계마다** 외부리뷰 + 승인 사다리(PRD→계획서→실행: 각 관문마다 사용자 승인+외부리뷰, 반려 시 해당 단계 재작업; 승인 관문 절차는 external-review-loop Step 7 준용) |
315:**단계 마감 게이트(표준·중대):** 오케스트레이터가 `external-review-loop` 스킬 호출 — **라운드 반복 루프**(codex/gemini 병렬 → 판정 → 확인분만 TDD 수정·게이트 → 수정 diff 재리뷰). **loop-until-dry**(신규 확인 0건 K회 연속) 또는 MAX_ROUNDS에서 종료. 판정 원장(`verdicts.json`)으로 신규만 판정. 근거 수집은 위임 가능하나 **최종 확정은 오케스트레이터 비위임**. 상세: `references/external-review-loop.md`.
317:**커밋 순서(순환 제거):** 리뷰→판정→수정→게이트 PASS → **승인 관문** → 단일 커밋. (리뷰는 커밋 *전* 작업트리/스테이지 대상 — "커밋 직후 리뷰" 아님.)
319:- **자율 노브:** `프로젝트/_workspace/.autonomous` 마커(또는 "자율로"·"승인 생략" 발화) 시 승인 자동 통과 → 커밋. 권한모드(bypassPermissions)는 스킬이 못 읽으므로 마커/발화로 명시. 마커 ON이어도 외부리뷰·판정·게이트는 그대로(인간 승인 한 스텝만 생략).
320:- **push는 자율이어도 기본 대기**(외부 송출·되돌리기 어려움) — `_workspace/.autonomous-push` 마커 시만 자동.
322:**리뷰 예산(비용·지연 통제):** run당 외부 리뷰 횟수 상한을 두고, **코드 변경 없으면 게이트 생략(skip-when-no-delta)**. 검증된 반복 구간은 `_workspace/.fast-pass` 마커로 우회. 이슈 다수(10+)면 판정 보조로 일괄 처리해 오케스트레이터 컨텍스트 비대화를 막는다.
324:### Phase 6: 검증 및 테스트
326:생성된 하네스를 검증한다. 상세 테스트 방법론은 `references/skill-testing-guide.md` 참조.
328:#### 6-1. 구조 검증
331:- 스킬의 frontmatter(name, description) 검증
335:#### 6-2. 실행 모드별 검증
341:#### 6-3. 스킬 실행 테스트
345:생성된 각 스킬에 대해 실제 실행 테스트를 수행한다:
347:1. **테스트 프롬프트 작성** — 각 스킬에 대해 2~3개의 현실적인 테스트 프롬프트를 작성한다. 실제 사용자가 입력할 법한 구체적이고 자연스러운 문장으로 작성한다.
353:3. **결과 평가** — 산출물의 품질을 정성적(사용자 리뷰) + 정량적(assertion 기반) 으로 평가한다. 산출물이 객관적으로 검증 가능한 경우(파일 생성, 데이터 추출 등) assertion을 정의하고, 주관적인 경우(문체, 디자인) 사용자 피드백에 의존한다.
355:4. **반복 개선 루프** — 테스트 결과에서 문제가 발견되면:
357:   - 수정 후 재테스트한다
360:5. **반복 패턴 번들링** — 테스트 실행에서 에이전트들이 공통으로 작성하는 코드(예: 모든 테스트에서 동일한 헬퍼 스크립트를 생성)가 발견되면, 해당 코드를 `scripts/`에 미리 번들링한다.
362:#### 6-4. 트리거 검증
364:각 스킬의 description이 올바르게 트리거되는지 검증한다:
369:**near-miss 작성 핵심:** "피보나치 함수 작성" 같이 명백히 무관한 쿼리는 테스트 가치가 없다. "이 엑셀 파일의 차트를 PNG로 추출해줘" (xlsx 스킬 vs 이미지 변환)처럼 **경계가 모호한 쿼리**가 좋은 테스트 케이스다.
373:#### 6-5. 드라이런 테스트
380:#### 6-6. 테스트 시나리오 작성
382:- 오케스트레이터 스킬에 `## 테스트 시나리오` 섹션 추가
385:### Phase 7: 하네스 진화
389:#### 7-1. 실행 후 피드백 수집
397:#### 7-2. 피드백 반영 경로
403:| 결과물 품질 | 해당 에이전트의 스킬 | "분석이 너무 피상적" → 스킬에 깊이 기준 추가 |
405:| 워크플로우 순서 | 오케스트레이터 스킬 | "검증을 먼저 해야" → Phase 순서 변경 |
409:#### 7-3. 변경 이력
418:| 2026-04-07 | QA 에이전트 추가 | agents/qa.md | 산출물 품질 검증 부족 피드백 |
424:#### 7-4. 진화 트리거
430:- **(수치 기반 — 데이터 충분 시)** 누적 `loop_scorecard.json` 추세가 악화: `alignment_score` 롤링 하락 3회 연속, `rounds_normalized` 상승 추세, `overturned_rejection_rate` 임계 초과, 동일 경계 N회 실패. **단, 자동 적용 금지 — 제안만 + 승인 게이트**, `min_adjudicated_claims≥20` 전 발화 금지(플래핑·Goodhart 방지). 상세: `references/loop-self-eval.md`.

hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
codex
1. [high] 4개 앵커가 필요조건일 뿐 충분조건은 아님
- 현황: `self-improvement-loop.md`는 GT assertion·holdout·사람 승인·단계적 도입을 Goodhart/과적합/에코체임버/플래핑 방지 앵커로 둠.
- 이슈: assertion·holdout·개정안 생성 주체가 같은 하네스/LLM 흐름이면 앵커가 서로 독립 신호가 아님. 사람 승인도 승인 기준·블라인드 비교·반례 검토가 없으면 rubber stamp가 될 수 있음.
- 권고: “독립 벤치마크 작성자/검토자”, “블라인드 candidate-vs-baseline 비교”, “외부 리뷰 또는 사용자 표본 승인”을 채택 전 필수 조건으로 추가. 승인 체크리스트도 명문화.

2. [critical] 미구현 러너 의존으로 설계가 검증 불가능
- 현황: `run-benchmark.sh`는 “별도 구현 대상”으로 남아 있음.
- 이슈: 핵심 안전장치인 with/without 실행, grading, baseline 비교, holdout 분리, rollback 검증이 모두 러너 구현에 달려 있음. 러너 스펙 없이 문서만 있으면 자기개선 루프가 공허해짐.
- 권고: 설계 정본에 최소 러너 계약을 먼저 고정. 입력/출력 스키마, 격리 방식, seed/model/env 기록, artifact hash, 실패 처리, 재실행 정책, baseline 비교식을 명시하고 Phase 6 검증 대상에 포함.

3. [high] LLM 생성 과제의 holdout 누수 방지 기준이 약함
- 현황: train/holdout 70/30, “도메인 누수 없이”, “같은 과제·동일 패턴 금지”만 제시.
- 이슈: LLM이 같은 문서, 같은 생성 프롬프트, 같은 도메인 taxonomy에서 만든 과제는 문면이 달라도 semantic sibling일 수 있음. train에서 본 실패 패턴을 고치면 holdout 패턴까지 암묵적으로 튜닝될 수 있음.
- 권고: cluster split, source/provenance 기록, 생성 프롬프트 분리, holdout 작성자 분리, 유사도 dedup, locked append-only holdout, proposal generator의 holdout 접근 금지를 추가.

4. [high] baseline re-baseline이 품질 표류를 만들 수 있음
- 현황: 채택 시 baseline 레지스트리를 갱신하고 이전 baseline을 보존.
- 이슈: baseline 자체가 자기측정 산물이므로 잘못된 assertion·오염된 holdout·운 좋은 실행 결과가 새 기준으로 승격될 수 있음. 이전 baseline 보존만으로는 “champion 대비”, “원시 기준 대비”, “장기 추세”가 보장되지 않음.
- 권고: baseline을 immutable artifact로 저장하고 skill/agent hash, assertion version, runner version, model/env, seed, case IDs를 함께 고정. 새 후보는 current champion과 original/reference baseline 모두에 비교.

5. [high] rollback 절차가 artifact 수준으로 닫혀 있지 않음
- 현황: `prev_baseline_path`만 언급.
- 이슈: baseline 점수만 되돌려도 실제 스킬/에이전트/오케스트레이터/러너/케이스 세트가 되돌아가지 않으면 롤백이 재현 불가능.
- 권고: rollback manifest 추가. 포함: adopted diff, artifact hashes, 이전 파일 경로, baseline snapshot, eval case snapshot, command, expected score. Phase 7에 rollback 실행 절차 명시.

6. [med] assertion 앵커의 자동개선 대상/비대상 경계가 모호함
- 현황: assertion 가능한 영역만 자동개선, 창작·문체·설계 감각은 사람 평가 유지.
- 이슈: 하네스 품질 대부분은 오케스트레이션, 역할 분리, 설명 정확도, 트리거 경계 같은 혼합 영역임. 일부 파일 생성 assertion이 통과해도 전체 품질 개선으로 볼 수 없음.
- 권고: capability별 등급표 추가. `objective`, `hybrid`, `subjective`로 나누고 hybrid는 assertion + blind human/external review 없이는 채택 금지.

7. [med] non-discriminating 방지가 100/100 케이스에만 갇힘
- 현황: with/without 모두 100% 통과하는 assertion 제거/강화.
- 이슈: 95/100처럼 거의 차별력 없는 항목, 너무 어려워 둘 다 실패하는 항목, wrong-proxy assertion, flaky assertion은 잡지 못함.
- 권고: item discrimination, repeated-run variance, negative control, mutation test, pass-rate band 기준을 추가. “둘 다 100%”는 예시로 낮추고 일반 판별력 기준으로 확장.

8. [high] 통계 기준이 비어 있어 플래핑 방지가 약함
- 현황: margin δ + min n, rolling 3회 하락 같은 문구가 있음.
- 이슈: δ, min n, confidence interval, repeated runs, LLM stochasticity 처리 기준이 없음. 작은 holdout에서 pass_rate 차이만으로 채택/기각하면 노이즈에 취약.
- 권고: 리스크별 최소 n, 반복 실행 수, bootstrap/confidence interval, tie/gray-zone 정책, effect size 기준을 정본에 넣기.

9. [med] 기존 `loop-self-eval`·Phase 6/7과 책임 경계가 중복됨
- 현황: `self-improvement-loop`가 Phase 6 측정, Phase 7 채택/re-baseline, `loop-self-eval` 단계표를 동시에 참조.
- 이슈: 어떤 루프가 “루프 자체”를 평가하고 어떤 루프가 “생성 산출물”을 평가하는지는 설명하지만 실행 산출물 이름과 트리거가 겹침. 운영자가 같은 scorecard/baseline 정책으로 오해할 수 있음.
- 권고: 용어 분리. 예: `loop_scorecard.json`은 오케스트레이션 루프 전용, `artifact_benchmark.json`은 스킬/에이전트 전용. Phase 6/7에 호출 순서와 산출물 경로를 단일 표로 정리.

10. [low] 설계가 다소 과설계이며 초기 운영 경로가 무거움
- 현황: A/B, assertion, holdout, baseline registry, re-baseline, rollback, 외부 리뷰, 단계적 도입이 모두 포함됨.
- 이슈: 러너도 없는 상태에서 모든 장치를 동시에 요구하면 실제 도입이 지연되고, 결국 수동으로 우회될 가능성이 큼.
- 권고: MVP를 분리. 1단계는 “케이스 스키마 + 러너 + immutable 결과 기록 + 수동 승인”만. 2단계에 holdout/champion 비교. 3단계 이후에 re-baseline/rollback 자동화를 붙이기.
hook: Stop
hook: Stop Completed
tokens used
37,525
1. [high] 4개 앵커가 필요조건일 뿐 충분조건은 아님
- 현황: `self-improvement-loop.md`는 GT assertion·holdout·사람 승인·단계적 도입을 Goodhart/과적합/에코체임버/플래핑 방지 앵커로 둠.
- 이슈: assertion·holdout·개정안 생성 주체가 같은 하네스/LLM 흐름이면 앵커가 서로 독립 신호가 아님. 사람 승인도 승인 기준·블라인드 비교·반례 검토가 없으면 rubber stamp가 될 수 있음.
- 권고: “독립 벤치마크 작성자/검토자”, “블라인드 candidate-vs-baseline 비교”, “외부 리뷰 또는 사용자 표본 승인”을 채택 전 필수 조건으로 추가. 승인 체크리스트도 명문화.

2. [critical] 미구현 러너 의존으로 설계가 검증 불가능
- 현황: `run-benchmark.sh`는 “별도 구현 대상”으로 남아 있음.
- 이슈: 핵심 안전장치인 with/without 실행, grading, baseline 비교, holdout 분리, rollback 검증이 모두 러너 구현에 달려 있음. 러너 스펙 없이 문서만 있으면 자기개선 루프가 공허해짐.
- 권고: 설계 정본에 최소 러너 계약을 먼저 고정. 입력/출력 스키마, 격리 방식, seed/model/env 기록, artifact hash, 실패 처리, 재실행 정책, baseline 비교식을 명시하고 Phase 6 검증 대상에 포함.

3. [high] LLM 생성 과제의 holdout 누수 방지 기준이 약함
- 현황: train/holdout 70/30, “도메인 누수 없이”, “같은 과제·동일 패턴 금지”만 제시.
- 이슈: LLM이 같은 문서, 같은 생성 프롬프트, 같은 도메인 taxonomy에서 만든 과제는 문면이 달라도 semantic sibling일 수 있음. train에서 본 실패 패턴을 고치면 holdout 패턴까지 암묵적으로 튜닝될 수 있음.
- 권고: cluster split, source/provenance 기록, 생성 프롬프트 분리, holdout 작성자 분리, 유사도 dedup, locked append-only holdout, proposal generator의 holdout 접근 금지를 추가.

4. [high] baseline re-baseline이 품질 표류를 만들 수 있음
- 현황: 채택 시 baseline 레지스트리를 갱신하고 이전 baseline을 보존.
- 이슈: baseline 자체가 자기측정 산물이므로 잘못된 assertion·오염된 holdout·운 좋은 실행 결과가 새 기준으로 승격될 수 있음. 이전 baseline 보존만으로는 “champion 대비”, “원시 기준 대비”, “장기 추세”가 보장되지 않음.
- 권고: baseline을 immutable artifact로 저장하고 skill/agent hash, assertion version, runner version, model/env, seed, case IDs를 함께 고정. 새 후보는 current champion과 original/reference baseline 모두에 비교.

5. [high] rollback 절차가 artifact 수준으로 닫혀 있지 않음
- 현황: `prev_baseline_path`만 언급.
- 이슈: baseline 점수만 되돌려도 실제 스킬/에이전트/오케스트레이터/러너/케이스 세트가 되돌아가지 않으면 롤백이 재현 불가능.
- 권고: rollback manifest 추가. 포함: adopted diff, artifact hashes, 이전 파일 경로, baseline snapshot, eval case snapshot, command, expected score. Phase 7에 rollback 실행 절차 명시.

6. [med] assertion 앵커의 자동개선 대상/비대상 경계가 모호함
- 현황: assertion 가능한 영역만 자동개선, 창작·문체·설계 감각은 사람 평가 유지.
- 이슈: 하네스 품질 대부분은 오케스트레이션, 역할 분리, 설명 정확도, 트리거 경계 같은 혼합 영역임. 일부 파일 생성 assertion이 통과해도 전체 품질 개선으로 볼 수 없음.
- 권고: capability별 등급표 추가. `objective`, `hybrid`, `subjective`로 나누고 hybrid는 assertion + blind human/external review 없이는 채택 금지.

7. [med] non-discriminating 방지가 100/100 케이스에만 갇힘
- 현황: with/without 모두 100% 통과하는 assertion 제거/강화.
- 이슈: 95/100처럼 거의 차별력 없는 항목, 너무 어려워 둘 다 실패하는 항목, wrong-proxy assertion, flaky assertion은 잡지 못함.
- 권고: item discrimination, repeated-run variance, negative control, mutation test, pass-rate band 기준을 추가. “둘 다 100%”는 예시로 낮추고 일반 판별력 기준으로 확장.

8. [high] 통계 기준이 비어 있어 플래핑 방지가 약함
- 현황: margin δ + min n, rolling 3회 하락 같은 문구가 있음.
- 이슈: δ, min n, confidence interval, repeated runs, LLM stochasticity 처리 기준이 없음. 작은 holdout에서 pass_rate 차이만으로 채택/기각하면 노이즈에 취약.
- 권고: 리스크별 최소 n, 반복 실행 수, bootstrap/confidence interval, tie/gray-zone 정책, effect size 기준을 정본에 넣기.

9. [med] 기존 `loop-self-eval`·Phase 6/7과 책임 경계가 중복됨
- 현황: `self-improvement-loop`가 Phase 6 측정, Phase 7 채택/re-baseline, `loop-self-eval` 단계표를 동시에 참조.
- 이슈: 어떤 루프가 “루프 자체”를 평가하고 어떤 루프가 “생성 산출물”을 평가하는지는 설명하지만 실행 산출물 이름과 트리거가 겹침. 운영자가 같은 scorecard/baseline 정책으로 오해할 수 있음.
- 권고: 용어 분리. 예: `loop_scorecard.json`은 오케스트레이션 루프 전용, `artifact_benchmark.json`은 스킬/에이전트 전용. Phase 6/7에 호출 순서와 산출물 경로를 단일 표로 정리.

10. [low] 설계가 다소 과설계이며 초기 운영 경로가 무거움
- 현황: A/B, assertion, holdout, baseline registry, re-baseline, rollback, 외부 리뷰, 단계적 도입이 모두 포함됨.
- 이슈: 러너도 없는 상태에서 모든 장치를 동시에 요구하면 실제 도입이 지연되고, 결국 수동으로 우회될 가능성이 큼.
- 권고: MVP를 분리. 1단계는 “케이스 스키마 + 러너 + immutable 결과 기록 + 수동 승인”만. 2단계에 holdout/champion 비교. 3단계 이후에 re-baseline/rollback 자동화를 붙이기.
