# 설계서 — D4 T2-lite + 강제장치(check-artifacts) 문서체계 완성

> 상태: **설계 제안(미구현)**. 자체검토 → 외부감사 통과 전 하네스 정본 미수정.
> 대상: `skills/myharness/references/orchestrator-template.md`(문서 체계 §), `templates/`(신규 골격), `skills/myharness/scripts/`(신규 `check-artifacts.sh`), `SKILL.md` 5-1·체크리스트.
> 배경: 실사용에서 영속 산출물(design/plan/result)이 `docs/`에 안 가고 gitignored `_workspace`에 방치(→ cleanup/재실행 시 소멸·감사 이력 0). 사용자 T2 아이디어 외부감사(codex+agy 강수렴) 판정 = *문제의식 타당, 버전폴더/링크체인/general 강제는 기각, T2-lite로 축소 + 강제장치가 진짜 픽스*.

## 1. 근본원인 (재확인)
D4 문서체계는 설계됐으나 **강제장치(forcing function)가 없다.** 외부리뷰엔 `check-review-tools.sh`+게이트가 있어 신뢰되는데, 문서기록엔 검증 스크립트도, 하드 체크리스트 게이트도, 기본값도(T0=_workspace만) 없다 → LLM이 과업 몰입 중 스킵. **구조가 아니라 강제가 문제.**

## 2. 설계 원칙
1. **두 축 분리:** 구조(T2-lite) ≠ 강제(check-artifacts). 버그의 실해법은 강제(구조만 늘리면 재발).
2. **버전은 git, 경로 아님:** `docs/v{버전}/` 금지(git 이중버전·drift). git tag/release가 버전 담당.
3. **살아있음 vs 불변 구분:** STATUS·design·todo=덮어쓰기(현재), working_history=append(불변 원장).
4. **규모 스케일(slim 유지):** general 강제 금지. T2-lite는 큰 작업만.
5. **연속성 정본 = 최신 결과서 §다음단계참조**(링크체인·복붙 첨부 금지 — link rot·할루시).

## 3. 문서 구조 (T2-lite)
```
docs/{project}/
├── STATUS.md            # 살아있는 보드(덮어씀): 완료/진행중/다음/리스크. 상태 가시성.
├── design.md            # 상위 구조·전체 계획(살아있는 1장). §변경이력 append로 고도화. git이 버전.
├── todo/Pn_*.md         # 단계별 체크리스트(작업 UI, 정본 아님, 덮어씀). result 링크만(복붙 금지).
└── working_history/     # 결과서(불변 append, 감사·RAG 정본). §다음단계참조=연속성 진입점.
_workspace/  (gitignore) # 휘발: 리뷰 raw·status json·마커.
```
- **STATUS.md 이중상태 주의:** 수동 정본이 되면 result와 이중. 규칙 = "**최신 result에서 갱신**"(정본은 result, STATUS는 파생 보드). 가능하면 결과서 frontmatter/파일명에서 **자동 rollup** 생성.
- **버전:** 릴리스 시 `git tag vX.Y.Z` + (선택) `docs/{project}/releases/vX.md` 요약 1장. 경로에 버전축 없음.

## 4. 티어 (동적 격상 — general 금지)
| 티어 | 조건 | 산출물 |
|------|------|--------|
| T0 | trivial(1파일·단순질문) | `_workspace`만 |
| Tμ | 마이크로(1~2파일) | `docs/{project}/current.md` 1행 digest + commit 본문 |
| T1 | 표준 단발 | 결과서 1장(working_history) |
| **T2-lite** | **다단계/e2e·병렬·실패후재시작·장기감사·명시적 영속화 요청** | STATUS + design + todo/ + working_history/ |
- T2-lite 트리거는 **명시 조건만**. 오케스트레이터가 Phase 2에서 판정(리스크등급과 별개 축 — 문서 무게).

## 5. 강제장치 — `check-artifacts.sh {project}` (신규 번들)
`check-review-tools.sh`와 동형(번들·실행·끝줄 상태). 단계 마감 게이트에서 호출.
```
용도: 영속 클래스 산출물이 docs/에 기록됐는지 검증. 휘발(reviews/status)은 무시.
입력: 프로젝트 docs 경로 + 현 티어.
로직:
  - 티어 T0/Tμ → PASS(문서 불요).
  - T1 → docs/{project}/working_history/ 에 최신 결과서 1개 이상 존재? 없으면 FAIL.
  - T2-lite → STATUS.md·design.md 존재 + working_history 결과서 존재? 없으면 FAIL.
  - 결과서에 `## 다음 단계 참조` 블록 존재? 없으면 WARN(연속성 진입점).
