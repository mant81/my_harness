# 하네스 팩토리 자체 평가 시스템 설계

## 목적

이 문서는 하네스 팩토리가 생성한 에이전트, 스킬, 오케스트레이션 프로세스를 평가해 다음 생성 품질을 개선하기 위한 자체 평가 시스템을 정의한다.

목표는 별도 평가 제품이나 공개 벤치마크를 만드는 것이 아니다. 목표는 팩토리 내부 품질관리 루프를 만들어 다음을 판단하는 것이다.

- 생성된 하네스가 필수 산출물을 만들었는가
- 에이전트 역할이 도메인에 적합한가
- 역할 충돌이나 책임 공백이 없는가
- 오케스트레이터가 업무 도메인에 맞는 프로세스로 에이전트를 구성하는가
- 작업 단계별 검증 루프가 포함되어 실제 프로젝트 성공 가능성을 높이는가
- 생성된 스킬이 적절한 범위, 트리거, 참조 자료를 갖는가
- 검증 Phase가 포함되어 있는가

## 평가 대상 — 정책 품질 (기능 자랑이 아니라)

"잘 짜였다"를 주장하려면 기능 목록이 아니라 **정책 품질을 검증 가능한 증거로** 보여줘야 한다. 평가 대상은 다음 7개 정책 축이다:

| 정책 축 | 평가 질문 |
|---------|----------|
| 빌드 정책 | Phase 0~7 흐름이 타당한가 |
| 에이전트 설계 정책 | 역할 분해·책임 경계·중복 방지가 적절한가 |
| 스킬 생성 정책 | trigger·scope·references/scripts 동봉이 적절한가 |
| 오케스트레이션 정책 | 도메인 프로세스를 agent handoff로 잘 변환하는가 |
| 검증 정책 | 내부 QA·외부 리뷰·smoke/full gate가 적절한가 |
| 비용 정책 | 항상 heavy eval을 돌리지 않고 위험도 기반으로 제어하는가 |
| 듀얼 런타임 정책 | Claude/Codex 산출물과 문서가 일치하는가 |

## 기본 원칙

자체 평가는 항상 켜지 않는다. 하네스 팩토리는 사용자의 도메인 요청을 빠르게 구조화하는 도구이므로, 모든 요청에 full self-eval을 붙이면 토큰 비용과 지연이 과도해진다.

따라서 자체 평가는 위험도 기반 gate로 동작한다.

| 모드 | 적용 시점 | 평가 방식 | 비용 |
|------|----------|----------|------|
| `off` | 단순 질문, 소규모 하네스, 초안 생성 | 평가 생략 | 없음 |
| `smoke` | 기본 생성 완료 후 | 정적 검사 중심 | 낮음 |
| `full` | 릴리스 전, 대규모 구조 변경, 명시적 품질 검증 요청 | 정적 검사 + LLM judge + 외부 리뷰 | 높음 |

기본값은 `smoke`다. `full`은 사용자가 요청했거나, 변경 위험도가 높은 경우에만 실행한다.

## 평가 대상

자체 평가는 생성된 하네스 디렉토리 전체를 대상으로 한다.

필수 입력:

- 생성 요청 원문
- 대상 도메인 설명
- 생성된 에이전트 정의
- 생성된 스킬 정의
- 오케스트레이터 스킬 또는 프로세스 문서
- `CLAUDE.md`, `AGENTS.md` 같은 런타임 진입점
- references/scripts 같은 보조 파일
- 실행 로그 또는 리뷰 결과가 있으면 함께 사용

필수 출력:

- `self_eval_scorecard.json`
- `self_eval_report.md`
- 개선 제안 목록
- 자동 반영 여부: 기본 `false`

## 평가 축

| 축 | 질문 | smoke | full |
|----|------|-------|------|
| 파일 완성도 | 필수 파일과 디렉토리가 생성되었는가 | yes | yes |
| 런타임 정합성 | Claude/Codex 산출물이 문서 주장과 일치하는가 | yes | yes |
| 에이전트 역할 적합성 | 도메인에 필요한 역할을 충분히 커버하는가 | partial | yes |
| 역할 충돌 | 여러 에이전트가 같은 책임을 중복 소유하지 않는가 | partial | yes |
| 책임 공백 | 중요한 업무 영역에 owner가 없는가 | partial | yes |
| 오케스트레이션 적합성 | 도메인 업무 흐름을 단계와 handoff로 표현하는가 | partial | yes |
| 검증 루프 | 작업 단계별 QA, review, test, approval gate가 있는가 | yes | yes |
| 스킬 적절성 | 스킬 범위, trigger, references/scripts가 적절한가 | partial | yes |
| 실패 처리 | 재시도, 중단, 사용자 승인, rollback 기준이 있는가 | partial | yes |
| 비용 통제 | 고비용 평가와 외부 리뷰가 위험도에 따라 켜지는가 | yes | yes |

