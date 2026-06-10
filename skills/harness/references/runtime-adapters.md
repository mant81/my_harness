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
- **Codex:** 레포 루트 `AGENTS.md` 자동 로드(루트→cwd concat, 가까운 쪽 우선). AGENTS.md 역할: 하네스 포인터 + "하네스 만들/고치려면 `skills/harness/SKILL.md`를 따르라" + 오케스트레이션은 §4 어댑터. (Codex 스킬 auto-activation이 있으므로, 스킬을 `.agents/skills/`에 두면 AGENTS.md는 얇게 가능.)

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
