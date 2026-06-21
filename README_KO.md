<p align="center">
  <img src="harness_banner.png" alt="Harness Banner" width="600">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.1.0-brightgreen.svg" alt="Version">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/Claude_Code-Plugin-purple.svg" alt="Claude Code Plugin">
  <img src="https://img.shields.io/badge/Patterns-6_Architectures-orange.svg" alt="6 Architecture Patterns">
  <img src="https://img.shields.io/badge/Mode-Agent_Teams-green.svg" alt="Agent Teams">
  <a href="https://github.com/cookyman74/my_harness/stargazers"><img src="https://img.shields.io/github/stars/cookyman74/my_harness?style=social" alt="GitHub Stars"></a>
</p>

<p align="center">
  <a href="#카테고리--harness는-어디에-서-있나요"><img src="https://img.shields.io/badge/Layer-L3%20Meta--Factory-orange" alt="Layer"></a>
  <a href="#카테고리--harness는-어디에-서-있나요"><img src="https://img.shields.io/badge/Sub--layer-Team--Architecture%20Factory-teal" alt="Sub-layer"></a>
  <a href="#"><img src="https://img.shields.io/badge/README-EN%20%7C%20KO%20%7C%20JA-lightgrey" alt="i18n"></a>
</p>

# Harness — Claude Code를 위한 팀 아키텍처 팩토리

[English](README.md) | **한국어** | [日本語](README_JA.md)

> **Harness는 Claude Code용 팀 아키텍처 팩토리입니다.** **"하네스 구성해줘"** (한국어) · **"build a harness for this project"** (English) · **"ハーネスを構成して"** (日本語) 한 문장으로, 플러그인이 도메인 설명을 에이전트 팀과 그들이 쓸 스킬로 변환합니다 — 사전 정의된 6가지 팀 아키텍처 패턴 중 하나를 골라서요.

## 개요

Harness는 Claude Code의 에이전트 팀 시스템을 활용하여 복잡한 작업을 전문 에이전트 팀으로 분해·조율하는 아키텍처 도구다. "하네스 구성해줘"라고 말하면, 사용자의 도메인에 맞는 에이전트 정의(`.claude/agents/`)와 스킬(`.claude/skills/`)을 자동 생성한다.

## 카테고리 — Harness는 어디에 서 있나요

Harness는 Claude Code 생태계의 **L3 Meta-Factory** 층 — 다른 하네스들이 아니라 "다른 하네스들을 생성하는 층" — 에 자리합니다. 그 층 안에서 우리는 **Team-Architecture Factory** 서브 층을 선택합니다.

