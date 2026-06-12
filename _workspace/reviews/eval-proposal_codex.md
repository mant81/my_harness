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
session id: 019eba37-ef12-7c80-9eeb-02c220e42c0a
--------
user
리뷰 대상(설계 제안): _workspace/reviews/eval-proposal_artifact.md (이 레포 skills/myharness/ 하네스 팩토리의 external-review-loop에 "자체 평가→흐름 개선" 닫힌 고리를 추가하는 제안 P1~P6).
관련 참조: skills/myharness/references/external-review-loop.md, skill-testing-guide.md, skill-writing-guide.md(§7 데이터 스키마), skills/myharness/SKILL.md(Phase 7).
이 제안의 정합성·타당성·구현 가능성을 리뷰해 발생 가능한 이슈를 모두 찾아 보고하라:
- 기존 정책/스키마와의 정합(eval_metadata/grading/timing 재사용이 실제 맞물리나), 중복·모순
- 메트릭 정의의 정확성(reviewer_precision·false_positive_rate·rounds_to_converge 산식이 의미 있나, 측정 가능?)
- 자동 환류(P3/P4)의 위험: 과적합·오발화·자기강화 편향·임계(θ,ε,N) 근거
- 메타-루프(평가가 또 평가를 부르는) 비용·복잡도, over-engineering 여부
- 누락된 측정/실패 모드, 단순화 가능 지점
<이슈 작성 방법>
1. [레벨(critical/high/med/low)] 제목
- 현황: / - 이슈: / - 권고:
</이슈 작성 방법>
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
context-mode 지침 적용. 먼저 사용 가능한 ctx 도구 확인 후, 대상 문서와 참조를 원문 덤프 없이 인덱싱/검색해 리뷰하겠습니다.
mcp: context-mode/ctx_index started
mcp: context-mode/ctx_index (failed)
user cancelled MCP tool call
codex
ctx 인덱싱 호출이 취소되었습니다. 원문을 직접 쏟지 않는 방식은 유지하면서, 필요한 파일만 대상으로 좁혀 재시도합니다.
mcp: context-mode/ctx_batch_execute started
mcp: context-mode/ctx_batch_execute (failed)
user cancelled MCP tool call
codex
ctx 도구가 연속 취소되어 일반 셸로 전환합니다. 출력은 패턴 기반 추출로 제한해 원문 전체를 읽지 않겠습니다.
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse
hook: PostToolUse
hook: PreToolUse Completed
hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
codex
여기문서가 읽기 전용 샌드박스에서 임시파일 생성 때문에 막혔습니다. 같은 추출을 `node -e` 단일 명령으로 다시 실행합니다.
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
/bin/zsh -lc "node -e \"const fs=require('fs');const root='/Users/junghojang/Developments/myProject/myHarness/';const files=[['external','skills/myharness/references/external-review-loop.md'],['testing','skills/myharness/references/skill-testing-guide.md'],['writing','skills/myharness/references/skill-writing-guide.md'],['skill','skills/myharness/SKILL.md']];const re=/"'^#{1,4}'"\\\\s|eval_metadata|grading|timing|review|gate|artifact|failure|schema|Phase\\\\s*7|데이터|메타|평가|검증|외부|루프|metric|rubric|baseline|gold/;for(const [name,p] of files){console.log('## '+name);const s=fs.readFileSync(root+p,'utf8');s.split(/\\\\n/).forEach((l,i)=>{if(re.test(l)) console.log((i+1)+': '+l)})}\"" in /Users/junghojang/Developments/myProject/myHarness
exec
/bin/zsh -lc "node -e \"const fs=require('fs');const p='/Users/junghojang/Developments/myProject/myHarness/_workspace/reviews/eval-proposal_artifact.md';const s=fs.readFileSync(p,'utf8');const re=/"'^#{1,4}'"\\\\s|P[1-6]|eval_metadata|grading|timing|reviewer_precision|false_positive_rate|rounds_to_converge|theta|θ|epsilon|ε|threshold|임계|overfit|과적합|bias|편향|schema|스키마/;s.split(/\\\\n/).forEach((l,i)=>{if(re.test(l)) console.log((i+1)+': '+l)})\"" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
1: # 제안: external-review-loop 자체 평가 닫힌 고리 (리뷰 대상)
5: ## 갭
7: 2. [high] 수렴 ≠ 품질 — loop-until-dry "신규 0건"은 부재 신호. 리뷰어 소진인지 실품질 상승인지 구분 못 함. 종료에 양의 품질 신호(게이트 PASS + assertion 통과율 ≥ θ) 필요. converged-good/exhausted/max-rounds 라벨.
8: 3. [high] 평가 결과 미영속·미추세 — eval 스키마(eval_metadata/grading/timing)는 있으나 루프에 미배선. 매 실행 고립 → 추세·회귀 감지 불가.
9: 4. [high] 평가→흐름 자동 환류 부재 — Phase 7-4 트리거가 관찰적. 수치 임계 자동 발화 없음. 추세 데이터 소스 없음.
11: 6. [med] 테스트 루프 수렴 지표 모호 — "의미 있는 개선 없을 때까지" → assertion 통과율 델타 < ε 수치화 + scorecard 연동.
13: ## 핵심 제안
14: - P1. 루프 self-eval scorecard — 각 루프가 `_workspace/eval/{loop}_{단계ID}.json` 발행. external-review: rounds_to_converge·reviewer_precision·confirmed/partial/deferred/rejected·new_per_round·cost_tokens·gate_pass·false_positive_rate. build/test: assertion_pass_rate·with/without_delta·regression_flags. (grading.json 재사용)
15: - P2. 수렴 품질 신호 — 종료 = (신규 확인 0건 K회) AND (게이트 PASS + assertion 통과율 ≥ θ). 종료사유 라벨.
16: - P3. 자체 평가 스텝 → 흐름 제안 — 루프 끝 scorecard 점수화 → 롤링 베이스라인 대비 → 악화 시 흐름 개선안 자동 emit(프롬프트 튜닝/게이트 강도/QA 체크 추가/에이전트 분리).
17: - P4. Phase 7-4 수치 트리거 — 누적 scorecard로 reviewer_precision<θ, rounds 상승, 동일 경계 N회 실패, 확인당 비용 상승 시 진화 발화.
18: - P5. 판정 보정 — 사후 기각/이월 표본 재점검 → 틀린 기각이면 사유표·신뢰도 교정.
19: - P6. 테스트 루프 수렴 수치화 — assertion 통과율 델타 < ε 종료 + scorecard.

hook: PostToolUse
hook: PostToolUse
 succeeded in 122ms:
