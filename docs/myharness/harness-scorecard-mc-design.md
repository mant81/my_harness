# 설계서 — M-C 구성 자기평가 추세 축적 + UI

> 상태: **설계 확정 · 외부감사 R5 수렴(codex+agy 양 엔진 no-high·R1~R5).** ("코드 미구현" 지적은 설계 결함 아님 — 구현은 M-C TDD 단계.) 상위: `harness-scorecard-{prd,design}.md`(수렴), M-A/M-B(구현·커밋). 범위: **스냅샷 write 배선(축적) + 추세 read/판정 + Eval UI 확장.** 비목표(별도·후속): 계층B LLM diag·오케스트레이터 자연어 제안 저술.

## 0. 문제 (현 상태)
- `computeHarnessScorecard`는 compute-only. `writeHarnessScorecardSnapshot` **호출처 0** → `harness_scorecard.json`·`harness_summary.jsonl` 미생성 → **시간축 데이터 없음** → 추세/delta 불가.
- loop_scorecard는 external-review-loop이 축적(조건부)하나, 구성(harness_scorecard)은 안 쌓임.
- Eval UI 패널은 현재 스냅샷 1장만·subject_kind/severity/detail/waiver/namespace 미표시.

## 1. 축적 = append-on-state-change (2 cadence 실현)
스냅샷을 매번 쓰면 churn. **상태가 변할 때만 append.** 단, `config_hash`(정의 파일 해시)만으로 dedup하면 **waiver 추가/만료가 무시된다**(R1: config_hash엔 waiver 미포함 — diag 캐시 보존 위해 유지). → **append 판정 키 = `state_key`**:
- `state_key = sha256(config_hash + "|" + 정렬된 **전수** 미waived active finding id 목록)`. config_hash는 그대로(계층B 캐시 무효화 방지·R1 agy). **hard-guard(R2 agy):** state_key 입력은 **절단 전 전체** id 목록 — 파일에 쓰는 `active_ids`(MAX 절단)를 재사용 금지(상한 밖 변경 누락 방지). waiver 변화도 active 집합을 바꾸므로 잡힌다.
- **동시성 락(R2/R3 — Node flock 없음·전용 helper `tryHarnessScorecardLock`·defedit `withDefLock`(큐) 재사용 금지):**
  - **크로스 프로세스(CLI vs UI):** `_workspace/evals/.harness-scorecard.lock` **원자 lockfile**(`open(O_CREAT|O_EXCL|O_WRONLY)`) — 파일 내용 = `{pid, host, startedAt}` JSON. 성공 시만 진입·실패 시 즉시 반환(비큐·tryLock).
  - **stale 판정(R3 HIGH — mtime 단독 금지):** lock 존재 시 `{pid,host}` 읽어 **`process.kill(pid,0)` 생존 검증**(동일 host일 때). **unlink 절차(단계)**: ① same host + valid pid + `kill(pid,0)` dead 확인 → ② unlink 시도 → ③ O_EXCL 재획득(실패=정상 경합·타 프로세스가 먼저 잡음). 이 조건 밖 제거 금지. **살아있거나 검증 불가(다른 host·pid 판독 실패)면 자동 제거 절대 금지 → 미획득 반환.** **`mtime`은 로그/상태표시/429 retry-hint 전용 — unlink 조건 아님**(R4 codex — mtime 기준 삭제 금지).
- `writeHarnessScorecardSnapshot(sc, root, nowIso)` 개정 → **append-if-changed(원자):**
  1. **lockfile 획득**(read-check-write-append 전체를 단일 임계구역·R1 HIGH TOCTOU). 미획득 시 skip/재시도.
  2. `harness_summary.jsonl` 마지막 **유효** 줄 `state_key` 읽기(bounded·역방향·§3 꼬리손상 내성). **skip 조건 = summary 최신 state_key 동일 AND `harness_scorecard.json` 존재+최상위 `state_key` 동일**(R3 HIGH 복구·R4: scorecard.json에 `state_key` 저장 — HarnessScorecard 최상위 필드 추가·O(1) 비교). 불일치면 skip 안 하고 scorecard.json 재기록(부분실패 복구).
  3. 변경 or 복구 필요 시 **순서 보장(R2 agy):** ① `summary.jsonl` append — **물리 개행 보장(R4 — 연쇄오염 차단):** append 전 파일 비어있지 않고 **마지막 바이트가 `\n`이 아니면 `\n`을 선행**(잘린 꼬리 뒤 정상 줄이 병합되는 것 방지) → `line + "\n"` **append + fsync**(추세 원장·누락 금지·이미 최신 줄이면 재append 안 함) → ② `harness_scorecard.json`(**최상위 `state_key` 포함**) **temp+rename** 원자 교체.
  4. lockfile 해제(`finally`).