| 층위 | 하는 일 | 공존하는 이웃 |
|------|---------|---------------|
| **L3 — Meta-Factory / Team-Architecture Factory** (우리) | 도메인 설명 → 에이전트 팀 + 스킬, 6가지 사전 정의된 팀 패턴 | — |
| L3 — Meta-Factory / Runtime-Configuration Factory | 결정적(deterministic)·반복 가능한 런타임 설정 생성 | [coleam00/Archon](https://github.com/coleam00/Archon) |
| L3 — Meta-Factory / Codex Runtime Port | 같은 컨셉, Codex 런타임 | [SaehwanPark/meta-harness](https://github.com/SaehwanPark/meta-harness) |
| L2 — Cross-Harness Workflow | 여러 하네스 위에서 스킬·규칙·훅을 표준화 | [affaan-m/ECC](https://github.com/affaan-m/everything-claude-code) |

> Archon은 결정적 런타임 설정을 뽑아냅니다. Harness는 팀 아키텍처(파이프라인·팬아웃/팬인·전문가 풀·생성-검증·감독자·계층적 위임)와 에이전트가 쓸 스킬을 뽑아냅니다. 같은 L3의 서로 다른 서브 층입니다. 런타임 결정성은 Archon, 팀 아키텍처는 Harness, 또는 둘을 조합해서 쓰세요.

## 핵심 기능

- **에이전트 팀 설계** — 파이프라인, 팬아웃/팬인, 전문가 풀, 생성-검증, 감독자, 계층적 위임 등 6가지 아키텍처 패턴 지원
- **스킬 생성** — Progressive Disclosure 패턴으로 컨텍스트를 효율 관리하는 스킬 자동 생성
- **오케스트레이션** — 에이전트 간 데이터 전달, 에러 핸들링, 팀 조율 프로토콜 포함
- **검증 체계** — 트리거 검증, 드라이런 테스트, With-skill vs Without-skill 비교 테스트
- **2층 품질 게이트** — 내부 생성-검증 QA **+** 외부 독립 리뷰 루프(`external-review-loop`): 독립 리뷰어 CLI가 단계 산출물을 리뷰하고, 오케스트레이터가 실코드 대조로 전건 판정(확인/부분/이월/기각) 후 확인분만 TDD로 수정. 리뷰어는 **엔진 다양성**으로 선택 — 러너 자신의 엔진은 제외해 AI가 자기 맹점을 자기가 리뷰하지 못하게 한다(Claude Code → codex + agy; Codex → claude + agy). **수렴 루프** — loop-until-dry + 라운드 상한 + 판정 원장(dedup vs seen, 기각 재부상 방지) + 수정본 재리뷰. 도구 연동을 먼저 점검(`check-review-tools.sh`가 러너 제외 `REVIEWERS:` 산출)해 외부 리뷰어가 없으면 스킬을 생성하지 않음.
- **루프 자체 평가** — 각 루프가 `loop_scorecard.json`(alignment_score·판정 카운트·정규화 라운드·비용·종료 라벨) 발행 → 단계적 자기개선(측정→수동 리포트→제안→자동), 자기강화 방지장치(제안만+승인·롤링윈도우·최소 표본; recall은 Ground Truth로만). 상세: `references/loop-self-eval.md`.
- **교리 주입** — 생성된 코드/수정 에이전트에 TDD(`tdd-doctrine.md`)·개발 규칙(`dev-rules.md`)을 실경로로 주입. 리스크 등급(경량/표준/중대)으로 게이트 강도 조절.
- **듀얼 런타임 (Claude Code + Codex)** — 단일 출처(`skills/myharness/`) + 런타임별 얇은 어댑터. 팩토리가 `CLAUDE.md`·`AGENTS.md` 포인터를 둘 다 출력하고 오케스트레이션을 분기(Claude 에이전트 팀 — `Agent` 도구 ↔ Codex 네이티브 subagents / `codex exec`). Phase 7 런타임 동기화로 drift 방지. 상세: `references/runtime-adapters.md`.
- **빌드된 하네스 업데이트 (Claude `/myharness update` · Codex `$myharness update`)** — 플러그인 최신화 후, 팩토리 교리/스크립트를 이미 빌드된 하네스에 재전파하되 **로컬 수정을 덮어쓰기로부터 보호**한다. 생성 시 기록한 `.harness-manifest.json` 기준선으로 `harness-update.sh`가 파일별 해시 분류 — SAME / UPDATABLE(자동) / USER-MODIFIED(기본 보류; 명시 승인 시 정본으로 통째 교체, 부분 병합 없음) / UNKNOWN(보수 — manifest 없음) / NEW. 추가 규칙은 `*.local.*` 파일로 분리하면 update-safe. 상세: `references/harness-update.md`.
- **비용·동시성 통제** — 모델 라우팅(고추론 → `opus`, 단순 작업 → 경량 모델), 동시성 cap+백프레셔(기본 3·최대 5), 외부 리뷰 예산(skip-when-no-delta·`.fast-pass`), smoke/full 테스트 모드로 대규모 fan-out 비용 억제. 이식성 도구(`timeout`/`gtimeout` 탐지·프로세스 정리).

## 철학 — 스킬 ↔ 에이전트

생성된 하네스는 **누가**와 **어떻게**를 분리하고, 스스로를 진화하는 시스템으로 다룬다:

- **관심사 분리** — *에이전트*는 "누가"(전문가 페르소나 + 작업 원칙), *스킬*은 "어떻게"(절차 + 도구 번들). 둘 다 파일(`.claude/agents/*.md`, `skills/*/SKILL.md`), 인라인 금지 → 다음 세션 재사용. 1 에이전트 = 1 집중 역할, 1 에이전트 ↔ 1~N 스킬(공유 가능).
- **에이전트 팀이 기본** — 2명+ 협업은 메시지·공유 작업목록·`_workspace/` 파일로 자체 조율. 발견 공유·상충 토론·누락 보완이 품질을 높임.
- **2층 품질 게이트** — 내부 생성-검증 QA **+** 외부 독립 리뷰 루프(엔진 다양성 리뷰어 — 러너 엔진 제외). 오케스트레이터가 모든 이슈를 실코드 대조로 판정 — 합의는 증거가 아님. 리스크 등급(경량/표준/중대)으로 강도 조절.
- **교리 주입** — 코드/수정 에이전트에 TDD(`tdd-doctrine.md`)·개발 규칙(`dev-rules.md`)을 실경로로 주입(서브에이전트는 글로벌 규칙을 못 받음).
- **강압 대신 Why, DRY 포인터** — 원칙은 *이유*를 설명(엣지케이스 판단)하고 단일 출처를 참조(복붙 금지).
- **진화하는 시스템** — 피드백을 알맞은 층으로(산출물→스킬, 역할→에이전트, 순서→오케스트레이터, 트리거→description) 라우팅하고 퇴행 방지를 위해 이력 기록.

> 요약: **오케스트레이터**가 누가/언제/순서를 정하고, **에이전트**가 "누가", **스킬**이 "어떻게", 2층 게이트가 품질을 정직하게 유지한다.

## 하네스 진화 메커니즘 (Harness Evolution Mechanism)

하네스 진화 메커니즘은 "무엇이 먹혔고 무엇이 안 먹혔는가"의 델타를 팩토리로 되먹여, 다음 세대가 측정 가능하게 더 나아지도록 합니다. 실제 프로젝트에서 생성된 하네스가 사용될 때, **진화 워크플로(Phase 7)** — Claude `/myharness`·Codex `$myharness`로 호출 — 가 초기 아키텍처와 최종 출시 아키텍처 간 변화량을 포착해 팩토리로 되먹입니다. 다음번 같은 도메인에 대한 생성은 이 되먹임을 반영해 "출시 상태에 더 가까운 초안"에서 시작합니다.

```
초기 하네스 ──▶ 실 프로젝트 사용 ──▶ 출시 하네스
                                          │
                                          ▼ (Phase 7 진화로 델타 포착)
                                    ┌───────────────┐
                                    │   팩토리      │◀── 더 나은 다음 세대 초안
                                    └───────────────┘
```

이것이 **하네스 진화 메커니즘 (Harness Evolution Mechanism; JA: ハーネス進化メカニズム)** 입니다.

## 워크플로우

```
Phase 1: 도메인 분석
    ↓
Phase 2: 팀 아키텍처 설계 (에이전트 팀 vs 서브 에이전트)
    ↓
Phase 3: 에이전트 정의 생성 (.claude/agents/)
    ↓
Phase 4: 스킬 생성 (.claude/skills/)
    ↓
Phase 5: 통합 및 오케스트레이션 (+ 2층 품질 게이트, 듀얼 런타임 출력)
    ↓
Phase 6: 검증 및 테스트
    ↓
Phase 7: 하네스 진화 (피드백 → 지속 갱신; 듀얼 런타임 동기화)
```

## 설치

### 마켓플레이스 등록 후 설치

#### 마켓플레이스 추가
```shell
/plugin marketplace add cookyman74/my_harness
```

#### 플러그인 설치
```shell
/plugin install myharness@myharness-marketplace
```

### 글로벌 스킬로 직접 설치

```shell
# skills 디렉토리를 ~/.claude/skills/myharness/에 복사
cp -r skills/myharness ~/.claude/skills/myharness
```

### Codex CLI (듀얼 런타임)

Codex는 `~/.codex/skills/`(사용자 글로벌)에서 스킬을 발견하며, untrusted 프로젝트에서도 스킬은 로드됩니다. 레포의 `install.sh`가 라이브 팩토리를 심링크하고 리뷰 도구를 점검합니다:

```shell
bash install.sh
# → ~/.codex/skills/myharness → skills/myharness (심링크, 항상 최신)
# → repo .agents/skills/myharness (trusted 프로젝트용)
# → AGENTS.md (Codex 자동 로드)
```

Codex에서는 **`$myharness`**, **`/skills`** 메뉴, 또는 description에 맞는 요청(예: "하네스 구성해줘")으로 호출합니다. `/myharness`는 Codex 문법이 **아닙니다**(커스텀 슬래시 미지원). 설치 후 스킬 목록 재로딩을 위해 Codex 세션을 재시작하세요.

## 플러그인 구조

```
my_harness/
├── .claude-plugin/
│   └── plugin.json                 # 플러그인 매니페스트 (name: myharness)
├── skills/
│   └── myharness/
│       ├── SKILL.md                # 메인 스킬 정의 (7 Phase 워크플로우)
│       ├── references/
│       │   ├── factory-map.md             # 항법: 최소 경로·구현 상태·루프 지도 (먼저 읽기)
│       │   ├── agent-design-patterns.md   # 6가지 아키텍처 패턴
│       │   ├── orchestrator-template.md   # 팀/서브/Codex 오케스트레이터 템플릿
│       │   ├── team-examples.md           # 실전 팀 구성 예시
│       │   ├── skill-writing-guide.md     # 스킬 작성 가이드
│       │   ├── skill-testing-guide.md     # 테스트/평가 방법론
│       │   ├── qa-agent-guide.md          # QA 에이전트 통합 가이드
│       │   ├── external-review-loop.md    # 외부 리뷰 게이트, 엔진 다양 (수렴 루프 + 템플릿)
│       │   ├── loop-self-eval.md          # 루프 scorecard (측정 전용; 3·4단계 실험적)
│       │   ├── self-improvement-loop.md   # 벤치마크 앵커 산출물 개선 (설계만)
│       │   ├── tdd-doctrine.md            # TDD 교리 (코드 에이전트 주입용)
│       │   ├── dev-rules.md               # 개발 규칙 (코드 에이전트 주입용)
│       │   ├── runtime-adapters.md        # Claude Code / Codex 듀얼 런타임 설계
│       │   └── harness-update.md          # 빌드된 하네스 업데이트 (로컬 수정 보호)
│       └── scripts/
│           ├── check-review-tools.sh      # 리뷰어 연동 점검 (러너 제외)
│           ├── build-scorecard.sh         # verdicts에서 loop_scorecard 계산
│           └── harness-update.sh          # 빌드된 하네스 업데이트 (manifest/plan/apply)
├── AGENTS.md                       # Codex 런타임 진입점
├── install.sh                      # 듀얼 런타임 설치 (Claude + Codex)
└── README.md
```

## 사용법

Claude Code에서 다음과 같이 트리거한다:

```
하네스 구성해줘
하네스 설계해줘
이 프로젝트에 맞는 에이전트 팀 구축해줘
```

### 실행 모드

| 모드 | 설명 | 권장 상황 |
|------|------|----------|
| **에이전트 팀** (기본) | Agent 도구(팀원 spawn) + SendMessage + TaskCreate | 2개 이상 에이전트, 협업 필요 |
| **서브 에이전트** | Agent 도구 직접 호출 | 단발성 작업, 통신 불필요 |

<p align="center">
  <img src="harness_team.png" alt="Harness Agent Team" width="500">
</p>

### 아키텍처 패턴

| 패턴 | 설명 |
|------|------|
| 파이프라인 | 순차 의존 작업 |
| 팬아웃/팬인 | 병렬 독립 작업 |
| 전문가 풀 | 상황별 선택 호출 |
| 생성-검증 | 생성 후 품질 검수 |
| 감독자 | 중앙 에이전트가 동적 분배 |
| 계층적 위임 | 상위→하위 재귀적 위임 |

## 산출물

하네스가 생성하는 파일:

```
프로젝트/
├── .claude/
│   ├── agents/          # 에이전트 정의 파일
│   │   ├── analyst.md
│   │   ├── builder.md
│   │   └── qa.md
│   └── skills/          # 스킬 파일
│       ├── analyze/
│       │   └── SKILL.md
│       └── build/
│           ├── SKILL.md
│           └── references/
```

## 사용 사례 — 이 프롬프트를 그대로 사용하세요

Harness 설치 후 아래 프롬프트를 Claude Code에 복사해서 사용하세요:

**딥 리서치**
```
리서치 하네스를 구성해줘. 어떤 주제든 여러 각도에서 조사할 수 있는 에이전트 팀이
필요해 — 웹 검색, 학술 자료, 커뮤니티 반응 — 교차 검증 후 종합 보고서를 작성하는 팀.
```

**웹사이트 제작**
```
풀스택 웹사이트 개발 하네스를 구성해줘. 디자인, 프론트엔드(React/Next.js),
백엔드(API), QA 테스트를 와이어프레임부터 배포까지 파이프라인으로 조율하는 팀.
```

**웹툰 제작**
```
웹툰 에피소드 제작 하네스를 구성해줘. 스토리 작성, 캐릭터 디자인 프롬프트,
패널 레이아웃 기획, 대사 편집 에이전트가 필요하고 서로의 작업물을
스타일 일관성 관점에서 리뷰해야 해.
```

**유튜브 콘텐츠 기획**
```
유튜브 콘텐츠 제작 하네스를 구성해줘. 트렌드 조사, 대본 작성, 제목/태그 SEO 최적화,
썸네일 컨셉 기획을 감독자 에이전트가 조율하는 팀.
```

**코드 리뷰**
```
종합 코드 리뷰 하네스를 구성해줘. 아키텍처, 보안 취약점, 성능 병목, 코드 스타일을
병렬로 감사하는 에이전트들이 결과를 하나의 리포트로 통합하는 팀.
```

**기술 문서 작성**
```
이 코드베이스에서 API 문서를 자동 생성하는 하네스를 구성해줘. 엔드포인트 분석,
설명 작성, 사용 예제 생성, 완성도 리뷰를 파이프라인으로 처리하는 팀.
```

**데이터 파이프라인 설계**
```
데이터 파이프라인 설계 하네스를 구성해줘. 스키마 설계, ETL 로직, 데이터 검증 규칙,
모니터링 설정을 계층적으로 위임하는 에이전트 팀.
```

**마케팅 캠페인**
```
마케팅 캠페인 제작 하네스를 구성해줘. 타겟 시장 조사, 광고 카피 작성,
비주얼 컨셉 디자인, A/B 테스트 계획을 반복적 품질 리뷰와 함께 진행하는 팀.
```

## 공존 — Harness와 이웃 저장소들

Harness는 Claude Code / 에이전트 프레임워크 생태계에서 혼자가 아닙니다. 아래 저장소들은 인접한 층위에 위치하며, 모두 "X는 ···, Harness는 ···" 병렬 구조로 기술되어 있어 용도에 맞게 선택하거나 조합할 수 있습니다.

| 저장소 | 저장소의 포지션 | Harness와의 관계 |
|--------|-----------------|------------------|
| [coleam00/Archon](https://github.com/coleam00/Archon) | "harness builder" — 결정적·반복 가능한 런타임 설정 | **같은 L3, 이웃 서브 층.** Archon은 Runtime-Configuration Factory, Harness는 Team-Architecture Factory. 런타임 결정성은 Archon, 팀 아키텍처는 Harness, 또는 조합. |
| [SaehwanPark/meta-harness](https://github.com/SaehwanPark/meta-harness) | 같은 컨셉의 Codex 포트 | **같은 L3, 다른 런타임.** Claude Code에서는 Harness, Codex에서는 meta-harness. |
| [affaan-m/ECC](https://github.com/affaan-m/everything-claude-code) | "Agent harness performance & workflow layer" — 기존 하네스 위에 앉는 표준화 층 | **다른 층위.** ECC는 여러 하네스 위 표준화 층, Harness는 하네스를 생성하는 팩토리. 직렬 조합 가능. |
| [wshobson/agents](https://github.com/wshobson/agents) | 서브 에이전트 / 스킬 카탈로그 (182 agents, 149 skills) | **팩토리 ↔ 부품 공급.** wshobson은 "쇼핑할 카탈로그", Harness는 "팀 설계". Harness가 만든 팀에 wshobson 항목을 부품으로 흡수. |
| [LangGraph](https://langchain-ai.github.io/langgraph/) | 상태 그래프 오케스트레이션, LLM-agnostic | **다른 트랙.** 장기 실행·상태 복구가 핵심이면 LangGraph, Claude Code 네이티브의 빠른 팀 설계가 핵심이면 Harness. |

## Harness로 만든 프로젝트

### Harness 100

**[revfactory/harness-100](https://github.com/revfactory/harness-100)** — 10개 도메인, 100개의 프로덕션 레디 에이전트 팀 하네스 (한영 200패키지). 각 하네스에 4-5명의 전문 에이전트, 오케스트레이터 스킬, 도메인 특화 스킬이 포함되어 있으며, 모두 이 플러그인으로 생성되었습니다. 콘텐츠 제작, 소프트웨어 개발, 데이터/AI, 비즈니스 전략, 교육, 법률, 헬스케어 등 1,808개 마크다운 파일.

## 요구사항

- [에이전트 팀 기능 활성화](https://code.claude.com/docs/en/agent-teams): `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

## FAQ

<details>
<summary><b>Q1. 왜 "harness builder"가 아니라 "harness factory"인가요? Archon과 경쟁하나요?</b></summary>

**A.** Archon은 결정적 런타임 설정을 생성하는 **Runtime-Configuration Factory** 성격, Harness는 에이전트 팀 아키텍처(팀 구조·메시지 프로토콜·리뷰 게이트)를 생성하는 **Team-Architecture Factory** 성격입니다. 둘은 **같은 L3 Meta-Factory 층의 이웃 서브 층**이며, 용도가 다릅니다. 결정적 런타임이 필요하면 Archon, 팀 아키텍처 6패턴 사전 정의가 필요하면 Harness. 조합 사용(아키텍처 설계 → 런타임 배포)도 가능합니다.

**Evidence:**
- Archon 자기 규정: [clawfit docs/reference-levels.md](https://github.com/hongsw/clawfit/blob/main/docs/reference-levels.md)
- 서브 층 선언: 본 README **카테고리 — Harness는 어디에 서 있나요** 섹션
- Archon 저장소: [github.com/coleam00/Archon](https://github.com/coleam00/Archon)
</details>

<details>
<summary><b>Q2. 어떤 런타임을 지원하나요 — Claude Code, Codex?</b></summary>

**A.** 둘 다. myharness는 **듀얼 런타임**입니다: 단일 출처(`skills/myharness/`) + 런타임별 얇은 어댑터. Claude Code가 주(가장 자동화됨 — `Agent` 도구 에이전트 팀), Codex는 `AGENTS.md` + `.agents/skills/` + 네이티브 subagents / `codex exec`로 지원(`$myharness` 또는 `/skills`로 호출). 상세: `skills/myharness/references/runtime-adapters.md`. Gemini는 호스트 런타임이 아니라 외부 리뷰(agy 경유) 리뷰어로 사용.
</details>

## 라이선스

Apache 2.0