## 증거 패키지 — 5가지 평가 방법 (설득력 순)

"내가 좋다고 말함"이 아니라 **독립 검증 가능한 증거**로 정책 품질을 보인다. 비용·신뢰도 순:

1. **Policy Conformance Audit (최우선·저비용)** — `skills/myharness/SKILL.md`가 *자기 정책을 실제로 지키는지* 정적 점검. 예: Phase 6 검증 존재, scorecard 설계, 외부 리뷰 gate, runtime adapter, 비용 통제 규칙. 자체 점검 가능·노이즈 적음 → 가장 먼저.

2. **Golden Domain Replay** — 대표 도메인 10~20개(예: SaaS 개발팀·문서 자동화·보안 리뷰·콘텐츠 운영·데이터 분석)에 하네스를 생성하고 산출물 평가.
   - ⚠️ **누수 주의:** 도메인 케이스를 하네스/같은 LLM이 만들면 self-bias·과적합. **외부 seed(사람·타 모델)·negative control(스킬이 방해되는 역기획)** 포함. (`references/self-improvement-loop.md` §6 holdout 규율 준용)

3. **Baseline 비교 (vs 일반 LLM)** — baseline="이 프로젝트용 에이전트 팀 만들어줘"(plain), treatment=myharness. 비교 항목: 필수 파일 생성률·역할 중복률·검증 Phase 포함률·오케스트레이션 명확도·스킬 trigger 품질·런타임 정합성·재작업 횟수.
   - ⚠️ **자체측정은 약증거.** "X% 우수" 주장 시 **n·측정자·blind(candidate/baseline 익명)·holdout**을 같은 문장에 명시. 작은 n으로 단정 금지(과거 "+60% n=15" 과대주장 함정 회피). 객관 항목(파일 생성률 등) 우선, 주관 항목은 blind judge.

4. **External Review Evidence** — codex/gemini 외부 리뷰 루프 결과를 *증거로 남김*. "독립 리뷰어가 무엇을 잡았고 무엇을 통과시켰나"를 로그로 공개(`_workspace/reviews/`). 통과만이 아니라 **기각·미수렴도 공개**(체리피킹 금지).

5. **Scorecard 공개** — 케이스별 점수를 표로. 예(서식 예시 — 실측값 아님):
   | 축 | 점수 |
   |----|------|
   | file_completeness | 0.95 |
   | role_fit | 0.86 |
   | role_conflict_safety | 0.91 |
   | orchestration_fit | 0.88 |
   | validation_loop | 0.93 |
   | runtime_consistency | 0.72 |
   - ⚠️ 위 숫자는 **서식 예시**다. 실측 scorecard만 증거로 인용. 낮은 축(예 runtime_consistency)은 숨기지 말고 개선 항목으로 노출.

> 용어 정합: 본 문서 `self_eval_scorecard`(하네스 *산출물* 품질) ≈ `references/self-improvement-loop.md`의 `artifact_benchmark`. 루프 *효율*은 `loop_scorecard`(`loop-self-eval.md`)로 별도 — 셋을 섞지 말 것.

## Smoke 평가

`smoke`는 LLM judge 없이 가능한 검사를 우선한다.

필수 검사:

- `.claude/agents/` 또는 런타임별 agent 정의 존재
- `.claude/skills/` 또는 `.agents/skills/` 존재
- 오케스트레이터 스킬 존재
- `CLAUDE.md` 또는 `AGENTS.md` 포인터 존재
- 각 `SKILL.md` frontmatter의 `name`, `description` 존재
- references/scripts 참조 파일 존재
- 검증 Phase 또는 동등한 validation section 존재
- agent name, role, responsibility 중복 후보 탐지
- 동일 런타임 안에서 스킬 이름 충돌 탐지
- Codex/Claude dual runtime을 주장할 경우 양쪽 산출물 존재 여부 검사

Smoke 결과는 pass/fail과 경고 목록을 낸다. 이 단계는 빠르게 실패를 잡는 용도이며, 역할 적합성 같은 판단형 품질을 확정하지 않는다.

## Full 평가

`full`은 smoke 결과에 더해 LLM judge와 외부 리뷰를 사용한다.

판정형 질문:

- 이 도메인에서 필요한 핵심 역할이 빠지지 않았는가
- 각 에이전트의 책임 경계가 명확한가
- 오케스트레이터가 실제 업무 프로세스에 맞는 순서로 작업을 배치했는가
- 설계, 구현, 검증, 릴리스 또는 운영 단계가 성공 가능한 흐름으로 연결되는가
- 검증 루프가 형식적 문구가 아니라 실패를 발견하고 수정할 수 있는 구조인가
- 스킬이 너무 넓거나 너무 좁지 않은가
- 스킬 description이 실제 사용자 요청에서 적절히 trigger될 가능성이 높은가