- **호출처(명시 cadence만·GET 비오염):**
  - **portable CLI `--snapshot` 플래그**(오케스트레이터 Phase 0/7-5·구성변경 직후 — 주 축적 경로). `--snapshot` 없으면 stdout만. **인자 파싱(R2 codex):** `--snapshot`는 위치 무관 플래그·`root`=첫 non-flag positional(`node cli [root] --snapshot`·`node cli --snapshot [root]` 둘 다 허용). 파서 테스트 추가.
  - **UI 수동 버튼**(POST `/api/eval/harness-scorecard/snapshot` — "명시 점검" cadence).
  - **GET은 절대 write 안 함**(라이브 계산만·design §3-2 read-only 불변).

## 2. summary.jsonl 스키마 (추세 입력·lean)
config 변경 시에만 append하므로 파일은 작다. 각 줄:
```json
{ "generated_at": "2026-07-11T..", "config_hash": "…", "state_key": "…", "scope": "factory|built",
  "counts": { "orphan": 6, "link_unknown": 6, "dead_link": 0, "coverage_gap": 0,
              "unknown_scope": 0, "incomplete_def": 0, "oversize": 0, "agents": 6, "skills": 6 },
  "penalized": 6,                      // 감점 대상 합(orphan+dead_link+coverage_gap+incomplete_def+oversize)
  "debt": 6,                           // migration-debt(link_unknown+unknown_scope·감점 아님·분리)
  "active_ids": ["orphan:claude:skill:…", …], // 미waived finding id(new/resolved용·bounded MAX)
  "truncated": false }                 // active_ids 절단 여부(차집합 유효성 판정)
```
- `active_ids`는 finding id 배열(waived 제외)·**표시/차집합용**. MAX 상한(예 500)·초과 시 절단 + `truncated:true`. `counts`/`penalized`/`debt`는 절단과 무관(전수 집계·verdict는 이걸로). **`state_key`는 절단 전 전수 id로 계산**(§1 hard-guard) — 파일의 절단된 `active_ids`와 별개.

## 3. 추세 read/판정 (`readHarnessTrend`)
```ts
export type Trend = {
  points: { at: string; penalized: number; debt: number }[];  // summary 시계열(최근 N)
  latest: SummaryLine | null; prev: SummaryLine | null;
  verdict: "improved" | "regressed" | "steady" | "insufficient"; // penalized 기준(counts — 절단 무관)
  delta: number | null;                            // latest.penalized − prev.penalized(<2면 null)
  findingDelta: "available" | "approximate";       // 차집합 유효성
  newFindings: string[] | null;                    // truncated면 null(ghost 오판 차단·R1 HIGH)
  resolvedFindings: string[] | null;
};
export function readHarnessTrend(root: string): Promise<Trend>;
```
- **verdict(penalized 기준·전수 counts·절단 무관):** latest.penalized < prev.penalized → `improved` / > → `regressed` / == → `steady`. 스냅샷 <2 → `insufficient`. **verdict는 항상 counts 기반**(active_ids 절단과 독립).
- **new/resolved(id 차집합):** latest·prev **둘 중 하나라도 `truncated`면** `findingDelta:"approximate"` + `newFindings/resolvedFindings = null`(부분집합 차집합은 수학적 무효 — ghost finding 차단·R1 HIGH). 아니면 `available` + 차집합.
- **debt(link_unknown+unknown_scope):** "부채 감소"로 별도 표기(마이그레이션 진척)·penalized verdict와 분리(감점 아님).
- bounded read(summary.jsonl 크기캡·마지막 N줄·역방향 스캔).
- **꼬리 손상 내성(R3 agy·R4 — fail-open·GET 비오염·연쇄오염 차단):** `appendFile` 중 크래시/ENOSPC로 마지막 줄이 잘릴 수 있음. **(리더)** summary 리더(추세·state_key 판독 공용)는 **파싱 실패 줄을 예외 없이 discard·직전 완전 줄로 폴백**·마비 금지. **(라이터)** §1.3 물리 개행 보장으로 다음 append가 잘린 꼬리에 병합되지 않게 함(리더 폴백 단독으론 첫 복구 데이터 유실 — 양쪽 필요).
- **결정성:** 판정 순수(파일 입력만). `generated_at`은 표시용.

## 4. API
- `GET /api/eval/harness-scorecard` — 기존(라이브 계층A·§ M-A).
- `GET /api/eval/harness-scorecard/trend` — `readHarnessTrend(projectRoot)`.
- `POST /api/eval/harness-scorecard/snapshot` — append-on-change 1회. **계약:** ① **본문 없음 허용** — 무본문(Fastify `undefined`)은 `{}`로 정규화 후 `z.object({}).strict()` parse(미지 필드 거부). 테스트에 no-body와 `{}` 분리(R2 codex). ② `/api` **security hook 적용**(Host/Origin·세션 게이트·기존 라우트 동일) ③ **429 = non-blocking tryLock**(R2 agy — `withDefLock`는 큐라 429 불가). 진행 중(lockfile 점유)이면 **즉시 429**·대기 큐잉 안 함. ④ short cooldown. 반환: `{written: boolean, state_key}`. **읽기전용 앱 불변 예외 경계**: write는 `_workspace/evals/`(gitignore·평가 원장)에 **한정**·정의 파일(`.claude/agents·skills`)·config **절대 미수정**(mutation API와 별개 축).