1: # 스킬 테스트 & 반복 개선 가이드
3: 하네스에서 생성한 스킬의 품질을 검증하고 반복적으로 개선하는 방법론. SKILL.md Phase 6의 보충 레퍼런스.
7: ## 목차
11: 3. [실행 테스트: With-skill vs Baseline](#3-실행-테스트-with-skill-vs-baseline)
12: 4. [정량적 평가: Assertion 기반 채점](#4-정량적-평가-assertion-기반-채점)
14: 6. [반복 개선 루프](#6-반복-개선-루프)
15: 7. [Description 트리거 검증](#7-description-트리거-검증)
20: ## 1. 테스트 프레임워크 개요
22: 스킬 품질 검증은 **정성적 평가**와 **정량적 평가**의 조합이다.
24: | 평가 유형 | 방법 | 적합한 스킬 |
27: | **정량적** | assertion 기반 자동 채점 | 파일 생성, 데이터 추출, 코드 생성 등 객관적 검증 가능 |
29: 핵심 루프: **작성 → 테스트 실행 → 평가 → 개선 → 재테스트**
33: ## 2. 테스트 프롬프트 작성법
35: ### 원칙
39: ### 나쁜 예
43: "데이터를 추출하라"
47: ### 좋은 예
59: ### 프롬프트 다양성
66: ### 커버리지
75: ## 3. 실행 테스트: With-skill vs Baseline
77: ### 3-1. 비교 실행 구조
95: ### 3-2. Baseline 선택
102: ### 3-3. 타이밍 데이터 캡처
104: 서브에이전트 완료 알림에서 `total_tokens`와 `duration_ms`를 **즉시** 저장한다. 이 데이터는 알림 시점에만 접근 가능하고 이후 복구할 수 없다.
116: ## 4. 정량적 평가: Assertion 기반 채점
118: ### 4-1. Assertion 작성
120: 산출물이 객관적으로 검증 가능한 경우, 자동 채점을 위한 assertion을 정의한다.
125: - 스킬의 핵심 가치를 검증
131: ### 4-2. 프로그래밍 가능한 검증
133: assertion이 코드로 검증 가능하면 스크립트로 작성한다. 눈으로 확인하는 것보다 빠르고 신뢰성 있으며, iteration마다 재사용 가능.
135: ### 4-3. Non-discriminating assertion 주의
139: ### 4-4. 채점 결과 스키마
166: ## 5. 전문 에이전트 활용
168: 테스트/평가 과정에서 전문 역할의 에이전트를 활용하면 품질이 향상된다.
170: ### 5-1. Grader (채점자)
172: assertion 기반 채점을 수행하고, 산출물에서 검증 가능한 주장(claim)을 추출하여 교차 검증한다.
176: - 산출물에서 사실적 주장을 추출하고 검증
179: ### 5-2. Comparator (블라인드 비교자)
190: ### 5-3. Analyzer (분석자)
192: 벤치마크 데이터에서 통계적 패턴을 분석한다:
199: ## 6. 반복 개선 루프
201: ### 6-1. 피드백 수집
205: ### 6-2. 개선 원칙
212: ### 6-3. 반복 절차
227: ### 6-4. 초안 → 재검토 패턴
233: ## 7. Description 트리거 검증
235: ### 7-1. 트리거 Eval 쿼리 작성
256: ### 7-2. 기존 스킬 충돌 검증
264: ### 7-3. 자동 최적화 (선택적 고급 기능)
278: ## 8. 워크스페이스 구조
280: 테스트/평가 결과를 체계적으로 관리하는 디렉토리 구조:
286: │   │   ├── eval_metadata.json
289: │   │   │   ├── timing.json
290: │   │   │   └── grading.json
293: │   │       ├── timing.json
294: │   │       └── grading.json
307: - `_workspace/`는 삭제하지 않음 — 사후 검증 및 감사 추적용
## writing
1: # 스킬 작성 가이드
7: ## 목차
15: 7. [데이터 스키마 표준](#7-데이터-스키마-표준)
20: ## 1. Description 작성 패턴
24: ### 트리거 메커니즘 이해
28: ### 작성 원칙
34: ### 좋은 예시
45:   데이터 정제를 포함한 모든 스프레드시트 작업. 사용자가 스프레드시트
50: ### 나쁜 예시
52: - `"데이터를 처리하는 스킬"` — 너무 모호, 어떤 파일/작업인지 불분명
57: ## 2. 본문 작성 스타일
59: ### Why-First 원칙
72: 셀 경계를 인식하여 구조화된 데이터를 반환한다.
75: ### 일반화 원칙
90: ### 명령형 어조
94: ### 컨텍스트 절약
103: ## 3. 출력 형식 정의 패턴
108: ## 보고서 구조
111: # [제목]
112: ## 요약
113: ## 핵심 발견
114: ## 권장 사항
121: ## 4. 예시 작성 패턴
126: ## 커밋 메시지 형식
139: ## 5. Progressive Disclosure 패턴
141: ### 패턴 1: 도메인별 분리
154: ### 패턴 2: 조건부 상세
159: # DOCX 처리
161: ## 문서 생성
164: ## 문서 편집
169: ### 패턴 3: 대형 레퍼런스 파일 구조
174: # API 레퍼런스
176: ## 목차
184: ## 인증
190: ## 6. 스크립트 번들링 판단 기준
205: ## 7. 데이터 스키마 표준
207: 스킬 간 데이터 교환의 일관성을 위해 표준 스키마를 사용한다. 하네스에서 생성하는 스킬의 테스트/평가에 사용할 수 있다.
209: ### eval_metadata.json
211: 각 테스트 케이스의 메타데이터:
225: ### grading.json
235:       "evidence": "3번째 단계에서 '서울 지역 데이터 추출' 확인"
249: ### timing.json
261: 서브에이전트 완료 알림에서 `total_tokens`와 `duration_ms`를 즉시 저장한다. 이 데이터는 알림 시점에만 접근 가능하고 이후 복구 불가.
265: ## 8. 스킬에 포함하지 않을 것
268: - 스킬 생성 과정의 메타 정보 (테스트 결과, 반복 이력)
274: ## 9. 스킬 재사용 설계
287: ### 어디까지 일반화할지
291: 예: "fintech 리스크 평가 PDF" 스킬
295: | fintech 종속 제거 | "평가 결과 PDF" — 책임 범위가 평가 리포트면 여기서 멈춤 |
296: | 평가 종속 제거 | "PDF 포매팅" — 이미 존재한다면 별개 스킬 생성하지 말고 재사용 |
298: 책임 범위가 "fintech 리스크 평가"로 의도된 특화라면 일반화하지 않고 별개 스킬로 유지한다.
## skill
3: description: "하네스(에이전트 팀 + 스킬)를 구성·확장·점검하는 메타 스킬 (myharness · /myharness · $myharness). 신규 도메인/프로젝트 자동화 체계 구축, 기존 하네스 재구성·운영·유지보수에 사용. 트리거 — KO: '하네스 구성/구축/설계/엔지니어링', '하네스 점검/감사/현황', '에이전트·스킬 동기화'; EN: 'build a harness for this project', 'build/design an agent team', 'scaffold agents and skills', 'audit the harness'; JA: 'ハーネスを構成して', 'ハーネスを設計', 'エージェントチームを作成', 'ハーネスを点検'."
6: # Harness — The Team-Architecture Factory
13: 5. **품질 게이트 2층 (코드/설계 도메인).** *내부* 생성-검증(같은 세션 QA)과 *외부* 리뷰 루프(codex/gemini 독립 검증)를 병행한다. 같은 컨텍스트 QA는 같은 맹점을 공유하므로 외부 독립 관점이 추가 결함을 잡는다. 단 합의=정답 아님 — 판정 권위는 오케스트레이터. 상세: `references/external-review-loop.md`.
16: 8. **듀얼 런타임 (Claude Code + Codex).** 두 런타임 거의 대칭(둘 다 skills·agents·MCP·hooks). SKILL.md 포맷 동일이라 정본 공유, 어댑터로 분기할 것만: 진입점(plugin.json+CLAUDE.md / AGENTS.md), 스킬 경로(`.claude/skills/` / `.agents/skills/`), 에이전트(`.md` / `.codex/agents/*.toml`), 오케스트레이션(TeamCreate / Codex subagents·subprocess). 생성 시 양쪽 출력. 상세·검증: `references/runtime-adapters.md`.
18: ## 워크플로우
20: ### Phase 0: 현황 감사
28:    - **운영/유지보수**: 기존 하네스의 감사·수정·동기화 요청 → Phase 7-5 운영/유지보수 워크플로우로 이동
39: ### Phase 1: 도메인 분석
41: 2. 핵심 작업 유형 식별 (생성, 검증, 편집, 분석 등)
43: 4. 프로젝트 코드베이스 탐색 — 기술 스택, 데이터 모델, 주요 모듈 파악
44: 5. **사용자 숙련도 감지** — 대화의 맥락 단서(사용 용어, 질문 수준)로 기술 수준을 파악하고, 이후 커뮤니케이션 톤을 조절한다. 코딩 경험이 적은 사용자에게는 "assertion", "JSON schema" 같은 용어를 설명 없이 쓰지 않는다.
46: ### Phase 2: 팀 아키텍처 설계
48: #### 2-1. 실행 모드 선택
65: #### 2-2. 아키텍처 패턴 선택
72:    - **생성-검증**: 생성 후 품질 검수
76: #### 2-3. 에이전트 분리 기준
80: ### Phase 3: 에이전트 정의 생성
84: #### 3-0. 기존 에이전트 중복 검토
97: **모델 설정(라우팅 — 비용 통제):** 설계·판정·구현 등 **고추론** 작업만 `model: "opus"`(Claude). 단순 작업(grep·구조 검증·트리거 eval·파일 감사)은 **경량 모델**로 라우팅해 비용 절감. 대규모 팀 실행 전 예상 토큰/비용을 보고·승인받는다. Codex 런타임은 `.codex/agents/*.toml`·내장 `worker`/`explorer`의 현재 모델/설정값을 사용.
106: - QA 에이전트는 `general-purpose` 타입을 사용하라 (`Explore`는 읽기 전용이므로 검증 스크립트 실행 불가)
111: #### 3-1. 교리 주입 (코드/수정 에이전트)
119: ### Phase 4: 스킬 생성
123: #### 4-0. 기존 스킬 중복 검토
129: #### 4-1. 스킬 구조
142: #### 4-2. Description 작성 — 적극적 트리거 유도
146: #### 4-3. 본문 작성 원칙
156: #### 4-4. Progressive Disclosure (단계적 정보 공개)
180: #### 4-5. 스킬-에이전트 연결 원칙
186: > 상세 작성 패턴, 예시, 데이터 스키마 표준은 `references/skill-writing-guide.md` 참조.
188: #### 4-6. 외부 리뷰 스킬 생성 (코드/설계 — 도구 연동 확인 후)
191: 1. **점검:** `bash skills/myharness/scripts/check-review-tools.sh` → 끝줄 `AVAILABLE:`. **none**=스킬 생성 안 함(내부 QA만, 보고서·CLAUDE.md에 "도구 미연동 생략" 명시) / **하나만**=그 도구만 쓰는 저하 모드 생성 / **둘 다**=풀 생성.
192: 2. **생성:** `references/external-review-loop.md`(방법론 겸 템플릿)를 타겟 `.claude/skills/external-review-loop/SKILL.md`(듀얼 런타임이면 `.agents/skills/external-review-loop/`에도)로 생성(frontmatter 포함). `check-review-tools.sh`도 그 스킬 `scripts/`로 복사(런타임 폴백).
195: ### Phase 5: 통합 및 오케스트레이션
199: **기존 확장 시 오케스트레이터 수정:** 신규 구축이 아닌 기존 확장일 때는 오케스트레이터를 새로 생성하지 않고 기존 오케스트레이터를 수정한다. 에이전트 추가 시 팀 구성·작업 할당·데이터 흐름에 새 에이전트를 반영하고, description에 새 에이전트 관련 트리거 키워드를 추가한다.
203: #### 5-0. 오케스트레이터 패턴 (모드별)
216: - **팀 생성(팀) → 검증(서브)**: Phase 2에서 팀이 초안 생성 → Phase 3에서 단일 서브 에이전트가 독립 검증
221: #### 5-1. 데이터 전달 프로토콜
223: 오케스트레이터 내에 에이전트 간 데이터 전달 방식을 명시한다:
229: | **파일 기반** | 약속된 경로에 파일을 쓰고 읽음 | 팀 + 서브 | 대용량 데이터, 구조화된 산출물, 감사 추적 필요 |
238: - 파일명 컨벤션: `{phase}_{agent}_{artifact}.{ext}` (예: `01_analyst_requirements.md`)
239: - 최종 산출물만 사용자 지정 경로에 출력, 중간 파일(`_workspace/`)은 보존 (사후 검증·감사 추적용)
242: #### 5-2. 에러 핸들링
244: 오케스트레이터 내에 에러 처리 방침을 포함한다. 핵심 원칙: 1회 재시도 후 재실패 시 해당 결과 없이 진행(보고서에 누락 명시), 상충 데이터는 삭제하지 않고 출처 병기.
248: #### 5-3. 팀 크기 가이드라인
257: > **동시성 cap(백프레셔):** 동시 실행 기본 3·최대 5, 외부 리뷰는 별도 2. 초과는 큐잉. 대규모 fan-out의 리소스·API quota·토큰 폭증 방지 (`references/orchestrator-template.md` 동시성 정책).
259: #### 5-4. CLAUDE.md 하네스 포인터 등록
266: ## 하네스: {도메인명}
282: #### 5-5. 후속 작업 지원
305: #### 5-6. 품질 게이트 (코드/설계 도메인)
307: 내부 생성-검증(QA 에이전트)에 더해, 단계 산출물마다 외부 리뷰 게이트를 건다. 무차별 적용은 과의식이므로 **리스크 등급으로 강도를 맞춘다.**
312: | 표준 | 다파일·기능 추가 | 내부 QA + 외부리뷰 **1회**(단계 끝) |
313: | 중대 | 계약 변경·비가역·다도메인 | **단계마다** 외부리뷰 + 승인 사다리(PRD→계획서→실행: 각 관문마다 사용자 승인+외부리뷰, 반려 시 해당 단계 재작업; 승인 관문 절차는 external-review-loop Step 7 준용) |
315: **단계 마감 게이트(표준·중대):** 오케스트레이터가 `external-review-loop` 스킬 호출 — **라운드 반복 루프**(codex/gemini 병렬 → 판정 → 확인분만 TDD 수정·게이트 → 수정 diff 재리뷰). **loop-until-dry**(신규 확인 0건 K회 연속) 또는 MAX_ROUNDS에서 종료. 판정 원장(`verdicts.json`)으로 신규만 판정. 근거 수집은 위임 가능하나 **최종 확정은 오케스트레이터 비위임**. 상세: `references/external-review-loop.md`.
319: - **자율 노브:** `프로젝트/_workspace/.autonomous` 마커(또는 "자율로"·"승인 생략" 발화) 시 승인 자동 통과 → 커밋. 권한모드(bypassPermissions)는 스킬이 못 읽으므로 마커/발화로 명시. 마커 ON이어도 외부리뷰·판정·게이트는 그대로(인간 승인 한 스텝만 생략).
320: - **push는 자율이어도 기본 대기**(외부 송출·되돌리기 어려움) — `_workspace/.autonomous-push` 마커 시만 자동.
322: **리뷰 예산(비용·지연 통제):** run당 외부 리뷰 횟수 상한을 두고, **코드 변경 없으면 게이트 생략(skip-when-no-delta)**. 검증된 반복 구간은 `_workspace/.fast-pass` 마커로 우회. 이슈 다수(10+)면 판정 보조로 일괄 처리해 오케스트레이터 컨텍스트 비대화를 막는다.
324: ### Phase 6: 검증 및 테스트
326: 생성된 하네스를 검증한다. 상세 테스트 방법론은 `references/skill-testing-guide.md` 참조.
328: #### 6-1. 구조 검증
331: - 스킬의 frontmatter(name, description) 검증
335: #### 6-2. 실행 모드별 검증
339: - **하이브리드**: 각 Phase의 실행 모드가 오케스트레이터에 명시되었는지, Phase 경계에서 데이터 전달이 끊기지 않는지 확인 (팀 → 서브 전환 시 팀의 산출물이 서브의 입력으로 연결되는지)
341: #### 6-3. 스킬 실행 테스트
351:    - **Without-skill (baseline)**: 같은 프롬프트를 스킬 없이 수행
353: 3. **결과 평가** — 산출물의 품질을 정성적(사용자 리뷰) + 정량적(assertion 기반) 으로 평가한다. 산출물이 객관적으로 검증 가능한 경우(파일 생성, 데이터 추출 등) assertion을 정의하고, 주관적인 경우(문체, 디자인) 사용자 피드백에 의존한다.
355: 4. **반복 개선 루프** — 테스트 결과에서 문제가 발견되면:
362: #### 6-4. 트리거 검증
364: 각 스킬의 description이 올바르게 트리거되는지 검증한다:
373: #### 6-5. 드라이런 테스트
376: - 데이터 전달 경로에 빈 구간(dead link)이 없는지 확인
380: #### 6-6. 테스트 시나리오 작성
385: ### Phase 7: 하네스 진화
389: #### 7-1. 실행 후 피드백 수집
397: #### 7-2. 피드백 반영 경로
405: | 워크플로우 순서 | 오케스트레이터 스킬 | "검증을 먼저 해야" → Phase 순서 변경 |
409: #### 7-3. 변경 이력
418: | 2026-04-07 | QA 에이전트 추가 | agents/qa.md | 산출물 품질 검증 부족 피드백 |
424: #### 7-4. 진화 트리거
431: #### 7-5. 운영/유지보수 워크플로우
447: **Step 4: 변경 검증**
448: - 수정된 에이전트/스킬의 구조 검증 (Phase 6-1 기준)
449: - 수정 범위가 트리거에 영향을 주면 트리거 검증 (Phase 6-4 기준)
453: #### 7-6. 런타임 동기화 (듀얼 런타임 — drift 방지)
456: ## 산출물 체크리스트
461: - [ ] 오케스트레이터 스킬 1개 (데이터 흐름 + 에러 핸들링 + 테스트 시나리오 포함)
469: - [ ] 테스트 프롬프트 2~3개 실행 검증 + 트리거 검증(should/should-NOT) 완료
472: - [ ] (듀얼 런타임) `.codex/agents/*.toml` 생성 + `.claude`↔`.codex` 역할 동등성 + `.agents/skills/` references/scripts 동봉 검증
474: - [ ] (코드/설계) **codex/gemini 연동 점검**(`check-review-tools.sh`) 후 `external-review-loop` 스킬 생성 — 도구 전무면 생략(불필요 스킬 방지) + 단계 게이트 배선, 단계마다 리스크 등급 판정 (Phase 4-6, 5-6)
479: ## 참고
484: - **스킬 작성 가이드**: `references/skill-writing-guide.md` — 작성 패턴, 예시, 데이터 스키마 표준
485: - **스킬 테스트 가이드**: `references/skill-testing-guide.md` — 테스트/평가/반복 개선 방법론
486: - **QA 에이전트 가이드**: `references/qa-agent-guide.md` — 빌드 하네스에 QA 에이전트를 포함할 때 참조. 통합 정합성 검증 방법론, 경계면 버그 패턴, QA 에이전트 정의 템플릿 포함. 실제 프로젝트에서 발견된 7개 버그 사례 기반.
487: - **외부 리뷰 루프**: `references/external-review-loop.md` — codex/gemini 독립 검증 단계 게이트. 방법론 겸 생성 템플릿. **루프 제어(loop-until-dry·MAX_ROUNDS·라운드 카운터)·판정 원장(verdicts.json, dedup vs seen)·수정본 재리뷰·근거수집 위임/확정 비위임**·기각 사유표·커밋 순서·자율 노브 포함.
489: - **런타임 어댑터**: `references/runtime-adapters.md` — Claude Code/Codex 듀얼 런타임 설계. 진입점·오케스트레이션 매핑, AGENTS.md·`.agents/skills/` 생성, 설치(Codex 공식 docs 검증).

hook: PostToolUse Completed
hook: PostToolUse Completed
codex
핵심 구조는 확인했습니다. 이제 산식·스키마 충돌 판단에 필요한 좁은 라인 범위만 더 봅니다.
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
exec
/bin/zsh -lc "awk 'NR>=205&&NR<=263{print NR \": \" "'$0}'"' skills/myharness/references/skill-writing-guide.md" in /Users/junghojang/Developments/myProject/myHarness
exec
/bin/zsh -lc "awk 'NR>=139&&NR<=164{print NR \": \" "'$0}'"' skills/myharness/references/skill-testing-guide.md" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
139: ### 4-4. 채점 결과 스키마
140: 
141: ```json
142: {
143:   "expectations": [
144:     {
145:       "text": "이익률 열이 추가됨",
146:       "passed": true,
147:       "evidence": "E열에 'profit_margin_pct' 열 확인"
148:     },
149:     {
150:       "text": "이익률 기준 내림차순 정렬",
151:       "passed": false,
152:       "evidence": "정렬 없이 원본 순서 유지됨"
153:     }
154:   ],
155:   "summary": {
156:     "passed": 1,
157:     "failed": 1,
158:     "total": 2,
159:     "pass_rate": 0.50
160:   }
161: }
162: ```
163: 
164: ---

 succeeded in 0ms:
205: ## 7. 데이터 스키마 표준
206: 
207: 스킬 간 데이터 교환의 일관성을 위해 표준 스키마를 사용한다. 하네스에서 생성하는 스킬의 테스트/평가에 사용할 수 있다.
208: 
209: ### eval_metadata.json
210: 
211: 각 테스트 케이스의 메타데이터:
212: 
213: ```json
214: {
215:   "eval_id": 0,
216:   "eval_name": "descriptive-name-here",
217:   "prompt": "사용자의 작업 프롬프트",
218:   "assertions": [
219:     "산출물에 X가 포함되어 있다",
220:     "Y 형식으로 파일이 생성되었다"
221:   ]
222: }
223: ```
224: 
225: ### grading.json
226: 
227: assertion 기반 채점 결과:
228: 
229: ```json
230: {
231:   "expectations": [
232:     {
233:       "text": "산출물에 '서울'이 포함됨",
234:       "passed": true,
235:       "evidence": "3번째 단계에서 '서울 지역 데이터 추출' 확인"
236:     }
237:   ],
238:   "summary": {
239:     "passed": 2,
240:     "failed": 1,
241:     "total": 3,
242:     "pass_rate": 0.67
243:   }
244: }
245: ```
246: 
247: **필드명 주의:** `text`, `passed`, `evidence`를 정확히 사용한다 (`name`/`met`/`details` 등 변형 금지).
248: 
249: ### timing.json
250: 
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

hook: PostToolUse
hook: PostToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
/bin/zsh -lc "awk 'NR>=385&&NR<=430{print NR \": \" "'$0}'"' skills/myharness/SKILL.md" in /Users/junghojang/Developments/myProject/myHarness
exec
/bin/zsh -lc "awk 'NR>=1&&NR<=25{print NR \": \" "'$0}'"' _workspace/reviews/eval-proposal_artifact.md" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
1: # 제안: external-review-loop 자체 평가 닫힌 고리 (리뷰 대상)
2: 
3: 대상 컨텍스트: 이 레포 `skills/myharness/` 하네스 팩토리. external-review-loop는 라운드 반복 루프(loop-until-dry + MAX_ROUNDS + verdicts 원장 + 수정본 재리뷰)로 이미 구현됨. 아래는 그 위에 "자체 평가→흐름 개선" 닫힌 고리를 추가하려는 제안.
4: 
5: ## 갭
6: 1. [critical] 루프 자체 평가 부재 — 수렴만 하고 자기 성과(리뷰어 정밀도=확인/(확인+기각)·수렴 라운드수·확인당 비용·오탐률·라운드별 신규 곡선) 미측정. 리뷰 프롬프트/도구 품질·루프 건강 모름.
7: 2. [high] 수렴 ≠ 품질 — loop-until-dry "신규 0건"은 부재 신호. 리뷰어 소진인지 실품질 상승인지 구분 못 함. 종료에 양의 품질 신호(게이트 PASS + assertion 통과율 ≥ θ) 필요. converged-good/exhausted/max-rounds 라벨.
8: 3. [high] 평가 결과 미영속·미추세 — eval 스키마(eval_metadata/grading/timing)는 있으나 루프에 미배선. 매 실행 고립 → 추세·회귀 감지 불가.
9: 4. [high] 평가→흐름 자동 환류 부재 — Phase 7-4 트리거가 관찰적. 수치 임계 자동 발화 없음. 추세 데이터 소스 없음.
10: 5. [med] 판정 보정 없음 — 확인/기각 사후 검증 없음 → 기각 사유표·리뷰어 신뢰도 미교정.
11: 6. [med] 테스트 루프 수렴 지표 모호 — "의미 있는 개선 없을 때까지" → assertion 통과율 델타 < ε 수치화 + scorecard 연동.
12: 
13: ## 핵심 제안
14: - P1. 루프 self-eval scorecard — 각 루프가 `_workspace/eval/{loop}_{단계ID}.json` 발행. external-review: rounds_to_converge·reviewer_precision·confirmed/partial/deferred/rejected·new_per_round·cost_tokens·gate_pass·false_positive_rate. build/test: assertion_pass_rate·with/without_delta·regression_flags. (grading.json 재사용)
15: - P2. 수렴 품질 신호 — 종료 = (신규 확인 0건 K회) AND (게이트 PASS + assertion 통과율 ≥ θ). 종료사유 라벨.
16: - P3. 자체 평가 스텝 → 흐름 제안 — 루프 끝 scorecard 점수화 → 롤링 베이스라인 대비 → 악화 시 흐름 개선안 자동 emit(프롬프트 튜닝/게이트 강도/QA 체크 추가/에이전트 분리).
17: - P4. Phase 7-4 수치 트리거 — 누적 scorecard로 reviewer_precision<θ, rounds 상승, 동일 경계 N회 실패, 확인당 비용 상승 시 진화 발화.
18: - P5. 판정 보정 — 사후 기각/이월 표본 재점검 → 틀린 기각이면 사유표·신뢰도 교정.
19: - P6. 테스트 루프 수렴 수치화 — assertion 통과율 델타 < ε 종료 + scorecard.

 succeeded in 0ms:
385: ### Phase 7: 하네스 진화
386: 
387: 하네스는 한 번 만들고 끝나는 정적 산출물이 아니다. 사용자 피드백에 따라 계속 진화하는 시스템이다.
388: 
389: #### 7-1. 실행 후 피드백 수집
390: 
391: 매 하네스 실행 완료 후, 사용자에게 피드백을 요청한다:
392: - "결과에서 개선할 부분이 있나요?"
393: - "에이전트 팀 구성이나 워크플로우에 바꾸고 싶은 점이 있나요?"
394: 
395: 피드백이 없으면 넘어간다. 강요하지 않되, 반드시 기회를 제공한다.
396: 
397: #### 7-2. 피드백 반영 경로
398: 
399: 피드백 유형에 따라 수정 대상이 다르다:
400: 
401: | 피드백 유형 | 수정 대상 | 예시 |
402: |-----------|----------|------|
403: | 결과물 품질 | 해당 에이전트의 스킬 | "분석이 너무 피상적" → 스킬에 깊이 기준 추가 |
404: | 에이전트 역할 | 에이전트 정의 `.md` | "보안 검토도 필요" → 새 에이전트 추가 |
405: | 워크플로우 순서 | 오케스트레이터 스킬 | "검증을 먼저 해야" → Phase 순서 변경 |
406: | 팀 구성 | 오케스트레이터 + 에이전트 | "이 둘은 합쳐도 될 듯" → 에이전트 병합 |
407: | 트리거 누락 | 스킬 description | "이 표현으로 하면 작동 안 함" → description 확장 |
408: 
409: #### 7-3. 변경 이력
410: 
411: 모든 변경은 CLAUDE.md의 **변경 이력** 테이블에 기록한다 (Phase 5-4 템플릿의 "변경 이력" 섹션과 동일 테이블):
412: 
413: ```markdown
414: **변경 이력:**
415: | 날짜 | 변경 내용 | 대상 | 사유 |
416: |------|----------|------|------|
417: | 2026-04-05 | 초기 구성 | 전체 | - |
418: | 2026-04-07 | QA 에이전트 추가 | agents/qa.md | 산출물 품질 검증 부족 피드백 |
419: | 2026-04-10 | 톤 가이드 추가 | skills/content-creator | "너무 딱딱하다" 피드백 |
420: ```
421: 
422: 이 이력을 통해 하네스가 어떤 방향으로 진화했는지 추적하고, 퇴행(regression)을 방지한다.
423: 
424: #### 7-4. 진화 트리거
425: 
426: 사용자가 명시적으로 "하네스 수정해줘"라고 할 때만이 아니라, 다음 상황에서도 진화를 제안한다:
427: - 같은 유형의 피드백이 2회 이상 반복될 때
428: - 에이전트가 반복적으로 실패하는 패턴이 발견될 때
429: - 사용자가 오케스트레이터를 우회하여 수동으로 작업하는 것이 관찰될 때
430: 

exec
/bin/zsh -lc "awk 'NR>=23&&NR<=40{print NR \": \" "'$0} NR>=75&&NR<=104{print NR ": " $0}'"' skills/myharness/references/external-review-loop.md" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
23: ## 루프 제어 (수렴·종료 — 무한 루프/미검증 방지)
24: 이 게이트는 **라운드 반복 루프**다. 단일 패스가 아니다.
25: 
26: ```
27: round = 1; dry_streak = 0
28: while True:
29:   Step 1~4 (round==1: {산출물} 전체 / round>1: 직전 수정분 diff만 좁게 재리뷰)
30:   신규_확인 = 이번 라운드 '확인/부분' 중 verdicts 원장에 없던 것
31:   if 신규_확인 == 0: dry_streak += 1
32:   else: dry_streak = 0; Step 5~7 (신규_확인만 수정·게이트·기록)
33:   if dry_streak >= K(기본 1, 중대 2): break        # loop-until-dry
34:   if round >= MAX_ROUNDS(기본 3): break + 잔여 미수렴 보고
35:   round += 1
36: ```
37: - **K회 연속 신규 확인 0건**이면 수렴 종료. **MAX_ROUNDS 도달 시 강제 종료 + 미수렴 이슈 보고**(무한 루프 차단).
38: - **수정본 재리뷰(req)**: round>1은 이전 라운드 수정 diff만 좁게 재리뷰 → 수정이 새 결함을 만들지 검증(같은 맹점 회피 전제가 수정에도 적용).
39: - **판정 원장(req)**: `_workspace/reviews/{단계ID}_verdicts.json` — 이슈지문(파일+결함요지 해시)→ 판정·라운드·근거. 매 라운드 **seen 대조로 신규만 판정**(기각 이슈 재부상 방지, dedup vs seen).
40: 
75: ## Step 3 — 이슈 통합 + 원장 대조
76: 두 출력에서 이슈 추출 → 중복 병합(동일 대상·동일 결함=1건, 출처 병기) → 번호 재부여. **`verdicts.json` 원장과 대조해 이미 판정된(기각/이월/기수정) 이슈는 제외하고 신규만 Step 4로** (dedup vs seen). 리뷰 보고 0건이면 "외부 리뷰 — 이슈 0건" 기록, dry_streak +1.
77: 
78: ## Step 4 — 전건 판정 (근거수집 위임 가능 · 최종 확정 비위임)
79: 신규 이슈마다 실코드/실문서 대조(grep/Read) 후 판정. **이슈 10+건이면 이슈별/배치로 판정 보조 에이전트에 위임** — 보조는 실코드 대조 근거 + 판정 *초안(draft)*만 반환(쓰기 금지). 오케스트레이터는 초안을 받아 **최종 확정(confirm)**만 직접 수행(권위 비위임). 판정 결과는 `verdicts.json`에 기록(이슈지문·판정·라운드·근거).
80: 
81: | 판정 | 기준 | 처리 |
82: |------|------|------|
83: | **확인** | 결함 재현/실재 | Step 5 수정 |
84: | **부분 확인** | 지적 실재하나 권고 과잉/계약 위배 | 비파괴 범위만 + 잔여 기각 근거 |
85: | **이월** | 타당하나 본 단계 범위 외 | 백로그 위치 명기 — 기각과 구분 |
86: | **기각** | 사유표 | 근거 명시(코드/정본 인용) — 삭제 금지 |
87: 
88: **기각 사유표:** 동결 계약 위배 · 설계 정본 명시 결정 · 기구현 오판(호출 형태만 보고 오판) · YAGNI/과설계 · 리뷰어 자인 비병목 · 기존 설계와 상충(멱등·격리 등).
89: 
90: ## Step 5 — 확인분 TDD 수정 (확인 0건이면 생략)
91: **'확인/부분 확인'이 0건이면 Step 5~7을 생략**하고 판정 기록만 남긴 뒤 dry_streak +1로 루프 제어로 복귀(전부 기각/이월인데 수정·게이트 도는 낭비 방지). 확인분이 있으면: `tdd-doctrine.md` 규율(Red→Green→Refactor, 구조/행위 분리). 다중 에이전트 병렬 시 파일권 명시 분리(병렬 충돌 = 1차 실패 주원인). 에이전트는 커밋·브랜치 금지, status는 `_workspace/status/`.
92: 
93: ## Step 6 — 통합 게이트
94: `{게이트명령}` 실행 → PASS. 게이트 없으면(설계서) 정본 정합성 재확인으로 대체. 테스트 리소스 간섭 게이트는 동시 실행 금지.
95: 
96: ## Step 7 — 기록·커밋 (커밋 순서·자율 노브)
97: 1. 결과서에 `## 외부 리뷰 반영 ({일자} — {단계ID} {k}건)` § — 판정표·게이트 수치·출처(codex/gemini).
98: 2. 순서: 게이트 PASS → **승인 관문** → 단일 커밋(`fix: 외부 리뷰 {k}건 — {요지}`, Co-Authored-By).
99:    - 승인 관문 기본: 사용자 대기. `_workspace/.autonomous` 마커(또는 "자율로" 발화) 시 자동 통과.
100:    - **push는 자율이어도 기본 대기** — `_workspace/.autonomous-push` 마커 시만 자동.
101:    - 권한모드(bypassPermissions)는 스킬이 못 읽으므로 마커/발화로 명시. 마커 ON이어도 리뷰·판정·게이트는 그대로(인간 승인 한 스텝만 생략).
102: 
103: ## 재진입 (루프 라운드 = 재진입)
104: 재진입은 위 **루프 제어**의 라운드 반복으로 일원화한다. round>1은 직전 수정분 diff만 좁게 재리뷰하고, `verdicts.json` seen 대조로 기수정·기각 이슈는 다시 판정하지 않는다("기수정 확인"은 원장+게이트 재실행으로 갈음). 사용자가 동일 목록을 수동 재제출해도 원장 대조 → 신규만 판정.

hook: PostToolUse
hook: PostToolUse
hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
codex
[critical] P2 종료 조건이 설계 산출물에서 성립 불가
- 현황: external-review-loop Step 6은 코드 게이트가 없으면 “정본 정합성 재확인”으로 대체된다. `grading.json`/assertion pass rate는 스킬 테스트용 스키마다.
- 이슈: `게이트 PASS + assertion 통과율 ≥ θ`를 모든 external-review 종료 조건에 넣으면 설계 리뷰, 문서 리뷰, 게이트 없는 단계에서 측정값이 없다. 신규 확인 0건이어도 종료 못 하거나 MAX_ROUNDS까지 헛돈다.
- 권고: P2는 종료 조건이 아니라 “가능한 경우 보조 품질 라벨”로 낮춘다. 코드/테스트 단계만 `gate_pass`, assertion 기반 eval이 존재하는 단계만 `assertion_pass_rate` 적용. 설계 단계는 `verdicts.json` 완료 + 정본 대조 체크리스트로 별도 판정.

[high] 기존 eval 스키마 재사용 주장이 실제 스키마와 맞지 않음
- 현황: `eval_metadata.json`은 테스트 케이스 메타데이터, `grading.json`은 `expectations[].text/passed/evidence`와 `summary.pass_rate`, `timing.json`은 `total_tokens/duration_ms` 구조다.
- 이슈: P1 scorecard의 `rounds_to_converge`, `reviewer_precision`, `new_per_round`, `confirmed/partial/deferred/rejected`, `false_positive_rate`는 `grading.json` 필드가 아니다. “grading.json 재사용”으로 넣으면 표준 필드명 주의와 충돌한다.
- 권고: `loop_scorecard.json` 같은 신규 스키마를 정의하고, `grading.json`은 assertion 결과가 있을 때만 링크/참조한다. 예: `{schema_version, loop_id, stage_id, verdict_counts, rounds, costs, gate, linked_grading_path, linked_timing_path}`.

[high] `reviewer_precision` 산식이 리뷰어 정밀도를 제대로 측정하지 못함
- 현황: 제안은 `확인/(확인+기각)`을 리뷰어 정밀도로 본다.
- 이슈: `부분 확인`, `이월`, 중복 병합, 이미 seen 처리된 이슈, codex/gemini 출처별 기여도가 빠진다. 병합 후 단일 이슈가 여러 리뷰어 출처를 가지면 “어느 리뷰어의 precision인지”도 불명확하다.
- 권고: 최소 단위 정의 필요. `issue_source_claim` 단위로 `reviewer_id`, `issue_fingerprint`, `verdict`를 저장하고, precision은 `confirmed + partial_weight*partial` / `adjudicated_non_deferred`처럼 계산한다. `deferred`는 precision 분모에서 제외하거나 별도 `deferral_rate`로 분리한다.

[high] `false_positive_rate`가 정의되지 않았고 precision과 중복됨
- 현황: P1은 `false_positive_rate`를 별도 메트릭으로 제안하지만 산식이 없다.
- 이슈: 단순히 `rejected / reported`라면 `1 - precision`의 변형이다. `partial`, `deferred`, duplicate, seen 재부상 포함 여부에 따라 값이 크게 달라진다.
- 권고: 중복 메트릭 제거 또는 명확히 분리. 예: `rejected_rate = rejected / adjudicated_new_claims`, `duplicate_rate`, `deferred_rate`를 별도 기록. “false positive”라는 이름은 사후 확정 가능한 경우에만 사용.

[high] 루프 품질의 핵심인 false negative/recall 측정이 빠짐
- 현황: 제안은 precision, 오탐률, 수렴 라운드, 비용 중심이다.
- 이슈: 리뷰어가 아무 이슈도 안 내면 precision/오탐은 좋아 보일 수 있다. 실제 결함을 놓친 비율은 측정하지 못한다. “수렴 ≠ 품질” 문제를 해결한다고 하지만 miss rate를 보지 않아 품질 신호가 반쪽이다.
- 권고: 표본 기반 사후 감사, known-seeded defects, regression 발견 후 원인 역추적 같은 `missed_defect_rate` 계열을 추가한다. 없으면 자동 환류는 “리뷰어 건강”이 아니라 “판정된 보고 품질”로만 명명한다.

[high] P3/P4 자동 환류가 자기강화 편향을 만들 수 있음
- 현황: 악화 시 프롬프트 튜닝, 게이트 강도, QA 체크, 에이전트 분리를 자동 emit/발화한다.
- 이슈: 같은 루프가 만든 지표로 같은 루프를 조정하면 정밀도만 높이려고 리뷰어가 애매한 이슈를 덜 보고하거나, 비용 절감 방향으로 검증 강도가 약해지는 식의 Goodhart 문제가 생긴다.
- 권고: 자동 “적용”이 아니라 자동 “제안”으로 제한하고, 적용 전 외부 독립 검토나 사용자 승인 게이트를 둔다. 변경 후에는 holdout 시나리오/기존 회귀 케이스에서 검증한다.

[med] θ, ε, N 임계값 근거가 없음
- 현황: P2/P4/P6가 `θ`, `ε`, `N`을 사용한다.
- 이슈: 단계 위험도, 산출물 종류, 리뷰어 수, 샘플 크기별로 적정값이 다르다. 작은 표본에서 `reviewer_precision<θ`는 노이즈에 취약하다.
- 권고: 초기값을 고정 자동화하지 말고 관찰 전용으로 시작한다. 최소 표본수, 신뢰구간, 리스크 등급별 기본값을 둔다. 예: `min_adjudicated_claims >= 20` 전에는 트리거 금지.

[med] `rounds_to_converge`는 품질보다 설정값/난이도 영향을 크게 받음
- 현황: 수렴 라운드 상승을 악화 신호로 본다.
- 이슈: K, MAX_ROUNDS, 변경 규모, diff-only 재리뷰 범위, 중대 단계 여부에 따라 라운드 수가 바뀐다. 단순 상승은 품질 저하가 아니라 난이도 증가일 수 있다.
- 권고: `changed_files`, `diff_lines`, `risk_level`, `initial_issue_count`로 정규화한다. 원시 라운드 수는 보조 지표로만 사용한다.

[med] cost 지표가 0건/설계 리뷰에서 불안정함
- 현황: 확인당 비용 상승을 P4 트리거로 둔다.
- 이슈: 확인 0건이면 분모가 0이다. 결함이 적은 좋은 산출물일수록 확인당 비용이 무한대/미정으로 보일 수 있다.
- 권고: `cost_per_confirmed`는 confirmed>0일 때만 계산하고, 항상 `cost_per_review_run`, `cost_per_adjudicated_claim`, `cost_per_changed_loc` 같은 안정 지표와 함께 본다.

[med] P5 판정 보정이 독립성을 보장하지 않음
- 현황: 기각/이월 표본을 사후 재점검해 틀린 기각이면 사유표·신뢰도 교정한다.
- 이슈: 같은 오케스트레이터와 같은 근거수집 방식으로 재점검하면 최초 판정 편향을 반복할 수 있다. “틀린 기각”의 기준도 사후 버그 발견인지, 사용자 반박인지, 별도 리뷰인지 불명확하다.
- 권고: 재점검 트리거와 판정 권위를 분리한다. 사용자 반박, 후속 결함, 독립 리뷰어 샘플 감사 중 하나가 있을 때만 보정하고, `overturned_rejection_rate`로 별도 기록한다.

[med] 메타 루프 비용 대비 효과가 과함
- 현황: P1~P6는 scorecard, rolling baseline, 자동 제안, 수치 트리거, 판정 보정까지 한 번에 추가한다.
- 이슈: external-review-loop 자체가 이미 codex/gemini 실행, 판정 원장, 재리뷰, 게이트를 포함한다. 여기에 자동 진화 루프를 얹으면 운영 복잡도와 토큰 비용이 크게 는다.
- 권고: 1단계는 P1의 최소 로깅만 구현한다. 2단계는 수동 리포트. 3단계에서 충분한 데이터가 쌓인 뒤 P4 트리거를 “제안”으로 추가한다. P3 자동 흐름 개선은 마지막 단계로 둔다.

[low] `_workspace/eval/{loop}_{단계ID}.json` 경로가 기존 구조와 어긋날 수 있음
- 현황: 테스트 가이드는 `_workspace/evals/.../eval_metadata.json`, `with_skill/timing.json`, `grading.json` 구조를 예시로 든다.
- 이슈: 단일 scorecard 파일 경로는 기존 eval 케이스 구조와 섞일 때 검색/집계 규칙이 애매하다.
- 권고: `_workspace/evals/external-review/{stage_id}/{run_id}/scorecard.json`처럼 실행 단위 디렉터리를 둔다. 기존 `grading.json`, `timing.json`, `verdicts.json`은 링크로 연결한다.

[low] “테스트 루프 수렴”과 “외부 리뷰 루프 수렴”이 섞임
- 현황: P6는 assertion 통과율 델타 `< ε` 종료를 scorecard에 연결한다.
- 이슈: skill-testing 반복 개선 루프와 external-review-loop는 목적과 입력이 다르다. 하나의 수렴 규칙으로 묶으면 리뷰 게이트 종료와 스킬 테스트 종료가 혼동된다.
- 권고: P6는 external-review-loop 변경안에서 분리해 skill-testing-guide 개선안으로 별도 제안한다. 공통으로 쓸 것은 scorecard 링크 규약 정도만 둔다.
hook: Stop
hook: Stop Completed
tokens used
52,554
[critical] P2 종료 조건이 설계 산출물에서 성립 불가
- 현황: external-review-loop Step 6은 코드 게이트가 없으면 “정본 정합성 재확인”으로 대체된다. `grading.json`/assertion pass rate는 스킬 테스트용 스키마다.
- 이슈: `게이트 PASS + assertion 통과율 ≥ θ`를 모든 external-review 종료 조건에 넣으면 설계 리뷰, 문서 리뷰, 게이트 없는 단계에서 측정값이 없다. 신규 확인 0건이어도 종료 못 하거나 MAX_ROUNDS까지 헛돈다.
- 권고: P2는 종료 조건이 아니라 “가능한 경우 보조 품질 라벨”로 낮춘다. 코드/테스트 단계만 `gate_pass`, assertion 기반 eval이 존재하는 단계만 `assertion_pass_rate` 적용. 설계 단계는 `verdicts.json` 완료 + 정본 대조 체크리스트로 별도 판정.

[high] 기존 eval 스키마 재사용 주장이 실제 스키마와 맞지 않음
- 현황: `eval_metadata.json`은 테스트 케이스 메타데이터, `grading.json`은 `expectations[].text/passed/evidence`와 `summary.pass_rate`, `timing.json`은 `total_tokens/duration_ms` 구조다.
- 이슈: P1 scorecard의 `rounds_to_converge`, `reviewer_precision`, `new_per_round`, `confirmed/partial/deferred/rejected`, `false_positive_rate`는 `grading.json` 필드가 아니다. “grading.json 재사용”으로 넣으면 표준 필드명 주의와 충돌한다.
- 권고: `loop_scorecard.json` 같은 신규 스키마를 정의하고, `grading.json`은 assertion 결과가 있을 때만 링크/참조한다. 예: `{schema_version, loop_id, stage_id, verdict_counts, rounds, costs, gate, linked_grading_path, linked_timing_path}`.

[high] `reviewer_precision` 산식이 리뷰어 정밀도를 제대로 측정하지 못함
- 현황: 제안은 `확인/(확인+기각)`을 리뷰어 정밀도로 본다.
- 이슈: `부분 확인`, `이월`, 중복 병합, 이미 seen 처리된 이슈, codex/gemini 출처별 기여도가 빠진다. 병합 후 단일 이슈가 여러 리뷰어 출처를 가지면 “어느 리뷰어의 precision인지”도 불명확하다.
- 권고: 최소 단위 정의 필요. `issue_source_claim` 단위로 `reviewer_id`, `issue_fingerprint`, `verdict`를 저장하고, precision은 `confirmed + partial_weight*partial` / `adjudicated_non_deferred`처럼 계산한다. `deferred`는 precision 분모에서 제외하거나 별도 `deferral_rate`로 분리한다.

[high] `false_positive_rate`가 정의되지 않았고 precision과 중복됨
- 현황: P1은 `false_positive_rate`를 별도 메트릭으로 제안하지만 산식이 없다.
- 이슈: 단순히 `rejected / reported`라면 `1 - precision`의 변형이다. `partial`, `deferred`, duplicate, seen 재부상 포함 여부에 따라 값이 크게 달라진다.
- 권고: 중복 메트릭 제거 또는 명확히 분리. 예: `rejected_rate = rejected / adjudicated_new_claims`, `duplicate_rate`, `deferred_rate`를 별도 기록. “false positive”라는 이름은 사후 확정 가능한 경우에만 사용.

[high] 루프 품질의 핵심인 false negative/recall 측정이 빠짐
- 현황: 제안은 precision, 오탐률, 수렴 라운드, 비용 중심이다.
- 이슈: 리뷰어가 아무 이슈도 안 내면 precision/오탐은 좋아 보일 수 있다. 실제 결함을 놓친 비율은 측정하지 못한다. “수렴 ≠ 품질” 문제를 해결한다고 하지만 miss rate를 보지 않아 품질 신호가 반쪽이다.
- 권고: 표본 기반 사후 감사, known-seeded defects, regression 발견 후 원인 역추적 같은 `missed_defect_rate` 계열을 추가한다. 없으면 자동 환류는 “리뷰어 건강”이 아니라 “판정된 보고 품질”로만 명명한다.

[high] P3/P4 자동 환류가 자기강화 편향을 만들 수 있음
- 현황: 악화 시 프롬프트 튜닝, 게이트 강도, QA 체크, 에이전트 분리를 자동 emit/발화한다.
- 이슈: 같은 루프가 만든 지표로 같은 루프를 조정하면 정밀도만 높이려고 리뷰어가 애매한 이슈를 덜 보고하거나, 비용 절감 방향으로 검증 강도가 약해지는 식의 Goodhart 문제가 생긴다.
- 권고: 자동 “적용”이 아니라 자동 “제안”으로 제한하고, 적용 전 외부 독립 검토나 사용자 승인 게이트를 둔다. 변경 후에는 holdout 시나리오/기존 회귀 케이스에서 검증한다.

[med] θ, ε, N 임계값 근거가 없음
- 현황: P2/P4/P6가 `θ`, `ε`, `N`을 사용한다.
- 이슈: 단계 위험도, 산출물 종류, 리뷰어 수, 샘플 크기별로 적정값이 다르다. 작은 표본에서 `reviewer_precision<θ`는 노이즈에 취약하다.
- 권고: 초기값을 고정 자동화하지 말고 관찰 전용으로 시작한다. 최소 표본수, 신뢰구간, 리스크 등급별 기본값을 둔다. 예: `min_adjudicated_claims >= 20` 전에는 트리거 금지.

[med] `rounds_to_converge`는 품질보다 설정값/난이도 영향을 크게 받음
- 현황: 수렴 라운드 상승을 악화 신호로 본다.
- 이슈: K, MAX_ROUNDS, 변경 규모, diff-only 재리뷰 범위, 중대 단계 여부에 따라 라운드 수가 바뀐다. 단순 상승은 품질 저하가 아니라 난이도 증가일 수 있다.
- 권고: `changed_files`, `diff_lines`, `risk_level`, `initial_issue_count`로 정규화한다. 원시 라운드 수는 보조 지표로만 사용한다.

[med] cost 지표가 0건/설계 리뷰에서 불안정함
- 현황: 확인당 비용 상승을 P4 트리거로 둔다.
- 이슈: 확인 0건이면 분모가 0이다. 결함이 적은 좋은 산출물일수록 확인당 비용이 무한대/미정으로 보일 수 있다.
- 권고: `cost_per_confirmed`는 confirmed>0일 때만 계산하고, 항상 `cost_per_review_run`, `cost_per_adjudicated_claim`, `cost_per_changed_loc` 같은 안정 지표와 함께 본다.

[med] P5 판정 보정이 독립성을 보장하지 않음
- 현황: 기각/이월 표본을 사후 재점검해 틀린 기각이면 사유표·신뢰도 교정한다.
- 이슈: 같은 오케스트레이터와 같은 근거수집 방식으로 재점검하면 최초 판정 편향을 반복할 수 있다. “틀린 기각”의 기준도 사후 버그 발견인지, 사용자 반박인지, 별도 리뷰인지 불명확하다.
- 권고: 재점검 트리거와 판정 권위를 분리한다. 사용자 반박, 후속 결함, 독립 리뷰어 샘플 감사 중 하나가 있을 때만 보정하고, `overturned_rejection_rate`로 별도 기록한다.

[med] 메타 루프 비용 대비 효과가 과함
- 현황: P1~P6는 scorecard, rolling baseline, 자동 제안, 수치 트리거, 판정 보정까지 한 번에 추가한다.
- 이슈: external-review-loop 자체가 이미 codex/gemini 실행, 판정 원장, 재리뷰, 게이트를 포함한다. 여기에 자동 진화 루프를 얹으면 운영 복잡도와 토큰 비용이 크게 는다.
- 권고: 1단계는 P1의 최소 로깅만 구현한다. 2단계는 수동 리포트. 3단계에서 충분한 데이터가 쌓인 뒤 P4 트리거를 “제안”으로 추가한다. P3 자동 흐름 개선은 마지막 단계로 둔다.

[low] `_workspace/eval/{loop}_{단계ID}.json` 경로가 기존 구조와 어긋날 수 있음
- 현황: 테스트 가이드는 `_workspace/evals/.../eval_metadata.json`, `with_skill/timing.json`, `grading.json` 구조를 예시로 든다.
- 이슈: 단일 scorecard 파일 경로는 기존 eval 케이스 구조와 섞일 때 검색/집계 규칙이 애매하다.
- 권고: `_workspace/evals/external-review/{stage_id}/{run_id}/scorecard.json`처럼 실행 단위 디렉터리를 둔다. 기존 `grading.json`, `timing.json`, `verdicts.json`은 링크로 연결한다.

[low] “테스트 루프 수렴”과 “외부 리뷰 루프 수렴”이 섞임
- 현황: P6는 assertion 통과율 델타 `< ε` 종료를 scorecard에 연결한다.
- 이슈: skill-testing 반복 개선 루프와 external-review-loop는 목적과 입력이 다르다. 하나의 수렴 규칙으로 묶으면 리뷰 게이트 종료와 스킬 테스트 종료가 혼동된다.
- 권고: P6는 external-review-loop 변경안에서 분리해 skill-testing-guide 개선안으로 별도 제안한다. 공통으로 쓸 것은 scorecard 링크 규약 정도만 둔다.
