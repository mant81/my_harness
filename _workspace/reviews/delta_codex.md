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
session id: 019ebfe7-3928-7652-af7c-ad97be9ab972
--------
user
이 레포(cookyman74/my_harness, Claude Code+Codex 하네스 팩토리 플러그인)의 commit 9294dd6 이후 변경 전체를 리뷰한다. 변경 요지(커밋·통계는 _workspace/reviews/delta_commits.txt):
(1) 화이트라벨 revfactory→cookyman, (2) 플러그인/마켓/스킬명 → myharness(/myharness·$myharness), (3) 듀얼 런타임(Claude+Codex) 어댑터, (4) external-review-loop 수렴 루프화, (5) loop-self-eval·self-improvement 설계, (6) factory-map 항법층.
**현재 HEAD 상태의 실제 파일**(.claude-plugin/*, skills/myharness/SKILL.md + references/*, AGENTS.md, install.sh, README*.md, docs/*)을 읽고 발생 가능한 이슈를 모두 보고하라:
- 리네임 잔존/불일치(stale "harness" 식별자 vs 보존대상 my_harness·브랜드·harness-100), 화이트라벨 누락(revfactory 잔존)
- 버전·install 명령·뱃지 3종 정합, 3개국어 README drift
- 매니페스트(plugin.json/marketplace.json) 유효성·정합
- 팩토리 정책 문서 간 모순·dead link·정책 vs 실행 갭
- 듀얼 런타임 어댑터·경로의 정합
<이슈 작성 방법>
1. [레벨(critical/high/med/low)] 제목
- 현황: / - 이슈: / - 권고:
</이슈 작성 방법>
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
context-mode 스킬 사용. 레포 변경 리뷰라 원시 출력은 인덱싱/검색 중심으로 처리하고, 필요한 파일만 최소 열람하겠습니다.
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc "sed -n '1,220p' /Users/junghojang/.codex/skills/context-mode/SKILL.md" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
---
name: context-mode
description: Use the context-mode MCP server and routing hooks when tasks involve large context, many files, or repeated analysis that should be indexed instead of pasted.
---

# context-mode

Use this skill when a task benefits from the context-mode MCP server installed from `mksglu/context-mode`.

## What it does

- Routes Codex tool use through context-mode hooks.
- Pushes large or repeated context into indexed memory instead of flooding the chat.
- Provides `ctx_*` commands for search, batch execution, indexing, and maintenance.

## How to use

- Keep `context-mode` installed on PATH.
- Ensure `~/.codex/config.toml` contains the `context-mode` MCP server entry.
- Ensure `~/.codex/hooks.json` points Codex hook events at `context-mode hook codex ...`.
- Keep `~/.codex/AGENTS.md` loaded as the routing policy for Codex sessions.

## When to prefer it

- Large repo analysis.
- Repeated file exploration.
- Multi-file search or transform work.
- Tasks that need a local indexed memory instead of raw transcript growth.

## Operational rule

- Prefer indexed search and batch execution over raw context dumps.
- Prefer code that reads, indexes, and summarizes over manual copy/paste.

hook: PostToolUse
hook: PostToolUse Completed
codex
먼저 대상 파일군과 delta 커밋 요약을 인덱싱해 실제 HEAD 기준으로 비교합니다. 이후 스캐너로 stale 식별자, 버전/설치 문자열, 링크, 매니페스트 정합을 뽑겠습니다.
mcp: context-mode/ctx_batch_execute started
mcp: context-mode/ctx_batch_execute (failed)
user cancelled MCP tool call
codex
배치 호출이 취소됐습니다. 원시 덤프 없이 단일 JS 스캐너로 같은 정보를 요약해 진행합니다.
mcp: context-mode/ctx_execute started
mcp: context-mode/ctx_execute (failed)
user cancelled MCP tool call
codex
context-mode MCP가 계속 취소되어 로컬 스크립트 요약으로 fallback합니다. 출력은 이슈 후보와 파일:라인만 제한합니다.
hook: PreToolUse
hook: PreToolUse Completed
hook: PostToolUse
hook: PostToolUse Completed
codex
읽기 전용 샌드박스가 here-doc 임시파일도 막습니다. `node -e` 한 줄로만 읽기/검사합니다.
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc "node -e \"const fs=require('fs'),path=require('path');function walk(d,o=[]){if("'!fs.existsSync(d))return o;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?walk(p,o):o.push(p)}return o}const files=[...walk('"'.claude-plugin'),...walk('skills/myharness'),...walk('docs'),...fs.readdirSync('.').filter(f=>/"'^README/.test(f)||['"'AGENTS.md','install.sh'].includes(f))].sort();console.log(JSON.stringify({count:files.length,files},null,2))\"" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
{
  "count": 26,
  "files": [
    ".claude-plugin/marketplace.json",
    ".claude-plugin/plugin.json",
    "AGENTS.md",
    "README.md",
    "README_JA.md",
    "README_KO.md",
    "docs/experimental-dependency.md",
    "docs/quickstart.md",
    "docs/self-evaluation-system.md",
    "install.sh",
    "skills/myharness/SKILL.md",
    "skills/myharness/references/agent-design-patterns.md",
    "skills/myharness/references/dev-rules.md",
    "skills/myharness/references/external-review-loop.md",
    "skills/myharness/references/factory-map.md",
    "skills/myharness/references/loop-self-eval.md",
    "skills/myharness/references/orchestrator-template.md",
    "skills/myharness/references/qa-agent-guide.md",
    "skills/myharness/references/runtime-adapters.md",
    "skills/myharness/references/self-improvement-loop.md",
    "skills/myharness/references/skill-testing-guide.md",
    "skills/myharness/references/skill-writing-guide.md",
    "skills/myharness/references/tdd-doctrine.md",
    "skills/myharness/references/team-examples.md",
    "skills/myharness/scripts/build-scorecard.sh",
    "skills/myharness/scripts/check-review-tools.sh"
  ]
}

hook: PostToolUse
hook: PostToolUse Completed
codex
대상은 26개 파일입니다. 이제 패턴 스캔과 구조 검증을 한 번에 돌려서 후보를 좁힙니다: `revfactory`, 명령명, 버전, 링크, manifest 필드.
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc "node -e \"const fs=require('fs'),path=require('path');function walk(d,o=[]){if("'!fs.existsSync(d))return o;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?walk(p,o):o.push(p)}return o}const files=[...walk('"'.claude-plugin'),...walk('skills/myharness'),...walk('docs'),...fs.readdirSync('.').filter(f=>/"'^README/.test(f)||['"'AGENTS.md','install.sh'].includes(f))].sort();const pats=[/revfactory/ig,/rev[-_ ]?factory/ig,/myharness/ig,/my_harness/ig,/harness-factory/ig,/harness-100/ig,/\\/harness\\b/g,/\\"'$harness'"\\b/g,/skills\\/harness/ig,/\\.agents\\/skills\\/harness/ig,/\\.claude\\/skills\\/harness/ig,/cookyman/ig,/version/ig,/9294dd6/ig];for(const f of files){const s=fs.readFileSync(f,'utf8');let lines=s.split(/\\n/);let hits=[];for(let i=0;i<lines.length;i++){let l=lines[i]; if(pats.some(p=>{p.lastIndex=0; return p.test(l)})) hits.push("'`${i+1}: ${l.slice(0,220)}`)} if(hits.length) console.log('"'\\n## '+f+'\\n'+hits.slice(0,80).join('\\n')+(hits.length>80?"'`'"\\n... "'${hits.length-80} more`:'"''));}\"" in /Users/junghojang/Developments/myProject/myHarness
 exited 1 in 0ms:
zsh:1: bad substitution
zsh:1: bad substitution
[eval]:1
const fs=require('fs'),path=require('path');function walk(d,o=[]){if(!fs.existsSync(d))return o;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?walk(p,o):o.push(p)}return o}const files=[...walk('.claude-plugin'),...walk('skills/myharness'),...walk('docs'),...fs.readdirSync('.').filter(f=>/^README/.test(f)||['AGENTS.md','install.sh'].includes(f))].sort();const pats=[/revfactory/ig,/rev[-_ ]?factory/ig,/myharness/ig,/my_harness/ig,/harness-factory/ig,/harness-100/ig,/\/harness\b/g,/$harness\b/g,/skills\/harness/ig,/\.agents\/skills\/harness/ig,/\.claude\/skills\/harness/ig,/cookyman/ig,/version/ig,/9294dd6/ig];for(const f of files){const s=fs.readFileSync(f,'utf8');let lines=s.split(/\n/);let hits=[];for(let i=0;i<lines.length;i++){let l=lines[i]; if(pats.some(p=>{p.lastIndex=0; return p.test(l)})) hits.push()} if(hits.length) console.log('\n## '+f+'\n'+hits.slice(0,80).join('\n')+(hits.length>80?:''));}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               ^

SyntaxError: Unexpected token ':'
    at makeContextifyScript (node:internal/vm:185:14)
    at node:internal/process/execution:107:22
    at [eval]-wrapper:6:24
    at runScript (node:internal/process/execution:101:62)
    at evalScript (node:internal/process/execution:136:3)
    at node:internal/main/eval_string:55:3

Node.js v22.11.0

hook: PostToolUse
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc "node -e 'const fs=require(\"fs\"),path=require(\"path\");function walk(d,o=[]){if("'!fs.existsSync(d))return o;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?walk(p,o):o.push(p)}return o}const files=[...walk(".claude-plugin"),...walk("skills/myharness"),...walk("docs"),...fs.readdirSync(".").filter(f=>/''^README/.test(f)||["AGENTS.md","install.sh"].includes(f))].sort();const pats=[/revfactory/ig,/rev[-_ ]?factory/ig,/myharness/ig,/my_harness/ig,/harness-factory/ig,/harness-100/ig,/'"\\/harness\\b/g,/\\"'$harness'"\\b/g,/skills\\/harness/ig,/\\.agents\\/skills\\/harness/ig,/\\.claude\\/skills\\/harness/ig,/cookyman/ig,/version/ig,/9294dd6/ig];for(const f of files){const s=fs.readFileSync(f,\"utf8\");let lines=s.split(/\\n/);let hits=[];for(let i=0;i<lines.length;i++){let l=lines[i]; if(pats.some(p=>{p.lastIndex=0; return p.test(l)})) hits.push("'`${i+1}: ${l.slice(0,220)}`)} if(hits.length) console.log("'"\\n## \"+f+\"\\n\"+hits.slice(0,80).join(\"\\n\")+(hits.length>80?"'`'"\\n... "'${hits.length-80} more`:""));}'"'" in /Users/junghojang/Developments/myProject/myHarness
hook: PostToolUse
 succeeded in 263ms:

## .claude-plugin/marketplace.json
2:   "name": "myharness-marketplace",
4:     "name": "cookyman",
5:     "email": "cookyman@gmail.com",
6:     "url": "https://github.com/cookyman74"
10:       "name": "myharness",
13:       "version": "1.0.0"

## .claude-plugin/plugin.json
2:   "name": "myharness",
4:   "version": "1.0.0",
6:     "name": "cookyman",
7:     "url": "https://github.com/cookyman74"
10:   "repository": "https://github.com/cookyman74/my_harness",
13:     "myharness",
15:     "harness-factory",

## AGENTS.md
6: - 새 도메인/프로젝트용 하네스를 만들거나 확장·점검하려면 **`skills/myharness/SKILL.md`를 읽고 그 워크플로우(Phase 0~7)를 따른다.**
7: - Codex 스킬 자동 활성화를 쓰려면 `install.sh`로 `.agents/skills/myharness`를 설치한다(그 후 "하네스 만들어줘" 등에 description 기반 활성화 + `/skills`·`$myharness` 명시 호출).
15: - 상세: `skills/myharness/references/runtime-adapters.md`, 오케스트레이션은 `references/orchestrator-template.md` 템플릿 D.
18: `skills/myharness/references/external-review-loop.md` — codex/gemini 독립 검증. 양쪽 런타임 동일하게 subprocess로 작동. `skills/myharness/scripts/check-review-tools.sh`로 도구 연동 점검(없으면 게이트 생략).

## README.md
6:   <img src="https://img.shields.io/badge/Version-1.0.0-brightgreen.svg" alt="Version">
11:   <a href="https://github.com/cookyman74/my_harness/stargazers"><img src="https://img.shields.io/github/stars/cookyman74/my_harness?style=social" alt="GitHub Stars"></a>
52: - **Dual Runtime (Claude Code + Codex)** — One source of truth (`skills/myharness/`), thin per-runtime adapters. The factory emits both `CLAUDE.md` and `AGENTS.md` pointers and adapts orchestration (Claude `TeamCreate` ↔
93: /plugin marketplace add cookyman74/my_harness
98: /plugin install myharness@myharness-marketplace
104: # Copy the skills directory to ~/.claude/skills/myharness/
105: cp -r skills/myharness ~/.claude/skills/myharness
114: # → ~/.codex/skills/myharness → skills/myharness (symlink, always latest)
115: # → repo .agents/skills/myharness (for trusted projects)
119: Invoke in Codex with **`$myharness`**, the **`/skills`** menu, or a description-matching request (e.g. "하네스 구성해줘"). Note: `/myharness` is **not** valid Codex syntax (custom slash commands are unsupported); restart the Co
276: **[revfactory/harness-100](https://github.com/revfactory/harness-100)** — 100 production-ready agent team harnesses across 10 domains, available in both English and Korean (200 packages total). Each harness ships with 4-
302: - Cross-runtime scaffolder: [github.com/Gizele1/harness-init](https://github.com/Gizele1/harness-init)

## README_JA.md
6:   <img src="https://img.shields.io/badge/Version-1.0.0-brightgreen.svg" alt="Version">
11:   <a href="https://github.com/cookyman74/my_harness/stargazers"><img src="https://img.shields.io/github/stars/cookyman74/my_harness?style=social" alt="GitHub Stars"></a>
52: - **デュアルランタイム（Claude Code + Codex）** — 単一の出典（`skills/myharness/`）＋ランタイム別の薄いアダプター。ファクトリーが `CLAUDE.md`・`AGENTS.md` ポインターを両方出力し、オーケストレーションを分岐（Claude `TeamCreate` ↔ Codex ネイティブ subagents / `codex exec`）。Phase 7 のランタイム同期で dri
70: ハーネス進化メカニズムは「何が効いて、何が効かなかったか」のデルタをファクトリーへフィードバックし、次世代が測定可能なかたちで改善されるようにします。生成されたハーネスが実プロジェクトで使用されると、`/myharness:evolve` スキルが初期アーキテクチャとリリース時アーキテクチャのデルタを捕捉し、ファクトリーへ戻します。次回、同様のドメインでの生成は、このフィードバックを反映して「リリース状態により近いドラフト」から始まりま
75:                                               ▼ (/myharness:evolve によるデルタ取得)
107: /plugin marketplace add cookyman74/my_harness
112: /plugin install myharness@myharness-marketplace
118: # skillsディレクトリを ~/.claude/skills/myharness/ にコピー
119: cp -r skills/myharness ~/.claude/skills/myharness
128: # → ~/.codex/skills/myharness → skills/myharness（シンボリックリンク、常に最新）
129: # → repo .agents/skills/myharness（trusted プロジェクト用）
133: Codex では **`$myharness`**、**`/skills`** メニュー、または description に合致する依頼（例：「ハーネスを構成して」）で呼び出します。`/myharness` は Codex の構文では **ありません**（カスタムスラッシュ未対応）。インストール後はスキル一覧の再読み込みのため Codex セッションを再起動してください。
290: **[revfactory/harness-100](https://github.com/revfactory/harness-100)** — 10ドメイン、100のプロダクションレディなエージェントチームハーネス（英韓200パッケージ）。各ハーネスには4〜5名の専門エージェント、オーケストレータースキル、ドメイン特化スキルが含まれており、すべて本プラグインで生成されました。コンテンツ制作、ソフトウェア開発、データ/AI、ビジネス戦
316: - クロスランタイム・スキャフォルダー: [github.com/Gizele1/harness-init](https://github.com/Gizele1/harness-init)

## README_KO.md
6:   <img src="https://img.shields.io/badge/Version-1.0.0-brightgreen.svg" alt="Version">
11:   <a href="https://github.com/cookyman74/my_harness/stargazers"><img src="https://img.shields.io/github/stars/cookyman74/my_harness?style=social" alt="GitHub Stars"></a>
52: - **듀얼 런타임 (Claude Code + Codex)** — 단일 출처(`skills/myharness/`) + 런타임별 얇은 어댑터. 팩토리가 `CLAUDE.md`·`AGENTS.md` 포인터를 둘 다 출력하고 오케스트레이션을 분기(Claude `TeamCreate` ↔ Codex 네이티브 subagents / `codex exec`). Phase 7 런타임 동기화로 drift 방지.
70: 하네스 진화 메커니즘은 "무엇이 먹혔고 무엇이 안 먹혔는가"의 델타를 팩토리로 되먹여, 다음 세대가 측정 가능하게 더 나아지도록 합니다. 실제 프로젝트에서 생성된 하네스가 사용될 때, `/myharness:evolve` 스킬이 초기 아키텍처와 최종 출시 아키텍처 간 변화량을 포착해 팩토리로 되먹입니다. 다음번 같은 도메인에 대한 생성은 이 되먹임을 반영해 "출시 상태에 더 가까운 초안"에서 
75:                                           ▼ (/myharness:evolve 로 델타 포착)
107: /plugin marketplace add cookyman74/my_harness
112: /plugin install myharness@myharness-marketplace
118: # skills 디렉토리를 ~/.claude/skills/myharness/에 복사
119: cp -r skills/myharness ~/.claude/skills/myharness
128: # → ~/.codex/skills/myharness → skills/myharness (심링크, 항상 최신)
129: # → repo .agents/skills/myharness (trusted 프로젝트용)
133: Codex에서는 **`$myharness`**, **`/skills`** 메뉴, 또는 description에 맞는 요청(예: "하네스 구성해줘")으로 호출합니다. `/myharness`는 Codex 문법이 **아닙니다**(커스텀 슬래시 미지원). 설치 후 스킬 목록 재로딩을 위해 Codex 세션을 재시작하세요.
283: **[revfactory/harness-100](https://github.com/revfactory/harness-100)** — 10개 도메인, 100개의 프로덕션 레디 에이전트 팀 하네스 (한영 200패키지). 각 하네스에 4-5명의 전문 에이전트, 오케스트레이터 스킬, 도메인 특화 스킬이 포함되어 있으며, 모두 이 플러그인으로 생성되었습니다. 콘텐츠 제작, 소프트웨어 개발, 데이터/A
309: - 크로스 런타임 스캐폴더: [github.com/Gizele1/harness-init](https://github.com/Gizele1/harness-init)

## docs/experimental-dependency.md
3: > **Status:** Active · **Owner:** cookyman · **Last updated:** 2026-04-18 · **SLA:** See [Monitoring Commitment](#monitoring-commitment)
35: 2. [Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) — the patterns `harness` codifies (Pipeline, Producer-Reviewer, Supervisor, etc.).
106: | **T+24h** | Merge hotfix. Push `v1.2.x` patch tag. Update `docs/compatibility-matrix.md` row for affected Claude Code version. | `v1.2.x` patch release |
109: **Adopter impact:** Existing pinned users on the prior Claude Code version are unaffected. Users on latest get a same-week patch.
153: - `docs/compatibility-matrix.md` *(pending P-13)* — Claude Code × harness version table

## docs/quickstart.md
10: - Claude Code **v2.x or later** (`claude --version` should return `2.x` or higher)
19: claude plugin marketplace add cookyman74/my_harness
22: **What this does:** Registers the `myharness-marketplace` so Claude Code can discover plugins published by `cookyman`.
24: **Expected output:** `Added marketplace: cookyman74/my_harness`
31: claude plugin install myharness@myharness-marketplace
37: **What this does:** Installs the `myharness` plugin from the `myharness-marketplace` marketplace, then enables Agent Teams — the Claude Code API harness uses to orchestrate multi-agent workflows. See [`docs/experimental-
40: **Cause:** Claude Code version is older than v2.x (Agent Teams was introduced in v2.0).
41: **Fix:** Run `claude --version`. If below 2.0, upgrade via `npm i -g @anthropic-ai/claude-code` (or your distribution's installer), then repeat Step 2.
51: **What this does:** Invokes the `/myharness` meta-skill, which analyzes your domain sentence and scaffolds a team of specialized agents + their skills into `.claude/agents/` and `.claude/skills/` in the current directory
79: **Fix:** Run `claude plugin list`. If `myharness@myharness-marketplace` is absent, repeat Step 2. If present but inactive, run `claude plugin enable myharness@myharness-marketplace`, then repeat Step 3.
99: **Fix:** Limit to a single task per run (don't chain `&&` multiple harness invocations), and use the `--max-turns` flag if your Claude Code version supports it. For production, gate harness invocations behind a cost-awar
114: - [`revfactory/harness-100`](https://github.com/revfactory/harness-100) — Catalog of 100+ pre-built domain harnesses, if you'd rather clone than generate
115: - [`revfactory/claude-code-harness`](https://github.com/revfactory/claude-code-harness) — The A/B test harness we used to measure +60% quality on 15 tasks
117: **If you hit something this guide didn't cover:** open an issue with the `quickstart-gap` label and include: (a) which step failed, (b) `claude --version`, (c) the exact error message. The SLA for quickstart-gap issues i

## docs/self-evaluation-system.md
116:   "schema_version": "1.0",
195: - `skills/myharness/SKILL.md`의 Phase 6 검증
196: - `skills/myharness/references/loop-self-eval.md`
197: - `skills/myharness/scripts/build-scorecard.sh`
198: - `skills/myharness/scripts/check-review-tools.sh`

## install.sh
3: # 정본은 skills/myharness/ 한 곳. 런타임별 진입점만 연결한다.
13: # 호출: $myharness 또는 /skills 메뉴. (/myharness 슬래시 명령은 미지원)
16: if [ -e "$CODEX_SKILLS/myharness" ] && [ ! -L "$CODEX_SKILLS/myharness" ]; then
17:   mv "$CODEX_SKILLS/myharness" "$CODEX_SKILLS/myharness.bak.$(git rev-parse --short HEAD 2>/dev/null || echo old)"
18:   echo "Codex: 기존 구버전 myharness → myharness.bak.* 백업"
20: ln -sfn "$REPO/skills/myharness" "$CODEX_SKILLS/myharness"
21: echo "Codex: ~/.codex/skills/myharness → $REPO/skills/myharness 심링크 (최신 반영)"
25: ln -sfn ../../skills/myharness .agents/skills/myharness
26: echo "Codex: .agents/skills/myharness 심링크 (trusted 프로젝트용)"
31: bash skills/myharness/scripts/check-review-tools.sh || echo "  (도구 전무 → external-review-loop 게이트는 생략됨)"
43: - Codex: ~/.codex/skills/myharness (최신 심링크)
44:   호출법 → `$myharness` 또는 `/skills` 메뉴 또는 "하네스 만들어줘" (※ `/myharness` 슬래시 명령은 미지원)

## skills/myharness/SKILL.md
2: name: myharness
3: description: "하네스(에이전트 팀 + 스킬)를 구성·확장·점검하는 메타 스킬 (myharness · /myharness · $myharness). 신규 도메인/프로젝트 자동화 체계 구축, 기존 하네스 재구성·운영·유지보수에 사용. 트리거 — KO: '하네스 구성/구축/설계/엔지니어링', '하네스 점검/감사/현황', '에이전트·스킬 동기화'; EN: 'build a harness f
202: 1. **점검:** `bash skills/myharness/scripts/check-review-tools.sh` → 끝줄 `AVAILABLE:`. **none**=스킬 생성 안 함(내부 QA만, 보고서·CLAUDE.md에 "도구 미연동 생략" 명시) / **하나만**=그 도구만 쓰는 저하 모드 생성 / **둘 다**=풀 생성.

## skills/myharness/references/loop-self-eval.md
28:   "schema_version": "1",

## skills/myharness/references/runtime-adapters.md
35: - **Codex:** 레포 루트 `AGENTS.md` 자동 로드(루트→cwd concat, 가까운 쪽 우선). AGENTS.md 역할: 하네스 포인터 + "하네스 만들/고치려면 `skills/myharness/SKILL.md`를 따르라" + 오케스트레이션은 §4 어댑터. (Codex 스킬 auto-activation이 있으므로, 스킬을 `.agents/skills/`에 두면 AGENTS.m

## skills/myharness/references/self-improvement-loop.md
28: - **출력:** `grading.json`(`expectations[].passed/evidence`, `summary.pass_rate`) + `timing.json`(tokens·ms) + `run_manifest.json`(skill_hash·assertion_version·runner_version·model·seed·env·case_ids).
50: - baseline은 **immutable artifact** — `skill_hash·assertion_version·runner_version·model·env·seed·case_ids·holdout_score·n` 고정.

## skills/myharness/scripts/build-scorecard.sh
39:     schema_version:"1", loop:($d.loop//"external-review"), stage_id:($d.stage_id//"?"),

hook: PostToolUse Completed
codex
초기 스캔상 `revfactory`가 README/quickstart에 남아 있고, Codex 호출 문법 설명과 skill description 사이에 충돌 후보가 보입니다. 매니페스트와 README 3종 drift를 더 구체화합니다.
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
/bin/zsh -lc "sed -n '1,220p' .claude-plugin/marketplace.json" in /Users/junghojang/Developments/myProject/myHarness
exec
/bin/zsh -lc "sed -n '1,220p' .claude-plugin/plugin.json" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
{
  "name": "myharness-marketplace",
  "owner": {
    "name": "cookyman",
    "email": "cookyman@gmail.com",
    "url": "https://github.com/cookyman74"
  },
  "plugins": [
    {
      "name": "myharness",
      "source": "./",
      "description": "에이전트 팀 & 스킬 아키텍트. 도메인/프로젝트에 맞는 하네스를 구성하고, 전문 에이전트를 정의하며, 에이전트가 사용할 스킬을 생성하는 메타 스킬.",
      "version": "1.0.0"
    }
  ]
}

 succeeded in 0ms:
{
  "name": "myharness",
  "description": "The team-architecture factory for Claude Code and Codex — a meta-skill that turns a domain description into an agent team and the skills they use, with six team patterns (Pipeline, Fan-out/Fan-in, Expert Pool, Producer-Reviewer, Supervisor, Hierarchical Delegation), a two-layer quality gate (internal QA + external codex/gemini review), TDD/dev-rules doctrine injection, risk-tiered gates, and dual-runtime output (Claude Code + Codex). Claude Code·Codex용 팀 아키텍처 팩토리: 도메인 한 문장을 에이전트 팀+스킬로 변환하고, 내부 QA + 외부 리뷰 2층 게이트와 듀얼 런타임을 적용하는 메타 스킬.",
  "version": "1.0.0",
  "author": {
    "name": "cookyman",
    "url": "https://github.com/cookyman74"
  },
  "homepage": "https://www.hell0world.net/",
  "repository": "https://github.com/cookyman74/my_harness",
  "license": "Apache-2.0",
  "keywords": [
    "myharness",
    "harness",
    "harness-factory",
    "team-architecture-factory",
    "agent-team",
    "skill-architect",
    "meta-skill",
    "orchestration",
    "claude-code",
    "claude-code-plugin",
    "codex",
    "dual-runtime",
    "external-review",
    "tdd",
    "risk-tiered-gate",
    "agent-scaffolding",
    "multi-agent",
    "pipeline",
    "fan-out-fan-in",
    "expert-pool",
    "producer-reviewer",
    "supervisor",
    "hierarchical-delegation"
  ]
}

hook: PostToolUse
hook: PostToolUse
exec
/bin/zsh -lc "sed -n '1,180p' docs/quickstart.md" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
# Quickstart — 5 Minutes to Your First Harness

> **Time budget: 5 minutes (strict).** If you are not at Step 5 within 5 minutes, stop and file an issue — that is a bug in this document, not a bug in you.

<!-- TODO: Loom embed — 60s screen recording showing Steps 1→5 end-to-end. Replace this comment with the `<iframe>` once recorded. -->

**What you will have at the end:** a working `.claude/agents/` directory with 3–5 domain-specialized agents, generated from a single-sentence prompt, ready to run on a sample task.

**Prerequisites (check before starting):**
- Claude Code **v2.x or later** (`claude --version` should return `2.x` or higher)
- A shell that persists `export` across commands (bash, zsh, or fish)
- Network access to `github.com` and `api.anthropic.com`

---

## Step 1 — Add the marketplace (60 seconds)

```bash
claude plugin marketplace add cookyman74/my_harness
```

**What this does:** Registers the `myharness-marketplace` so Claude Code can discover plugins published by `cookyman`.

**Expected output:** `Added marketplace: cookyman74/my_harness`

---

## Step 2 — Install the plugin and enable the Experimental flag (40 seconds)

```bash
claude plugin install myharness@myharness-marketplace
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

*(To persist the flag across shell sessions, append the `export` line to `~/.zshrc` or `~/.bashrc`.)*

**What this does:** Installs the `myharness` plugin from the `myharness-marketplace` marketplace, then enables Agent Teams — the Claude Code API harness uses to orchestrate multi-agent workflows. See [`docs/experimental-dependency.md`](./experimental-dependency.md) for why the flag is required.

**Failure FAQ #1 — `AGENT_TEAMS not found` / teams don't instantiate**
**Cause:** Claude Code version is older than v2.x (Agent Teams was introduced in v2.0).
**Fix:** Run `claude --version`. If below 2.0, upgrade via `npm i -g @anthropic-ai/claude-code` (or your distribution's installer), then repeat Step 2.

---

## Step 3 — Generate a harness from one sentence (2 minutes)

```bash
claude "build a harness for a fintech risk-assessment team"
```

**What this does:** Invokes the `/myharness` meta-skill, which analyzes your domain sentence and scaffolds a team of specialized agents + their skills into `.claude/agents/` and `.claude/skills/` in the current directory.

**Try these alternate prompts** — any of them work:
- `claude "하네스 구성해줘 — 핀테크 리스크 평가 팀"` (Korean also works)
- `claude "build a harness for an e-commerce fraud-detection workflow"`
- `claude "design an agent team for technical due diligence on open-source repos"`

**Expected output:** A streaming plan, then confirmation that 3–5 agent `.md` files and their skills were written.

**Failure FAQ #2 — The Korean prompt returns nothing / the English one succeeds but Korean doesn't**
**Cause:** Locale or tokenizer misrouting; harness's orchestrator matches on Korean trigger words ("하네스 구성"), which are built into the skill definition.
**Fix:** If Korean fails, re-run with the English prompt above — the underlying skill is identical. If both fail, jump to Failure FAQ #3.

---

## Step 4 — Verify the generated files (30 seconds)

```bash
ls -la .claude/agents/
ls -la .claude/skills/
```

**What this does:** Confirms the meta-skill wrote files to the expected locations.

**Expected output:** 3–5 files per directory, with names reflecting your domain (e.g., `risk-analyst.md`, `compliance-reviewer.md`, `portfolio-monitor.md` for the fintech example).

**Failure FAQ #3 — "Nothing was generated" / directories are empty**
**Cause:** The plugin is not actually installed or is not active in the current project.
**Fix:** Run `claude plugin list`. If `myharness@myharness-marketplace` is absent, repeat Step 2. If present but inactive, run `claude plugin enable myharness@myharness-marketplace`, then repeat Step 3.

---

## Step 5 — Run a sample task against the new team (90 seconds)

Copy a realistic Jira-ticket-style prompt and hand it to your fresh team:

```bash
claude "Ticket FIN-427: A new corporate customer (mid-cap manufacturer, \$80M revenue, South Korea) has applied for a \$5M working-capital line. Produce a risk assessment covering (1) credit-history red flags, (2) sector concentration vs. our existing book, (3) regulatory exposure (KFTC, FSC). Output: a 1-page memo with a go/no-go recommendation."
```

**What this does:** Claude Code detects the new agents in `.claude/agents/`, routes the task through the team patterns harness generated (typically Producer-Reviewer or Expert-Pool for risk work), and returns a structured memo.

**Failure FAQ #4 — "The team doesn't execute / only one agent responds"**
**Cause:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` was set in the shell that ran Step 3 but not in the shell running Step 5 (happens when opening a new terminal).
**Fix:** Re-export in the current shell: `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, then re-run Step 5. To make permanent, add the line to your shell rc file.

**Failure FAQ #5 — "Too many API calls / cost anxiety"**
**Cause:** Multi-agent teams can fan out to 5+ parallel Claude calls per task. A single complex ticket can consume 50K–200K tokens.
**Fix:** Limit to a single task per run (don't chain `&&` multiple harness invocations), and use the `--max-turns` flag if your Claude Code version supports it. For production, gate harness invocations behind a cost-aware wrapper — see `docs/cost-controls.md` *(forthcoming)*.

---

## You're done

At this point you should have:

- [x] A `.claude/agents/` directory with domain-specialized agents
- [x] A `.claude/skills/` directory with their supporting skills
- [x] One successful sample-task execution
- [x] A working `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` environment

**Next reads:**
- [`docs/experimental-dependency.md`](./experimental-dependency.md) — Why the flag, and what we'll do when it changes
- [`revfactory/harness-100`](https://github.com/revfactory/harness-100) — Catalog of 100+ pre-built domain harnesses, if you'd rather clone than generate
- [`revfactory/claude-code-harness`](https://github.com/revfactory/claude-code-harness) — The A/B test harness we used to measure +60% quality on 15 tasks

**If you hit something this guide didn't cover:** open an issue with the `quickstart-gap` label and include: (a) which step failed, (b) `claude --version`, (c) the exact error message. The SLA for quickstart-gap issues is **48 hours** to first response (see `CONTRIBUTING.md`).

hook: PostToolUse
exec
/bin/zsh -lc "sed -n '1,260p' skills/myharness/SKILL.md" in /Users/junghojang/Developments/myProject/myHarness
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

## 항법 (최소 경로 — 기본은 슬림)
팩토리가 커졌어도 **기본은 슬림**. 게이트·평가·자기개선은 *리스크가 오를 때만* 켠다(단순 하네스 강제 금지).

| 하네스 유형 | 반드시 | 생략 |
|------------|--------|------|
| 단순/비코드 · 코드 경량 | Phase 0~7 코어 + 내부 QA (dev-rules만 선택) | 외부 리뷰·TDD·평가·self-improve |
| 코드/설계 표준 | + 외부 리뷰 1회 + dev-rules·tdd 주입 | 자동 환류 |
| 코드/설계 중대 | + 단계마다 외부 리뷰 + 승인 사다리 + scorecard | 자동 채택(실험) |

> 최소 경로·구현 상태(active vs 🧪실험/📐설계만)·루프 개요 지도는 `references/factory-map.md`. 🧪/📐 기능은 생성 하네스가 자동 실행 안 함.

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

**하이브리드 패턴:** Phase마다 모드를 섞음(예: 병렬 수집=서브 → 합의 통합=팀 / 팀 초안 → 서브 검증 / Phase 간 `TeamDelete`+새 `TeamCreate`). 각 Phase 상단에 실행 모드 명시. 상세: `references/orchestrator-template.md` 템플릿 C.

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


hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
codex
quickstart는 아직 Claude 전용 문서로 남아 있고 Codex 설치/호출과 README 설치 섹션이 분리돼 있습니다. Phase 6/7, runtime 어댑터, factory-map, 외부 리뷰 루프를 집중 확인합니다.
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
/bin/zsh -lc "sed -n '260,520p' skills/myharness/SKILL.md" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:

> 팀원이 많을수록 조율 오버헤드가 커진다. 3명의 집중된 팀원이 5명의 산만한 팀원보다 낫다.
> **동시성 cap(백프레셔):** 동시 실행 기본 3·최대 5, 외부 리뷰는 별도 2. 초과는 큐잉. 대규모 fan-out의 리소스·API quota·토큰 폭증 방지 (`references/orchestrator-template.md` 동시성 정책).

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

**단계 마감 게이트(표준·중대):** 오케스트레이터가 `external-review-loop` 스킬 호출 — **라운드 반복 루프**(codex/gemini 병렬 → 판정 → 확인분만 TDD 수정·게이트 → 수정 diff 재리뷰). **loop-until-dry**(신규 확인 0건 K회 연속) 또는 MAX_ROUNDS에서 종료. 판정 원장(`verdicts.json`)으로 신규만 판정. 근거 수집은 위임 가능하나 **최종 확정은 오케스트레이터 비위임**. 상세: `references/external-review-loop.md`.

**커밋 순서(순환 제거):** 리뷰→판정→수정→게이트 PASS → **승인 관문** → 단일 커밋. (리뷰는 커밋 *전* 작업트리/스테이지 대상 — "커밋 직후 리뷰" 아님.)
- 승인 관문 기본: 사용자 승인 대기.
- **자율 노브:** `프로젝트/_workspace/.autonomous` 마커(또는 "자율로"·"승인 생략" 발화) 시 승인 자동 통과 → 커밋. 권한모드(bypassPermissions)는 스킬이 못 읽으므로 마커/발화로 명시. 마커 ON이어도 외부리뷰·판정·게이트는 그대로(인간 승인 한 스텝만 생략).
- **push는 자율이어도 기본 대기**(외부 송출·되돌리기 어려움) — `_workspace/.autonomous-push` 마커 시만 자동.

**리뷰 예산(비용·지연 통제):** run당 외부 리뷰 횟수 상한을 두고, **코드 변경 없으면 게이트 생략(skip-when-no-delta)**. 검증된 반복 구간은 `_workspace/.fast-pass` 마커로 우회. 이슈 다수(10+)면 판정 보조로 일괄 처리해 오케스트레이터 컨텍스트 비대화를 막는다.

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

> **smoke/full 모드(비용 통제):** 기본은 **smoke** — 스킬당 대표 프롬프트 1개 + 정적 트리거 lint. with/without 비교·20개 트리거 eval·반복 최적화 등 **full**은 명시 요청 또는 릴리스 게이트에서만(스킬 N개면 agent run이 곱셈으로 폭증).

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
- **(수치 기반 — 데이터 충분 시)** 누적 `loop_scorecard.json` 추세가 악화: `alignment_score` 롤링 하락 3회 연속, `rounds_normalized` 상승 추세, `overturned_rejection_rate` 임계 초과, 동일 경계 N회 실패. **단, 자동 적용 금지 — 제안만 + 승인 게이트**, `min_adjudicated_claims≥20` 전 발화 금지(플래핑·Goodhart 방지). 상세: `references/loop-self-eval.md`.

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
- [ ] 모델 라우팅 — 고추론만 `opus`, 단순 작업은 경량 모델 (비용 통제) / Codex는 런타임 모델
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

- **항법(먼저 읽기)**: `references/factory-map.md` — 최소 경로(도메인/리스크별 무엇을 쓰나)·구현 상태·루프 개요 지도. 단순 하네스 과부담 방지.
- 하네스 패턴: `references/agent-design-patterns.md`
- 기존 하네스 예시 (실제 파일 전문 포함): `references/team-examples.md`
- 오케스트레이터 템플릿: `references/orchestrator-template.md`
- **스킬 작성 가이드**: `references/skill-writing-guide.md` — 작성 패턴, 예시, 데이터 스키마 표준
- **스킬 테스트 가이드**: `references/skill-testing-guide.md` — 테스트/평가/반복 개선 방법론
- **QA 에이전트 가이드**: `references/qa-agent-guide.md` — 빌드 하네스에 QA 에이전트를 포함할 때 참조. 통합 정합성 검증 방법론, 경계면 버그 패턴, QA 에이전트 정의 템플릿 포함. 실제 프로젝트에서 발견된 7개 버그 사례 기반.
- **루프 평가/개선**: `references/loop-self-eval.md`(루프 scorecard·alignment·단계적 — 측정만→수동→제안→자동) + `references/self-improvement-loop.md`(생성 산출물 벤치→holdout→승인→채택, 설계만·MVP 단계적·자동 적용 아님). 용어: `loop_scorecard`(루프) vs `artifact_benchmark`(산출물).
- **외부 리뷰 루프**: `references/external-review-loop.md` — codex/gemini 독립 검증 단계 게이트. 방법론 겸 생성 템플릿. **루프 제어(loop-until-dry·MAX_ROUNDS·라운드 카운터)·판정 원장(verdicts.json, dedup vs seen)·수정본 재리뷰·근거수집 위임/확정 비위임**·기각 사유표·커밋 순서·자율 노브 포함.
- **TDD 교리 / 개발 규칙**: `references/tdd-doctrine.md`, `references/dev-rules.md` — 코드/수정 에이전트 작업 원칙 주입용.
- **런타임 어댑터**: `references/runtime-adapters.md` — Claude Code/Codex 듀얼 런타임 설계. 진입점·오케스트레이션 매핑, AGENTS.md·`.agents/skills/` 생성, 설치(Codex 공식 docs 검증).

hook: PostToolUse
exec
/bin/zsh -lc "sed -n '1,260p' skills/myharness/references/runtime-adapters.md" in /Users/junghojang/Developments/myProject/myHarness
exec
/bin/zsh -lc "sed -n '1,260p' skills/myharness/references/external-review-loop.md" in /Users/junghojang/Developments/myProject/myHarness
exec
/bin/zsh -lc "sed -n '1,260p' skills/myharness/references/factory-map.md" in /Users/junghojang/Developments/myProject/myHarness
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

 succeeded in 0ms:
# 팩토리 항법 (Factory Map) — 최소 경로 · 구현 상태 · 루프 개요

팩토리가 커지며(references 12+) 단순 하네스에 과부담이 생기지 않도록, **"무엇을 언제 쓰나"를 한 곳에 모은 항법층**. 핵심 사명은 여전히 *도메인 한 문장 → 에이전트 팀 + 스킬*이다. 아래 기계(게이트·평가·자기개선)는 **필요할 때만** 켠다.

## 1. 최소 경로 지도 (도메인/리스크별)
| 하네스 유형 | 반드시 | 건너뛰어도 됨 |
|------------|--------|--------------|
| **단순/비코드** (콘텐츠·리서치·문서) | Phase 0~7 코어 + 내부 QA(생성-검증). `dev-rules`만 선택 주입 | 외부 리뷰 루프·TDD 교리·self-improvement·scorecard 전부 |
| **코드/설계 — 경량**(1파일·가역) | 코어 + 내부 QA | 외부 리뷰·교리·평가 |
| **코드/설계 — 표준**(다파일·기능) | + 외부 리뷰 **1회**(끝) + `dev-rules`·`tdd-doctrine` 주입 | self-improvement·자동 환류 |
| **코드/설계 — 중대**(계약·비가역·다도메인) | + 단계마다 외부 리뷰 + 승인 사다리 + scorecard 로깅 | 자동 채택(실험적) |
> 기본은 **슬림**. 위 표의 "반드시"만 하고, 나머지는 리스크가 올라갈 때 추가. 단순 하네스에 외부리뷰/교리/평가를 강제하지 말 것.

## 2. 구현 상태 (정책 ≠ 실행 — 약속과 현실 구분)
| 기능 | 상태 | 비고 |
|------|------|------|
| 6패턴 팀설계 · 에이전트/스킬 생성 · 오케스트레이션 | ✅ active | 코어 |
| 내부 QA(생성-검증) · 듀얼 런타임 · 리스크 등급 · 모델 라우팅 | ✅ active | |
| external-review-loop(수렴·원장·재리뷰) | ✅ active | codex/gemini 설치 시. `check-review-tools.sh` |
| `build-scorecard.sh`(loop_scorecard) | ✅ active (측정 로깅만) | 1단계. 자동 환류 없음 |
| loop-self-eval 단계 3·4(제안·자동 환류) | 🧪 **실험적·비활성** | 데이터·holdout 후 |
| self-improvement-loop | 📐 **설계만** | `run-benchmark.sh` **미구현** → 현재 실행 불가 |
> 🧪/📐 기능은 **생성된 하네스가 자동 실행하지 않는다**. "있다고 적힌" 것 ≠ "돈다". MVP 전까지 설계 참조용.

## 3. 루프 개요 지도 (어떤 루프가 언제)
```
[생성] → [내부 QA] 같은 세션 경계면 교차검증 (모든 도메인, 점진)
            ↓ (코드/설계, 도구 있음)
       [external-review-loop] codex/gemini 독립 → 전건 판정 → 수정 → 수렴(loop-until-dry)   ✅
            ↓ (측정)
       [loop_scorecard] 루프 효율 측정·로깅 (build-scorecard.sh)                          ✅ 1단계
            ↓ (실험적)
       [loop-self-eval 3·4] 추세 악화 → 흐름 개선 "제안"(승인 게이트)                       🧪
       [self-improvement-loop] 산출물 벤치(artifact_benchmark) → holdout → 채택            📐 설계만
       [test-refine] 스킬 with/without·assertion 반복 개선 (Phase 6-3, ε 수렴)             ✅
       [진화 Phase 7] 피드백·수치 트리거 → 하네스 갱신                                       ✅(관찰)/🧪(수치)
```
**용어:** `loop_scorecard`=루프 효율(loop-self-eval), `artifact_benchmark`=산출물 품질(self-improvement). 섞지 말 것.
**공통 안전장치:** 판정 권위=오케스트레이터(근거수집만 위임), anti-Goodhart(holdout·독립성), 자동 적용 금지(제안+승인), 단계적.

## 읽는 순서 (신규 사용자)
1. SKILL.md(워크플로우) → 2. 이 지도(§1 최소 경로로 범위 결정) → 3. 해당 도메인에 필요한 reference만.

 succeeded in 0ms:
# 외부 리뷰 루프 (External Review Loop) — 방법론 & 생성 템플릿

이 파일은 두 역할을 한다:
1. **방법론 정본** — 단계 산출물 마감 게이트(외부 독립 AI 리뷰)의 표준 절차.
2. **생성 템플릿** — 코드/설계 도메인 하네스를 만들 때, 이 내용을 타겟 프로젝트의 `.claude/skills/external-review-loop/SKILL.md`로 생성한다(아래 frontmatter 포함). **단, 생성 전 `check-review-tools.sh`로 codex/gemini 연동을 확인**하고, 둘 다 미설치면 스킬을 만들지 않는다(Phase 4-6). 생성 시 `check-review-tools.sh`를 스킬의 `scripts/`로 함께 번들한다.

**왜 외부 리뷰인가**: 내부 생성-검증/QA는 같은 세션·같은 컨텍스트라 *동일한 맹점*을 공유한다. 외부 독립 AI(codex/gemini)는 다른 관점으로 결함을 잡는다. 단, **합의=정답이 아니다** — 두 AI가 같은 답을 내도 공유 학습데이터로 인한 상관 오류일 수 있다. 합의는 약한 증거이며, **판정 권위는 오케스트레이터에 있다 — 근거 수집(실코드 대조)은 보조 에이전트에 위임 가능하나, 최종 확정(confirm)은 비위임.**

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

## 루프 제어 (수렴·종료 — 무한 루프/미검증 방지)
이 게이트는 **라운드 반복 루프**다. 단일 패스가 아니다.

```
round = 1; dry_streak = 0
while True:
  Step 1~4 (round==1: {산출물} 전체 / round>1: 직전 수정분 diff만 좁게 재리뷰)
  신규_확인 = 이번 라운드 '확인/부분' 중 verdicts 원장에 없던 것
  if 신규_확인 == 0: dry_streak += 1
  else: dry_streak = 0; Step 5~7 (신규_확인만 수정·게이트·기록)
  if dry_streak >= K(기본 1, 중대 2): break        # loop-until-dry
  if round >= MAX_ROUNDS(기본 3): break + 잔여 미수렴 보고
  round += 1
```
- **K회 연속 신규 확인 0건**이면 수렴 종료. **MAX_ROUNDS 도달 시 강제 종료 + 미수렴 이슈 보고**(무한 루프 차단). **품질 θ 미달이 명백하면 `failed-quality-gate`로 즉시 중단**(MAX_ROUNDS 헛돌지 않게). 종료 사유는 `converged-good`/`exhausted`/`max-rounds`/`failed-quality-gate` 라벨로 기록. (gate/assertion은 코드 단계 전용 — 설계·문서는 `verdicts.json` 완료+정본 대조로 종료. 상세: `loop-self-eval.md`)
- **수정본 재리뷰(req)**: round>1은 이전 라운드 수정 diff만 좁게 재리뷰 → 수정이 새 결함을 만들지 검증(같은 맹점 회피 전제가 수정에도 적용).
- **판정 원장(req)**: `_workspace/reviews/{단계ID}_verdicts.json` — 이슈지문(파일+결함요지 해시)→ 판정·라운드·근거. 매 라운드 **seen 대조로 신규만 판정**(기각 이슈 재부상 방지, dedup vs seen).

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
trap 'pkill -P $$ 2>/dev/null' EXIT   # 셸 종료 시 하위 프로세스 정리(좀비 방지)
# timeout은 GNU coreutils — macOS엔 없을 수 있다(gtimeout). 이식성 위해 탐지 후 적용.
TO="$(command -v timeout || command -v gtimeout || true)"
# 주의: codex exec는 stdin 열려 있으면 무한 대기 → 반드시 < /dev/null
${TO:+$TO 600s} codex exec --sandbox read-only "$(cat _workspace/reviews/{단계ID}_prompt_general.md)" < /dev/null \
  > _workspace/reviews/{단계ID}_codex.md 2>&1 &
# gemini는 자체 sandbox 옵션이 없다(읽기전용 보장 불가). 프롬프트로만 "읽기 전용 리뷰"를 제약하고,
# 쓰기 위험이 우려되면 read-only 권한 셸/복제본에서 실행할 것.
${TO:+$TO 600s} gemini -p "$(cat _workspace/reviews/{단계ID}_prompt_perf.md)" < /dev/null \
  > _workspace/reviews/{단계ID}_gemini.md 2>&1 &
wait
```
- `timeout`/`gtimeout` 없으면 위 패턴은 타임아웃 없이 실행되니, 장시간 무응답 시 수동 중단 또는 watchdog 추가.
- 타임아웃(exit 124)·실패 → 1회 재시도 → 재실패 시 해당 도구 누락 명시 후 단일 출처로 진행(**루프 차단 금지**).
- gemini `-p` 플래그가 없는 버전이면 `cat prompt.md | gemini` 또는 `gemini "$(cat prompt.md)"`로 대체.
- **도구 부재 폴백:** codex/gemini 미설치면 그 사실을 결과서에 명시하고 내부 QA만으로 진행.

## Step 3 — 이슈 통합 + 원장 대조
두 출력에서 이슈 추출 → 중복 병합(동일 대상·동일 결함=1건, 출처 병기) → 번호 재부여. **`verdicts.json` 원장과 대조해 이미 판정된(기각/이월/기수정) 이슈는 제외하고 신규만 Step 4로** (dedup vs seen). 리뷰 보고 0건이면 "외부 리뷰 — 이슈 0건" 기록, dry_streak +1.

## Step 4 — 전건 판정 (근거수집 위임 가능 · 최종 확정 비위임)
신규 이슈마다 실코드/실문서 대조(grep/Read) 후 판정. **이슈 10+건이면 이슈별/배치로 판정 보조 에이전트에 위임** — 보조는 실코드 대조 근거 + 판정 *초안(draft)*만 반환(쓰기 금지). 오케스트레이터는 초안을 받아 **최종 확정(confirm)**만 직접 수행(권위 비위임). 판정 결과는 `verdicts.json`에 기록(이슈지문·판정·라운드·근거).

| 판정 | 기준 | 처리 |
|------|------|------|
| **확인** | 결함 재현/실재 | Step 5 수정 |
| **부분 확인** | 지적 실재하나 권고 과잉/계약 위배 | 비파괴 범위만 + 잔여 기각 근거 |
| **이월** | 타당하나 본 단계 범위 외 | 백로그 위치 명기 — 기각과 구분 |
| **기각** | 사유표 | 근거 명시(코드/정본 인용) — 삭제 금지 |

**기각 사유표:** 동결 계약 위배 · 설계 정본 명시 결정 · 기구현 오판(호출 형태만 보고 오판) · YAGNI/과설계 · 리뷰어 자인 비병목 · 기존 설계와 상충(멱등·격리 등).

## Step 5 — 확인분 TDD 수정 (확인 0건이면 생략)
**'확인/부분 확인'이 0건이면 Step 5~7을 생략**하고 판정 기록만 남긴 뒤 dry_streak +1로 루프 제어로 복귀(전부 기각/이월인데 수정·게이트 도는 낭비 방지). 확인분이 있으면: `tdd-doctrine.md` 규율(Red→Green→Refactor, 구조/행위 분리). 다중 에이전트 병렬 시 파일권 명시 분리(병렬 충돌 = 1차 실패 주원인). 에이전트는 커밋·브랜치 금지, status는 `_workspace/status/`.

## Step 6 — 통합 게이트
`{게이트명령}` 실행 → PASS. 게이트 없으면(설계서) 정본 정합성 재확인으로 대체. 테스트 리소스 간섭 게이트는 동시 실행 금지.

## Step 7 — 기록·커밋 (커밋 순서·자율 노브)
1. 결과서에 `## 외부 리뷰 반영 ({일자} — {단계ID} {k}건)` § — 판정표·게이트 수치·출처(codex/gemini).
2. 순서: 게이트 PASS → **승인 관문** → 단일 커밋(`fix: 외부 리뷰 {k}건 — {요지}`, Co-Authored-By).
   - 승인 관문 기본: 사용자 대기. `_workspace/.autonomous` 마커(또는 "자율로" 발화) 시 자동 통과.
   - **push는 자율이어도 기본 대기** — `_workspace/.autonomous-push` 마커 시만 자동.
   - 권한모드(bypassPermissions)는 스킬이 못 읽으므로 마커/발화로 명시. 마커 ON이어도 리뷰·판정·게이트는 그대로(인간 승인 한 스텝만 생략).

## Step 8 — 자체 평가 (1단계: 측정 로깅만, 계산 도출)
루프 종료 시 **`bash scripts/build-scorecard.sh {단계ID}_verdicts.json _workspace/evals/external-review/{단계ID}/{run_id}/scorecard.json [timing.json]`** 실행 — verdict_counts·rounds·`alignment_score`(정밀도 아님)·`*_rate`·cost·**`regression_catch_rate`**(round>1 재리뷰가 잡은 회귀/누출 — 전체 recall 아님)를 **스크립트가 verdicts.json에서 기계 계산**(LLM 자기보고 아님). 라벨(`converged-good`/`converged`/`max-rounds`/...)만 오케스트레이터가 해석. **측정·기록만**, 자동 흐름 변경 없음.
- `verdicts.json` 각 이슈에 `round`·`source` 기록(round>1 재리뷰분은 `source:"re-review"`)해야 regression_catch_rate 계산됨.
- 스크립트가 `summary.jsonl`에 집계 append → Phase 0/7 진입 시 **요약만** 읽음(읽기 경로, Lean). 스키마·졸업 기준·단계적 도입은 `loop-self-eval.md`. (jq 필요)

## 재진입 (루프 라운드 = 재진입)
재진입은 위 **루프 제어**의 라운드 반복으로 일원화한다. round>1은 직전 수정분 diff만 좁게 재리뷰하고, `verdicts.json` seen 대조로 기수정·기각 이슈는 다시 판정하지 않는다("기수정 확인"은 원장+게이트 재실행으로 갈음). 사용자가 동일 목록을 수동 재제출해도 원장 대조 → 신규만 판정.

## 테스트 시나리오
- **정상(수렴)**: round1 — codex 8+gemini 3→중복 1 병합→10건 판정(확인6/부분2/이월1/기각1)→수정·게이트 PASS·기록. round2 — 수정 diff 재리뷰, 신규 확인 0 → dry_streak 1=K → 종료.
- **수정이 새 결함(재리뷰 효과)**: round2에서 수정분 재리뷰가 신규 확인 1건 발견 → 수정 → round3 신규 0 → 종료.
- **미수렴**: round3(MAX)까지 신규 확인 지속 → 강제 종료 + 잔여 미수렴 이슈를 결과서·백로그에 보고.
- **도구 에러**: gemini 타임아웃 ×2 → "gemini 미수집" 명시, codex 단독 진행 — 라운드 완료.

hook: PostToolUse
hook: PostToolUse
hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
codex
문서 간 링크와 설치 절차는 사용자 경로에서 바로 깨지는 항목이므로 별도 정적 검사를 돌립니다. 특히 forthcoming 문서 링크와 세 README 간 install 블록 불일치를 봅니다.
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc "node -e 'const fs=require(\"fs\"),path=require(\"path\");function walk(d,o=[]){if("'!fs.existsSync(d))return o;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?walk(p,o):o.push(p)}return o}const files=[...walk("docs"),...walk("skills/myharness"),"README.md","README_KO.md","README_JA.md","AGENTS.md"].filter(f=>fs.existsSync(f));for(const f of files){const s=fs.readFileSync(f,"utf8");const re=/'"\\[["'^'"\\]]+\\]\\((["'^)]+)'"\\)|"'`([''^`]+'"\\.(?:md|sh|json|toml))"'`/g;let m;while((m=re.exec(s))){let ref=(m[1]||m[2]||"").split("#")[0]; if(!ref||/''^(https?:|mailto:|#)/.test(ref)) continue; if(ref.startsWith("./")) ref=path.join(path.dirname(f),ref); else if(!ref.startsWith("/")) ref=path.join(path.dirname(f),ref); ref=path.normalize(ref); if(!fs.existsSync(ref)){const line=s.slice(0,m.index).split("'"\\n\").length; console.log("'`${f}:${line}: missing ${m[1]||m[2]} -> ${ref}`)}}}'"'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
docs/experimental-dependency.md:71: missing plugin.json -> docs/plugin.json
docs/experimental-dependency.md:72: missing docs/migrating-from-experimental.md -> docs/docs/migrating-from-experimental.md
docs/experimental-dependency.md:72: missing docs/experimental-dependency.md -> docs/docs/experimental-dependency.md
docs/experimental-dependency.md:89: missing docs/managed-agents-migration.md -> docs/docs/managed-agents-migration.md
docs/experimental-dependency.md:106: missing docs/compatibility-matrix.md -> docs/docs/compatibility-matrix.md
docs/experimental-dependency.md:121: missing docs/compatibility-matrix.md -> docs/docs/compatibility-matrix.md
docs/experimental-dependency.md:141: missing .claude/agents/*.md -> docs/.claude/agents/*.md
docs/experimental-dependency.md:146: missing CONTRIBUTING.md -> docs/CONTRIBUTING.md
docs/experimental-dependency.md:152: missing ./show-hn-launch-kit.md -> docs/show-hn-launch-kit.md
docs/experimental-dependency.md:153: missing docs/compatibility-matrix.md -> docs/docs/compatibility-matrix.md
docs/quickstart.md:75: missing risk-analyst.md -> docs/risk-analyst.md
docs/quickstart.md:75: missing compliance-reviewer.md -> docs/compliance-reviewer.md
docs/quickstart.md:75: missing portfolio-monitor.md -> docs/portfolio-monitor.md
docs/quickstart.md:99: missing docs/cost-controls.md -> docs/docs/cost-controls.md
docs/quickstart.md:117: missing CONTRIBUTING.md -> docs/CONTRIBUTING.md
docs/self-evaluation-system.md:42: missing CLAUDE.md -> docs/CLAUDE.md
docs/self-evaluation-system.md:42: missing AGENTS.md -> docs/AGENTS.md
docs/self-evaluation-system.md:48: missing self_eval_scorecard.json -> docs/self_eval_scorecard.json
docs/self-evaluation-system.md:49: missing self_eval_report.md -> docs/self_eval_report.md
docs/self-evaluation-system.md:77: missing CLAUDE.md -> docs/CLAUDE.md
docs/self-evaluation-system.md:77: missing AGENTS.md -> docs/AGENTS.md
docs/self-evaluation-system.md:78: missing SKILL.md -> docs/SKILL.md
docs/self-evaluation-system.md:112: missing self_eval_scorecard.json -> docs/self_eval_scorecard.json
docs/self-evaluation-system.md:195: missing skills/myharness/SKILL.md -> docs/skills/myharness/SKILL.md
docs/self-evaluation-system.md:196: missing skills/myharness/references/loop-self-eval.md -> docs/skills/myharness/references/loop-self-eval.md
docs/self-evaluation-system.md:197: missing skills/myharness/scripts/build-scorecard.sh -> docs/skills/myharness/scripts/build-scorecard.sh
docs/self-evaluation-system.md:198: missing skills/myharness/scripts/check-review-tools.sh -> docs/skills/myharness/scripts/check-review-tools.sh
docs/self-evaluation-system.md:206: missing self_eval_scorecard.json -> docs/self_eval_scorecard.json
skills/myharness/SKILL.md:16: missing .codex/agents/*.toml -> skills/myharness/.codex/agents/*.toml
skills/myharness/SKILL.md:35: missing CLAUDE.md -> skills/myharness/CLAUDE.md
skills/myharness/SKILL.md:35: missing AGENTS.md -> skills/myharness/AGENTS.md
skills/myharness/SKILL.md:93: missing .claude/agents/*.md -> skills/myharness/.claude/agents/*.md
skills/myharness/SKILL.md:93: missing .codex/agents/{name}.toml -> skills/myharness/.codex/agents/{name}.toml
skills/myharness/SKILL.md:101: missing 프로젝트/.claude/agents/{name}.md -> skills/myharness/프로젝트/.claude/agents/{name}.md
skills/myharness/SKILL.md:108: missing .codex/agents/*.toml -> skills/myharness/.codex/agents/*.toml
skills/myharness/SKILL.md:112: missing 프로젝트/.claude/agents/{name}.md -> skills/myharness/프로젝트/.claude/agents/{name}.md
skills/myharness/SKILL.md:132: missing 프로젝트/.claude/skills/{name}/SKILL.md -> skills/myharness/프로젝트/.claude/skills/{name}/SKILL.md
skills/myharness/SKILL.md:202: missing bash skills/myharness/scripts/check-review-tools.sh -> skills/myharness/bash skills/myharness/scripts/check-review-tools.sh
skills/myharness/SKILL.md:203: missing .claude/skills/external-review-loop/SKILL.md -> skills/myharness/.claude/skills/external-review-loop/SKILL.md
skills/myharness/SKILL.md:203: missing check-review-tools.sh -> skills/myharness/check-review-tools.sh
skills/myharness/SKILL.md:243: missing 01_analyst_requirements.md -> skills/myharness/01_analyst_requirements.md
skills/myharness/SKILL.md:266: missing CLAUDE.md -> skills/myharness/CLAUDE.md
skills/myharness/SKILL.md:283: missing AGENTS.md -> skills/myharness/AGENTS.md
skills/myharness/SKILL.md:320: missing verdicts.json -> skills/myharness/verdicts.json
skills/myharness/SKILL.md:435: missing loop_scorecard.json -> skills/myharness/loop_scorecard.json
skills/myharness/SKILL.md:460: missing .claude/agents/*.md -> skills/myharness/.claude/agents/*.md
skills/myharness/SKILL.md:460: missing .codex/agents/*.toml -> skills/myharness/.codex/agents/*.toml
skills/myharness/SKILL.md:478: missing .codex/agents/*.toml -> skills/myharness/.codex/agents/*.toml
skills/myharness/SKILL.md:480: missing check-review-tools.sh -> skills/myharness/check-review-tools.sh
skills/myharness/SKILL.md:483: missing AGENTS.md -> skills/myharness/AGENTS.md
skills/myharness/references/agent-design-patterns.md:203: missing .claude/agents/{name}.md -> skills/myharness/references/.claude/agents/{name}.md
skills/myharness/references/agent-design-patterns.md:215: missing .claude/agents/{name}.md -> skills/myharness/references/.claude/agents/{name}.md
skills/myharness/references/dev-rules.md:28: missing .claude/skills/{harness-name}/references/dev-rules.md -> skills/myharness/references/.claude/skills/{harness-name}/references/dev-rules.md
skills/myharness/references/external-review-loop.md:5: missing .claude/skills/external-review-loop/SKILL.md -> skills/myharness/references/.claude/skills/external-review-loop/SKILL.md
skills/myharness/references/external-review-loop.md:5: missing check-review-tools.sh -> skills/myharness/references/check-review-tools.sh
skills/myharness/references/external-review-loop.md:5: missing check-review-tools.sh -> skills/myharness/references/check-review-tools.sh
skills/myharness/references/external-review-loop.md:37: missing verdicts.json -> skills/myharness/references/verdicts.json
skills/myharness/references/external-review-loop.md:39: missing _workspace/reviews/{단계ID}_verdicts.json -> skills/myharness/references/_workspace/reviews/{단계ID}_verdicts.json
skills/myharness/references/external-review-loop.md:55: missing bash scripts/check-review-tools.sh -> skills/myharness/references/bash scripts/check-review-tools.sh
skills/myharness/references/external-review-loop.md:76: missing verdicts.json -> skills/myharness/references/verdicts.json
skills/myharness/references/external-review-loop.md:79: missing verdicts.json -> skills/myharness/references/verdicts.json
skills/myharness/references/external-review-loop.md:105: missing verdicts.json -> skills/myharness/references/verdicts.json
skills/myharness/references/external-review-loop.md:109: missing verdicts.json -> skills/myharness/references/verdicts.json
skills/myharness/references/factory-map.md:19: missing check-review-tools.sh -> skills/myharness/references/check-review-tools.sh
skills/myharness/references/factory-map.md:20: missing build-scorecard.sh -> skills/myharness/references/build-scorecard.sh
skills/myharness/references/factory-map.md:22: missing run-benchmark.sh -> skills/myharness/references/run-benchmark.sh
skills/myharness/references/loop-self-eval.md:12: missing loop_scorecard.json -> skills/myharness/references/loop_scorecard.json
skills/myharness/references/loop-self-eval.md:21: missing scripts/build-scorecard.sh -> skills/myharness/references/scripts/build-scorecard.sh
skills/myharness/references/loop-self-eval.md:25: missing _workspace/evals/{loop}/{stage_id}/{run_id}/scorecard.json -> skills/myharness/references/_workspace/evals/{loop}/{stage_id}/{run_id}/scorecard.json
skills/myharness/references/loop-self-eval.md:53: missing scripts/build-scorecard.sh -> skills/myharness/references/scripts/build-scorecard.sh
skills/myharness/references/loop-self-eval.md:53: missing verdicts.json -> skills/myharness/references/verdicts.json
skills/myharness/references/loop-self-eval.md:53: missing timing.json -> skills/myharness/references/timing.json
skills/myharness/references/loop-self-eval.md:55: missing grading.json -> skills/myharness/references/grading.json
skills/myharness/references/loop-self-eval.md:55: missing timing.json -> skills/myharness/references/timing.json
skills/myharness/references/orchestrator-template.md:14: missing references/runtime-adapters.md -> skills/myharness/references/references/runtime-adapters.md
skills/myharness/references/orchestrator-template.md:104: missing _workspace/{phase}_{teammate-1}_{artifact}.md -> skills/myharness/references/_workspace/{phase}_{teammate-1}_{artifact}.md
skills/myharness/references/orchestrator-template.md:105: missing _workspace/{phase}_{teammate-2}_{artifact}.md -> skills/myharness/references/_workspace/{phase}_{teammate-2}_{artifact}.md
skills/myharness/references/orchestrator-template.md:206: missing _workspace/{phase}_{agent}_{artifact}.md -> skills/myharness/references/_workspace/{phase}_{agent}_{artifact}.md
skills/myharness/references/orchestrator-template.md:207: missing _workspace/{phase}_{agent}_{artifact}.md -> skills/myharness/references/_workspace/{phase}_{agent}_{artifact}.md
skills/myharness/references/orchestrator-template.md:250: missing _workspace/02_{agent}_raw.md -> skills/myharness/references/_workspace/02_{agent}_raw.md
skills/myharness/references/orchestrator-template.md:258: missing _workspace/03_integrated.md -> skills/myharness/references/_workspace/03_integrated.md
skills/myharness/references/orchestrator-template.md:264: missing _workspace/03_integrated.md -> skills/myharness/references/_workspace/03_integrated.md
skills/myharness/references/orchestrator-template.md:278: missing .codex/agents/*.toml -> skills/myharness/references/.codex/agents/*.toml
skills/myharness/references/orchestrator-template.md:288: missing .codex/agents/*.toml -> skills/myharness/references/.codex/agents/*.toml
skills/myharness/references/orchestrator-template.md:294: missing _workspace/{phase}_{agent}_{artifact}.md -> skills/myharness/references/_workspace/{phase}_{agent}_{artifact}.md
skills/myharness/references/orchestrator-template.md:312: missing _workspace/status/*.json -> skills/myharness/references/_workspace/status/*.json
skills/myharness/references/orchestrator-template.md:318: missing _workspace/status/{agent}.json -> skills/myharness/references/_workspace/status/{agent}.json
skills/myharness/references/orchestrator-template.md:321: missing _workspace/*.md -> skills/myharness/references/_workspace/*.md
skills/myharness/references/orchestrator-template.md:324: missing references/runtime-adapters.md -> skills/myharness/references/references/runtime-adapters.md
skills/myharness/references/orchestrator-template.md:353: missing references/team-examples.md -> skills/myharness/references/references/team-examples.md
skills/myharness/references/runtime-adapters.md:20: missing CLAUDE.md -> skills/myharness/references/CLAUDE.md
skills/myharness/references/runtime-adapters.md:20: missing AGENTS.md -> skills/myharness/references/AGENTS.md
skills/myharness/references/runtime-adapters.md:21: missing .claude/skills/{n}/SKILL.md -> skills/myharness/references/.claude/skills/{n}/SKILL.md
skills/myharness/references/runtime-adapters.md:21: missing .agents/skills/{n}/SKILL.md -> skills/myharness/references/.agents/skills/{n}/SKILL.md
skills/myharness/references/runtime-adapters.md:22: missing .claude/agents/{n}.md -> skills/myharness/references/.claude/agents/{n}.md
skills/myharness/references/runtime-adapters.md:22: missing .codex/agents/{n}.toml -> skills/myharness/references/.codex/agents/{n}.toml
skills/myharness/references/runtime-adapters.md:24: missing .claude-plugin/plugin.json -> skills/myharness/references/.claude-plugin/plugin.json
skills/myharness/references/runtime-adapters.md:25: missing .codex/config.toml -> skills/myharness/references/.codex/config.toml
skills/myharness/references/runtime-adapters.md:25: missing ~/.codex/config.toml -> skills/myharness/references/~/.codex/config.toml
skills/myharness/references/runtime-adapters.md:26: missing config.toml -> skills/myharness/references/config.toml
skills/myharness/references/runtime-adapters.md:27: missing commands/*.md -> skills/myharness/references/commands/*.md
skills/myharness/references/runtime-adapters.md:27: missing ~/.codex/prompts/*.md -> skills/myharness/references/~/.codex/prompts/*.md
skills/myharness/references/runtime-adapters.md:34: missing .claude-plugin/plugin.json -> skills/myharness/references/.claude-plugin/plugin.json
skills/myharness/references/runtime-adapters.md:34: missing CLAUDE.md -> skills/myharness/references/CLAUDE.md
skills/myharness/references/runtime-adapters.md:35: missing AGENTS.md -> skills/myharness/references/AGENTS.md
skills/myharness/references/runtime-adapters.md:35: missing skills/myharness/SKILL.md -> skills/myharness/references/skills/myharness/SKILL.md
skills/myharness/references/runtime-adapters.md:39: missing .claude/agents/{n}.md -> skills/myharness/references/.claude/agents/{n}.md
skills/myharness/references/runtime-adapters.md:39: missing .codex/agents/{n}.toml -> skills/myharness/references/.codex/agents/{n}.toml
skills/myharness/references/runtime-adapters.md:44: missing .codex/agents/*.toml -> skills/myharness/references/.codex/agents/*.toml
skills/myharness/references/runtime-adapters.md:50: missing 프로젝트/CLAUDE.md -> skills/myharness/references/프로젝트/CLAUDE.md
skills/myharness/references/runtime-adapters.md:50: missing 프로젝트/AGENTS.md -> skills/myharness/references/프로젝트/AGENTS.md
skills/myharness/references/runtime-adapters.md:52: missing .claude/agents/{n}.md -> skills/myharness/references/.claude/agents/{n}.md
skills/myharness/references/runtime-adapters.md:52: missing .codex/agents/{n}.toml -> skills/myharness/references/.codex/agents/{n}.toml
skills/myharness/references/runtime-adapters.md:53: missing .codex/config.toml -> skills/myharness/references/.codex/config.toml
skills/myharness/references/runtime-adapters.md:57: missing AGENTS.md -> skills/myharness/references/AGENTS.md
skills/myharness/references/runtime-adapters.md:57: missing .codex/config.toml -> skills/myharness/references/.codex/config.toml
skills/myharness/references/runtime-adapters.md:58: missing install.sh -> skills/myharness/references/install.sh
skills/myharness/references/runtime-adapters.md:58: missing check-review-tools.sh -> skills/myharness/references/check-review-tools.sh
skills/myharness/references/runtime-adapters.md:64: missing .codex/config.toml -> skills/myharness/references/.codex/config.toml
skills/myharness/references/self-improvement-loop.md:12: missing loop_scorecard.json -> skills/myharness/references/loop_scorecard.json
skills/myharness/references/self-improvement-loop.md:13: missing artifact_benchmark.json -> skills/myharness/references/artifact_benchmark.json
skills/myharness/references/self-improvement-loop.md:26: missing run-benchmark.sh -> skills/myharness/references/run-benchmark.sh
skills/myharness/references/self-improvement-loop.md:28: missing grading.json -> skills/myharness/references/grading.json
skills/myharness/references/self-improvement-loop.md:28: missing timing.json -> skills/myharness/references/timing.json
skills/myharness/references/self-improvement-loop.md:28: missing run_manifest.json -> skills/myharness/references/run_manifest.json
skills/myharness/references/self-improvement-loop.md:86: missing artifact_benchmark.json -> skills/myharness/references/artifact_benchmark.json
skills/myharness/references/self-improvement-loop.md:87: missing loop_scorecard.json -> skills/myharness/references/loop_scorecard.json
skills/myharness/references/self-improvement-loop.md:89: missing run-benchmark.sh -> skills/myharness/references/run-benchmark.sh
skills/myharness/references/skill-writing-guide.md:156: missing docx-js.md -> skills/myharness/references/docx-js.md
skills/myharness/references/skill-writing-guide.md:156: missing redlining.md -> skills/myharness/references/redlining.md
skills/myharness/references/skill-writing-guide.md:162: missing references/docx-js.md -> skills/myharness/references/references/docx-js.md
skills/myharness/references/skill-writing-guide.md:166: missing references/redlining.md -> skills/myharness/references/references/redlining.md
skills/myharness/references/tdd-doctrine.md:27: missing .claude/skills/{harness-name}/references/tdd-doctrine.md -> skills/myharness/references/.claude/skills/{harness-name}/references/tdd-doctrine.md
skills/myharness/references/team-examples.md:32: missing .claude/agents/{name}.md -> skills/myharness/references/.claude/agents/{name}.md
skills/myharness/references/team-examples.md:110: missing worldbuilder.md -> skills/myharness/references/worldbuilder.md
skills/myharness/references/team-examples.md:135: missing _workspace/01_worldbuilder_setting.md -> skills/myharness/references/_workspace/01_worldbuilder_setting.md
skills/myharness/references/team-examples.md:198: missing webtoon-reviewer.md -> skills/myharness/references/webtoon-reviewer.md
skills/myharness/references/team-examples.md:223: missing _workspace/review_report.md -> skills/myharness/references/_workspace/review_report.md
skills/myharness/references/team-examples.md:320: missing 프로젝트/.claude/agents/{agent-name}.md -> skills/myharness/references/프로젝트/.claude/agents/{agent-name}.md
skills/myharness/references/team-examples.md:325: missing 프로젝트/.claude/skills/{skill-name}/SKILL.md -> skills/myharness/references/프로젝트/.claude/skills/{skill-name}/SKILL.md
skills/myharness/references/team-examples.md:326: missing ~/.claude/skills/{skill-name}/SKILL.md -> skills/myharness/references/~/.claude/skills/{skill-name}/SKILL.md
skills/myharness/references/team-examples.md:330: missing references/orchestrator-template.md -> skills/myharness/references/references/orchestrator-template.md
README.md:49: missing check-review-tools.sh -> check-review-tools.sh
README.md:50: missing loop_scorecard.json -> loop_scorecard.json
README.md:50: missing references/loop-self-eval.md -> references/loop-self-eval.md
README.md:51: missing tdd-doctrine.md -> tdd-doctrine.md
README.md:51: missing dev-rules.md -> dev-rules.md
README.md:52: missing references/runtime-adapters.md -> references/runtime-adapters.md
README.md:60: missing .claude/agents/*.md -> .claude/agents/*.md
README.md:60: missing skills/*/SKILL.md -> skills/*/SKILL.md
README.md:63: missing tdd-doctrine.md -> tdd-doctrine.md
README.md:63: missing dev-rules.md -> dev-rules.md
README_KO.md:49: missing check-review-tools.sh -> check-review-tools.sh
README_KO.md:50: missing loop_scorecard.json -> loop_scorecard.json
README_KO.md:50: missing references/loop-self-eval.md -> references/loop-self-eval.md
README_KO.md:51: missing tdd-doctrine.md -> tdd-doctrine.md
README_KO.md:51: missing dev-rules.md -> dev-rules.md
README_KO.md:52: missing references/runtime-adapters.md -> references/runtime-adapters.md
README_KO.md:59: missing .claude/agents/*.md -> .claude/agents/*.md
README_KO.md:59: missing skills/*/SKILL.md -> skills/*/SKILL.md
README_KO.md:62: missing tdd-doctrine.md -> tdd-doctrine.md
README_KO.md:62: missing dev-rules.md -> dev-rules.md
README_JA.md:49: missing check-review-tools.sh -> check-review-tools.sh
README_JA.md:50: missing loop_scorecard.json -> loop_scorecard.json
README_JA.md:50: missing references/loop-self-eval.md -> references/loop-self-eval.md
README_JA.md:51: missing tdd-doctrine.md -> tdd-doctrine.md
README_JA.md:51: missing dev-rules.md -> dev-rules.md
README_JA.md:52: missing references/runtime-adapters.md -> references/runtime-adapters.md
README_JA.md:59: missing .claude/agents/*.md -> .claude/agents/*.md
README_JA.md:59: missing skills/*/SKILL.md -> skills/*/SKILL.md
README_JA.md:62: missing tdd-doctrine.md -> tdd-doctrine.md
README_JA.md:62: missing dev-rules.md -> dev-rules.md
AGENTS.md:11: missing .codex/agents/*.toml -> .codex/agents/*.toml
AGENTS.md:13: missing .claude/agents/*.md -> .claude/agents/*.md
AGENTS.md:13: missing .codex/agents/*.toml -> .codex/agents/*.toml
AGENTS.md:15: missing references/orchestrator-template.md -> references/orchestrator-template.md

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
/bin/zsh -lc "nl -ba README_KO.md | sed -n '1,145p;275,312p'" in /Users/junghojang/Developments/myProject/myHarness
exec
/bin/zsh -lc "nl -ba README.md | sed -n '1,140p;260,315p'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
     1	<p align="center">
     2	  <img src="harness_banner.png" alt="Harness Banner" width="600">
     3	</p>
     4	
     5	<p align="center">
     6	  <img src="https://img.shields.io/badge/Version-1.0.0-brightgreen.svg" alt="Version">
     7	  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License"></a>
     8	  <img src="https://img.shields.io/badge/Claude_Code-Plugin-purple.svg" alt="Claude Code Plugin">
     9	  <img src="https://img.shields.io/badge/Patterns-6_Architectures-orange.svg" alt="6 Architecture Patterns">
    10	  <img src="https://img.shields.io/badge/Mode-Agent_Teams-green.svg" alt="Agent Teams">
    11	  <a href="https://github.com/cookyman74/my_harness/stargazers"><img src="https://img.shields.io/github/stars/cookyman74/my_harness?style=social" alt="GitHub Stars"></a>
    12	</p>
    13	
    14	<p align="center">
    15	  <a href="#category--where-harness-sits"><img src="https://img.shields.io/badge/Layer-L3%20Meta--Factory-orange" alt="Layer"></a>
    16	  <a href="#category--where-harness-sits"><img src="https://img.shields.io/badge/Sub--layer-Team--Architecture%20Factory-teal" alt="Sub-layer"></a>
    17	  <a href="#"><img src="https://img.shields.io/badge/README-EN%20%7C%20KO%20%7C%20JA-lightgrey" alt="i18n"></a>
    18	</p>
    19	
    20	# Harness — The Team-Architecture Factory for Claude Code
    21	
    22	**English** | [한국어](README_KO.md) | [日本語](README_JA.md)
    23	
    24	> **Harness is a team-architecture factory for Claude Code.** Say **"build a harness for this project"** (English) or **"하네스 구성해줘"** (한국어) or **"ハーネスを構成して"** (日本語), and the plugin turns your domain description into an agent team and the skills they use — picked from six pre-defined team-architecture patterns.
    25	
    26	## Overview
    27	
    28	Harness leverages Claude Code's agent team system to decompose complex tasks into coordinated teams of specialized agents. Say "build a harness for this project" and it automatically generates agent definitions (`.claude/agents/`) and skills (`.claude/skills/`) tailored to your domain.
    29	
    30	## Category — Where Harness Sits
    31	
    32	Harness lives at the **L3 Meta-Factory** layer of the Claude Code ecosystem — the layer that generates other harnesses rather than being one. Inside L3, we pick a specific sub-layer: **Team-Architecture Factory**.
    33	
    34	| Layer | What it does | Neighbors we coexist with |
    35	|-------|--------------|---------------------------|
    36	| **L3 — Meta-Factory / Team-Architecture Factory** (us) | Domain sentence → agent team + skills, via 6 pre-defined team patterns | — |
    37	| L3 — Meta-Factory / Runtime-Configuration Factory | Deterministic, repeatable runtime configurations | [coleam00/Archon](https://github.com/coleam00/Archon) |
    38	| L3 — Meta-Factory / Codex Runtime Port | Same concept, Codex runtime | [SaehwanPark/meta-harness](https://github.com/SaehwanPark/meta-harness) |
    39	| L2 — Cross-Harness Workflow | Standardize skills/rules/hooks across multiple harnesses | [affaan-m/ECC](https://github.com/affaan-m/everything-claude-code) |
    40	
    41	> Archon generates deterministic runtime configurations. Harness generates team architectures (pipeline, fan-out/fan-in, expert pool, producer-reviewer, supervisor, hierarchical delegation) plus the skills agents use. Different sub-layers of the same L3. Pick Archon for runtime determinism, Harness for team architecture, or combine them.
    42	
    43	## Key Features
    44	
    45	- **Agent Team Design** — 6 architectural patterns: Pipeline, Fan-out/Fan-in, Expert Pool, Producer-Reviewer, Supervisor, and Hierarchical Delegation
    46	- **Skill Generation** — Auto-generates skills with Progressive Disclosure for efficient context management
    47	- **Orchestration** — Inter-agent data passing, error handling, and team coordination protocols
    48	- **Validation** — Trigger verification, dry-run testing, and with-skill vs without-skill comparison tests
    49	- **Two-Layer Quality Gate** — Internal Producer-Reviewer QA **plus** an external independent review loop (`external-review-loop`): codex/gemini CLIs review each stage's deliverable, the orchestrator adjudicates every issue against real code (confirm/partial/defer/reject), and only confirmed issues are fixed via TDD. It is a **convergent loop** — loop-until-dry with a round cap, a verdicts ledger (dedup vs seen) so rejected issues don't resurface, and re-review of its own fixes. Tool availability is checked first (`check-review-tools.sh`) so the skill is skipped when codex/gemini are absent.
    50	- **Loop Self-Evaluation** — each loop emits a `loop_scorecard.json` (alignment_score, verdict counts, normalized rounds, cost, termination label) for a staged self-improvement path (measure → manual report → propose → auto), with anti-Goodhart guards (propose-only + approval, rolling window, min-samples; recall measured only against ground truth). See `references/loop-self-eval.md`.
    51	- **Doctrine Injection** — Generated code/modification agents get TDD (`tdd-doctrine.md`) and development-rules (`dev-rules.md`) doctrine injected by real path, with risk-tiered gate strength (light / standard / critical).
    52	- **Dual Runtime (Claude Code + Codex)** — One source of truth (`skills/myharness/`), thin per-runtime adapters. The factory emits both `CLAUDE.md` and `AGENTS.md` pointers and adapts orchestration (Claude `TeamCreate` ↔ Codex native subagents / `codex exec`), with a Phase-7 runtime-sync step to prevent drift. See `references/runtime-adapters.md`.
    53	- **Cost & Concurrency Control** — model routing (high-reasoning → `opus`, simple tasks → light models), concurrency caps with backpressure (default 3 / max 5), external-review budget (skip-when-no-delta, `.fast-pass`), and smoke/full test modes keep large fan-outs affordable. Portable tooling (`timeout`/`gtimeout` detection, process cleanup).
    54	
    55	
    56	## Philosophy — Skill ↔ Agent
    57	
    58	A generated harness separates **who** from **how**, and treats itself as an evolving system:
    59	
    60	- **Separation of concerns** — an *agent* is the "who" (expert persona + working principles), a *skill* is the "how" (procedure + bundled tools). Both are files (`.claude/agents/*.md`, `skills/*/SKILL.md`), never inline — reusable across sessions. One agent = one focused role; one agent uses 1–N skills (sharing allowed).
    61	- **Agent teams by default** — 2+ collaborators self-coordinate via messages, a shared task list, and files under `_workspace/`. Discovery-sharing, conflict debate, and gap-filling raise quality.
    62	- **Two-layer quality gate** — internal Producer-Reviewer QA **plus** an external independent review loop (codex/gemini). The orchestrator adjudicates every issue against real code — consensus is not proof. Gate strength is risk-tiered (light / standard / critical).
    63	- **Doctrine injection** — code/modification agents receive TDD (`tdd-doctrine.md`) and development-rules (`dev-rules.md`) doctrine by real path (subagents don't inherit global rules).
    64	- **Why over command, DRY pointers** — principles explain *why* (so agents judge edge cases) and reference a single source instead of duplicating it.
    65	- **Evolving system** — feedback routes to the right layer (output → skill, role → agent, order → orchestrator, trigger → description) and is logged for regression safety.
    66	
    67	> In short: the **orchestrator** decides who/when/order, **agents** are the *who*, **skills** are the *how*, and a two-layer gate keeps quality honest.
    68	
    69	## Workflow
    70	
    71	```
    72	Phase 1: Domain Analysis
    73	    ↓
    74	Phase 2: Team Architecture Design (Agent Teams vs Subagents)
    75	    ↓
    76	Phase 3: Agent Definition Generation (.claude/agents/)
    77	    ↓
    78	Phase 4: Skill Generation (.claude/skills/)
    79	    ↓
    80	Phase 5: Integration & Orchestration (+ two-layer quality gate, dual-runtime output)
    81	    ↓
    82	Phase 6: Validation & Testing
    83	    ↓
    84	Phase 7: Harness Evolution (feedback → continuous update; dual-runtime sync)
    85	```
    86	
    87	## Installation
    88	
    89	### Via Marketplace
    90	
    91	#### Add the marketplace
    92	```shell
    93	/plugin marketplace add cookyman74/my_harness
    94	```
    95	
    96	#### Install the plugin
    97	```shell
    98	/plugin install myharness@myharness-marketplace
    99	```
   100	
   101	### Direct Installation as Global Skill
   102	
   103	```shell
   104	# Copy the skills directory to ~/.claude/skills/myharness/
   105	cp -r skills/myharness ~/.claude/skills/myharness
   106	```
   107	
   108	### Codex CLI (Dual Runtime)
   109	
   110	Codex discovers skills from `~/.codex/skills/` (user-global) — and skills load even in untrusted projects. The repo's `install.sh` symlinks the live factory and verifies review tools:
   111	
   112	```shell
   113	bash install.sh
   114	# → ~/.codex/skills/myharness → skills/myharness (symlink, always latest)
   115	# → repo .agents/skills/myharness (for trusted projects)
   116	# → AGENTS.md (auto-loaded by Codex)
   117	```
   118	
   119	Invoke in Codex with **`$myharness`**, the **`/skills`** menu, or a description-matching request (e.g. "하네스 구성해줘"). Note: `/myharness` is **not** valid Codex syntax (custom slash commands are unsupported); restart the Codex session after install so the skill list reloads.
   120	
   121	## Plugin Structure
   122	
   123	```
   124	harness/
   125	├── .claude-plugin/
   126	│   └── plugin.json                 # Plugin manifest
   127	├── skills/
   128	│   └── harness/
   129	│       ├── SKILL.md                # Main skill definition (7-Phase workflow)
   130	│       ├── references/
   131	│       │   ├── agent-design-patterns.md   # 6 architectural patterns
   132	│       │   ├── orchestrator-template.md   # Team/subagent/Codex orchestrator templates
   133	│       │   ├── team-examples.md           # Real-world team configurations
   134	│       │   ├── skill-writing-guide.md     # Skill authoring guide
   135	│       │   ├── skill-testing-guide.md     # Testing & evaluation methodology
   136	│       │   ├── qa-agent-guide.md          # QA agent integration guide
   137	│       │   ├── external-review-loop.md    # codex/gemini external review gate (convergent loop + template)
   138	│       │   ├── loop-self-eval.md          # loop scorecard + staged self-improvement
   139	│       │   ├── tdd-doctrine.md            # TDD doctrine (injected into code agents)
   140	│       │   ├── dev-rules.md               # Development rules (injected into code agents)
   260	## Coexistence — Harness and Neighbors
   261	
   262	Harness is not alone in the Claude Code / agent-framework ecosystem. The following repos live in adjacent layers; each is described in a parallel "X is …, Harness is …" form so you can pick the one that fits your need or combine several.
   263	
   264	| Repo | Their position | Relationship to Harness |
   265	|------|----------------|-------------------------|
   266	| [coleam00/Archon](https://github.com/coleam00/Archon) | "harness builder" — deterministic, repeatable runtime configurations | **Same L3, neighbor sub-layer.** Archon is a Runtime-Configuration Factory, Harness is a Team-Architecture Factory. Pick Archon for runtime determinism, Harness for team architecture, or combine them. |
   267	| [SaehwanPark/meta-harness](https://github.com/SaehwanPark/meta-harness) | Codex port of the same concept | **Same L3, different runtime.** Use Harness on Claude Code, meta-harness on Codex. |
   268	| [affaan-m/ECC](https://github.com/affaan-m/everything-claude-code) | "Agent harness performance & workflow layer" (sits on top of existing harnesses) | **Different layer.** ECC is a standardization layer across harnesses; Harness is a factory that generates harnesses. Serial combination possible. |
   269	| [wshobson/agents](https://github.com/wshobson/agents) | Subagent / skill catalog (182 agents, 149 skills) | **Factory ↔ parts supply.** wshobson is a catalog to shop from; Harness designs the team. Absorb wshobson entries as parts inside a Harness-generated team. |
   270	| [LangGraph](https://langchain-ai.github.io/langgraph/) | State-graph orchestration, LLM-agnostic | **Different track.** LangGraph is for long-running, state-recoverable orchestration; Harness is for fast Claude-Code-native team design. |
   271	
   272	## Built with Harness
   273	
   274	### Harness 100
   275	
   276	**[revfactory/harness-100](https://github.com/revfactory/harness-100)** — 100 production-ready agent team harnesses across 10 domains, available in both English and Korean (200 packages total). Each harness ships with 4-5 specialist agents, an orchestrator skill, and domain-specific skills — all generated by this plugin. 1,808 markdown files covering content creation, software development, data/AI, business strategy, education, legal, health, and more.
   277	
   278	## Requirements
   279	
   280	- [Agent Teams enabled](https://code.claude.com/docs/en/agent-teams): `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
   281	
   282	## FAQ
   283	
   284	<details>
   285	<summary><b>Q1. Why "harness factory" and not "harness builder"? Isn't this competing with Archon?</b></summary>
   286	
   287	**A.** Archon generates deterministic runtime configurations — it's a **Runtime-Configuration Factory**. Harness generates agent team architectures (team structure, message protocols, review gates) — it's a **Team-Architecture Factory**. They are **neighbor sub-layers of the same L3 Meta-Factory** and serve different needs. Pick Archon for runtime determinism, Harness for team-architecture patterns, or combine them (design architecture with Harness → deploy runtime with Archon).
   288	
   289	**Evidence:**
   290	- Archon self-definition: [clawfit docs/reference-levels.md](https://github.com/hongsw/clawfit/blob/main/docs/reference-levels.md)
   291	- Sub-layer declaration: see the **Category — Where Harness Sits** section above
   292	- Archon repo: [github.com/coleam00/Archon](https://github.com/coleam00/Archon)
   293	</details>
   294	
   295	<details>
   296	<summary><b>Q2. Isn't "Claude Code only" too narrow? What about Gemini/Codex?</b></summary>
   297	
   298	**A.** Currently the official runtime is Claude Code only. A Codex port of the same concept — [SaehwanPark/meta-harness](https://github.com/SaehwanPark/meta-harness) — is already public, so Codex teams can start there. Harness chose "Claude-Code-native, deep" over "multi-runtime, shallow"; cross-runtime collaboration with sibling repos (meta-harness, harness-init, OpenRig) is on the roadmap.
   299	
   300	**Evidence:**
   301	- Codex port: [github.com/SaehwanPark/meta-harness](https://github.com/SaehwanPark/meta-harness)
   302	- Cross-runtime scaffolder: [github.com/Gizele1/harness-init](https://github.com/Gizele1/harness-init)
   303	</details>
   304	
   305	## License
   306	
   307	Apache 2.0

 succeeded in 0ms:
     1	<p align="center">
     2	  <img src="harness_banner.png" alt="Harness Banner" width="600">
     3	</p>
     4	
     5	<p align="center">
     6	  <img src="https://img.shields.io/badge/Version-1.0.0-brightgreen.svg" alt="Version">
     7	  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License"></a>
     8	  <img src="https://img.shields.io/badge/Claude_Code-Plugin-purple.svg" alt="Claude Code Plugin">
     9	  <img src="https://img.shields.io/badge/Patterns-6_Architectures-orange.svg" alt="6 Architecture Patterns">
    10	  <img src="https://img.shields.io/badge/Mode-Agent_Teams-green.svg" alt="Agent Teams">
    11	  <a href="https://github.com/cookyman74/my_harness/stargazers"><img src="https://img.shields.io/github/stars/cookyman74/my_harness?style=social" alt="GitHub Stars"></a>
    12	</p>
    13	
    14	<p align="center">
    15	  <a href="#카테고리--harness는-어디에-서-있나요"><img src="https://img.shields.io/badge/Layer-L3%20Meta--Factory-orange" alt="Layer"></a>
    16	  <a href="#카테고리--harness는-어디에-서-있나요"><img src="https://img.shields.io/badge/Sub--layer-Team--Architecture%20Factory-teal" alt="Sub-layer"></a>
    17	  <a href="#"><img src="https://img.shields.io/badge/README-EN%20%7C%20KO%20%7C%20JA-lightgrey" alt="i18n"></a>
    18	</p>
    19	
    20	# Harness — Claude Code를 위한 팀 아키텍처 팩토리
    21	
    22	[English](README.md) | **한국어** | [日本語](README_JA.md)
    23	
    24	> **Harness는 Claude Code용 팀 아키텍처 팩토리입니다.** **"하네스 구성해줘"** (한국어) · **"build a harness for this project"** (English) · **"ハーネスを構成して"** (日本語) 한 문장으로, 플러그인이 도메인 설명을 에이전트 팀과 그들이 쓸 스킬로 변환합니다 — 사전 정의된 6가지 팀 아키텍처 패턴 중 하나를 골라서요.
    25	
    26	## 개요
    27	
    28	Harness는 Claude Code의 에이전트 팀 시스템을 활용하여 복잡한 작업을 전문 에이전트 팀으로 분해·조율하는 아키텍처 도구다. "하네스 구성해줘"라고 말하면, 사용자의 도메인에 맞는 에이전트 정의(`.claude/agents/`)와 스킬(`.claude/skills/`)을 자동 생성한다.
    29	
    30	## 카테고리 — Harness는 어디에 서 있나요
    31	
    32	Harness는 Claude Code 생태계의 **L3 Meta-Factory** 층 — 다른 하네스들이 아니라 "다른 하네스들을 생성하는 층" — 에 자리합니다. 그 층 안에서 우리는 **Team-Architecture Factory** 서브 층을 선택합니다.
    33	
    34	| 층위 | 하는 일 | 공존하는 이웃 |
    35	|------|---------|---------------|
    36	| **L3 — Meta-Factory / Team-Architecture Factory** (우리) | 도메인 설명 → 에이전트 팀 + 스킬, 6가지 사전 정의된 팀 패턴 | — |
    37	| L3 — Meta-Factory / Runtime-Configuration Factory | 결정적(deterministic)·반복 가능한 런타임 설정 생성 | [coleam00/Archon](https://github.com/coleam00/Archon) |
    38	| L3 — Meta-Factory / Codex Runtime Port | 같은 컨셉, Codex 런타임 | [SaehwanPark/meta-harness](https://github.com/SaehwanPark/meta-harness) |
    39	| L2 — Cross-Harness Workflow | 여러 하네스 위에서 스킬·규칙·훅을 표준화 | [affaan-m/ECC](https://github.com/affaan-m/everything-claude-code) |
    40	
    41	> Archon은 결정적 런타임 설정을 뽑아냅니다. Harness는 팀 아키텍처(파이프라인·팬아웃/팬인·전문가 풀·생성-검증·감독자·계층적 위임)와 에이전트가 쓸 스킬을 뽑아냅니다. 같은 L3의 서로 다른 서브 층입니다. 런타임 결정성은 Archon, 팀 아키텍처는 Harness, 또는 둘을 조합해서 쓰세요.
    42	
    43	## 핵심 기능
    44	
    45	- **에이전트 팀 설계** — 파이프라인, 팬아웃/팬인, 전문가 풀, 생성-검증, 감독자, 계층적 위임 등 6가지 아키텍처 패턴 지원
    46	- **스킬 생성** — Progressive Disclosure 패턴으로 컨텍스트를 효율 관리하는 스킬 자동 생성
    47	- **오케스트레이션** — 에이전트 간 데이터 전달, 에러 핸들링, 팀 조율 프로토콜 포함
    48	- **검증 체계** — 트리거 검증, 드라이런 테스트, With-skill vs Without-skill 비교 테스트
    49	- **2층 품질 게이트** — 내부 생성-검증 QA **+** 외부 독립 리뷰 루프(`external-review-loop`): codex/gemini CLI가 단계 산출물을 리뷰하고, 오케스트레이터가 실코드 대조로 전건 판정(확인/부분/이월/기각) 후 확인분만 TDD로 수정. **수렴 루프** — loop-until-dry + 라운드 상한 + 판정 원장(dedup vs seen, 기각 재부상 방지) + 수정본 재리뷰. 도구 연동을 먼저 점검(`check-review-tools.sh`)해 codex/gemini가 없으면 스킬을 생성하지 않음.
    50	- **루프 자체 평가** — 각 루프가 `loop_scorecard.json`(alignment_score·판정 카운트·정규화 라운드·비용·종료 라벨) 발행 → 단계적 자기개선(측정→수동 리포트→제안→자동), 자기강화 방지장치(제안만+승인·롤링윈도우·최소 표본; recall은 Ground Truth로만). 상세: `references/loop-self-eval.md`.
    51	- **교리 주입** — 생성된 코드/수정 에이전트에 TDD(`tdd-doctrine.md`)·개발 규칙(`dev-rules.md`)을 실경로로 주입. 리스크 등급(경량/표준/중대)으로 게이트 강도 조절.
    52	- **듀얼 런타임 (Claude Code + Codex)** — 단일 출처(`skills/myharness/`) + 런타임별 얇은 어댑터. 팩토리가 `CLAUDE.md`·`AGENTS.md` 포인터를 둘 다 출력하고 오케스트레이션을 분기(Claude `TeamCreate` ↔ Codex 네이티브 subagents / `codex exec`). Phase 7 런타임 동기화로 drift 방지. 상세: `references/runtime-adapters.md`.
    53	- **비용·동시성 통제** — 모델 라우팅(고추론 → `opus`, 단순 작업 → 경량 모델), 동시성 cap+백프레셔(기본 3·최대 5), 외부 리뷰 예산(skip-when-no-delta·`.fast-pass`), smoke/full 테스트 모드로 대규모 fan-out 비용 억제. 이식성 도구(`timeout`/`gtimeout` 탐지·프로세스 정리).
    54	
    55	## 철학 — 스킬 ↔ 에이전트
    56	
    57	생성된 하네스는 **누가**와 **어떻게**를 분리하고, 스스로를 진화하는 시스템으로 다룬다:
    58	
    59	- **관심사 분리** — *에이전트*는 "누가"(전문가 페르소나 + 작업 원칙), *스킬*은 "어떻게"(절차 + 도구 번들). 둘 다 파일(`.claude/agents/*.md`, `skills/*/SKILL.md`), 인라인 금지 → 다음 세션 재사용. 1 에이전트 = 1 집중 역할, 1 에이전트 ↔ 1~N 스킬(공유 가능).
    60	- **에이전트 팀이 기본** — 2명+ 협업은 메시지·공유 작업목록·`_workspace/` 파일로 자체 조율. 발견 공유·상충 토론·누락 보완이 품질을 높임.
    61	- **2층 품질 게이트** — 내부 생성-검증 QA **+** 외부 독립 리뷰 루프(codex/gemini). 오케스트레이터가 모든 이슈를 실코드 대조로 판정 — 합의는 증거가 아님. 리스크 등급(경량/표준/중대)으로 강도 조절.
    62	- **교리 주입** — 코드/수정 에이전트에 TDD(`tdd-doctrine.md`)·개발 규칙(`dev-rules.md`)을 실경로로 주입(서브에이전트는 글로벌 규칙을 못 받음).
    63	- **강압 대신 Why, DRY 포인터** — 원칙은 *이유*를 설명(엣지케이스 판단)하고 단일 출처를 참조(복붙 금지).
    64	- **진화하는 시스템** — 피드백을 알맞은 층으로(산출물→스킬, 역할→에이전트, 순서→오케스트레이터, 트리거→description) 라우팅하고 퇴행 방지를 위해 이력 기록.
    65	
    66	> 요약: **오케스트레이터**가 누가/언제/순서를 정하고, **에이전트**가 "누가", **스킬**이 "어떻게", 2층 게이트가 품질을 정직하게 유지한다.
    67	
    68	## 하네스 진화 메커니즘 (Harness Evolution Mechanism)
    69	
    70	하네스 진화 메커니즘은 "무엇이 먹혔고 무엇이 안 먹혔는가"의 델타를 팩토리로 되먹여, 다음 세대가 측정 가능하게 더 나아지도록 합니다. 실제 프로젝트에서 생성된 하네스가 사용될 때, `/myharness:evolve` 스킬이 초기 아키텍처와 최종 출시 아키텍처 간 변화량을 포착해 팩토리로 되먹입니다. 다음번 같은 도메인에 대한 생성은 이 되먹임을 반영해 "출시 상태에 더 가까운 초안"에서 시작합니다.
    71	
    72	```
    73	초기 하네스 ──▶ 실 프로젝트 사용 ──▶ 출시 하네스
    74	                                          │
    75	                                          ▼ (/myharness:evolve 로 델타 포착)
    76	                                    ┌───────────────┐
    77	                                    │   팩토리      │◀── 더 나은 다음 세대 초안
    78	                                    └───────────────┘
    79	```
    80	
    81	이것이 **하네스 진화 메커니즘 (Harness Evolution Mechanism; JA: ハーネス進化メカニズム)** 입니다.
    82	
    83	## 워크플로우
    84	
    85	```
    86	Phase 1: 도메인 분석
    87	    ↓
    88	Phase 2: 팀 아키텍처 설계 (에이전트 팀 vs 서브 에이전트)
    89	    ↓
    90	Phase 3: 에이전트 정의 생성 (.claude/agents/)
    91	    ↓
    92	Phase 4: 스킬 생성 (.claude/skills/)
    93	    ↓
    94	Phase 5: 통합 및 오케스트레이션 (+ 2층 품질 게이트, 듀얼 런타임 출력)
    95	    ↓
    96	Phase 6: 검증 및 테스트
    97	    ↓
    98	Phase 7: 하네스 진화 (피드백 → 지속 갱신; 듀얼 런타임 동기화)
    99	```
   100	
   101	## 설치
   102	
   103	### 마켓플레이스 등록 후 설치
   104	
   105	#### 마켓플레이스 추가
   106	```shell
   107	/plugin marketplace add cookyman74/my_harness
   108	```
   109	
   110	#### 플러그인 설치
   111	```shell
   112	/plugin install myharness@myharness-marketplace
   113	```
   114	
   115	### 글로벌 스킬로 직접 설치
   116	
   117	```shell
   118	# skills 디렉토리를 ~/.claude/skills/myharness/에 복사
   119	cp -r skills/myharness ~/.claude/skills/myharness
   120	```
   121	
   122	### Codex CLI (듀얼 런타임)
   123	
   124	Codex는 `~/.codex/skills/`(사용자 글로벌)에서 스킬을 발견하며, untrusted 프로젝트에서도 스킬은 로드됩니다. 레포의 `install.sh`가 라이브 팩토리를 심링크하고 리뷰 도구를 점검합니다:
   125	
   126	```shell
   127	bash install.sh
   128	# → ~/.codex/skills/myharness → skills/myharness (심링크, 항상 최신)
   129	# → repo .agents/skills/myharness (trusted 프로젝트용)
   130	# → AGENTS.md (Codex 자동 로드)
   131	```
   132	
   133	Codex에서는 **`$myharness`**, **`/skills`** 메뉴, 또는 description에 맞는 요청(예: "하네스 구성해줘")으로 호출합니다. `/myharness`는 Codex 문법이 **아닙니다**(커스텀 슬래시 미지원). 설치 후 스킬 목록 재로딩을 위해 Codex 세션을 재시작하세요.
   134	
   135	## 플러그인 구조
   136	
   137	```
   138	harness/
   139	├── .claude-plugin/
   140	│   └── plugin.json                 # 플러그인 매니페스트
   141	├── skills/
   142	│   └── harness/
   143	│       ├── SKILL.md                # 메인 스킬 정의 (7 Phase 워크플로우)
   144	│       ├── references/
   145	│       │   ├── agent-design-patterns.md   # 6가지 아키텍처 패턴
   275	| [affaan-m/ECC](https://github.com/affaan-m/everything-claude-code) | "Agent harness performance & workflow layer" — 기존 하네스 위에 앉는 표준화 층 | **다른 층위.** ECC는 여러 하네스 위 표준화 층, Harness는 하네스를 생성하는 팩토리. 직렬 조합 가능. |
   276	| [wshobson/agents](https://github.com/wshobson/agents) | 서브 에이전트 / 스킬 카탈로그 (182 agents, 149 skills) | **팩토리 ↔ 부품 공급.** wshobson은 "쇼핑할 카탈로그", Harness는 "팀 설계". Harness가 만든 팀에 wshobson 항목을 부품으로 흡수. |
   277	| [LangGraph](https://langchain-ai.github.io/langgraph/) | 상태 그래프 오케스트레이션, LLM-agnostic | **다른 트랙.** 장기 실행·상태 복구가 핵심이면 LangGraph, Claude Code 네이티브의 빠른 팀 설계가 핵심이면 Harness. |
   278	
   279	## Harness로 만든 프로젝트
   280	
   281	### Harness 100
   282	
   283	**[revfactory/harness-100](https://github.com/revfactory/harness-100)** — 10개 도메인, 100개의 프로덕션 레디 에이전트 팀 하네스 (한영 200패키지). 각 하네스에 4-5명의 전문 에이전트, 오케스트레이터 스킬, 도메인 특화 스킬이 포함되어 있으며, 모두 이 플러그인으로 생성되었습니다. 콘텐츠 제작, 소프트웨어 개발, 데이터/AI, 비즈니스 전략, 교육, 법률, 헬스케어 등 1,808개 마크다운 파일.
   284	
   285	## 요구사항
   286	
   287	- [에이전트 팀 기능 활성화](https://code.claude.com/docs/en/agent-teams): `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
   288	
   289	## FAQ
   290	
   291	<details>
   292	<summary><b>Q1. 왜 "harness builder"가 아니라 "harness factory"인가요? Archon과 경쟁하나요?</b></summary>
   293	
   294	**A.** Archon은 결정적 런타임 설정을 생성하는 **Runtime-Configuration Factory** 성격, Harness는 에이전트 팀 아키텍처(팀 구조·메시지 프로토콜·리뷰 게이트)를 생성하는 **Team-Architecture Factory** 성격입니다. 둘은 **같은 L3 Meta-Factory 층의 이웃 서브 층**이며, 용도가 다릅니다. 결정적 런타임이 필요하면 Archon, 팀 아키텍처 6패턴 사전 정의가 필요하면 Harness. 조합 사용(아키텍처 설계 → 런타임 배포)도 가능합니다.
   295	
   296	**Evidence:**
   297	- Archon 자기 규정: [clawfit docs/reference-levels.md](https://github.com/hongsw/clawfit/blob/main/docs/reference-levels.md)
   298	- 서브 층 선언: 본 README **카테고리 — Harness는 어디에 서 있나요** 섹션
   299	- Archon 저장소: [github.com/coleam00/Archon](https://github.com/coleam00/Archon)
   300	</details>
   301	
   302	<details>
   303	<summary><b>Q2. "Claude Code 전용"이 너무 좁은 것 아닌가요? Gemini·Codex는?</b></summary>
   304	
   305	**A.** 현재 공식 런타임은 Claude Code 단일입니다. 같은 컨셉의 Codex 포트 [SaehwanPark/meta-harness](https://github.com/SaehwanPark/meta-harness)가 이미 공개되어 있어, 기존 Codex 팀은 그쪽에서 바로 시작할 수 있습니다. Harness는 "Claude Code 네이티브·깊게"를 택한 상태이며, 크로스 런타임 수요는 공존 저장소(meta-harness, harness-init, OpenRig)와의 연계 계획을 로드맵에 반영할 예정입니다.
   306	
   307	**Evidence:**
   308	- Codex 포트: [github.com/SaehwanPark/meta-harness](https://github.com/SaehwanPark/meta-harness)
   309	- 크로스 런타임 스캐폴더: [github.com/Gizele1/harness-init](https://github.com/Gizele1/harness-init)
   310	</details>
   311	
   312	## 라이선스

hook: PostToolUse
hook: PostToolUse
exec
/bin/zsh -lc "nl -ba README_JA.md | sed -n '1,145p;285,318p'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
     1	<p align="center">
     2	  <img src="harness_banner.png" alt="Harness Banner" width="600">
     3	</p>
     4	
     5	<p align="center">
     6	  <img src="https://img.shields.io/badge/Version-1.0.0-brightgreen.svg" alt="Version">
     7	  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License"></a>
     8	  <img src="https://img.shields.io/badge/Claude_Code-Plugin-purple.svg" alt="Claude Code Plugin">
     9	  <img src="https://img.shields.io/badge/Patterns-6_Architectures-orange.svg" alt="6 Architecture Patterns">
    10	  <img src="https://img.shields.io/badge/Mode-Agent_Teams-green.svg" alt="Agent Teams">
    11	  <a href="https://github.com/cookyman74/my_harness/stargazers"><img src="https://img.shields.io/github/stars/cookyman74/my_harness?style=social" alt="GitHub Stars"></a>
    12	</p>
    13	
    14	<p align="center">
    15	  <a href="#カテゴリー--harness-はどこに位置するか"><img src="https://img.shields.io/badge/Layer-L3%20Meta--Factory-orange" alt="Layer"></a>
    16	  <a href="#カテゴリー--harness-はどこに位置するか"><img src="https://img.shields.io/badge/Sub--layer-Team--Architecture%20Factory-teal" alt="Sub-layer"></a>
    17	  <a href="#"><img src="https://img.shields.io/badge/README-EN%20%7C%20KO%20%7C%20JA-lightgrey" alt="i18n"></a>
    18	</p>
    19	
    20	# Harness — Claude Code のためのチームアーキテクチャファクトリー
    21	
    22	[English](README.md) | [한국어](README_KO.md) | **日本語**
    23	
    24	> **Harness は Claude Code 向けのチームアーキテクチャファクトリーです。** **「ハーネスを構成して」** (日本語) ·  **"build a harness for this project"** (English) · **"하네스 구성해줘"** (한국어) と伝えるだけで、プラグインがドメイン記述をエージェントチームとそのチームが使うスキルへと変換します — あらかじめ定義された 6 種類のチームアーキテクチャパターンから 1 つを選んで。
    25	
    26	## 概要
    27	
    28	Harnessは、Claude Codeのエージェントチームシステムを活用し、複雑なタスクを専門エージェントチームに分解・統制するアーキテクチャツールです。「ハーネスを構成して」と伝えるだけで、ドメインに適したエージェント定義（`.claude/agents/`）とスキル（`.claude/skills/`）を自動生成します。
    29	
    30	## カテゴリー — Harness はどこに位置するか
    31	
    32	Harness は Claude Code エコシステムの **L3 Meta-Factory** 層 — 他のハーネスそのものではなく「他のハーネスを生成する層」 — に位置します。その層の中で、**Team-Architecture Factory** というサブ層を選択します。
    33	
    34	| 層 | 担当領域 | 共存する隣人 |
    35	|----|----------|--------------|
    36	| **L3 — Meta-Factory / Team-Architecture Factory** (当プロジェクト) | ドメイン記述 → エージェントチーム + スキル、事前定義された 6 種のチームパターン経由 | — |
    37	| L3 — Meta-Factory / Runtime-Configuration Factory | 決定的で再現可能なランタイム構成 | [coleam00/Archon](https://github.com/coleam00/Archon) |
    38	| L3 — Meta-Factory / Codex Runtime Port | 同一コンセプトの Codex ランタイム版 | [SaehwanPark/meta-harness](https://github.com/SaehwanPark/meta-harness) |
    39	| L2 — Cross-Harness Workflow | 複数ハーネスにまたがるスキル・ルール・フックの標準化 | [affaan-m/ECC](https://github.com/affaan-m/everything-claude-code) |
    40	
    41	> Archon は決定的なランタイム構成を生成します。Harness はチームアーキテクチャ（パイプライン・ファンアウト/ファンイン・エキスパートプール・プロデューサー-レビューア・スーパーバイザー・階層的委任）と、エージェントが使うスキルを生成します。同じ L3 の異なるサブ層です。ランタイムの決定性が欲しければ Archon、チームアーキテクチャが欲しければ Harness、あるいは両者を組み合わせて利用できます。
    42	
    43	## 主な機能
    44	
    45	- **エージェントチーム設計** — パイプライン、ファンアウト/ファンイン、エキスパートプール、プロデューサー-レビューア、スーパーバイザー、階層的委任の6種アーキテクチャパターンに対応
    46	- **スキル生成** — Progressive Disclosureパターンによるコンテキストの効率的管理を備えたスキルを自動生成
    47	- **オーケストレーション** — エージェント間のデータ受け渡し、エラーハンドリング、チーム連携プロトコルを内蔵
    48	- **検証体制** — トリガー検証、ドライランテスト、With-skill vs Without-skill 比較テスト
    49	- **2層品質ゲート** — 内部のプロデューサー-レビューアQA **に加え** 外部独立レビューループ（`external-review-loop`）：codex/gemini CLIが各段階の成果物をレビューし、オーケストレーターが実コードと照合して全件判定（確認/部分/繰越/却下）、確認分のみTDDで修正。**収束ループ** — loop-until-dry＋ラウンド上限＋判定台帳（dedup vs seen、却下の再浮上防止）＋修正分の再レビュー。先にツール連携を点検（`check-review-tools.sh`）し、codex/geminiが無ければスキルを生成しない。
    50	- **ループ自己評価** — 各ループが `loop_scorecard.json`（alignment_score・判定カウント・正規化ラウンド・コスト・終了ラベル）を発行 → 段階的な自己改善（測定→手動レポート→提案→自動）、自己強化防止（提案のみ＋承認・ローリングウィンドウ・最小サンプル；recall は Ground Truth のみ）。詳細：`references/loop-self-eval.md`。
    51	- **ドクトリン注入** — 生成されたコード/修正エージェントにTDD（`tdd-doctrine.md`）・開発ルール（`dev-rules.md`）を実パスで注入。リスク等級（軽量/標準/重大）でゲート強度を調整。
    52	- **デュアルランタイム（Claude Code + Codex）** — 単一の出典（`skills/myharness/`）＋ランタイム別の薄いアダプター。ファクトリーが `CLAUDE.md`・`AGENTS.md` ポインターを両方出力し、オーケストレーションを分岐（Claude `TeamCreate` ↔ Codex ネイティブ subagents / `codex exec`）。Phase 7 のランタイム同期で drift を防止。詳細：`references/runtime-adapters.md`。
    53	- **コスト・並行性の制御** — モデルルーティング（高推論 → `opus`、単純タスク → 軽量モデル）、並行数上限＋バックプレッシャー（既定 3・最大 5）、外部レビュー予算（skip-when-no-delta・`.fast-pass`）、smoke/full テストモードで大規模ファンアウトのコストを抑制。移植性ツール（`timeout`/`gtimeout` 検出・プロセス整理）。
    54	
    55	## 哲学 — スキル ↔ エージェント
    56	
    57	生成されたハーネスは **誰が** と **どうやって** を分離し、自身を進化するシステムとして扱う：
    58	
    59	- **関心の分離** — *エージェント*は「誰が」（専門家ペルソナ＋作業原則）、*スキル*は「どうやって」（手順＋ツール）。いずれもファイル（`.claude/agents/*.md`、`skills/*/SKILL.md`）でインライン禁止 → セッション横断で再利用。1エージェント＝1つの集中した役割、1エージェント↔1〜Nスキル（共有可）。
    60	- **エージェントチームが既定** — 2名以上はメッセージ・共有タスクリスト・`_workspace/` ファイルで自己調整。発見の共有・対立の議論・抜け漏れ補完が品質を高める。
    61	- **2層品質ゲート** — 内部のプロデューサー-レビューアQA **＋** 外部独立レビューループ（codex/gemini）。オーケストレーターが全課題を実コードと照合して判定 — 合意は証拠ではない。リスク等級（軽量/標準/重大）で強度を調整。
    62	- **ドクトリン注入** — コード/修正エージェントにTDD（`tdd-doctrine.md`）・開発ルール（`dev-rules.md`）を実パスで注入（サブエージェントはグローバル規則を継承しない）。
    63	- **強制ではなくWhy、DRYなポインター** — 原則は*理由*を説明し（エッジケースの判断）、単一の出典を参照（複製禁止）。
    64	- **進化するシステム** — フィードバックを適切な層へ（成果物→スキル、役割→エージェント、順序→オーケストレーター、トリガー→description）ルーティングし、退行防止のため履歴を記録。
    65	
    66	> 要約：**オーケストレーター**が誰が/いつ/順序を決め、**エージェント**が「誰が」、**スキル**が「どうやって」、2層ゲートが品質を誠実に保つ。
    67	
    68	## ハーネス進化メカニズム (Harness Evolution Mechanism)
    69	
    70	ハーネス進化メカニズムは「何が効いて、何が効かなかったか」のデルタをファクトリーへフィードバックし、次世代が測定可能なかたちで改善されるようにします。生成されたハーネスが実プロジェクトで使用されると、`/myharness:evolve` スキルが初期アーキテクチャとリリース時アーキテクチャのデルタを捕捉し、ファクトリーへ戻します。次回、同様のドメインでの生成は、このフィードバックを反映して「リリース状態により近いドラフト」から始まります。
    71	
    72	```
    73	初期ハーネス ──▶ 実プロジェクト利用 ──▶ リリース版ハーネス
    74	                                              │
    75	                                              ▼ (/myharness:evolve によるデルタ取得)
    76	                                        ┌───────────────┐
    77	                                        │  ファクトリー │◀── より良い次世代ドラフト
    78	                                        └───────────────┘
    79	```
    80	
    81	これを **ハーネス進化メカニズム (Harness Evolution Mechanism; KR: 하네스 진화 메커니즘)** と呼びます。
    82	
    83	## ワークフロー
    84	
    85	```
    86	Phase 1: ドメイン分析
    87	    ↓
    88	Phase 2: チームアーキテクチャ設計（Agent Teams vs サブエージェント）
    89	    ↓
    90	Phase 3: エージェント定義の生成（.claude/agents/）
    91	    ↓
    92	Phase 4: スキル生成（.claude/skills/）
    93	    ↓
    94	Phase 5: 統合とオーケストレーション（+ 2層品質ゲート、デュアルランタイム出力）
    95	    ↓
    96	Phase 6: 検証とテスト
    97	    ↓
    98	Phase 7: ハーネス進化（フィードバック → 継続更新；デュアルランタイム同期）
    99	```
   100	
   101	## インストール
   102	
   103	### マーケットプレイス経由
   104	
   105	#### マーケットプレイスの追加
   106	```shell
   107	/plugin marketplace add cookyman74/my_harness
   108	```
   109	
   110	#### プラグインのインストール
   111	```shell
   112	/plugin install myharness@myharness-marketplace
   113	```
   114	
   115	### グローバルスキルとして直接インストール
   116	
   117	```shell
   118	# skillsディレクトリを ~/.claude/skills/myharness/ にコピー
   119	cp -r skills/myharness ~/.claude/skills/myharness
   120	```
   121	
   122	### Codex CLI（デュアルランタイム）
   123	
   124	Codex は `~/.codex/skills/`（ユーザーグローバル）からスキルを検出し、untrusted プロジェクトでもスキルはロードされます。リポジトリの `install.sh` がライブのファクトリーをシンボリックリンクし、レビューツールを点検します：
   125	
   126	```shell
   127	bash install.sh
   128	# → ~/.codex/skills/myharness → skills/myharness（シンボリックリンク、常に最新）
   129	# → repo .agents/skills/myharness（trusted プロジェクト用）
   130	# → AGENTS.md（Codex が自動ロード）
   131	```
   132	
   133	Codex では **`$myharness`**、**`/skills`** メニュー、または description に合致する依頼（例：「ハーネスを構成して」）で呼び出します。`/myharness` は Codex の構文では **ありません**（カスタムスラッシュ未対応）。インストール後はスキル一覧の再読み込みのため Codex セッションを再起動してください。
   134	
   135	## プラグイン構成
   136	
   137	```
   138	harness/
   139	├── .claude-plugin/
   140	│   └── plugin.json                 # プラグインマニフェスト
   141	├── skills/
   142	│   └── harness/
   143	│       ├── SKILL.md                # メインスキル定義（7フェーズワークフロー）
   144	│       ├── references/
   145	│       │   ├── agent-design-patterns.md   # 6種のアーキテクチャパターン
   285	
   286	## Harnessで構築されたプロジェクト
   287	
   288	### Harness 100
   289	
   290	**[revfactory/harness-100](https://github.com/revfactory/harness-100)** — 10ドメイン、100のプロダクションレディなエージェントチームハーネス（英韓200パッケージ）。各ハーネスには4〜5名の専門エージェント、オーケストレータースキル、ドメイン特化スキルが含まれており、すべて本プラグインで生成されました。コンテンツ制作、ソフトウェア開発、データ/AI、ビジネス戦略、教育、法律、ヘルスケアなど1,808のMarkdownファイル。
   291	
   292	## 要件
   293	
   294	- [Agent Teams機能の有効化](https://code.claude.com/docs/en/agent-teams)：`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
   295	
   296	## FAQ
   297	
   298	<details>
   299	<summary><b>Q1. なぜ "harness builder" ではなく "harness factory" なのですか？ Archon と競合しませんか？</b></summary>
   300	
   301	**A.** Archon は決定的なランタイム構成を生成する **Runtime-Configuration Factory** であり、Harness はエージェントチームアーキテクチャ（チーム構造・メッセージプロトコル・レビューゲート）を生成する **Team-Architecture Factory** です。両者は **同じ L3 Meta-Factory 層の隣接するサブ層** で、用途が異なります。決定的なランタイムが必要なら Archon、6 つのチームアーキテクチャパターンの事前定義が必要なら Harness。両者を組み合わせる（アーキテクチャ設計 → ランタイム配置）ことも可能です。
   302	
   303	**Evidence:**
   304	- Archon 自己定義: [clawfit docs/reference-levels.md](https://github.com/hongsw/clawfit/blob/main/docs/reference-levels.md)
   305	- サブ層宣言: 本 README の **カテゴリー — Harness はどこに位置するか** セクション
   306	- Archon リポジトリ: [github.com/coleam00/Archon](https://github.com/coleam00/Archon)
   307	</details>
   308	
   309	<details>
   310	<summary><b>Q2. 「Claude Code 専用」は狭すぎませんか？ Gemini・Codex は？</b></summary>
   311	
   312	**A.** 現時点で公式のランタイムは Claude Code のみです。同一コンセプトの Codex 移植 [SaehwanPark/meta-harness](https://github.com/SaehwanPark/meta-harness) がすでに公開されており、既存の Codex チームはそちらから開始できます。Harness は「Claude Code ネイティブ・深く」を選択しており、クロスランタイムの需要は共存リポジトリ（meta-harness、harness-init、OpenRig）との連携計画としてロードマップに反映される予定です。
   313	
   314	**Evidence:**
   315	- Codex 移植: [github.com/SaehwanPark/meta-harness](https://github.com/SaehwanPark/meta-harness)
   316	- クロスランタイム・スキャフォルダー: [github.com/Gizele1/harness-init](https://github.com/Gizele1/harness-init)
   317	</details>
   318	

hook: PostToolUse
exec
/bin/zsh -lc "find . -maxdepth 2 -type f | sort | sed -n '1,140p'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
./.claude-plugin/marketplace.json
./.claude-plugin/plugin.json
./.git/COMMIT_EDITMSG
./.git/HEAD
./.git/ORIG_HEAD
./.git/config
./.git/description
./.git/index
./.gitignore
./AGENTS.md
./CHANGELOG.md
./CLAUDE.md
./CONTRIBUTING.md
./LICENSE
./README.md
./README_JA.md
./README_KO.md
./_needs/99_TDD_plan.md
./_needs/external-review-loop.md
./_needs/must_be.md
./_needs/r2-d2.md
./_workspace/01_auditor_repo_audit.md
./_workspace/02_content_launch_contents.md
./_workspace/03_scout_outreach_map.md
./_workspace/04_strategist_launch_plan.md
./docs/experimental-dependency.md
./docs/quickstart.md
./docs/self-evaluation-system.md
./harness_banner.png
./harness_icon.png
./harness_social.png
./harness_team.png
./index.html
./install.sh
./privacy.html

hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc "nl -ba README.md | sed -n '121,190p'; nl -ba README_KO.md | sed -n '135,205p'; nl -ba README_JA.md | sed -n '135,205p'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
   121	## Plugin Structure
   122	
   123	```
   124	harness/
   125	├── .claude-plugin/
   126	│   └── plugin.json                 # Plugin manifest
   127	├── skills/
   128	│   └── harness/
   129	│       ├── SKILL.md                # Main skill definition (7-Phase workflow)
   130	│       ├── references/
   131	│       │   ├── agent-design-patterns.md   # 6 architectural patterns
   132	│       │   ├── orchestrator-template.md   # Team/subagent/Codex orchestrator templates
   133	│       │   ├── team-examples.md           # Real-world team configurations
   134	│       │   ├── skill-writing-guide.md     # Skill authoring guide
   135	│       │   ├── skill-testing-guide.md     # Testing & evaluation methodology
   136	│       │   ├── qa-agent-guide.md          # QA agent integration guide
   137	│       │   ├── external-review-loop.md    # codex/gemini external review gate (convergent loop + template)
   138	│       │   ├── loop-self-eval.md          # loop scorecard + staged self-improvement
   139	│       │   ├── tdd-doctrine.md            # TDD doctrine (injected into code agents)
   140	│       │   ├── dev-rules.md               # Development rules (injected into code agents)
   141	│       │   └── runtime-adapters.md        # Claude Code / Codex dual-runtime design
   142	│       └── scripts/
   143	│           └── check-review-tools.sh      # codex/gemini availability check
   144	├── AGENTS.md                       # Codex runtime entry point
   145	├── install.sh                      # Dual-runtime installer (Claude + Codex)
   146	└── README.md
   147	```
   148	
   149	## Usage
   150	
   151	Trigger in Claude Code with prompts like:
   152	
   153	```
   154	Build a harness for this project
   155	Design an agent team for this domain
   156	Set up a harness
   157	```
   158	
   159	### Execution Modes
   160	
   161	| Mode | Description | Recommended For |
   162	|------|-------------|-----------------|
   163	| **Agent Teams** (default) | TeamCreate + SendMessage + TaskCreate | 2+ agents requiring collaboration |
   164	| **Subagents** | Direct Agent tool invocation | One-off tasks, no inter-agent communication needed |
   165	
   166	<p align="center">
   167	  <img src="harness_team.png" alt="Harness Agent Team" width="500">
   168	</p>
   169	
   170	### Architecture Patterns
   171	
   172	| Pattern | Description |
   173	|---------|-------------|
   174	| Pipeline | Sequential dependent tasks |
   175	| Fan-out/Fan-in | Parallel independent tasks |
   176	| Expert Pool | Context-dependent selective invocation |
   177	| Producer-Reviewer | Generation followed by quality review |
   178	| Supervisor | Central agent with dynamic task distribution |
   179	| Hierarchical Delegation | Top-down recursive delegation |
   180	
   181	## Output
   182	
   183	Files generated by Harness:
   184	
   185	```
   186	your-project/
   187	├── .claude/
   188	│   ├── agents/          # Agent definition files
   189	│   │   ├── analyst.md
   190	│   │   ├── builder.md
   135	## 플러그인 구조
   136	
   137	```
   138	harness/
   139	├── .claude-plugin/
   140	│   └── plugin.json                 # 플러그인 매니페스트
   141	├── skills/
   142	│   └── harness/
   143	│       ├── SKILL.md                # 메인 스킬 정의 (7 Phase 워크플로우)
   144	│       ├── references/
   145	│       │   ├── agent-design-patterns.md   # 6가지 아키텍처 패턴
   146	│       │   ├── orchestrator-template.md   # 팀/서브/Codex 오케스트레이터 템플릿
   147	│       │   ├── team-examples.md           # 실전 팀 구성 예시
   148	│       │   ├── skill-writing-guide.md     # 스킬 작성 가이드
   149	│       │   ├── skill-testing-guide.md     # 테스트/평가 방법론
   150	│       │   ├── qa-agent-guide.md          # QA 에이전트 통합 가이드
   151	│       │   ├── external-review-loop.md    # codex/gemini 외부 리뷰 게이트 (수렴 루프 + 템플릿)
   152	│       │   ├── loop-self-eval.md          # 루프 scorecard + 단계적 자기개선
   153	│       │   ├── tdd-doctrine.md            # TDD 교리 (코드 에이전트 주입용)
   154	│       │   ├── dev-rules.md               # 개발 규칙 (코드 에이전트 주입용)
   155	│       │   └── runtime-adapters.md        # Claude Code / Codex 듀얼 런타임 설계
   156	│       └── scripts/
   157	│           └── check-review-tools.sh      # codex/gemini 연동 점검
   158	├── AGENTS.md                       # Codex 런타임 진입점
   159	├── install.sh                      # 듀얼 런타임 설치 (Claude + Codex)
   160	└── README.md
   161	```
   162	
   163	## 사용법
   164	
   165	Claude Code에서 다음과 같이 트리거한다:
   166	
   167	```
   168	하네스 구성해줘
   169	하네스 설계해줘
   170	이 프로젝트에 맞는 에이전트 팀 구축해줘
   171	```
   172	
   173	### 실행 모드
   174	
   175	| 모드 | 설명 | 권장 상황 |
   176	|------|------|----------|
   177	| **에이전트 팀** (기본) | TeamCreate + SendMessage + TaskCreate | 2개 이상 에이전트, 협업 필요 |
   178	| **서브 에이전트** | Agent 도구 직접 호출 | 단발성 작업, 통신 불필요 |
   179	
   180	<p align="center">
   181	  <img src="harness_team.png" alt="Harness Agent Team" width="500">
   182	</p>
   183	
   184	### 아키텍처 패턴
   185	
   186	| 패턴 | 설명 |
   187	|------|------|
   188	| 파이프라인 | 순차 의존 작업 |
   189	| 팬아웃/팬인 | 병렬 독립 작업 |
   190	| 전문가 풀 | 상황별 선택 호출 |
   191	| 생성-검증 | 생성 후 품질 검수 |
   192	| 감독자 | 중앙 에이전트가 동적 분배 |
   193	| 계층적 위임 | 상위→하위 재귀적 위임 |
   194	
   195	## 산출물
   196	
   197	하네스가 생성하는 파일:
   198	
   199	```
   200	프로젝트/
   201	├── .claude/
   202	│   ├── agents/          # 에이전트 정의 파일
   203	│   │   ├── analyst.md
   204	│   │   ├── builder.md
   205	│   │   └── qa.md
   135	## プラグイン構成
   136	
   137	```
   138	harness/
   139	├── .claude-plugin/
   140	│   └── plugin.json                 # プラグインマニフェスト
   141	├── skills/
   142	│   └── harness/
   143	│       ├── SKILL.md                # メインスキル定義（7フェーズワークフロー）
   144	│       ├── references/
   145	│       │   ├── agent-design-patterns.md   # 6種のアーキテクチャパターン
   146	│       │   ├── orchestrator-template.md   # チーム/サブ/Codex オーケストレーターテンプレート
   147	│       │   ├── team-examples.md           # 実践チーム構成例
   148	│       │   ├── skill-writing-guide.md     # スキル作成ガイド
   149	│       │   ├── skill-testing-guide.md     # テスト・評価方法論
   150	│       │   ├── qa-agent-guide.md          # QAエージェント統合ガイド
   151	│       │   ├── external-review-loop.md    # codex/gemini 外部レビューゲート（収束ループ＋テンプレート）
   152	│       │   ├── loop-self-eval.md          # ループ scorecard ＋ 段階的自己改善
   153	│       │   ├── tdd-doctrine.md            # TDDドクトリン（コードエージェント注入用）
   154	│       │   ├── dev-rules.md               # 開発ルール（コードエージェント注入用）
   155	│       │   └── runtime-adapters.md        # Claude Code / Codex デュアルランタイム設計
   156	│       └── scripts/
   157	│           └── check-review-tools.sh      # codex/gemini 連携チェック
   158	├── AGENTS.md                       # Codex ランタイムのエントリポイント
   159	├── install.sh                      # デュアルランタイムインストーラー（Claude + Codex）
   160	└── README.md
   161	```
   162	
   163	## 使い方
   164	
   165	Claude Codeで以下のように呼び出します：
   166	
   167	```
   168	Build a harness for this project
   169	Design an agent team for this domain
   170	Set up a harness
   171	```
   172	
   173	### 実行モード
   174	
   175	| モード | 説明 | 推奨ケース |
   176	|--------|------|------------|
   177	| **Agent Teams**（デフォルト） | TeamCreate + SendMessage + TaskCreate | エージェント2名以上、コラボレーションが必要な場合 |
   178	| **サブエージェント** | Agentツール直接呼び出し | 単発タスク、エージェント間通信不要の場合 |
   179	
   180	<p align="center">
   181	  <img src="harness_team.png" alt="Harness Agent Team" width="500">
   182	</p>
   183	
   184	### アーキテクチャパターン
   185	
   186	| パターン | 説明 |
   187	|----------|------|
   188	| パイプライン | 順次依存タスク |
   189	| ファンアウト/ファンイン | 並列独立タスク |
   190	| エキスパートプール | 状況に応じた選択的呼び出し |
   191	| プロデューサー-レビューア | 生成後の品質レビュー |
   192	| スーパーバイザー | 中央エージェントによる動的タスク分配 |
   193	| 階層的委任 | 上位→下位への再帰的委任 |
   194	
   195	## 出力
   196	
   197	Harnessが生成するファイル：
   198	
   199	```
   200	your-project/
   201	├── .claude/
   202	│   ├── agents/          # エージェント定義ファイル
   203	│   │   ├── analyst.md
   204	│   │   ├── builder.md
   205	│   │   └── qa.md

hook: PostToolUse
hook: PostToolUse Completed
codex
명확한 stale rename이 하나 더 있습니다: README 3종의 구조 예시가 `skills/harness`로 남아 실제 `skills/myharness`와 다릅니다. 다음은 스크립트/정책 실행 가능성 검증입니다.
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
hook: PreToolUse Completed
exec
/bin/zsh -lc "nl -ba install.sh | sed -n '1,120p'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
     1	#!/usr/bin/env bash
     2	# 하네스 팩토리 듀얼 런타임 설치 — Claude Code + Codex.
     3	# 정본은 skills/myharness/ 한 곳. 런타임별 진입점만 연결한다.
     4	# 사용: bash install.sh
     5	set -euo pipefail
     6	cd "$(git rev-parse --show-toplevel 2>/dev/null || dirname "$0")"
     7	
     8	echo "== 하네스 팩토리 듀얼 런타임 설치 =="
     9	
    10	REPO="$(pwd)"
    11	# --- Codex: 사용자 글로벌 스킬 dir에 심링크 (가장 안정적 — trust 불필요) ---
    12	# Codex는 ~/.codex/skills/{name}/SKILL.md 를 description 기반으로 활성화한다.
    13	# 호출: $myharness 또는 /skills 메뉴. (/myharness 슬래시 명령은 미지원)
    14	CODEX_SKILLS="$HOME/.codex/skills"
    15	mkdir -p "$CODEX_SKILLS"
    16	if [ -e "$CODEX_SKILLS/myharness" ] && [ ! -L "$CODEX_SKILLS/myharness" ]; then
    17	  mv "$CODEX_SKILLS/myharness" "$CODEX_SKILLS/myharness.bak.$(git rev-parse --short HEAD 2>/dev/null || echo old)"
    18	  echo "Codex: 기존 구버전 myharness → myharness.bak.* 백업"
    19	fi
    20	ln -sfn "$REPO/skills/myharness" "$CODEX_SKILLS/myharness"
    21	echo "Codex: ~/.codex/skills/myharness → $REPO/skills/myharness 심링크 (최신 반영)"
    22	
    23	# repo .agents/skills (trusted 프로젝트에서 codex가 추가로 스캔)
    24	mkdir -p .agents/skills
    25	ln -sfn ../../skills/myharness .agents/skills/myharness
    26	echo "Codex: .agents/skills/myharness 심링크 (trusted 프로젝트용)"
    27	[ -f AGENTS.md ] && echo "Codex: AGENTS.md 존재 ✓ (codex 자동 로드)" || echo "Codex: ⚠ AGENTS.md 없음"
    28	
    29	# --- 외부 리뷰 도구 점검 ---
    30	echo "-- 외부 리뷰 도구(codex/gemini) 점검 --"
    31	bash skills/myharness/scripts/check-review-tools.sh || echo "  (도구 전무 → external-review-loop 게이트는 생략됨)"
    32	
    33	# --- Claude Code 안내 (수동) ---
    34	cat <<'EOF'
    35	
    36	== Claude Code 설치 (수동) ==
    37	이 레포는 .claude-plugin/plugin.json 플러그인이다. Claude Code에서:
    38	  /plugin  으로 추가하거나, marketplace.json을 마켓에 등록.
    39	  skills/ 는 자동 발견된다.
    40	
    41	설치 완료.
    42	- Claude Code: 자동 (plugin)
    43	- Codex: ~/.codex/skills/myharness (최신 심링크)
    44	  호출법 → `$myharness` 또는 `/skills` 메뉴 또는 "하네스 만들어줘" (※ `/myharness` 슬래시 명령은 미지원)
    45	EOF

hook: PostToolUse
exec
/bin/zsh -lc "nl -ba skills/myharness/scripts/check-review-tools.sh | sed -n '1,180p'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
     1	#!/usr/bin/env bash
     2	# 외부 리뷰 도구(codex·gemini CLI) 연동 점검.
     3	# 용도: 하네스 생성 시 external-review-loop 스킬을 만들지 결정 + 생성 스킬의 런타임 폴백.
     4	# 사용: bash check-review-tools.sh
     5	# 출력 끝줄: AVAILABLE: <codex|gemini 공백구분 | none>
     6	# 종료코드: 항상 0 (none도 정상 신호). 도구 유무는 끝줄 AVAILABLE만 신뢰할 것
     7	#   — set -e/자동화 파이프라인이 파싱 전 중단되는 것을 막기 위함.
     8	set -uo pipefail
     9	
    10	avail=()
    11	for t in codex gemini; do
    12	  if command -v "$t" >/dev/null 2>&1; then
    13	    echo "$t: ✓ 연동됨 ($(command -v "$t"))"
    14	    avail+=("$t")
    15	  else
    16	    echo "$t: ✗ 미설치"
    17	  fi
    18	done
    19	
    20	# 상태는 끝줄 AVAILABLE로만 전달한다. 항상 exit 0 — set -e/자동화 파이프라인이
    21	# 출력 파싱 전에 중단되는 것을 막기 위함(none도 정상 신호).
    22	if [ "${#avail[@]}" -eq 0 ]; then
    23	  echo "AVAILABLE: none"
    24	else
    25	  echo "AVAILABLE: ${avail[*]}"
    26	fi
    27	exit 0

hook: PostToolUse
exec
/bin/zsh -lc "nl -ba skills/myharness/scripts/build-scorecard.sh | sed -n '1,220p'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
     1	#!/usr/bin/env bash
     2	# loop_scorecard.json을 verdicts.json(+선택 timing.json)에서 기계적으로 계산한다.
     3	# LLM 자기보고 제거 — 사실 필드는 스크립트가 산출, LLM은 라벨 해석만.
     4	# 사용: build-scorecard.sh <verdicts.json> <out_scorecard.json> [timing.json]
     5	#   verdicts.json: {"loop","stage_id","rounds","diff_lines","risk_level","termination_reason",
     6	#                   "issues":[{"fingerprint","verdict","round","source"}...]}
     7	#   verdict ∈ confirmed|partial|deferred|rejected|duplicate
     8	#   regression_catch_rate = (round>1 재리뷰가 잡은 confirmed+partial) / (round==1 confirmed+partial)
     9	#     ※ 이것은 "수정 diff에서 잡힌 회귀/누출"이지 전체 산출물 recall이 아니다(과대 해석 금지).
    10	set -uo pipefail
    11	V="${1:?verdicts.json 경로}"; OUT="${2:?출력 경로}"; T="${3:-}"
    12	
    13	# graceful degradation: 측정은 부가 기능 — jq 없으면 루프를 깨지 않고 경고만 (eval-unavailable)
    14	if ! command -v jq >/dev/null; then
    15	  echo '{"eval_status":"eval-unavailable","reason":"jq not installed"}' > "$OUT" 2>/dev/null || true
    16	  echo "WARN: jq 없음 → scorecard 생략(eval-unavailable). 루프는 계속." >&2
    17	  exit 0
    18	fi
    19	
    20	tok=0
    21	[ -n "$T" ] && [ -f "$T" ] && tok="$(jq -r '.total_tokens // 0' "$T" 2>/dev/null || echo 0)"
    22	
    23	jq -n --slurpfile v "$V" --argjson tok "$tok" '
    24	  ($v[0]) as $d | ($d.issues // []) as $i |
    25	  ($i | map(select(.verdict=="confirmed")) | length) as $c |
    26	  ($i | map(select(.verdict=="partial"))   | length) as $p |
    27	  ($i | map(select(.verdict=="deferred"))  | length) as $df |
    28	  ($i | map(select(.verdict=="rejected"))  | length) as $r |
    29	  ($i | map(select(.verdict=="duplicate")) | length) as $dup |
    30	  (($c+$p+$df+$r)) as $adj |
    31	  (($c+$p+$r)) as $adj_nondef |
    32	  # regression: round>1 & confirmed/partial & source=="re-review"
    33	  ($i | map(select(.round>1 and (.verdict=="confirmed" or .verdict=="partial") and .source=="re-review")) | length) as $reg_num |
    34	  # 분모: round==1 confirmed+partial (초기 라운드 기준 — 누적 아님)
    35	  ($i | map(select(.round==1 and (.verdict=="confirmed" or .verdict=="partial"))) | length) as $reg_den |
    36	  # 태깅 무결성: round>1 confirmed/partial 중 source 누락/비허용 → 경고(조용한 0 방지)
    37	  ($i | map(select(.round>1 and (.verdict=="confirmed" or .verdict=="partial") and ((.source//"")|IN("re-review","codex","gemini","orchestrator")|not))) | length) as $bad_src |
    38	  {
    39	    schema_version:"1", loop:($d.loop//"external-review"), stage_id:($d.stage_id//"?"),
    40	    rounds:($d.rounds // ($i|map(.round)|max // 1)),
    41	    termination_reason:($d.termination_reason//"unknown"),
    42	    verdict_counts:{confirmed:$c,partial:$p,deferred:$df,rejected:$r,duplicate:$dup},
    43	    alignment_score: (if $adj_nondef>0 then (($c + 0.5*$p)/$adj_nondef) else null end),
    44	    rejected_rate:   (if $adj>0 then ($r/$adj) else null end),
    45	    deferred_rate:   (if $adj>0 then ($df/$adj) else null end),
    46	    duplicate_rate:  (if $adj>0 then ($dup/$adj) else null end),
    47	    regression_catch_rate: (if $reg_den>0 then ($reg_num/$reg_den) else null end),
    48	    cost_per_run_tokens:$tok,
    49	    cost_per_confirmed: (if $c>0 then ($tok/$c) else null end),
    50	    diff_lines:($d.diff_lines//null), risk_level:($d.risk_level//null),
    51	    warnings: ( [ if $bad_src>0 then "round>1 confirmed/partial \($bad_src)건 source 태깅 누락 — regression_catch_rate 과소측정 가능" else empty end ] ),
    52	    computed_by:"scripts/build-scorecard.sh"
    53	  }' > "$OUT"
    54	echo "scorecard → $OUT"
    55	
    56	# 집계: stage-level summary.jsonl에 원자적 append(flock — 병렬 경합 방지). 실패는 노출.
    57	SUM="$(dirname "$OUT")/../summary.jsonl"
    58	LINE="$(jq -c '{stage_id,rounds,termination_reason,alignment_score,regression_catch_rate,cost_per_run_tokens,warnings}' "$OUT")"
    59	if command -v flock >/dev/null; then
    60	  flock "$SUM.lock" -c "printf '%s\n' '$LINE' >> '$SUM'" || echo "WARN: summary append 실패" >&2
    61	else
    62	  printf '%s\n' "$LINE" >> "$SUM" || echo "WARN: summary append 실패(flock 없음)" >&2
    63	fi

hook: PostToolUse
exec
/bin/zsh -lc "nl -ba docs/experimental-dependency.md | sed -n '1,180p'; nl -ba docs/self-evaluation-system.md | sed -n '1,230p'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
     1	# Experimental Flag Dependency
     2	
     3	> **Status:** Active · **Owner:** cookyman · **Last updated:** 2026-04-18 · **SLA:** See [Monitoring Commitment](#monitoring-commitment)
     4	
     5	This document explains why `harness` requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, the three plausible futures of that flag, and what this repository will do in each case — with time-boxed commitments so enterprise adopters can plan against it.
     6	
     7	---
     8	
     9	## Current State
    10	
    11	### Why the flag is required
    12	
    13	`harness` is a meta-skill factory built on top of Claude Code's **Agent Teams API**. Three Claude Code primitives are invoked internally whenever a user runs `claude "build a harness for <domain>"`:
    14	
    15	| Primitive | Purpose | Flag gated? |
    16	|-----------|---------|-------------|
    17	| `TeamCreate` | Instantiates a multi-agent team with shared context | **Yes** |
    18	| `SendMessage` | Routes messages between team members (supervisor ↔ worker) | **Yes** |
    19	| `TaskCreate` | Spawns long-running subtasks inside a team | **Yes** |
    20	| `Agent` tool (invoke) | Single-agent dispatch | No (GA) |
    21	
    22	All three flag-gated primitives require:
    23	
    24	```bash
    25	export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
    26	```
    27	
    28	Without this variable set in the shell that launches `claude`, harness's generated teams fall back to single-agent execution, which silently breaks the Pipeline / Fan-out-in / Supervisor / Hierarchical Delegation patterns.
    29	
    30	### Anthropic references (required reading before filing issues)
    31	
    32	The design rationale and roadmap for this flag live in three Anthropic Engineering posts. Adopters evaluating harness should read at least the first:
    33	
    34	1. [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — defines the "harness" category Anthropic endorses and the long-running agent contract.
    35	2. [Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) — the patterns `harness` codifies (Pipeline, Producer-Reviewer, Supervisor, etc.).
    36	3. [Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents) — the forward path that may supersede the Experimental flag (see Scenario B).
    37	
    38	---
    39	
    40	## Dependency Graph
    41	
    42	```
    43	harness (v1.2.0)
    44	  └── Agent Teams API (Claude Code)
    45	        ├── TeamCreate            ← EXPERIMENTAL_AGENT_TEAMS=1
    46	        ├── SendMessage           ← EXPERIMENTAL_AGENT_TEAMS=1
    47	        ├── TaskCreate            ← EXPERIMENTAL_AGENT_TEAMS=1
    48	        └── Agent (invoke)        ← GA (flag-independent)
    49	              └── Anthropic Roadmap
    50	                    ├── Scenario A: Flag removed (GA promotion)
    51	                    ├── Scenario B: Managed Agents GA (parallel path)
    52	                    └── Scenario C: Breaking signature change
    53	```
    54	
    55	**Read this graph top-down:** harness depends on Agent Teams API, which depends on a single Experimental flag, which depends on Anthropic's own roadmap. If any upstream node changes, this repository is on the hook to adapt within the SLA below.
    56	
    57	---
    58	
    59	## 3 Scenarios
    60	
    61	Each scenario lists the **detection trigger** (how we will know it happened), the **T+24h / T+48h / T+72h actions** this repository commits to, and the **user-visible artifact** at each checkpoint.
    62	
    63	### Scenario A — Flag removed (Agent Teams promoted to GA)
    64	
    65	**Trigger detection:** Anthropic Claude Code Changelog publishes "Agent Teams is now GA" **or** `claude-code` binary no longer requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (detected by nightly CI in [P-13](#).
    66	
    67	**Probability (subjective):** High — this is the path the three blog posts above telegraph.
    68	
    69	| Checkpoint | Action | Artifact |
    70	|------------|--------|----------|
    71	| **T+24h** | Open branch `feat/drop-experimental-flag`. Remove `export` line from every README / docs / Quickstart. Add `claude-code >= X.Y.Z` lower bound in `plugin.json`. | Branch + PR (draft) |
    72	| **T+48h** | Publish `docs/migrating-from-experimental.md`. Update `docs/experimental-dependency.md` (this file) headline to "no flag required as of vX.Y". Pin GitHub issue: "Action required: drop the export line". | Migration guide + pinned issue |
    73	| **T+72h** | Ship **v1.3.0** release with: (a) CHANGELOG entry, (b) `gh release create` with migration note, (c) HN follow-up: "We dropped the experimental flag". | `v1.3.0` git tag + GH Release |
    74	
    75	**Adopter impact:** Positive. Enterprise approval friction drops — one checkbox ("no experimental flags") becomes satisfiable. No breaking change to harness user code.
    76	
    77	---
    78	
    79	### Scenario B — Managed Agents reaches GA (parallel path)
    80	
    81	**Trigger detection:** Anthropic publishes "[Managed Agents](https://www.anthropic.com/engineering/managed-agents) is generally available" with a stable `claude-agents` CLI or SDK surface.
    82	
    83	**Probability (subjective):** Medium-high within 90 days. Managed Agents is a server-side execution model; harness's client-side team orchestration does **not** automatically translate.
    84	
    85	| Checkpoint | Action | Artifact |
    86	|------------|--------|----------|
    87	| **T+24h** | Open `feat/managed-agents-compat` PR. Add `adapters/managed-agents/` scaffold that maps harness's 6 team patterns to Managed Agents invocation. Identify incompatible patterns (likely: Hierarchical Delegation). | Compat PR (draft) |
    88	| **T+48h** | Publish blog post: **"Harness + Managed Agents: one layer up, not replaced"** on Dev.to and in the repo. Re-frame harness as the **design-time** layer that outputs Managed Agents configs, not a runtime competitor. | Coexistence framing blog |
    89	| **T+72h** | Publish `docs/managed-agents-migration.md` with a per-pattern matrix (which of the 6 patterns map 1:1, which need rewrite). Update README sibling-repo section. | Migration guide |
    90	
    91	**Strategic note:** harness re-positions as the **upper layer on top of Managed Agents** — "Managed Agents runs the team, harness designs it." This is the coexistence frame in §4.2 of the GTM plan.
    92	
    93	**Adopter impact:** Neutral to positive. Existing harness users keep working on the Experimental flag path; new users can opt into Managed Agents output.
    94	
    95	---
    96	
    97	### Scenario C — Breaking change (API signature mutation)
    98	
    99	**Trigger detection:** Nightly CI (`.github/workflows/nightly-compat.yml`, tracked as roadmap P-13) fails against Claude Code's latest nightly build **or** the Changelog announces a renamed env var / changed `TeamCreate` signature.
   100	
   101	**Probability (subjective):** Medium. Experimental APIs are renamed without deprecation windows.
   102	
   103	| Checkpoint | Action | Artifact |
   104	|------------|--------|----------|
   105	| **T+0 to T+24h** | Nightly CI alert fires in Slack/Discord. Author opens `hotfix/compat-<date>` branch, patches affected call sites. Unit tests green on both old + new signature (best effort). | Hotfix branch |
   106	| **T+24h** | Merge hotfix. Push `v1.2.x` patch tag. Update `docs/compatibility-matrix.md` row for affected Claude Code version. | `v1.2.x` patch release |
   107	| **T+72h** | If the change is non-trivial (affects harness's public contract), publish a short notice on the repo Discussions tab + X. Otherwise, CHANGELOG entry is sufficient. | Discussions post (conditional) |
   108	
   109	**Adopter impact:** Existing pinned users on the prior Claude Code version are unaffected. Users on latest get a same-week patch.
   110	
   111	---
   112	
   113	## Monitoring Commitment
   114	
   115	We commit to the following **observable SLA**. Missing it is grounds for filing an issue with the `sla-breach` label.
   116	
   117	| Event | SLA | Measurement |
   118	|-------|-----|-------------|
   119	| Anthropic publishes Agent Teams / Managed Agents change in official Changelog | This document updated within **72 hours** | Compare Changelog post timestamp to this file's `Last updated` line |
   120	| Nightly CI detects compat break | Hotfix branch open within **24 hours** | GitHub Actions run timestamp vs. branch creation timestamp |
   121	| New Claude Code stable release (minor or major) | `docs/compatibility-matrix.md` row added within **7 days** | Compatibility matrix diff |
   122	
   123	**Sources we actively monitor:**
   124	
   125	- Claude Code release notes — watched via the [Anthropic Engineering blog](https://www.anthropic.com/engineering) RSS
   126	- `anthropics/claude-code` GitHub Releases (nightly tag)
   127	- Anthropic Discord `#claude-code` channel (community signal)
   128	
   129	---
   130	
   131	## FAQ for Enterprise Adopters
   132	
   133	### Q1. We're in a regulated industry (finance, healthcare, public sector) and can't enable `EXPERIMENTAL` flags in production. How do we adopt harness?
   134	
   135	**Cause:** Many compliance frameworks (SOC 2 Type II, ISO 27001, K-ISMS) disallow unstable / preview features in production.
   136	**Action:** Use harness **design-time only**: run it in a sandbox workstation to scaffold `.claude/agents/` and `.claude/skills/` files, then commit the generated artifacts into your production repo. Production Claude Code never needs the flag — only the flag-gated `TeamCreate` runtime does. The generated single-agent skills are GA-path compatible.
   137	
   138	### Q2. If Agent Teams goes GA (Scenario A), will my existing harness-generated code break?
   139	
   140	**Cause:** GA promotion in Anthropic's Claude Code has historically been non-breaking for generated artifacts; the flag simply stops being required.
   141	**Action:** No action required for end users. Your `.claude/agents/*.md` and `.claude/skills/*` files are plain Markdown and remain valid. You will be able to `unset CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` on the day of GA. We will publish a migration note within 48 hours (see Scenario A).
   142	
   143	### Q3. Do you guarantee an SLA in writing? What happens if you miss it?
   144	
   145	**Cause:** Enterprises need a contractual or at-minimum observable commitment before approval.
   146	**Action:** The SLA table above is the **public commitment** and is enforced by: (a) a GitHub Action that comments on this file if its `Last updated` line is older than 72 hours after a detected Changelog event, (b) an `sla-breach` issue label adopters may apply, (c) a post-mortem obligation in `CONTRIBUTING.md` for any breach. This is not a paid SLA — it is a community commitment. For a paid SLA, contact the maintainer (see repository README).
   147	
   148	---
   149	
   150	**Related documents:**
   151	- [`docs/quickstart.md`](./quickstart.md) — 5-minute install walkthrough
   152	- [`docs/show-hn-launch-kit.md`](./show-hn-launch-kit.md) — Public launch package
   153	- `docs/compatibility-matrix.md` *(pending P-13)* — Claude Code × harness version table
     1	# 하네스 팩토리 자체 평가 시스템 설계
     2	
     3	## 목적
     4	
     5	이 문서는 하네스 팩토리가 생성한 에이전트, 스킬, 오케스트레이션 프로세스를 평가해 다음 생성 품질을 개선하기 위한 자체 평가 시스템을 정의한다.
     6	
     7	목표는 별도 평가 제품이나 공개 벤치마크를 만드는 것이 아니다. 목표는 팩토리 내부 품질관리 루프를 만들어 다음을 판단하는 것이다.
     8	
     9	- 생성된 하네스가 필수 산출물을 만들었는가
    10	- 에이전트 역할이 도메인에 적합한가
    11	- 역할 충돌이나 책임 공백이 없는가
    12	- 오케스트레이터가 업무 도메인에 맞는 프로세스로 에이전트를 구성하는가
    13	- 작업 단계별 검증 루프가 포함되어 실제 프로젝트 성공 가능성을 높이는가
    14	- 생성된 스킬이 적절한 범위, 트리거, 참조 자료를 갖는가
    15	- 검증 Phase가 포함되어 있는가
    16	
    17	## 기본 원칙
    18	
    19	자체 평가는 항상 켜지 않는다. 하네스 팩토리는 사용자의 도메인 요청을 빠르게 구조화하는 도구이므로, 모든 요청에 full self-eval을 붙이면 토큰 비용과 지연이 과도해진다.
    20	
    21	따라서 자체 평가는 위험도 기반 gate로 동작한다.
    22	
    23	| 모드 | 적용 시점 | 평가 방식 | 비용 |
    24	|------|----------|----------|------|
    25	| `off` | 단순 질문, 소규모 하네스, 초안 생성 | 평가 생략 | 없음 |
    26	| `smoke` | 기본 생성 완료 후 | 정적 검사 중심 | 낮음 |
    27	| `full` | 릴리스 전, 대규모 구조 변경, 명시적 품질 검증 요청 | 정적 검사 + LLM judge + 외부 리뷰 | 높음 |
    28	
    29	기본값은 `smoke`다. `full`은 사용자가 요청했거나, 변경 위험도가 높은 경우에만 실행한다.
    30	
    31	## 평가 대상
    32	
    33	자체 평가는 생성된 하네스 디렉토리 전체를 대상으로 한다.
    34	
    35	필수 입력:
    36	
    37	- 생성 요청 원문
    38	- 대상 도메인 설명
    39	- 생성된 에이전트 정의
    40	- 생성된 스킬 정의
    41	- 오케스트레이터 스킬 또는 프로세스 문서
    42	- `CLAUDE.md`, `AGENTS.md` 같은 런타임 진입점
    43	- references/scripts 같은 보조 파일
    44	- 실행 로그 또는 리뷰 결과가 있으면 함께 사용
    45	
    46	필수 출력:
    47	
    48	- `self_eval_scorecard.json`
    49	- `self_eval_report.md`
    50	- 개선 제안 목록
    51	- 자동 반영 여부: 기본 `false`
    52	
    53	## 평가 축
    54	
    55	| 축 | 질문 | smoke | full |
    56	|----|------|-------|------|
    57	| 파일 완성도 | 필수 파일과 디렉토리가 생성되었는가 | yes | yes |
    58	| 런타임 정합성 | Claude/Codex 산출물이 문서 주장과 일치하는가 | yes | yes |
    59	| 에이전트 역할 적합성 | 도메인에 필요한 역할을 충분히 커버하는가 | partial | yes |
    60	| 역할 충돌 | 여러 에이전트가 같은 책임을 중복 소유하지 않는가 | partial | yes |
    61	| 책임 공백 | 중요한 업무 영역에 owner가 없는가 | partial | yes |
    62	| 오케스트레이션 적합성 | 도메인 업무 흐름을 단계와 handoff로 표현하는가 | partial | yes |
    63	| 검증 루프 | 작업 단계별 QA, review, test, approval gate가 있는가 | yes | yes |
    64	| 스킬 적절성 | 스킬 범위, trigger, references/scripts가 적절한가 | partial | yes |
    65	| 실패 처리 | 재시도, 중단, 사용자 승인, rollback 기준이 있는가 | partial | yes |
    66	| 비용 통제 | 고비용 평가와 외부 리뷰가 위험도에 따라 켜지는가 | yes | yes |
    67	
    68	## Smoke 평가
    69	
    70	`smoke`는 LLM judge 없이 가능한 검사를 우선한다.
    71	
    72	필수 검사:
    73	
    74	- `.claude/agents/` 또는 런타임별 agent 정의 존재
    75	- `.claude/skills/` 또는 `.agents/skills/` 존재
    76	- 오케스트레이터 스킬 존재
    77	- `CLAUDE.md` 또는 `AGENTS.md` 포인터 존재
    78	- 각 `SKILL.md` frontmatter의 `name`, `description` 존재
    79	- references/scripts 참조 파일 존재
    80	- 검증 Phase 또는 동등한 validation section 존재
    81	- agent name, role, responsibility 중복 후보 탐지
    82	- 동일 런타임 안에서 스킬 이름 충돌 탐지
    83	- Codex/Claude dual runtime을 주장할 경우 양쪽 산출물 존재 여부 검사
    84	
    85	Smoke 결과는 pass/fail과 경고 목록을 낸다. 이 단계는 빠르게 실패를 잡는 용도이며, 역할 적합성 같은 판단형 품질을 확정하지 않는다.
    86	
    87	## Full 평가
    88	
    89	`full`은 smoke 결과에 더해 LLM judge와 외부 리뷰를 사용한다.
    90	
    91	판정형 질문:
    92	
    93	- 이 도메인에서 필요한 핵심 역할이 빠지지 않았는가
    94	- 각 에이전트의 책임 경계가 명확한가
    95	- 오케스트레이터가 실제 업무 프로세스에 맞는 순서로 작업을 배치했는가
    96	- 설계, 구현, 검증, 릴리스 또는 운영 단계가 성공 가능한 흐름으로 연결되는가
    97	- 검증 루프가 형식적 문구가 아니라 실패를 발견하고 수정할 수 있는 구조인가
    98	- 스킬이 너무 넓거나 너무 좁지 않은가
    99	- 스킬 description이 실제 사용자 요청에서 적절히 trigger될 가능성이 높은가
   100	
   101	Full 평가는 비용이 크므로 다음 조건에서만 실행한다.
   102	
   103	- 사용자가 명시적으로 품질 검증을 요청
   104	- 하네스가 외부 사용자에게 배포될 예정
   105	- 에이전트 3개 이상 추가/삭제
   106	- 오케스트레이션 구조 변경
   107	- 코드/설계 도메인 중대 위험 작업
   108	- smoke 평가에서 high severity 문제가 발견됨
   109	
   110	## Scorecard 스키마
   111	
   112	`self_eval_scorecard.json`은 최소한 다음 필드를 가진다.
   113	
   114	```json
   115	{
   116	  "schema_version": "1.0",
   117	  "mode": "smoke",
   118	  "target": {
   119	    "domain": "example",
   120	    "path": "generated/example-harness",
   121	    "runtime": ["claude", "codex"]
   122	  },
   123	  "scores": {
   124	    "file_completeness": 0.0,
   125	    "runtime_consistency": 0.0,
   126	    "role_fit": null,
   127	    "role_conflict": 0.0,
   128	    "orchestration_fit": null,
   129	    "validation_loop": 0.0,
   130	    "skill_fit": null,
   131	    "failure_handling": null,
   132	    "cost_control": 0.0
   133	  },
   134	  "findings": [
   135	    {
   136	      "severity": "high",
   137	      "category": "runtime_consistency",
   138	      "message": "Dual runtime claimed, but .codex/agents/*.toml is missing.",
   139	      "evidence": ["AGENTS.md", "references/runtime-adapters.md"]
   140	    }
   141	  ],
   142	  "recommendations": [
   143	    {
   144	      "type": "manual_review",
   145	      "message": "Generate Codex agent definitions or downgrade the dual-runtime claim."
   146	    }
   147	  ],
   148	  "auto_apply": false
   149	}
   150	```
   151	
   152	점수는 0.0~1.0 범위를 사용한다. `smoke`에서 판단할 수 없는 항목은 `null`로 둔다.
   153	
   154	## 개선 루프
   155	
   156	자체 평가는 생성물을 바로 수정하지 않는다. 자동 수정은 팩토리가 자기 점수를 올리기 위해 기준을 왜곡하는 Goodhart 문제를 만들 수 있다.
   157	
   158	권장 루프:
   159	
   160	1. 하네스 생성
   161	2. smoke self-eval 실행
   162	3. high severity 발견 시 사용자에게 보고
   163	4. 필요 시 full self-eval 실행
   164	5. 실패 유형을 scorecard로 저장
   165	6. 같은 실패가 반복될 때 개선 제안 생성
   166	7. 사용자가 승인한 개선만 팩토리 스킬, 템플릿, references에 반영
   167	
   168	자동 반영 금지 기준:
   169	
   170	- 평가 기준 자체 변경
   171	- 에이전트 역할 추가/삭제
   172	- 오케스트레이션 Phase 변경
   173	- 외부 리뷰 gate 변경
   174	- 런타임 지원 범위 변경
   175	
   176	이 항목들은 반드시 사용자 승인 후 반영한다.
   177	
   178	## 반복 실패 패턴
   179	
   180	누적 scorecard에서 다음 패턴이 반복되면 팩토리 개선 후보로 올린다.
   181	
   182	- 필수 파일 누락이 3회 이상 반복
   183	- 같은 런타임 drift가 2회 이상 반복
   184	- 역할 충돌이 같은 카테고리에서 3회 이상 반복
   185	- 검증 Phase 누락 또는 형식적 검증이 반복
   186	- 스킬 trigger가 너무 약하거나 너무 넓다는 판정 반복
   187	- 오케스트레이터가 도메인 프로세스를 반영하지 못한다는 판정 반복
   188	
   189	단, 누적 표본이 너무 작을 때는 개선을 제안하지 않는다. 최소 기준은 `min_evaluated_harnesses >= 5` 또는 `min_adjudicated_findings >= 20`이다.
   190	
   191	## 현재 프로젝트에 대한 적용
   192	
   193	현재 하네스 팩토리에는 자체 평가 시스템의 재료가 이미 있다.
   194	
   195	- `skills/myharness/SKILL.md`의 Phase 6 검증
   196	- `skills/myharness/references/loop-self-eval.md`
   197	- `skills/myharness/scripts/build-scorecard.sh`
   198	- `skills/myharness/scripts/check-review-tools.sh`
   199	- codex/gemini 외부 리뷰 루프
   200	
   201	부족한 것은 이것들을 하나의 닫힌 품질관리 루프로 연결하는 실행 규칙이다.
   202	
   203	우선 구현 순서:
   204	
   205	1. smoke self-eval 스크립트 추가
   206	2. `self_eval_scorecard.json` 스키마 고정
   207	3. 생성된 하네스마다 scorecard 저장
   208	4. full self-eval은 명시 요청 또는 릴리스 gate에서만 실행
   209	5. 반복 실패 패턴만 팩토리 개선 제안으로 승격
   210	
   211	## 결론
   212	
   213	자체 평가 시스템은 가능하고 필요하다. 다만 상시 full 평가나 자동 자기수정은 피해야 한다.
   214	
   215	가장 현실적인 형태는 다음이다.
   216	
   217	- 기본은 저비용 `smoke`
   218	- 위험 작업과 릴리스 전만 `full`
   219	- scorecard는 누적
   220	- 개선은 제안까지만 자동화
   221	- 팩토리 본문 변경은 사용자 승인 후 반영

hook: PostToolUse
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
codex
스크립트 자체는 파싱 가능하나 `build-scorecard.sh`는 출력 디렉터리를 만들지 않아 템플릿 호출 경로에서 바로 실패할 수 있습니다. README/quickstart의 Claude 설치 명령도 interactive slash와 shell CLI 형식이 섞여 있습니다.
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc "node -e 'const fs=require(\"fs\");for(const f of [\".claude-plugin/plugin.json\",\".claude-plugin/marketplace.json\"]){try{const j=JSON.parse(fs.readFileSync(f,\"utf8\"));console.log(f+\" OK keys=\"+Object.keys(j).join(\",\"))}catch(e){console.log(f+\" ERR \"+e.message)}}'
# check scorecard behavior with missing out dir without writing in repo: use /tmp maybe blocked? just syntax parse
bash -n install.sh && bash -n skills/myharness/scripts/check-review-tools.sh && bash -n skills/myharness/scripts/build-scorecard.sh && echo 'shell syntax OK'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
.claude-plugin/plugin.json OK keys=name,description,version,author,homepage,repository,license,keywords
.claude-plugin/marketplace.json OK keys=name,owner,plugins
shell syntax OK

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
/bin/zsh -lc "nl -ba skills/myharness/references/self-improvement-loop.md | sed -n '1,180p'" in /Users/junghojang/Developments/myProject/myHarness
exec
/bin/zsh -lc "nl -ba skills/myharness/references/loop-self-eval.md | sed -n '1,180p'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
     1	# 자기개선 루프 (Self-Improvement Loop) — 벤치마크 앵커 자기개선 (설계 정본)
     2	
     3	생성된 스킬·에이전트를 **벤치마크로 측정 → 개정안 제안 → holdout 검증 → 사람 승인 → 채택**하는 닫힌 고리. `loop-self-eval.md`(루프 자체 평가)의 확장 — 대상이 *루프*가 아니라 *생성 산출물*. **자동 적용 아님.** 외부 리뷰(codex+gemini) 검증으로 교정된 정본.
     4	
     5	## 목차
     6	1. 왜 위험한가 · 2. 용어 분리(루프 vs 산출물) · 3. MVP 단계 · 4. 러너 계약(필수) · 5. 4앵커 + 독립성 · 6. holdout 누수 방지 · 7. baseline immutable · 8. 통계 기준 · 9. capability 등급 · 10. 비용 통제 · 11. rollback · 12. 한계
     7	
     8	## 1. 왜 — 그리고 왜 위험한가 (먼저)
     9	이전 external-review-loop 리뷰가 반복 입증한 함정: **Goodhart/과적합·에코체임버·플래핑·약증거(자체측정)**. 모든 채택 결정은 §5 앵커 + §6~8 통제에 묶인다. 앵커는 *필요조건이지 충분조건이 아니다* — 독립성(§5)이 핵심.
    10	
    11	## 2. 용어 분리 (중복 제거)
    12	- **`loop_scorecard.json`** = *오케스트레이션 루프* 효율 (alignment·rounds·cost). `loop-self-eval.md` 소관.
    13	- **`artifact_benchmark.json`** = *생성 스킬/에이전트* 품질 (pass_rate·with/without delta·holdout). 본 문서 소관.
    14	- 오케스트레이터 보고 시 두 지표를 **섞지 않는다**. Phase 6/7 호출 순서·경로는 §3 표.
    15	
    16	## 3. MVP 단계 (한 번에 다 만들지 말 것)
    17	| 단계 | 범위 | 자동화 |
    18	|------|------|--------|
    19	| **1 (정본 시작)** | 케이스 스키마 + **최소 러너(§4)** + immutable 결과 기록 + 수동 승인 | 없음 |
    20	| 2 | holdout/champion 비교 + 사람 리포트 | 없음 |
    21	| 3 (실험) | 개정안 *제안* + holdout 검증 결과 제시 | 제안만+승인 |
    22	| 4 (실험) | 승인 기반 채택 · re-baseline · rollback 자동 | 사람 승인 필수 |
    23	> 러너 없이 §5~11을 동시 요구하면 도입 지연·수동 우회. 1단계는 러너+기록+승인만.
    24	
    25	## 4. 러너 계약 (미구현이면 설계가 공허 — 최소 스펙 고정)
    26	`run-benchmark.sh`(별도 구현)의 **계약**을 먼저 못박는다:
    27	- **입력:** `{case_id, skill_path, mode: with|without}`.
    28	- **출력:** `grading.json`(`expectations[].passed/evidence`, `summary.pass_rate`) + `timing.json`(tokens·ms) + `run_manifest.json`(skill_hash·assertion_version·runner_version·model·seed·env·case_ids).
    29	- **격리:** 케이스마다 독립 작업디렉토리, read-only 소스, 결정적 seed 기록.
    30	- **재실행:** 동일 입력 → 반복 실행 R회(§8), 결과는 immutable append.
    31	- **실패 처리:** 러너 실패는 "측정 불가"로 기록(채택 근거 안 됨), 루프 불중단.
    32	- **비교식:** `adopt_if = candidate.holdout_score ≥ champion.holdout_score + δ AND candidate ≥ original_reference AND CI 비중첩`.
    33	
    34	## 5. 4앵커 + 독립성 (앵커는 필요조건일 뿐)
    35	1. **Ground-Truth assertion** — 객관 검증(파일·데이터·코드 동작)에 채택을 묶는다. judge 단독 금지.
    36	2. **Holdout 분리** — §6.
    37	3. **제안 + 사람 승인** — 자동 채택 금지.
    38	4. **단계적** — §3.
    39	**독립성(충분조건화):** assertion 작성자 ≠ 개정안 생성자, holdout 작성자 ≠ proposal generator(holdout 접근 금지). 채택 비교는 **blind**(candidate/champion 익명). 사람 승인은 rubber-stamp 방지 위해 **승인 체크리스트**(반례 검토·blind 비교 확인·holdout 누수 점검) + 외부 리뷰/사용자 표본. 다수 제안은 **batch best-of-N** 승인.
    40	
    41	## 6. Holdout 누수 방지 (LLM 생성 과제는 semantic sibling)
    42	70/30만으론 약함 — 문면이 달라도 같은 도메인·생성 프롬프트면 누수.
    43	- **locked append-only holdout** — 한 번 정하면 고정, 개정 튜닝에 재사용 금지.
    44	- **provenance 기록** + **생성 프롬프트 분리** + **유사도 dedup**(semantic) + **cluster split**(같은 클러스터가 train/holdout 양쪽에 안 가게).
    45	- **external seed** — holdout에 하네스 외부(사람·타 모델) 주입 과제 강제 포함.
    46	- **negative control** — "스킬이 오히려 방해되는" 역기획 과제 포함(과적합 시 여기서 점수 폭락 → 탐지).
    47	- proposal generator는 holdout 내용 열람 금지.
    48	
    49	## 7. baseline immutable (표류 방지)
    50	- baseline은 **immutable artifact** — `skill_hash·assertion_version·runner_version·model·env·seed·case_ids·holdout_score·n` 고정.
    51	- 후보는 **current champion AND original/reference baseline 둘 다** 이겨야 채택(국소 표류 차단).
    52	- **정기 재측정** — 모델 업그레이드·assertion 노후 반영(예: 주기적 전체 re-benchmark).
    53	- **assertion 버전 변경 시 baseline 무효화** → 전체 재측정.
    54	
    55	## 8. 통계 기준 (플래핑 방지 — 비어있으면 노이즈 채택)
    56	- 리스크별 **최소 holdout n**, **반복 실행 R회**(LLM stochasticity), **bootstrap/CI**, **effect size**, **gray-zone(tie) 보류 정책**.
    57	- 채택은 점수 차 단독 아님 — CI 비중첩 + effect size ≥ 기준 + 회귀 케이스 통과.
    58	- δ·min n·R·θ는 리스크 등급별 기본값 + 관찰 전용 시작(고정 자동화 금지).
    59	
    60	## 9. capability 등급 (자동개선 대상/비대상)
    61	하네스 품질 대부분은 혼합 영역(오케스트레이션·역할분리·트리거경계·설명정확도).
    62	| 등급 | 예 | 채택 조건 |
    63	|------|----|----------|
    64	| objective | 파일 생성·데이터 추출·코드 동작 | assertion 통과 |
    65	| hybrid | 트리거 경계·역할 분리·설명 정확도 | assertion + **blind human/외부 리뷰** |
    66	| subjective | 문체·디자인·창작 | 자동개선 비대상 — 사람 평가 |
    67	> objective 일부 통과 ≠ 전체 품질 개선. hybrid는 blind review 없이 채택 금지.
    68	
    69	## 10. 비용 통제 (벤치가 배보다 배꼽 되지 않게)
    70	- **Tiered:** `smoke`(1~2 케이스) 통과 시에만 `full`(holdout 전체).
    71	- **baseline 캐싱:** without/champion 결과는 skill/assertion/model 불변 동안 영구 캐싱(매번 재실행 금지).
    72	- **cheap-judge:** 측정·감지는 경량 모델(Haiku/Sonnet), 최종 승인 판단만 opus. (SKILL.md 모델 라우팅 준용)
    73	
    74	## 11. rollback (artifact 수준 폐쇄)
    75	- 점수만 되돌리면 안 됨. **rollback manifest**: adopted diff·artifact hashes·이전 파일 경로·baseline snapshot·eval case snapshot·command·expected score.
    76	- Phase 7에 rollback 실행 절차 명시(재현 가능).
    77	
    78	## 12. 정직한 한계
    79	- 자체측정 벤치 = 약증거. 외부 인용 시 n·측정자·holdout·assertion 버전 명시.
    80	- objective/hybrid만 자동개선. subjective는 사람.
    81	- 비용 多 → §10 통제 필수.
    82	
    83	## 통합 지점 (Phase 6/7 단일 표)
    84	| 시점 | 행위 | 산출물 |
    85	|------|------|--------|
    86	| Phase 6 | 측정(with/without·assertion) | `artifact_benchmark.json` |
    87	| Phase 6 | 루프 효율 측정 | `loop_scorecard.json` (별도) |
    88	| Phase 7 | 감지·제안·holdout 검증·승인·채택·re-baseline | baseline 레지스트리·rollback manifest |
    89	> 러너(`run-benchmark.sh`) 미구현 — §4 계약을 충족하는 MVP부터 `scripts/`에 구현.

 succeeded in 0ms:
     1	# 루프 자체 평가 (Loop Self-Evaluation) — scorecard & 단계적 도입
     2	
     3	루프(external-review-loop 등)가 자기 실행을 측정해 흐름 개선으로 환류하는 닫힌 고리. **외부 리뷰(codex/gemini) 검증을 거쳐 교정된 정본** — 순진한 precision·자동 적용·grading.json 재사용을 모두 제거했다.
     4	
     5	## 핵심 경계 (먼저 읽을 것)
     6	- **자기채점 ≠ 품질.** 오케스트레이터가 자기 판정으로 산출한 지표는 "정밀도"가 아니라 *자기와의 정합도*다. 그래서 precision이 아니라 **`alignment_score`**로 부른다. 리뷰어가 아무것도 안 내도 alignment는 좋아 보인다 — **놓친 결함(recall/miss)은 Ground Truth로만** 측정한다(아래).
     7	- **측정과 자동화를 분리한다.** 측정은 안전, 자동 흐름 변경은 고위험(Goodhart·플래핑). **단계적 도입**으로 측정부터.
     8	
     9	## 단계적 도입 (한 번에 다 넣지 말 것)
    10	| 단계 | 내용 | 졸업 기준(다음 단계로) | 자동화 |
    11	|------|------|----------------------|--------|
    12	| **1 (현재 정본)** | `loop_scorecard.json` 로깅만. 측정·기록 | 로깅 **≥ 10회** | 없음 |
    13	| 2 (사람) | 누적 요약을 사람이 수동 검토·판단 | rolling N≥10 + `min_adjudicated_claims≥30` + 사람 sign-off | 없음 |
    14	| 3 (실험) | 수치 트리거가 **개선안 "제안"**만 emit | 제안 holdout 통과율 ≥ θ + 명시 승인 | 제안만 + 승인 게이트 |
    15	| 4 (실험) | holdout 검증 후 자동 흐름 개선 | — | 최후, 승인 필수 |
    16	
    17	> **수치(10/30/θ)는 "관찰 시작 최소치"이지 통계적 확정 임계가 아니다** — LLM 평가 노이즈상 비율 지표는 표본이 더 필요할 수 있다. 리스크/단계/리뷰어가 섞이면 신뢰구간을 함께 보고, θ는 리스크 등급별 기본값으로 둔다. 3·4단계는 롤링윈도우·3회 연속 하락 시에만, 단일 실행 노이즈로 흐름을 바꾸지 않는다(플래핑 방지). **2단계까지가 실용 권장 — 3·4(자동 환류)는 실험적**, 데이터 충분+holdout 후에만.
    18	
    19	## 읽기 경로 (1단계에도 소비자 필수 — write-only 방지)
    20	측정만 하고 안 읽으면 낭비. 1단계부터 **읽기 경로**를 둔다:
    21	- `scripts/build-scorecard.sh`가 매 루프 종료 시 scorecard 발행 + `_workspace/evals/{loop}/summary.jsonl`에 최근 N회 집계(append).
    22	- 오케스트레이터는 **Phase 0(현황 감사)·Phase 7(진화) 진입 시 `summary.jsonl` 1줄 요약만** 읽는다(원본 JSON 미로드 — Lean). 악화 추세가 보이면 사람에게 보고(2단계 수동 검토).
    23	
    24	## loop_scorecard.json 스키마 (신규 — grading.json 재사용 아님)
    25	실행 단위 디렉터리에 발행: `_workspace/evals/{loop}/{stage_id}/{run_id}/scorecard.json`.
    26	```json
    27	{
    28	  "schema_version": "1",
    29	  "loop": "external-review",
    30	  "stage_id": "design-auth",
    31	  "run_id": "20260612_1530",
    32	  "rounds": 3,
    33	  "termination_reason": "converged-good | exhausted | max-rounds | failed-quality-gate",
    34	  "verdict_counts": { "confirmed": 6, "partial": 2, "deferred": 1, "rejected": 1, "duplicate": 1 },
    35	  "new_per_round": [10, 1, 0],
    36	  "alignment_score": 0.67,        // (confirmed + 0.5*partial) / adjudicated_non_deferred. deferred 분모 제외
    37	  "rejected_rate": 0.11,          // rejected / adjudicated_new_claims (1-alignment 아님, 별도)
    38	  "deferred_rate": 0.10,
    39	  "duplicate_rate": 0.09,
    40	  "rounds_normalized": 0.6,       // rounds / f(diff_lines, risk_level) — 난이도 보정
    41	  "diff_lines": 120, "risk_level": "standard",
    42	  "cost_per_run_tokens": 48000,
    43	  "cost_per_confirmed": 8000,     // confirmed>0일 때만. 0이면 null
    44	  "quality_label": "gate_pass | failed-quality-gate | converged | n/a",  // 설계단계 품질 자기단정 금지
    45	  "regression_catch_rate": 0.33,  // round>1 재리뷰가 잡은(confirmed+partial) / round1 confirmed+partial. "수정 diff의 회귀/누출"이지 전체 recall 아님
    46	  "warnings": [],                 // round>1 source 태깅 누락 등 — 조용한 0 방지
    47	  "missed_defect_rate": null,     // 진짜 recall: 외부 Ground Truth(seeded·사후 회귀·사용자 반박) 있을 때만
    48	  "overturned_rejection_rate": null,
    49	  "computed_by": "scripts/build-scorecard.sh",  // 사실 필드는 스크립트 계산(LLM 자기보고 아님). quality_label만 LLM 해석
    50	  "links": { "grading": "../grading.json", "timing": "../timing.json", "verdicts": "../../{stage_id}_verdicts.json" }
    51	}
    52	```
    53	- **계산 도출(메타 자기채점 제거):** `verdict_counts`·`rounds`·`new_per_round`·`*_rate`·`cost`·`regression_catch_rate`는 **`scripts/build-scorecard.sh`가 `verdicts.json`+`timing.json`에서 기계적으로 산출**한다. LLM은 라벨 해석에만 관여(`quality_label` 등). 카운트를 LLM이 손으로 적지 않는다(오기·낙관 편향 방지).
    54	- **Lean:** 원본 JSON을 세션에 상시 로드하지 않는다. 파일로만 보존, **Phase 시작 시 요약본만** 읽는다.
    55	- `grading.json`/`timing.json`은 assertion·토큰 정보가 있을 때 **링크**로 연결(중복 보관 금지).
    56	
    57	## 메트릭 정의 (교정본)
    58	- **alignment_score** = (confirmed + 0.5·partial) / (adjudicated 중 deferred 제외). 이름 그대로 "리뷰 보고 ↔ 오케스트레이터 판정" 정합도. **리뷰어 건강·정밀도라고 부르지 않는다.**
    59	- **rejected_rate / deferred_rate / duplicate_rate** — 각각 별도. `false_positive_rate`는 *사후 확정 가능*할 때만(기각이 나중에 진짜 결함으로 판명) `overturned_rejection_rate`로 기록.
    60	- **rounds_to_converge** 원시값은 K·MAX_ROUNDS·변경 규모에 좌우 → `diff_lines`·`risk_level`로 정규화한 `rounds_normalized`를 1차 지표로, 원시값은 보조.
    61	- **cost_per_confirmed** confirmed=0이면 분모 0 → `null`. 항상 `cost_per_run`·`cost_per_adjudicated_claim`과 함께 본다.
    62	- **regression_catch_rate (수정 회귀/누출 탐지 — 부분 신호)** = (round>1 재리뷰가 잡은 confirmed+partial) / (**round1** confirmed+partial). round>1은 *수정 diff만* 좁게 재리뷰하므로 이것은 "수정이 만든 회귀/이전 게이트 누출" 탐지율이지 **전체 산출물 recall이 아니다**(미수정 영역 누락은 관측 불가 → 과대 해석 금지). (예: timeout 수정이 2차에서 macOS 결함으로 잡힘.) 분모는 누적이 아닌 round1 기준(희석 방지). round>1 confirmed/partial에 `source` 태깅이 없으면 `warnings`에 기록(조용한 0 방지).
    63	- **missed_defect_rate (진짜 recall)** — 전체 누락은 **외부 Ground Truth**(seeded 결함 탐지율·사후 회귀 역추적·사용자 반박)가 있을 때만. 없으면 null. regression_catch_rate는 보조 신호일 뿐 recall을 대체하지 않는다.
    64	
    65	## 종료 사유 라벨 (P2 — 종료조건 아님, 라벨)
    66	gate/assertion은 **코드/테스트 단계 전용**. 설계·문서 리뷰엔 측정값이 없으므로 종료조건에 넣지 않는다.
    67	- `converged-good`: 신규 확인 0건 K회 + (코드 단계) 게이트 PASS·assertion ≥ θ.
    68	- `converged`: 신규 0건 K회 (게이트 없는 단계의 중립 종료 — "더 찾을 신규 결함 없음". 품질 단정 아님). *주의: `exhausted`를 부정 라벨로 쓰지 말 것 — 게이트 없는 설계/문서는 이게 정상 수렴이다.*
    69	- `max-rounds`: MAX_ROUNDS 강제 종료(미수렴 보고).
    70	- `failed-quality-gate`: (코드 단계) 품질 θ 미달 명백 → **루프 중단**(MAX_ROUNDS 헛돌지 않게).
    71	- **설계/문서 단계 품질은 라벨로 자기단정하지 않는다.** verdicts 완료 + 정본 대조 체크리스트는 종료 *조건*일 뿐, "양호" 단정(`design-ok` 같은)은 같은 오케스트레이터의 자기채점이 된다 → 금지. 품질 보증이 필요하면 독립 리뷰어 표본 감사·사용자 승인 같은 외부 신호를 별도로 받는다.
    72	
    73	## 판정 보정 (P5 — Ground Truth만)
    74	같은 오케스트레이터·같은 근거수집으로 재점검하면 편향 반복(에코체임버). 보정은 **독립 신호가 있을 때만** 발화: 사용자 반박 / 후속 결함 발견 / 독립 리뷰어 표본 감사. 결과는 `overturned_rejection_rate`로 기록하고, 임계 초과 시 기각 사유표·리뷰어 신뢰도를 *제안* 형태로 조정(자동 적용 금지).
    75	
    76	## 환류(P3/P4) 안전장치 — 3·4단계에서만
    77	- 자동 **"적용" 금지 → "제안"**만. 적용 전 사용자 또는 독립 검토 게이트.
    78	- 롤링윈도우(최근 N회 평균)·3회 연속 하락만 발화(단일 노이즈 무시).
    79	- `min_adjudicated_claims ≥ 30` 전에는 트리거 금지(표본 부족).
    80	- 변경 후 holdout 시나리오·기존 회귀 케이스로 검증.
    81	- θ·ε·N은 리스크 등급별 기본값 + 관찰 전용 시작(고정 자동화 금지).
    82	
    83	> 테스트 개선 루프 수렴(assertion 통과율 델타 < ε)은 목적이 달라 분리한다 — `skill-testing-guide.md`에서 다루고, scorecard 링크 규약만 공유.

hook: PostToolUse
exec
/bin/zsh -lc "nl -ba skills/myharness/references/orchestrator-template.md | sed -n '1,380p'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
     1	# 오케스트레이터 스킬 템플릿
     2	
     3	## 목차 (필요한 템플릿만 로드)
     4	- 템플릿 A: 에이전트 팀(기본) · B: 서브 에이전트 · C: 하이브리드 · D: Codex 런타임 어댑터(+동시성·에러 핸들링)
     5	- 작성 원칙 / 후속 작업 키워드 — 마무리 시. 실행 모드에 맞는 템플릿 1개만 읽으면 된다.
     6	
     7	오케스트레이터는 팀 전체를 조율하는 상위 스킬이다. 실행 모드별로 3가지 템플릿을 제공한다:
     8	
     9	- **템플릿 A: 에이전트 팀 모드 (기본)** — 2명 이상 협업 시 최우선 선택
    10	- **템플릿 B: 서브 에이전트 모드 (대안)** — 팀 통신이 불필요한 경우
    11	- **템플릿 C: 하이브리드 모드** — Phase마다 모드를 섞어 구성
    12	- **템플릿 D: Codex 런타임 어댑터** — Codex CLI에서 실행 시(팀 도구 부재). A/B를 순차·subprocess로 매핑
    13	
    14	> 듀얼 런타임(Claude Code + Codex) 설계 전반은 `references/runtime-adapters.md` 참조. 오케스트레이터 상단에 "런타임 감지 후 분기" 한 줄을 넣고, 팀 도구 가용 시 A, 부재 시 D를 따른다.
    15	
    16	---
    17	
    18	## 템플릿 A: 에이전트 팀 모드 (기본 · 최우선 선택)
    19	
    20	2명 이상의 에이전트가 협업할 때 **가장 먼저 검토하는 기본 모드**. `TeamCreate`로 팀을 구성하고, 공유 작업 목록과 `SendMessage`로 조율한다.
    21	
    22	```markdown
    23	---
    24	name: {domain}-orchestrator
    25	description: "{도메인} 에이전트 팀을 조율하는 오케스트레이터. {초기 실행 키워드}. 후속 작업: {도메인} 결과 수정, 부분 재실행, 업데이트, 보완, 다시 실행, 이전 결과 개선 요청 시에도 반드시 이 스킬을 사용."
    26	---
    27	
    28	# {Domain} Orchestrator
    29	
    30	{도메인}의 에이전트 팀을 조율하여 {최종 산출물}을 생성하는 통합 스킬.
    31	
    32	## 실행 모드: 에이전트 팀
    33	
    34	## 에이전트 구성
    35	
    36	| 팀원 | 에이전트 타입 | 역할 | 스킬 | 출력 |
    37	|------|-------------|------|------|------|
    38	| {teammate-1} | {커스텀 또는 빌트인} | {역할} | {skill} | {output-file} |
    39	| {teammate-2} | {커스텀 또는 빌트인} | {역할} | {skill} | {output-file} |
    40	| ... | | | | |
    41	
    42	## 워크플로우
    43	
    44	### Phase 0: 컨텍스트 확인 (후속 작업 지원)
    45	
    46	기존 산출물 존재 여부를 확인하여 실행 모드를 결정한다:
    47	
    48	1. `_workspace/` 디렉토리 존재 여부 확인
    49	2. 실행 모드 결정:
    50	   - **`_workspace/` 미존재** → 초기 실행. Phase 1로 진행
    51	   - **`_workspace/` 존재 + 사용자가 부분 수정 요청** → 부분 재실행. 해당 에이전트만 재호출하고, 기존 산출물 중 수정 대상만 덮어쓴다
    52	   - **`_workspace/` 존재 + 새 입력 제공** → 새 실행. 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동한 뒤 Phase 1 진행
    53	3. 부분 재실행 시: 이전 산출물 경로를 에이전트 프롬프트에 포함하여, 에이전트가 기존 결과를 읽고 피드백을 반영하도록 지시
    54	
    55	### Phase 1: 준비
    56	1. 사용자 입력 분석 — {무엇을 파악하는지}
    57	2. 작업 디렉토리에 `_workspace/` 생성
    58	   - **초기 실행**: 새 `_workspace/` 생성
    59	   - **새 실행**: 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동한 직후 새 `_workspace/` 재생성
    60	3. 입력 데이터를 `_workspace/00_input/`에 저장
    61	
    62	### Phase 2: 팀 구성
    63	
    64	1. 팀 생성:
    65	   ```
    66	   TeamCreate(
    67	     team_name: "{domain}-team",
    68	     members: [
    69	       { name: "{teammate-1}", agent_type: "{type}", model: "opus", prompt: "{역할 설명 및 작업 지시}" },
    70	       { name: "{teammate-2}", agent_type: "{type}", model: "opus", prompt: "{역할 설명 및 작업 지시}" },
    71	       ...
    72	     ]
    73	   )
    74	   ```
    75	
    76	2. 작업 등록:
    77	   ```
    78	   TaskCreate(tasks: [
    79	     { title: "{작업1}", description: "{상세}", assignee: "{teammate-1}" },
    80	     { title: "{작업2}", description: "{상세}", assignee: "{teammate-2}" },
    81	     { title: "{작업3}", description: "{상세}", depends_on: ["{작업1}"] },
    82	     ...
    83	   ])
    84	   ```
    85	
    86	   > 팀원당 5~6개 작업이 적정. 의존성이 있는 작업은 `depends_on`으로 명시.
    87	
    88	### Phase 3: {주요 작업 — 예: 조사/생성/분석}
    89	
    90	**실행 방식:** 팀원들이 자체 조율
    91	
    92	팀원들은 공유 작업 목록에서 작업을 요청(claim)하고 독립적으로 수행한다.
    93	리더는 진행 상황을 모니터링하며 필요 시 개입한다.
    94	
    95	**팀원 간 통신 규칙:**
    96	- {teammate-1}은 {teammate-2}에게 {어떤 정보}를 SendMessage로 전달
    97	- {teammate-2}는 작업 완료 시 결과를 파일로 저장하고 리더에게 알림
    98	- 팀원이 다른 팀원의 결과가 필요하면 SendMessage로 요청
    99	
   100	**산출물 저장:**
   101	
   102	| 팀원 | 출력 경로 |
   103	|------|----------|
   104	| {teammate-1} | `_workspace/{phase}_{teammate-1}_{artifact}.md` |
   105	| {teammate-2} | `_workspace/{phase}_{teammate-2}_{artifact}.md` |
   106	
   107	**리더 모니터링:**
   108	- 팀원이 유휴 상태가 되면 자동 알림 수신
   109	- 특정 팀원이 막혔을 때 SendMessage로 지시 또는 작업 재할당
   110	- 전체 진행률은 TaskGet으로 확인
   111	
   112	### Phase 4: {후속 작업 — 예: 검증/통합}
   113	1. 모든 팀원의 작업 완료 대기 (TaskGet으로 상태 확인)
   114	2. 각 팀원의 산출물을 Read로 수집
   115	3. {통합/검증 로직}
   116	4. 최종 산출물 생성: `{output-path}/{filename}`
   117	
   118	### Phase 5: 정리
   119	1. 팀원들에게 종료 요청 (SendMessage)
   120	2. 팀 정리 (TeamDelete)
   121	3. `_workspace/` 디렉토리 보존 (중간 산출물은 삭제하지 않음 — 사후 검증·감사 추적용)
   122	4. 사용자에게 결과 요약 보고
   123	
   124	> **팀 재구성이 필요한 경우:** Phase별로 다른 전문가 조합이 필요하면, 현재 팀을 TeamDelete로 정리한 뒤 새 TeamCreate로 다음 Phase의 팀을 구성한다. 이전 팀의 산출물은 `_workspace/`에 보존되므로 새 팀이 Read로 접근 가능.
   125	
   126	## 데이터 흐름
   127	
   128	```
   129	[리더] → TeamCreate → [teammate-1] ←SendMessage→ [teammate-2]
   130	                          │                           │
   131	                          ↓                           ↓
   132	                    artifact-1.md              artifact-2.md
   133	                          │                           │
   134	                          └───────── Read ────────────┘
   135	                                     ↓
   136	                              [리더: 통합]
   137	                                     ↓
   138	                              최종 산출물
   139	```
   140	
   141	## 에러 핸들링
   142	
   143	| 상황 | 전략 |
   144	|------|------|
   145	| 팀원 1명 실패/중지 | 리더가 감지 → SendMessage로 상태 확인 → 재시작 또는 대체 팀원 생성 |
   146	| 팀원 과반 실패 | 사용자에게 알리고 진행 여부 확인 |
   147	| 타임아웃 | 현재까지 수집된 부분 결과 사용, 미완료 팀원 종료 |
   148	| 팀원 간 데이터 충돌 | 출처 명시 후 병기, 삭제하지 않음 |
   149	| 작업 상태 지연 | 리더가 TaskGet으로 확인 후 수동으로 TaskUpdate |
   150	
   151	## 테스트 시나리오
   152	
   153	### 정상 흐름
   154	1. 사용자가 {입력}을 제공
   155	2. Phase 1에서 {분석 결과} 도출
   156	3. Phase 2에서 팀 구성 ({N}명 팀원 + {M}개 작업)
   157	4. Phase 3에서 팀원들이 자체 조율하며 작업 수행
   158	5. Phase 4에서 산출물 통합하여 최종 결과 생성
   159	6. Phase 5에서 팀 정리
   160	7. 예상 결과: `{output-path}/{filename}` 생성
   161	
   162	### 에러 흐름
   163	1. Phase 3에서 {teammate-2}가 에러로 중지
   164	2. 리더가 유휴 알림 수신
   165	3. SendMessage로 상태 확인 → 재시작 시도
   166	4. 재시작 실패 시 {teammate-2} 작업을 {teammate-1}에게 재할당
   167	5. 나머지 결과로 Phase 4 진행
   168	6. 최종 보고서에 "{teammate-2} 영역 일부 미수집" 명시
   169	```
   170	
   171	---
   172	
   173	## 템플릿 B: 서브 에이전트 모드 (대안)
   174	
   175	팀 통신 오버헤드가 불필요한 경우. `Agent` 도구로 직접 호출하고 반환값으로 결과를 수집한다.
   176	
   177	```markdown
   178	---
   179	name: {domain}-orchestrator
   180	description: "{도메인} 에이전트를 조율하는 오케스트레이터. {초기 실행 키워드}. 후속 작업 키워드 포함."
   181	---
   182	
   183	## 실행 모드: 서브 에이전트
   184	
   185	## 에이전트 구성
   186	
   187	| 에이전트 | subagent_type | 역할 | 스킬 | 출력 |
   188	|---------|--------------|------|------|------|
   189	| {agent-1} | {빌트인 또는 커스텀} | {역할} | {skill} | {output-file} |
   190	| {agent-2} | ... | ... | ... | ... |
   191	
   192	## 워크플로우
   193	
   194	### Phase 0: 컨텍스트 확인
   195	(Template A와 동일 — `_workspace/` 존재 여부 분기)
   196	
   197	### Phase 1: 준비
   198	1. 입력 분석
   199	2. `_workspace/` 생성 (초기 실행 시, 또는 새 실행에서 기존 `_workspace/`를 보관 디렉토리로 이동한 직후)
   200	
   201	### Phase 2: 병렬 실행
   202	단일 메시지에서 N개 Agent 도구를 동시 호출:
   203	
   204	| 에이전트 | 입력 | 출력 | model | run_in_background |
   205	|---------|------|------|-------|-------------------|
   206	| {agent-1} | {소스} | `_workspace/{phase}_{agent}_{artifact}.md` | opus | true |
   207	| {agent-2} | {소스} | `_workspace/{phase}_{agent}_{artifact}.md` | opus | true |
   208	
   209	### Phase 3: 통합
   210	1. 각 에이전트의 반환값 수집
   211	2. 파일 기반 산출물은 Read로 수집
   212	3. 통합 로직 적용 → 최종 산출물
   213	
   214	### Phase 4: 정리
   215	1. `_workspace/` 보존
   216	2. 결과 요약 보고
   217	
   218	## 에러 핸들링
   219	- 에이전트 1개 실패: 1회 재시도. 재실패 시 누락 명시하고 진행
   220	- 과반 실패: 사용자에게 알리고 진행 여부 확인
   221	- 타임아웃: 현재까지 수집된 부분 결과 사용
   222	```
   223	
   224	---
   225	
   226	## 템플릿 C: 하이브리드 모드
   227	
   228	Phase마다 다른 실행 모드를 사용한다. 각 Phase 상단에 `**실행 모드:** {팀 | 서브}`를 명시한다.
   229	
   230	```markdown
   231	---
   232	name: {domain}-orchestrator
   233	description: "{도메인} 오케스트레이터 (하이브리드). {키워드}. 후속 작업 키워드 포함."
   234	---
   235	
   236	## 실행 모드: 하이브리드
   237	
   238	| Phase | 모드 | 이유 |
   239	|-------|------|------|
   240	| Phase 2 (병렬 수집) | 서브 에이전트 | 독립 자료 수집, 팀 통신 불필요 |
   241	| Phase 3 (합의 통합) | 에이전트 팀 | 상충 데이터 토론·합의 필요 |
   242	| Phase 4 (독립 검증) | 서브 에이전트 | QA 에이전트 1명이 객관 검증 |
   243	
   244	## 워크플로우
   245	
   246	### Phase 2: 병렬 자료 수집
   247	**실행 모드:** 서브 에이전트
   248	
   249	단일 메시지에서 Agent 도구로 N개 에이전트 병렬 호출 (`run_in_background: true`).
   250	각 결과는 `_workspace/02_{agent}_raw.md`에 저장.
   251	
   252	### Phase 3: 합의 기반 통합
   253	**실행 모드:** 에이전트 팀
   254	
   255	1. `TeamCreate`로 통합 팀 구성 (editor + fact-checker + synthesizer)
   256	2. `TaskCreate`로 작업 분배 — 모두 Phase 2의 `_workspace/02_*` 파일을 Read
   257	3. 팀원들이 `SendMessage`로 상충 데이터를 논의, 파일 기반으로 합의안 도출
   258	4. 최종 통합본 `_workspace/03_integrated.md` 생성
   259	5. `TeamDelete`로 팀 정리
   260	
   261	### Phase 4: 독립 검증
   262	**실행 모드:** 서브 에이전트
   263	
   264	단일 QA 서브 에이전트가 `_workspace/03_integrated.md`를 입력으로 받아 검증 보고서 생성.
   265	```
   266	
   267	**하이브리드 전환 규칙:**
   268	- 팀 → 서브: 팀을 반드시 `TeamDelete`로 정리한 후 Agent 도구 호출
   269	- 서브 → 팀: 서브 에이전트의 파일 산출물을 팀원들에게 Read 경로로 전달
   270	- 팀 → 팀: 이전 팀을 정리한 후 새 `TeamCreate` (세션당 1팀만 활성 가능)
   271	
   272	---
   273	
   274	---
   275	
   276	## 템플릿 D: Codex 런타임 어댑터
   277	
   278	Codex엔 `TeamCreate`/`SendMessage`는 없지만 **네이티브 subagents**(내장 `default`/`worker`/`explorer` + 커스텀 `.codex/agents/*.toml`)가 있다. 정본 스킬(`.agents/skills/`, SKILL.md 동일 포맷)은 공유하고, **조율 도구만** 매핑한다. (검증: 공식 Codex docs + 0.137.0)
   279	
   280	```markdown
   281	## 실행 모드: Codex 어댑터 (런타임 감지 후 분기)
   282	
   283	> 팀 도구(TeamCreate 등) 가용 시 템플릿 A. 부재 시(=Codex) 아래.
   284	
   285	### 매핑 규칙
   286	| 팀 모드(A) | Codex 어댑터(D) |
   287	|-----------|----------------|
   288	| TeamCreate(members) | Codex subagents 병렬 spawn(`.codex/agents/*.toml` 또는 내장 worker/explorer), `/agent`로 전환 |
   289	| TaskCreate/depends_on | 단계 순서 실행(의존 = 선행 단계 산출물 파일 존재 확인) |
   290	| SendMessage(팀원 통신) | `_workspace/` 파일로 전달 — 다음 단계가 Read |
   291	| 완전 독립 병렬(CI 등) | `codex exec` subprocess 백그라운드 |
   292	
   293	### Phase 2: 실행
   294	subagents 병렬 또는 순차. 각 산출물 `_workspace/{phase}_{agent}_{artifact}.md` 저장 → 다음 단계가 Read로 입력(메시지 대신 파일).
   295	
   296	### codex exec subprocess (독립 병렬·CI)
   297	```bash
   298	mkdir -p _workspace
   299	trap 'pkill -P $$ 2>/dev/null' EXIT      # 좀비 방지
   300	TO="$(command -v timeout || command -v gtimeout || true)"   # macOS 이식성
   301	# stdin 폐쇄 필수(< /dev/null) — 안 하면 codex exec 무한 대기
   302	# 동시 실행 cap을 지켜라(아래 동시성 정책). 초과분은 큐잉.
   303	${TO:+$TO 600s} codex exec --sandbox read-only --json -o _workspace/{phase}_{agent}.md \
   304	  "$(cat _workspace/{agent}_prompt.md)" < /dev/null &
   305	wait   # 여러 개 띄운 뒤
   306	```
   307	- 베스트 프랙티스(검증): 기본 `read-only` / 쓰기만 `--sandbox workspace-write` / 스크립트 소비 `--json` / 최종 메시지만 `-o` / 격리 `--ignore-user-config`.
   308	- 외부 리뷰 게이트(external-review-loop)는 양쪽 동일 — 이미 subprocess.
   309	
   310	### 동시성 정책 (백프레셔)
   311	대규모 fan-out(에이전트 7+ · 다중 codex exec)은 CPU·file I/O·API quota·토큰을 폭증시킨다.
   312	- **동시 실행 cap 기본 3, 최대 5** — 초과는 큐잉(`_workspace/status/*.json` claim/lease).
   313	- **외부 리뷰는 별도 cap 2** (codex+gemini 1쌍).
   314	- 각 subprocess는 PID 수집·exit code 확인·실패 1회 재시도·잔여 kill.
   315	
   316	### 에러 핸들링
   317	- 실패 작업 1회 재시도 → 누락 명시 후 진행. 산출물 충돌: 출처 병기, 삭제 금지(A와 동일).
   318	- **상태/실패 감지:** `_workspace/status/{agent}.json`(status·heartbeat·retry_count·artifact_path)로 stale(무응답) 판정·재시작 idempotency·부분 산출물 유효성 확인.
   319	
   320	### 데이터 흐름
   321	[오케스트레이터] → subagents/순차/codex exec → `_workspace/*.md` → Read 통합 → 최종 산출물
   322	```
   323	
   324	> Codex 진입점(AGENTS.md)·스킬 경로(`.agents/skills/`)·설치·한계는 `references/runtime-adapters.md`.
   325	
   326	---
   327	
   328	## 작성 원칙
   329	
   330	1. **실행 모드를 먼저 명시** — 오케스트레이터 상단에 "에이전트 팀" / "서브 에이전트" / "하이브리드" / "Codex 어댑터" 중 하나 명시. 듀얼 런타임이면 "런타임 감지 후 A 또는 D" 명시. 하이브리드면 Phase별 모드 표 필수
   331	2. **팀 모드는 TeamCreate/SendMessage/TaskCreate 사용법을 구체적으로** — 팀 구성, 작업 등록, 통신 규칙
   332	3. **서브 모드는 Agent 도구 파라미터를 완전히 명시** — name, subagent_type, prompt, run_in_background, model
   333	4. **파일 경로는 기준이 명확하게** — 프로젝트 루트 기준 경로로 통일(`_workspace/...`·`.claude/...`·`.agents/...`). 현재 디렉토리에 의존하는 모호한 상대 경로만 금지
   334	5. **Phase 간 의존성 명시** — 어떤 Phase가 어떤 Phase의 결과에 의존하는지. 하이브리드는 모드 전환 지점을 특히 강조
   335	6. **에러 핸들링은 현실적으로** — "모든 것이 성공한다"고 가정하지 않음
   336	7. **테스트 시나리오 필수** — 정상 1 + 에러 1 이상
   337	
   338	## description 작성 시 후속 작업 키워드
   339	
   340	오케스트레이터 description은 초기 실행 키워드만으로는 부족하다. 다음 후속 작업 표현을 반드시 포함하라:
   341	
   342	- 재실행/다시 실행/업데이트/수정/보완
   343	- "{도메인}의 {부분}만 다시"
   344	- "이전 결과 기반으로", "결과 개선"
   345	- 도메인 관련 일상적 요청 (예: 런치 전략 하네스라면 "런치", "홍보", "트렌딩" 등)
   346	
   347	후속 키워드가 없으면 첫 실행 후 하네스가 사실상 죽은 코드가 된다.
   348	
   349	## 실제 오케스트레이터 참고
   350	
   351	팬아웃/팬인 패턴의 오케스트레이터 기본 구조:
   352	준비 → Phase 0(컨텍스트 확인) → TeamCreate + TaskCreate → N개 팀원 병렬 실행 → Read + 통합 → 정리.
   353	`references/team-examples.md`의 리서치 팀 예시를 참조.

hook: PostToolUse
hook: PostToolUse
exec
/bin/zsh -lc "git diff --stat 9294dd6..HEAD; git log --oneline 9294dd6..HEAD --decorate --no-merges | sed -n '1,80p'" in /Users/junghojang/Developments/myProject/myHarness
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse Completed
hook: PostToolUse
 succeeded in 3050ms:
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-hycIbtd4' (errno=Operation not permitted)
 .agents/skills/harness                             |    1 -
 .agents/skills/myharness                           |    1 +
 .claude-plugin/marketplace.json                    |   12 +-
 .claude-plugin/plugin.json                         |   20 +-
 AGENTS.md                                          |    8 +-
 CHANGELOG.md                                       |  103 +-
 CLAUDE.md                                          |    2 +-
 CONTRIBUTING.md                                    |    8 +-
 README.md                                          |   59 +-
 README_JA.md                                       |   63 +-
 README_KO.md                                       |   63 +-
 _workspace/reviews/dualrt_codex.md                 |  674 +++++
 _workspace/reviews/dualrt_prompt_codex.md          |    9 +
 _workspace/reviews/eval-proposal_artifact.md       |   19 +
 _workspace/reviews/eval-proposal_codex.md          |  657 ++++
 _workspace/reviews/eval-proposal_gemini.md         |   56 +
 _workspace/reviews/eval-proposal_prompt_general.md |   12 +
 _workspace/reviews/eval-proposal_prompt_perf.md    |   12 +
 _workspace/reviews/factory-perf_codex.md           | 1771 +++++++++++
 _workspace/reviews/factory-perf_gemini.md          |  136 +
 _workspace/reviews/factory-perf_prompt.md          |   12 +
 _workspace/reviews/factory-policy_codex.md         | 3176 ++++++++++++++++++++
 _workspace/reviews/factory-policy_gemini.md        |   62 +
 .../reviews/factory-policy_prompt_general.md       |   13 +
 _workspace/reviews/factory-policy_prompt_robust.md |   13 +
 _workspace/reviews/harness_invoke_codex.md         | 1775 +++++++++++
 _workspace/reviews/harness_invoke_prompt.md        |    4 +
 _workspace/reviews/loop-eval-v2_artifact.md        |   45 +
 _workspace/reviews/loop-eval-v2_codex.md           |  639 ++++
 _workspace/reviews/loop-eval-v2_gemini.md          |   46 +
 _workspace/reviews/loop-eval-v2_prompt.md          |   12 +
 _workspace/reviews/loop-eval-v2_prompt_perf.md     |   12 +
 _workspace/reviews/self-improve_codex.md           |  689 +++++
 _workspace/reviews/self-improve_gemini.md          |   60 +
 _workspace/reviews/self-improve_prompt.md          |   13 +
 _workspace/reviews/self-improve_prompt_perf.md     |   13 +
 docs/experimental-dependency.md                    |    2 +-
 docs/quickstart.md                                 |   14 +-
 index.html                                         |   16 +-
 install.sh                                         |   24 +-
 privacy.html                                       |    6 +-
 skills/harness/references/external-review-loop.md  |   83 -
 skills/{harness => myharness}/SKILL.md             |   99 +-
 .../references/agent-design-patterns.md            |    6 +-
 .../{harness => myharness}/references/dev-rules.md |    2 +-
 .../myharness/references/external-review-loop.md   |  115 +
 skills/myharness/references/factory-map.md         |   42 +
 skills/myharness/references/loop-self-eval.md      |   83 +
 .../references/orchestrator-template.md            |   20 +-
 .../references/qa-agent-guide.md                   |    0
 .../references/runtime-adapters.md                 |    2 +-
 .../myharness/references/self-improvement-loop.md  |   89 +
 .../references/skill-testing-guide.md              |    0
 .../references/skill-writing-guide.md              |    2 +
 .../references/tdd-doctrine.md                     |    2 +-
 .../references/team-examples.md                    |    3 +
 skills/myharness/scripts/build-scorecard.sh        |   63 +
 .../scripts/check-review-tools.sh                  |    9 +-
 58 files changed, 10532 insertions(+), 420 deletions(-)
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-NfB97tiV' (errno=Operation not permitted)
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-iqxqPxK5' (errno=Operation not permitted)
b1f5d6d (HEAD -> main, origin/main) docs(factory): add navigation layer (minimal-path, impl-status, loop map)
68ab93d feat(factory): self-improvement-loop design + external review applied
4ea15b7 feat(factory): loop self-eval maturity (priorities 1-4) + external review applied
288065f docs: README (EN/KO/JA) — convergent review loop + loop self-evaluation
1d7373f feat(factory): loop self-eval (corrected per external review)
a86e335 fix(factory): make external-review-loop a real convergent loop
ab81088 docs: update README (EN/KO/JA) with cost/concurrency control + runtime-sync from review
af030aa perf(factory): apply 2nd external review (codex+gemini) — performance/stability
f2af5bb fix(factory): apply 1st external review (codex+gemini) — dual-runtime threading + robustness
2713094 docs(factory): policy review fixes P1+P2
cf88584 chore: archive codex review logs (dual-runtime + skill invocation research)
b7a37a8 refactor: rename marketplace to myharness-marketplace
c3c3cf3 refactor: rename plugin to myharness (install: myharness@harness-marketplace)
5aad9db fix: correct quickstart install command to harness@harness-marketplace
a34ab5a refactor: rename skill command harness -> myharness (/myharness, $myharness)
95ae914 fix: correct plugin install command to harness@harness-marketplace (KO/JA/index)
78f0704 chore: remove +60% Research section, reset CHANGELOG to 1.0.0
4be2d7d chore: remove +60% A/B FAQ, unify version to 1.0.0
9abe62c fix: restore sibling-repo links (harness-100, claude-code-harness) to revfactory
c085b38 chore: white-label to cookyman / my_harness

hook: PostToolUse Completed
hook: PreToolUse
hook: PreToolUse Completed
exec
/bin/zsh -lc "nl -ba README.md | sed -n '181,235p'; nl -ba README_KO.md | sed -n '195,250p'; nl -ba README_JA.md | sed -n '195,255p'" in /Users/junghojang/Developments/myProject/myHarness
 succeeded in 0ms:
   181	## Output
   182	
   183	Files generated by Harness:
   184	
   185	```
   186	your-project/
   187	├── .claude/
   188	│   ├── agents/          # Agent definition files
   189	│   │   ├── analyst.md
   190	│   │   ├── builder.md
   191	│   │   └── qa.md
   192	│   └── skills/          # Skill files
   193	│       ├── analyze/
   194	│       │   └── SKILL.md
   195	│       └── build/
   196	│           ├── SKILL.md
   197	│           └── references/
   198	```
   199	
   200	## Use Cases — Try These Prompts
   201	
   202	Copy any prompt below into Claude Code after installing Harness:
   203	
   204	**Deep Research**
   205	```
   206	Build a harness for deep research. I need an agent team that can investigate
   207	any topic from multiple angles — web search, academic sources, community
   208	sentiment — then cross-validate findings and produce a comprehensive report.
   209	```
   210	
   211	**Website Development**
   212	```
   213	Build a harness for full-stack website development. The team should handle
   214	design, frontend (React/Next.js), backend (API), and QA testing in a
   215	coordinated pipeline from wireframe to deployment.
   216	```
   217	
   218	**Webtoon / Comic Production**
   219	```
   220	Build a harness for webtoon episode production. I need agents for story
   221	writing, character design prompts, panel layout planning, and dialogue
   222	editing. They should review each other's work for style consistency.
   223	```
   224	
   225	**YouTube Content Planning**
   226	```
   227	Build a harness for YouTube content creation. The team should research
   228	trending topics, write scripts, optimize titles/tags for SEO, and plan
   229	thumbnail concepts — all coordinated by a supervisor agent.
   230	```
   231	
   232	**Code Review & Refactoring**
   233	```
   234	Build a harness for comprehensive code review. I want parallel agents
   235	checking architecture, security vulnerabilities, performance bottlenecks,
   195	## 산출물
   196	
   197	하네스가 생성하는 파일:
   198	
   199	```
   200	프로젝트/
   201	├── .claude/
   202	│   ├── agents/          # 에이전트 정의 파일
   203	│   │   ├── analyst.md
   204	│   │   ├── builder.md
   205	│   │   └── qa.md
   206	│   └── skills/          # 스킬 파일
   207	│       ├── analyze/
   208	│       │   └── SKILL.md
   209	│       └── build/
   210	│           ├── SKILL.md
   211	│           └── references/
   212	```
   213	
   214	## 사용 사례 — 이 프롬프트를 그대로 사용하세요
   215	
   216	Harness 설치 후 아래 프롬프트를 Claude Code에 복사해서 사용하세요:
   217	
   218	**딥 리서치**
   219	```
   220	리서치 하네스를 구성해줘. 어떤 주제든 여러 각도에서 조사할 수 있는 에이전트 팀이
   221	필요해 — 웹 검색, 학술 자료, 커뮤니티 반응 — 교차 검증 후 종합 보고서를 작성하는 팀.
   222	```
   223	
   224	**웹사이트 제작**
   225	```
   226	풀스택 웹사이트 개발 하네스를 구성해줘. 디자인, 프론트엔드(React/Next.js),
   227	백엔드(API), QA 테스트를 와이어프레임부터 배포까지 파이프라인으로 조율하는 팀.
   228	```
   229	
   230	**웹툰 제작**
   231	```
   232	웹툰 에피소드 제작 하네스를 구성해줘. 스토리 작성, 캐릭터 디자인 프롬프트,
   233	패널 레이아웃 기획, 대사 편집 에이전트가 필요하고 서로의 작업물을
   234	스타일 일관성 관점에서 리뷰해야 해.
   235	```
   236	
   237	**유튜브 콘텐츠 기획**
   238	```
   239	유튜브 콘텐츠 제작 하네스를 구성해줘. 트렌드 조사, 대본 작성, 제목/태그 SEO 최적화,
   240	썸네일 컨셉 기획을 감독자 에이전트가 조율하는 팀.
   241	```
   242	
   243	**코드 리뷰**
   244	```
   245	종합 코드 리뷰 하네스를 구성해줘. 아키텍처, 보안 취약점, 성능 병목, 코드 스타일을
   246	병렬로 감사하는 에이전트들이 결과를 하나의 리포트로 통합하는 팀.
   247	```
   248	
   249	**기술 문서 작성**
   250	```
   195	## 出力
   196	
   197	Harnessが生成するファイル：
   198	
   199	```
   200	your-project/
   201	├── .claude/
   202	│   ├── agents/          # エージェント定義ファイル
   203	│   │   ├── analyst.md
   204	│   │   ├── builder.md
   205	│   │   └── qa.md
   206	│   └── skills/          # スキルファイル
   207	│       ├── analyze/
   208	│       │   └── SKILL.md
   209	│       └── build/
   210	│           ├── SKILL.md
   211	│           └── references/
   212	```
   213	
   214	## ユースケース — そのまま使えるプロンプト
   215	
   216	Harnessインストール後、以下のプロンプトをClaude Codeにコピーしてお使いください：
   217	
   218	**ディープリサーチ**
   219	```
   220	Build a harness for deep research. I need an agent team that can investigate
   221	any topic from multiple angles — web search, academic sources, community
   222	sentiment — then cross-validate findings and produce a comprehensive report.
   223	```
   224	
   225	**ウェブサイト制作**
   226	```
   227	Build a harness for full-stack website development. The team should handle
   228	design, frontend (React/Next.js), backend (API), and QA testing in a
   229	coordinated pipeline from wireframe to deployment.
   230	```
   231	
   232	**ウェブトゥーン制作**
   233	```
   234	Build a harness for webtoon episode production. I need agents for story
   235	writing, character design prompts, panel layout planning, and dialogue
   236	editing. They should review each other's work for style consistency.
   237	```
   238	
   239	**YouTube コンテンツ企画**
   240	```
   241	Build a harness for YouTube content creation. The team should research
   242	trending topics, write scripts, optimize titles/tags for SEO, and plan
   243	thumbnail concepts — all coordinated by a supervisor agent.
   244	```
   245	
   246	**コードレビュー**
   247	```
   248	Build a harness for comprehensive code review. I want parallel agents
   249	checking architecture, security vulnerabilities, performance bottlenecks,
   250	and code style — then merging all findings into a single report.
   251	```
   252	
   253	**技術ドキュメント作成**
   254	```
   255	Build a harness that generates API documentation from this codebase.

hook: PostToolUse
hook: PostToolUse Completed
codex
critical 없음. JSON 문법은 `plugin.json`, `marketplace.json` 둘 다 OK. 이슈는 아래.

1. [high] 외부 리뷰 생성 템플릿의 스크립트 경로가 실행 불가
- 현황: [external-review-loop.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/external-review-loop.md:5)는 생성 시 `check-review-tools.sh`를 스킬 `scripts/`에 번들한다고 함. 그런데 Step 2는 [55](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/external-review-loop.md:55)에서 `bash scripts/check-review-tools.sh`, Step 8은 [109](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/external-review-loop.md:109)에서 `bash scripts/build-scorecard.sh`를 실행함.
- 이슈: 프로젝트 루트 기준이면 `scripts/...`는 없음. 더구나 Phase 4-6은 `build-scorecard.sh` 복사를 지시하지 않아 scorecard 단계도 깨짐.
- 권고: 생성 대상 기준 절대/프로젝트상대 경로로 통일. 예: `.claude/skills/external-review-loop/scripts/check-review-tools.sh`, `.claude/skills/external-review-loop/scripts/build-scorecard.sh`. Phase 4-6에도 두 스크립트 모두 복사 명시.

2. [high] README 3종이 듀얼 런타임을 주장하면서 FAQ는 “Claude Code only”라고 반박
- 현황: README는 듀얼 런타임을 핵심 기능으로 선언함 [README.md](/Users/junghojang/Developments/myProject/myHarness/README.md:52). 하지만 FAQ는 “official runtime is Claude Code only”라고 함 [README.md](/Users/junghojang/Developments/myProject/myHarness/README.md:298), KO [README_KO.md](/Users/junghojang/Developments/myProject/myHarness/README_KO.md:305), JA [README_JA.md](/Users/junghojang/Developments/myProject/myHarness/README_JA.md:312).
- 이슈: 사용자는 Codex 지원 여부를 반대로 읽게 됨.
- 권고: FAQ를 “Claude Code plugin + Codex skill/runtime adapter supported”로 갱신하거나, Codex를 실험/부분지원으로 낮춰 전 문서 일치.

3. [med] README 구조 예시가 리네임 전 `skills/harness`로 남음
- 현황: 실제 경로는 `skills/myharness`. README 구조 예시는 EN [README.md](/Users/junghojang/Developments/myProject/myHarness/README.md:128), KO [README_KO.md](/Users/junghojang/Developments/myProject/myHarness/README_KO.md:142), JA [README_JA.md](/Users/junghojang/Developments/myProject/myHarness/README_JA.md:142) 모두 `skills/harness/`.
- 이슈: 리네임 잔존. 설치/복사/탐색 시 잘못된 경로 유도.
- 권고: `harness/` 제품명과 파일 식별자를 분리. 구조 예시는 `my_harness/` repo, `skills/myharness/`로 수정.

4. [med] `revfactory` 화이트라벨 잔존
- 현황: Harness 100 링크가 EN [README.md](/Users/junghojang/Developments/myProject/myHarness/README.md:276), KO [README_KO.md](/Users/junghojang/Developments/myProject/myHarness/README_KO.md:283), JA [README_JA.md](/Users/junghojang/Developments/myProject/myHarness/README_JA.md:290), quickstart [docs/quickstart.md](/Users/junghojang/Developments/myProject/myHarness/docs/quickstart.md:114)에서 `revfactory/harness-100`. quickstart에는 `revfactory/claude-code-harness`도 있음 [docs/quickstart.md](/Users/junghojang/Developments/myProject/myHarness/docs/quickstart.md:115).
- 이슈: `harness-100` 명칭 보존은 가능해도 owner가 revfactory로 남아 cookyman 화이트라벨과 충돌.
- 권고: 의도된 외부 원저작 링크면 “legacy/original”로 명시. 아니면 `cookyman74/...`로 교체.

5. [med] 설치 명령 형식 drift: `/plugin` vs `claude plugin`
- 현황: README는 shell block 안에 `/plugin marketplace add`와 `/plugin install` 사용 [README.md](/Users/junghojang/Developments/myProject/myHarness/README.md:91). quickstart는 `claude plugin marketplace add` 사용 [docs/quickstart.md](/Users/junghojang/Developments/myProject/myHarness/docs/quickstart.md:19).
- 이슈: interactive slash 명령과 shell CLI 명령이 섞임. README block은 shell로 복사하면 실패 가능.
- 권고: “Claude Code 내부”와 “터미널” 명령을 분리. README quick path는 quickstart와 같은 `claude plugin ...`로 통일.

6. [med] 버전 문서 drift
- 현황: manifest/README badge는 1.0.0. 그런데 experimental dependency 문서는 `harness (v1.2.0)` [docs/experimental-dependency.md](/Users/junghojang/Developments/myProject/myHarness/docs/experimental-dependency.md:43), `v1.3.0` 릴리스 [73](/Users/junghojang/Developments/myProject/myHarness/docs/experimental-dependency.md:73), `v1.2.x` 패치 [106](/Users/junghojang/Developments/myProject/myHarness/docs/experimental-dependency.md:106)를 말함.
- 이슈: 현재 릴리스 정합성 깨짐.
- 권고: 현재 버전은 1.0.0으로 맞추고, 미래 시나리오는 “future vNext 예시”라고 명시.

7. [med] dead/forthcoming 링크가 사용자 문서에 노출됨
- 현황: quickstart가 없는 `docs/cost-controls.md`를 안내 [docs/quickstart.md](/Users/junghojang/Developments/myProject/myHarness/docs/quickstart.md:99). experimental dependency는 없는 `docs/show-hn-launch-kit.md`, `docs/compatibility-matrix.md`를 관련 문서로 노출 [docs/experimental-dependency.md](/Users/junghojang/Developments/myProject/myHarness/docs/experimental-dependency.md:152).
- 이슈: quickstart/enterprise 문서에서 바로 dead link.
- 권고: 파일 추가 전까지 링크 제거 또는 “planned, not available” 텍스트로 비링크 처리.

8. [med] 듀얼 런타임 산출물 예시가 Claude-only
- 현황: README Output 섹션은 `.claude/agents`, `.claude/skills`만 보여줌 [README.md](/Users/junghojang/Developments/myProject/myHarness/README.md:185). KO/JA도 동일 [README_KO.md](/Users/junghojang/Developments/myProject/myHarness/README_KO.md:199), [README_JA.md](/Users/junghojang/Developments/myProject/myHarness/README_JA.md:199).
- 이슈: 앞에서는 `AGENTS.md`, `.agents/skills`, `.codex/agents/*.toml` 동시 출력을 주장하므로 출력 계약이 불완전.
- 권고: 듀얼 모드 출력 예시에 `AGENTS.md`, `.agents/skills/`, `.codex/agents/*.toml` 추가.

9. [med] `build-scorecard.sh`가 출력 디렉터리 생성 없이 리다이렉션
- 현황: script는 `> "$OUT"`로 바로 씀 [build-scorecard.sh](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/scripts/build-scorecard.sh:53). 외부 루프는 깊은 경로 `_workspace/evals/.../scorecard.json`을 넘기라고 함 [external-review-loop.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/external-review-loop.md:109).
- 이슈: 상위 디렉터리가 없으면 실패.
- 권고: `mkdir -p "$(dirname "$OUT")"`를 jq 실행 전 추가.

10. [low] `myharness` 호출 문법 설명 충돌
- 현황: README/install은 Codex에서 `/myharness` 불가라고 명시 [README.md](/Users/junghojang/Developments/myProject/myHarness/README.md:119), [install.sh](/Users/junghojang/Developments/myProject/myHarness/install.sh:44). 그러나 skill description은 `(myharness · /myharness · $myharness)`를 동시에 적음 [SKILL.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md:3).
- 이슈: Codex 사용자가 `/myharness`를 시도할 수 있음.
- 권고: description을 런타임별로 구분: “Claude: `/myharness`; Codex: `$myharness` or `/skills`”.

11. [low] marketplace 설명이 dual runtime/Codex를 빠뜨림
- 현황: plugin manifest description은 Claude+Codex를 설명함 [plugin.json](/Users/junghojang/Developments/myProject/myHarness/.claude-plugin/plugin.json:2). marketplace entry description은 한국어 Claude/Codex 구분 없이 “하네스 구성”만 설명 [marketplace.json](/Users/junghojang/Developments/myProject/myHarness/.claude-plugin/marketplace.json:12).
- 이슈: marketplace 노출 설명과 실제 포지셔닝 차이.
- 권고: marketplace description도 `myharness`, dual runtime, external review gate를 짧게 반영.

12. [low] quickstart가 dual runtime 추가 이후에도 Claude-only 빠른 시작으로 남음
- 현황: quickstart 결과물은 `.claude/agents/`만 약속 [docs/quickstart.md](/Users/junghojang/Developments/myProject/myHarness/docs/quickstart.md:7), Codex 설치/호출 없음.
- 이슈: README는 Codex 설치 섹션을 추가했지만 quickstart는 새 사용자 경로에서 빠짐.
- 권고: Claude quickstart와 Codex quickstart를 분리하거나 Step 0에 “Claude-only quickstart”라고 명시.
hook: Stop
hook: Stop Completed
tokens used
187,884
critical 없음. JSON 문법은 `plugin.json`, `marketplace.json` 둘 다 OK. 이슈는 아래.

1. [high] 외부 리뷰 생성 템플릿의 스크립트 경로가 실행 불가
- 현황: [external-review-loop.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/external-review-loop.md:5)는 생성 시 `check-review-tools.sh`를 스킬 `scripts/`에 번들한다고 함. 그런데 Step 2는 [55](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/external-review-loop.md:55)에서 `bash scripts/check-review-tools.sh`, Step 8은 [109](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/external-review-loop.md:109)에서 `bash scripts/build-scorecard.sh`를 실행함.
- 이슈: 프로젝트 루트 기준이면 `scripts/...`는 없음. 더구나 Phase 4-6은 `build-scorecard.sh` 복사를 지시하지 않아 scorecard 단계도 깨짐.
- 권고: 생성 대상 기준 절대/프로젝트상대 경로로 통일. 예: `.claude/skills/external-review-loop/scripts/check-review-tools.sh`, `.claude/skills/external-review-loop/scripts/build-scorecard.sh`. Phase 4-6에도 두 스크립트 모두 복사 명시.

2. [high] README 3종이 듀얼 런타임을 주장하면서 FAQ는 “Claude Code only”라고 반박
- 현황: README는 듀얼 런타임을 핵심 기능으로 선언함 [README.md](/Users/junghojang/Developments/myProject/myHarness/README.md:52). 하지만 FAQ는 “official runtime is Claude Code only”라고 함 [README.md](/Users/junghojang/Developments/myProject/myHarness/README.md:298), KO [README_KO.md](/Users/junghojang/Developments/myProject/myHarness/README_KO.md:305), JA [README_JA.md](/Users/junghojang/Developments/myProject/myHarness/README_JA.md:312).
- 이슈: 사용자는 Codex 지원 여부를 반대로 읽게 됨.
- 권고: FAQ를 “Claude Code plugin + Codex skill/runtime adapter supported”로 갱신하거나, Codex를 실험/부분지원으로 낮춰 전 문서 일치.

3. [med] README 구조 예시가 리네임 전 `skills/harness`로 남음
- 현황: 실제 경로는 `skills/myharness`. README 구조 예시는 EN [README.md](/Users/junghojang/Developments/myProject/myHarness/README.md:128), KO [README_KO.md](/Users/junghojang/Developments/myProject/myHarness/README_KO.md:142), JA [README_JA.md](/Users/junghojang/Developments/myProject/myHarness/README_JA.md:142) 모두 `skills/harness/`.
- 이슈: 리네임 잔존. 설치/복사/탐색 시 잘못된 경로 유도.
- 권고: `harness/` 제품명과 파일 식별자를 분리. 구조 예시는 `my_harness/` repo, `skills/myharness/`로 수정.

4. [med] `revfactory` 화이트라벨 잔존
- 현황: Harness 100 링크가 EN [README.md](/Users/junghojang/Developments/myProject/myHarness/README.md:276), KO [README_KO.md](/Users/junghojang/Developments/myProject/myHarness/README_KO.md:283), JA [README_JA.md](/Users/junghojang/Developments/myProject/myHarness/README_JA.md:290), quickstart [docs/quickstart.md](/Users/junghojang/Developments/myProject/myHarness/docs/quickstart.md:114)에서 `revfactory/harness-100`. quickstart에는 `revfactory/claude-code-harness`도 있음 [docs/quickstart.md](/Users/junghojang/Developments/myProject/myHarness/docs/quickstart.md:115).
- 이슈: `harness-100` 명칭 보존은 가능해도 owner가 revfactory로 남아 cookyman 화이트라벨과 충돌.
- 권고: 의도된 외부 원저작 링크면 “legacy/original”로 명시. 아니면 `cookyman74/...`로 교체.

5. [med] 설치 명령 형식 drift: `/plugin` vs `claude plugin`
- 현황: README는 shell block 안에 `/plugin marketplace add`와 `/plugin install` 사용 [README.md](/Users/junghojang/Developments/myProject/myHarness/README.md:91). quickstart는 `claude plugin marketplace add` 사용 [docs/quickstart.md](/Users/junghojang/Developments/myProject/myHarness/docs/quickstart.md:19).
- 이슈: interactive slash 명령과 shell CLI 명령이 섞임. README block은 shell로 복사하면 실패 가능.
- 권고: “Claude Code 내부”와 “터미널” 명령을 분리. README quick path는 quickstart와 같은 `claude plugin ...`로 통일.

6. [med] 버전 문서 drift
- 현황: manifest/README badge는 1.0.0. 그런데 experimental dependency 문서는 `harness (v1.2.0)` [docs/experimental-dependency.md](/Users/junghojang/Developments/myProject/myHarness/docs/experimental-dependency.md:43), `v1.3.0` 릴리스 [73](/Users/junghojang/Developments/myProject/myHarness/docs/experimental-dependency.md:73), `v1.2.x` 패치 [106](/Users/junghojang/Developments/myProject/myHarness/docs/experimental-dependency.md:106)를 말함.
- 이슈: 현재 릴리스 정합성 깨짐.
- 권고: 현재 버전은 1.0.0으로 맞추고, 미래 시나리오는 “future vNext 예시”라고 명시.

7. [med] dead/forthcoming 링크가 사용자 문서에 노출됨
- 현황: quickstart가 없는 `docs/cost-controls.md`를 안내 [docs/quickstart.md](/Users/junghojang/Developments/myProject/myHarness/docs/quickstart.md:99). experimental dependency는 없는 `docs/show-hn-launch-kit.md`, `docs/compatibility-matrix.md`를 관련 문서로 노출 [docs/experimental-dependency.md](/Users/junghojang/Developments/myProject/myHarness/docs/experimental-dependency.md:152).
- 이슈: quickstart/enterprise 문서에서 바로 dead link.
- 권고: 파일 추가 전까지 링크 제거 또는 “planned, not available” 텍스트로 비링크 처리.

8. [med] 듀얼 런타임 산출물 예시가 Claude-only
- 현황: README Output 섹션은 `.claude/agents`, `.claude/skills`만 보여줌 [README.md](/Users/junghojang/Developments/myProject/myHarness/README.md:185). KO/JA도 동일 [README_KO.md](/Users/junghojang/Developments/myProject/myHarness/README_KO.md:199), [README_JA.md](/Users/junghojang/Developments/myProject/myHarness/README_JA.md:199).
- 이슈: 앞에서는 `AGENTS.md`, `.agents/skills`, `.codex/agents/*.toml` 동시 출력을 주장하므로 출력 계약이 불완전.
- 권고: 듀얼 모드 출력 예시에 `AGENTS.md`, `.agents/skills/`, `.codex/agents/*.toml` 추가.

9. [med] `build-scorecard.sh`가 출력 디렉터리 생성 없이 리다이렉션
- 현황: script는 `> "$OUT"`로 바로 씀 [build-scorecard.sh](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/scripts/build-scorecard.sh:53). 외부 루프는 깊은 경로 `_workspace/evals/.../scorecard.json`을 넘기라고 함 [external-review-loop.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/references/external-review-loop.md:109).
- 이슈: 상위 디렉터리가 없으면 실패.
- 권고: `mkdir -p "$(dirname "$OUT")"`를 jq 실행 전 추가.

10. [low] `myharness` 호출 문법 설명 충돌
- 현황: README/install은 Codex에서 `/myharness` 불가라고 명시 [README.md](/Users/junghojang/Developments/myProject/myHarness/README.md:119), [install.sh](/Users/junghojang/Developments/myProject/myHarness/install.sh:44). 그러나 skill description은 `(myharness · /myharness · $myharness)`를 동시에 적음 [SKILL.md](/Users/junghojang/Developments/myProject/myHarness/skills/myharness/SKILL.md:3).
- 이슈: Codex 사용자가 `/myharness`를 시도할 수 있음.
- 권고: description을 런타임별로 구분: “Claude: `/myharness`; Codex: `$myharness` or `/skills`”.

11. [low] marketplace 설명이 dual runtime/Codex를 빠뜨림
- 현황: plugin manifest description은 Claude+Codex를 설명함 [plugin.json](/Users/junghojang/Developments/myProject/myHarness/.claude-plugin/plugin.json:2). marketplace entry description은 한국어 Claude/Codex 구분 없이 “하네스 구성”만 설명 [marketplace.json](/Users/junghojang/Developments/myProject/myHarness/.claude-plugin/marketplace.json:12).
- 이슈: marketplace 노출 설명과 실제 포지셔닝 차이.
- 권고: marketplace description도 `myharness`, dual runtime, external review gate를 짧게 반영.

12. [low] quickstart가 dual runtime 추가 이후에도 Claude-only 빠른 시작으로 남음
- 현황: quickstart 결과물은 `.claude/agents/`만 약속 [docs/quickstart.md](/Users/junghojang/Developments/myProject/myHarness/docs/quickstart.md:7), Codex 설치/호출 없음.
- 이슈: README는 Codex 설치 섹션을 추가했지만 quickstart는 새 사용자 경로에서 빠짐.
- 권고: Claude quickstart와 Codex quickstart를 분리하거나 Step 0에 “Claude-only quickstart”라고 명시.