## 5. UI (Eval 패널 확장)
현 `HarnessScorecardCard`를 3부로:
- **A. 구성 건강도(라이브·계층A) — ① quick-wins 반영:**
  - subject_kind 분리: "고아 에이전트 N / 고아 스킬 M"(별행). **라이브 GET의 `findings[]`를 client filter로 산출**(각 finding에 subject_kind 존재 — 스키마 변경 불요·R1 agy). severity 배지. provenance·detail은 펼침(details/summary·Lean).
  - namespace 축별 표기: `factory`(policy-audit 적용여부)·`built`·`loop_ref`(있으면 링크)·`diag`(null 시 "미실행"). **cross-aggregate 단일점수 금지**(설계 §3-6).
  - waiver 섹션: 억제된(waived) 항목·만료일(있으면). "억제 N건".
  - stale 표기.
- **B. 추세(신규·`/trend`):** verdict 배지(개선/퇴행/유지/데이터부족)·penalized 시계열 미니 스파크라인 또는 최근 delta·new/resolved findings 목록·부채(debt) 감소 표기·마지막 기록 시각.
- **C. 빈 상태:** 스냅샷 <1 → "추세 미축적 — 오케스트레이터 Phase 0/7-5가 `harness-scorecard.mjs --snapshot` 실행 시 쌓임. 또는 [지금 기록]"(POST 버튼).
- 기존 loop 평가 섹션(EvalIndexBody)은 **loop_ref 보조**로 그 아래 유지.

## 6. 테스트 (TDD)
| # | 대상 | 케이스 |
|---|------|--------|
| U1 | append-on-change | 동일 state_key 2회 → 1줄(skip)·정의 변경 → 2줄·**waiver만 바뀌어도 append**·**state_key 전수 id(절단 무관)**·lockfile 동시성(2 프로세스 중복 0)·append(fsync) 먼저→rename·**scorecard.json 부재/불일치 시 복구 재기록**(summary 최신인데도)·stale lock=pid 죽음 확인 후만 제거·**꼬리 손상 줄 discard 폴백** |
| U2 | readHarnessTrend | improved/regressed/steady/insufficient(counts 기준)·**truncated 시 new/resolved=null·findingDelta=approximate**(ghost 차단)·debt 분리·bounded read |
| U3 | POST snapshot | written true/false·**no-body/{} 허용·초과 필드만 거부**·정의 파일 미수정·_workspace 한정·in-flight 429 |
| U4 | CLI --snapshot | 플래그 시 파일 기록·없으면 stdout만 |
| U5 | UI | subject_kind 분리·waiver 섹션·namespace 표기·추세 verdict·빈 상태 CTA |
| U6 | 보안 | summary.jsonl bounded·active_ids MAX 절단·POST rate/락·경로 |

## 7. 파괴/회귀 위험
| 위험 | 완화 |
|------|------|
| POST write가 읽기전용 앱 불변 위반 | `_workspace/evals/`만·정의 파일 불가·mutation API와 분리·명시 트리거만 |
| summary.jsonl 무한 성장 | config 변경 시에만 append(dedup)·크기캡·N줄 read |
| active_ids 비대 | MAX 절단·truncated 플래그·new/resolved는 근사 명시 |
| 추세 오판(단일 노이즈) | penalized 기준·debt 분리·<2 스냅샷=insufficient(단정 금지) |

## 다음 단계 참조
- **미해결:** 계층B LLM diag·오케스트레이터 자연어 제안 저술 = 이 M-C 범위 밖(후속 M-D). view 강등 배지는 diag 의존이라 함께 미룸.
- **핵심 결정:** 축적 = **append-on-state-change**(state_key=config_hash+active id 해시 — waiver 변화도 포착·config_hash엔 waiver 미포함으로 diag 캐시 보존). per-root mutex(TOCTOU 차단)·temp+rename. 호출처=CLI `--snapshot`+UI 수동 POST(strict body·security hook·429). **GET 비오염**. verdict=penalized counts(절단 무관)·**truncated 시 new/resolved=null**(ghost 차단). subject_kind 분리=라이브 findings client filter. UI 3부.
- **R1~R4 반영:** state_key(전수 id·scorecard.json 최상위 저장·waiver 포착)·전용 lockfile(O_EXCL·pid 생존검증·mtime≠unlink조건)·부분실패 복구 skip조건·물리 개행 보장(연쇄오염 차단)+리더 폴백·POST empty body·CLI 인자·truncated→approximate.
- **다음:** TDD 구현(U1~U6·scorecard.ts/api/cli/web) → stabilizer(정본 배선분: 오케스트레이터 Phase 0/7-5 CLI --snapshot 호출).