출력 끝줄: ARTIFACTS: ok | missing:<목록>   (항상 exit 0, 상태는 끝줄로만 — 파이프라인 중단 방지)
```
- **게이트 배선:** external-review-loop Step 7 "기록→게이트→승인→커밋" 의 *기록* 직후 `check-artifacts.sh` → `missing:`이면 커밋 **차단**(결과서 쓸 때까지). = 안 지킬 수 없음.
- 외부 도구 무관(codex/agy 없어도 작동 — 순수 파일 검증).

## 6. 오케스트레이터 단계 루프 (배선)
```
단계 시작: working_history 최신 결과서 §다음단계참조 읽기(RAG) → todo/Pn 체크리스트 열기
작업 중:   완료마다 todo 체크(덮어씀). raw는 _workspace.
단계 마감: ① 결과서 write(working_history, append) ② check-artifacts.sh(missing이면 FAIL)
           ③ 게이트(외부리뷰/내부QA) ④ 승인 ⑤ 커밋 ⑥ STATUS.md 갱신(latest result 기준)
```

## 7. 반영 범위 (채택 시)
1. `scripts/check-artifacts.sh` 신규 + 생성 하네스에 번들(external-review 스킬처럼).
2. `templates/` — `status-skeleton.md`·`design-skeleton.md`·`todo-skeleton.md` 신규(working-history-skeleton은 유지, "교훈→개선" 섹션 명시 보강).
3. `orchestrator-template.md` 문서 체계 § — T2-lite 구조·티어 트리거·단계 마감 게이트에 check-artifacts 배선.
4. `SKILL.md` 5-1 + Phase 마감 체크리스트 — "결과서 docs/ 기록 + check-artifacts PASS" 하드 게이트 추가. **단 SKILL 500줄 캡 준수**(초과 시 references로).
5. `factory-map.md` — T2 상태 `📐 보류` → `T2-lite ✅ active`(축소형), full T2(버전폴더·병렬merge)는 계속 보류.

## 8. 자체검토 — 선반영 약점
1. **STATUS 이중상태 리스크** — 수동 STATUS가 result와 어긋날 수 있음 → "latest result에서 갱신" 규칙 + 장기적으로 자동 rollup(결과서 frontmatter 파싱). 수동은 T2-lite 보조로만.
2. **check-artifacts 우회** — 오케스트레이터가 게이트를 안 부르면 무의미 → SKILL 체크리스트 + Step 7 순서에 못박고, 자율 마커(`_workspace/.autonomous`)여도 이 검증은 유지(인간 승인만 생략).
3. **SKILL 500줄 캡** — 배선 추가분이 캡 압박 → 상세는 orchestrator-template/templates로, SKILL엔 포인터만.
4. **티어 판정 주관성** — T2-lite 트리거가 모호하면 남용/누락 → 명시 조건 리스트로 좁힘(§4).
5. **비코드 업무** — check-artifacts는 파일 존재만 보므로 비코드도 작동(설계·리서치 결과서도 대상).

## 9. 결정 기준
**채택(AND):** 강제장치가 실제 누락을 잡음(FAIL 재현) + slim 미저해(T0/Tμ 무영향) + git 이중버전 없음 + SKILL 캡 유지 + 외부감사 수렴.
**기각(OR):** check-artifacts 우회가 구조적으로 못 막힘 / T2-lite가 slim 과부담 / 자동 rollup 없이 수동 STATUS가 이중상태 상시화.

## 10. 오픈 퀘스천 (외부감사)
1. check-artifacts를 게이트에 넣어도 오케스트레이터가 게이트 자체를 스킵하면? 강제의 강제(메타)를 어디까지.
2. STATUS 자동 rollup(결과서 파싱 생성) vs 수동 — MVP는 어디까지.
3. T2-lite 트리거 판정을 스크립트/휴리스틱으로 자동화 가능한가, 오케스트레이터 재량인가.
4. working-history "덮어쓰기 금지" vs todo "덮어쓰기" 혼재를 사용자가 헷갈리지 않게 하는 최소 장치.