Full 평가는 비용이 크므로 다음 조건에서만 실행한다.

- 사용자가 명시적으로 품질 검증을 요청
- 하네스가 외부 사용자에게 배포될 예정
- 에이전트 3개 이상 추가/삭제
- 오케스트레이션 구조 변경
- 코드/설계 도메인 중대 위험 작업
- smoke 평가에서 high severity 문제가 발견됨

## Scorecard 스키마

`self_eval_scorecard.json`은 최소한 다음 필드를 가진다.

```json
{
  "schema_version": "1.0",
  "mode": "smoke",
  "target": {
    "domain": "example",
    "path": "generated/example-harness",
    "runtime": ["claude", "codex"]
  },
  "scores": {
    "file_completeness": 0.0,
    "runtime_consistency": 0.0,
    "role_fit": null,
    "role_conflict": 0.0,
    "orchestration_fit": null,
    "validation_loop": 0.0,
    "skill_fit": null,
    "failure_handling": null,
    "cost_control": 0.0
  },
  "findings": [
    {
      "severity": "high",
      "category": "runtime_consistency",
      "message": "Dual runtime claimed, but .codex/agents/*.toml is missing.",
      "evidence": ["AGENTS.md", "references/runtime-adapters.md"]
    }
  ],
  "recommendations": [
    {
      "type": "manual_review",
      "message": "Generate Codex agent definitions or downgrade the dual-runtime claim."
    }
  ],
  "auto_apply": false
}
```

점수는 0.0~1.0 범위를 사용한다. `smoke`에서 판단할 수 없는 항목은 `null`로 둔다.

## 개선 루프

자체 평가는 생성물을 바로 수정하지 않는다. 자동 수정은 팩토리가 자기 점수를 올리기 위해 기준을 왜곡하는 Goodhart 문제를 만들 수 있다.

권장 루프:

1. 하네스 생성
2. smoke self-eval 실행
3. high severity 발견 시 사용자에게 보고
4. 필요 시 full self-eval 실행
5. 실패 유형을 scorecard로 저장
6. 같은 실패가 반복될 때 개선 제안 생성
7. 사용자가 승인한 개선만 팩토리 스킬, 템플릿, references에 반영

자동 반영 금지 기준:

- 평가 기준 자체 변경
- 에이전트 역할 추가/삭제
- 오케스트레이션 Phase 변경
- 외부 리뷰 gate 변경
- 런타임 지원 범위 변경

이 항목들은 반드시 사용자 승인 후 반영한다.

## 반복 실패 패턴

누적 scorecard에서 다음 패턴이 반복되면 팩토리 개선 후보로 올린다.

- 필수 파일 누락이 3회 이상 반복
- 같은 런타임 drift가 2회 이상 반복
- 역할 충돌이 같은 카테고리에서 3회 이상 반복
- 검증 Phase 누락 또는 형식적 검증이 반복
- 스킬 trigger가 너무 약하거나 너무 넓다는 판정 반복
- 오케스트레이터가 도메인 프로세스를 반영하지 못한다는 판정 반복

단, 누적 표본이 너무 작을 때는 개선을 제안하지 않는다. 최소 기준은 `min_evaluated_harnesses >= 5` 또는 `min_adjudicated_findings >= 20`이다.

## 현재 프로젝트에 대한 적용

현재 하네스 팩토리에는 자체 평가 시스템의 재료가 이미 있다.

- `skills/myharness/SKILL.md`의 Phase 6 검증
- `skills/myharness/references/loop-self-eval.md`
- `skills/myharness/scripts/build-scorecard.sh`
- `skills/myharness/scripts/check-review-tools.sh`
- codex/gemini 외부 리뷰 루프

부족한 것은 이것들을 하나의 닫힌 품질관리 루프로 연결하는 실행 규칙이다.

우선 구현 순서:

1. smoke self-eval 스크립트 추가
2. `self_eval_scorecard.json` 스키마 고정
3. 생성된 하네스마다 scorecard 저장
4. full self-eval은 명시 요청 또는 릴리스 gate에서만 실행
5. 반복 실패 패턴만 팩토리 개선 제안으로 승격

## 결론

자체 평가 시스템은 가능하고 필요하다. 다만 상시 full 평가나 자동 자기수정은 피해야 한다.

가장 현실적인 형태는 다음이다.

- 기본은 저비용 `smoke`
- 위험 작업과 릴리스 전만 `full`
- scorecard는 누적
- 개선은 제안까지만 자동화
- 팩토리 본문 변경은 사용자 승인 후 반영
