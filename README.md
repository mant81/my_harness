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
  <a href="#category--where-harness-sits"><img src="https://img.shields.io/badge/Layer-L3%20Meta--Factory-orange" alt="Layer"></a>
  <a href="#category--where-harness-sits"><img src="https://img.shields.io/badge/Sub--layer-Team--Architecture%20Factory-teal" alt="Sub-layer"></a>
  <a href="#"><img src="https://img.shields.io/badge/README-EN%20%7C%20KO%20%7C%20JA-lightgrey" alt="i18n"></a>
</p>

# Harness — The Team-Architecture Factory for Claude Code

**English** | [한국어](README_KO.md) | [日本語](README_JA.md)

> **Harness is a team-architecture factory for Claude Code.** Say **"build a harness for this project"** (English) or **"하네스 구성해줘"** (한국어) or **"ハーネスを構成して"** (日本語), and the plugin turns your domain description into an agent team and the skills they use — picked from six pre-defined team-architecture patterns.

## Overview

Harness leverages Claude Code's agent team system to decompose complex tasks into coordinated teams of specialized agents. Say "build a harness for this project" and it automatically generates agent definitions (`.claude/agents/`) and skills (`.claude/skills/`) tailored to your domain.

## Category — Where Harness Sits

Harness lives at the **L3 Meta-Factory** layer of the Claude Code ecosystem — the layer that generates other harnesses rather than being one. Inside L3, we pick a specific sub-layer: **Team-Architecture Factory**.

| Layer | What it does | Neighbors we coexist with |
|-------|--------------|---------------------------|
| **L3 — Meta-Factory / Team-Architecture Factory** (us) | Domain sentence → agent team + skills, via 6 pre-defined team patterns | — |
| L3 — Meta-Factory / Runtime-Configuration Factory | Deterministic, repeatable runtime configurations | [coleam00/Archon](https://github.com/coleam00/Archon) |
| L3 — Meta-Factory / Codex Runtime Port | Same concept, Codex runtime | [SaehwanPark/meta-harness](https://github.com/SaehwanPark/meta-harness) |
| L2 — Cross-Harness Workflow | Standardize skills/rules/hooks across multiple harnesses | [affaan-m/ECC](https://github.com/affaan-m/everything-claude-code) |

> Archon generates deterministic runtime configurations. Harness generates team architectures (pipeline, fan-out/fan-in, expert pool, producer-reviewer, supervisor, hierarchical delegation) plus the skills agents use. Different sub-layers of the same L3. Pick Archon for runtime determinism, Harness for team architecture, or combine them.

## Key Features

- **Agent Team Design** — 6 architectural patterns: Pipeline, Fan-out/Fan-in, Expert Pool, Producer-Reviewer, Supervisor, and Hierarchical Delegation
- **Skill Generation** — Auto-generates skills with Progressive Disclosure for efficient context management
- **Orchestration** — Inter-agent data passing, error handling, and team coordination protocols
- **Validation** — Trigger verification, dry-run testing, and with-skill vs without-skill comparison tests
- **Two-Layer Quality Gate** — Internal Producer-Reviewer QA **plus** an external independent review loop (`external-review-loop`): independent reviewer CLIs review each stage's deliverable, the orchestrator adjudicates every issue against real code (confirm/partial/defer/reject), and only confirmed issues are fixed via TDD. Reviewers are chosen for **engine diversity** — the runner's own engine is excluded so an AI never reviews its own blind spots (Claude Code → codex + agy; Codex → claude + agy). It is a **convergent loop** — loop-until-dry with a round cap, a verdicts ledger (dedup vs seen) so rejected issues don't resurface, and re-review of its own fixes. Tool availability is checked first (`check-review-tools.sh`, emitting the runner-excluded `REVIEWERS:` set) so skill generation is skipped when no external reviewer is available.
- **Loop Self-Evaluation** — each loop emits a `loop_scorecard.json` (alignment_score, verdict counts, normalized rounds, cost, termination label) for a staged self-improvement path (measure → manual report → propose → auto), with anti-Goodhart guards (propose-only + approval, rolling window, min-samples; recall measured only against ground truth). See `references/loop-self-eval.md`.
- **Doctrine Injection** — Generated code/modification agents get TDD (`tdd-doctrine.md`) and development-rules (`dev-rules.md`) doctrine injected by real path, with risk-tiered gate strength (light / standard / critical).
- **Dual Runtime (Claude Code + Codex)** — One source of truth (`skills/myharness/`), thin per-runtime adapters. The factory emits both `CLAUDE.md` and `AGENTS.md` pointers and adapts orchestration (Claude agent teams via the `Agent` tool ↔ Codex native subagents / `codex exec`), with a Phase-7 runtime-sync step to prevent drift. See `references/runtime-adapters.md`.
- **Built-Harness Update (Claude `/myharness update` · Codex `$myharness update`)** — After a plugin update, re-propagates factory doctrine/scripts to an already-built harness while **protecting your local edits from being overwritten**. A `.harness-manifest.json` baseline (recorded at generation) lets `harness-update.sh` classify each file by hash — SAME / UPDATABLE (auto) / USER-MODIFIED (held back; overwritten with canonical only on explicit approval, no partial merge) / UNKNOWN (conservative, manifest missing) / NEW. Add your own rules in a `*.local.*` file to stay update-safe. See `references/harness-update.md`.
- **Cost & Concurrency Control** — model routing (high-reasoning → `opus`, simple tasks → light models), concurrency caps with backpressure (default 3 / max 5), external-review budget (skip-when-no-delta, `.fast-pass`), and smoke/full test modes keep large fan-outs affordable. Portable tooling (`timeout`/`gtimeout` detection, process cleanup).


## Philosophy — Skill ↔ Agent

A generated harness separates **who** from **how**, and treats itself as an evolving system:

- **Separation of concerns** — an *agent* is the "who" (expert persona + working principles), a *skill* is the "how" (procedure + bundled tools). Both are files (`.claude/agents/*.md`, `skills/*/SKILL.md`), never inline — reusable across sessions. One agent = one focused role; one agent uses 1–N skills (sharing allowed).
- **Agent teams by default** — 2+ collaborators self-coordinate via messages, a shared task list, and files under `_workspace/`. Discovery-sharing, conflict debate, and gap-filling raise quality.
- **Two-layer quality gate** — internal Producer-Reviewer QA **plus** an external independent review loop (engine-diverse reviewers, runner engine excluded). The orchestrator adjudicates every issue against real code — consensus is not proof. Gate strength is risk-tiered (light / standard / critical).
- **Doctrine injection** — code/modification agents receive TDD (`tdd-doctrine.md`) and development-rules (`dev-rules.md`) doctrine by real path (subagents don't inherit global rules).
- **Why over command, DRY pointers** — principles explain *why* (so agents judge edge cases) and reference a single source instead of duplicating it.
- **Evolving system** — feedback routes to the right layer (output → skill, role → agent, order → orchestrator, trigger → description) and is logged for regression safety.

> In short: the **orchestrator** decides who/when/order, **agents** are the *who*, **skills** are the *how*, and a two-layer gate keeps quality honest.

## Workflow

```
Phase 1: Domain Analysis
    ↓
Phase 2: Team Architecture Design (Agent Teams vs Subagents)
    ↓
Phase 3: Agent Definition Generation (.claude/agents/)
    ↓
Phase 4: Skill Generation (.claude/skills/)
    ↓
Phase 5: Integration & Orchestration (+ two-layer quality gate, dual-runtime output)
    ↓
Phase 6: Validation & Testing
    ↓
Phase 7: Harness Evolution (feedback → continuous update; dual-runtime sync)
```

## Installation

### Via Marketplace

#### Add the marketplace
```shell
/plugin marketplace add cookyman74/my_harness
```

#### Install the plugin
```shell
/plugin install myharness@myharness-marketplace
```

### Direct Installation as Global Skill

```shell
# Copy the skills directory to ~/.claude/skills/myharness/
cp -r skills/myharness ~/.claude/skills/myharness
```

### Codex CLI (Dual Runtime)

Codex discovers skills from `~/.codex/skills/` (user-global) — and skills load even in untrusted projects. The repo's `install.sh` symlinks the live factory and verifies review tools:

```shell
bash install.sh
# → ~/.codex/skills/myharness → skills/myharness (symlink, always latest)
# → repo .agents/skills/myharness (for trusted projects)
# → AGENTS.md (auto-loaded by Codex)
```

Invoke in Codex with **`$myharness`**, the **`/skills`** menu, or a description-matching request (e.g. "하네스 구성해줘"). Note: `/myharness` is **not** valid Codex syntax (custom slash commands are unsupported); restart the Codex session after install so the skill list reloads.

## Plugin Structure

```
my_harness/
├── .claude-plugin/
│   └── plugin.json                 # Plugin manifest (name: myharness)
├── skills/
│   └── myharness/
│       ├── SKILL.md                # Main skill definition (7-Phase workflow)
│       ├── references/
│       │   ├── factory-map.md             # Navigation: minimal path · impl status · loop map (read first)
│       │   ├── agent-design-patterns.md   # 6 architectural patterns
│       │   ├── orchestrator-template.md   # Team/subagent/Codex orchestrator templates
│       │   ├── team-examples.md           # Real-world team configurations
│       │   ├── skill-writing-guide.md     # Skill authoring guide
│       │   ├── skill-testing-guide.md     # Testing & evaluation methodology
│       │   ├── qa-agent-guide.md          # QA agent integration guide
│       │   ├── external-review-loop.md    # external review gate, engine-diverse (convergent loop + template)
│       │   ├── loop-self-eval.md          # loop scorecard (measure-only; stages 3-4 experimental)
│       │   ├── self-improvement-loop.md   # benchmark-anchored artifact improvement (design only)
│       │   ├── tdd-doctrine.md            # TDD doctrine (injected into code agents)
│       │   ├── dev-rules.md               # Development rules (injected into code agents)
│       │   ├── runtime-adapters.md        # Claude Code / Codex dual-runtime design
│       │   └── harness-update.md          # built-harness update (preserve local edits)
│       └── scripts/
│           ├── check-review-tools.sh      # reviewer availability check (runner-excluded)
│           ├── build-scorecard.sh         # compute loop_scorecard from verdicts
│           └── harness-update.sh          # update built harness (manifest/plan/apply)
├── AGENTS.md                       # Codex runtime entry point
├── install.sh                      # Dual-runtime installer (Claude + Codex)
└── README.md
```

## Usage

Trigger in Claude Code with prompts like:

```
Build a harness for this project
Design an agent team for this domain
Set up a harness
```

### Execution Modes

| Mode | Description | Recommended For |
|------|-------------|-----------------|
| **Agent Teams** (default) | Agent tool (spawn teammates) + SendMessage + TaskCreate | 2+ agents requiring collaboration |
| **Subagents** | Direct Agent tool invocation | One-off tasks, no inter-agent communication needed |

<p align="center">
  <img src="harness_team.png" alt="Harness Agent Team" width="500">
</p>

### Architecture Patterns

| Pattern | Description |
|---------|-------------|
| Pipeline | Sequential dependent tasks |
| Fan-out/Fan-in | Parallel independent tasks |
| Expert Pool | Context-dependent selective invocation |
| Producer-Reviewer | Generation followed by quality review |
| Supervisor | Central agent with dynamic task distribution |
| Hierarchical Delegation | Top-down recursive delegation |

## Output

Files generated by Harness:

```
your-project/
├── .claude/
│   ├── agents/          # Agent definition files
│   │   ├── analyst.md
│   │   ├── builder.md
│   │   └── qa.md
│   └── skills/          # Skill files
│       ├── analyze/
│       │   └── SKILL.md
│       └── build/
│           ├── SKILL.md
│           └── references/
├── CLAUDE.md            # Claude Code pointer
└── AGENTS.md            # Codex pointer (dual-runtime)
```

> **Dual-runtime output:** when targeting Codex too, the factory also emits `AGENTS.md`, `.agents/skills/<name>/`, and `.codex/agents/<name>.toml` alongside the `.claude/` files (same source of truth). See `references/runtime-adapters.md`.

## Use Cases — Try These Prompts

Copy any prompt below into Claude Code after installing Harness:

**Deep Research**
```
Build a harness for deep research. I need an agent team that can investigate
any topic from multiple angles — web search, academic sources, community
sentiment — then cross-validate findings and produce a comprehensive report.
```

**Website Development**
```
Build a harness for full-stack website development. The team should handle
design, frontend (React/Next.js), backend (API), and QA testing in a
coordinated pipeline from wireframe to deployment.
```

**Webtoon / Comic Production**
```
Build a harness for webtoon episode production. I need agents for story
writing, character design prompts, panel layout planning, and dialogue
editing. They should review each other's work for style consistency.
```

**YouTube Content Planning**
```
Build a harness for YouTube content creation. The team should research
trending topics, write scripts, optimize titles/tags for SEO, and plan
thumbnail concepts — all coordinated by a supervisor agent.
```

**Code Review & Refactoring**
```
Build a harness for comprehensive code review. I want parallel agents
checking architecture, security vulnerabilities, performance bottlenecks,
and code style — then merging all findings into a single report.
```

**Technical Documentation**
```
Build a harness that generates API documentation from this codebase.
Agents should analyze endpoints, write descriptions, generate usage
examples, and review for completeness.
```

**Data Pipeline Design**
```
Build a harness for designing data pipelines. I need agents for schema
design, ETL logic, data validation rules, and monitoring setup that
delegate sub-tasks hierarchically.
```

**Marketing Campaign**
```
Build a harness for marketing campaign creation. The team should research
the target market, write ad copy, design visual concepts, and set up
A/B test plans with iterative quality review.
```

## Coexistence — Harness and Neighbors

Harness is not alone in the Claude Code / agent-framework ecosystem. The following repos live in adjacent layers; each is described in a parallel "X is …, Harness is …" form so you can pick the one that fits your need or combine several.

| Repo | Their position | Relationship to Harness |
|------|----------------|-------------------------|
| [coleam00/Archon](https://github.com/coleam00/Archon) | "harness builder" — deterministic, repeatable runtime configurations | **Same L3, neighbor sub-layer.** Archon is a Runtime-Configuration Factory, Harness is a Team-Architecture Factory. Pick Archon for runtime determinism, Harness for team architecture, or combine them. |
| [SaehwanPark/meta-harness](https://github.com/SaehwanPark/meta-harness) | Codex port of the same concept | **Same L3, different runtime.** Use Harness on Claude Code, meta-harness on Codex. |
| [affaan-m/ECC](https://github.com/affaan-m/everything-claude-code) | "Agent harness performance & workflow layer" (sits on top of existing harnesses) | **Different layer.** ECC is a standardization layer across harnesses; Harness is a factory that generates harnesses. Serial combination possible. |
| [wshobson/agents](https://github.com/wshobson/agents) | Subagent / skill catalog (182 agents, 149 skills) | **Factory ↔ parts supply.** wshobson is a catalog to shop from; Harness designs the team. Absorb wshobson entries as parts inside a Harness-generated team. |
| [LangGraph](https://langchain-ai.github.io/langgraph/) | State-graph orchestration, LLM-agnostic | **Different track.** LangGraph is for long-running, state-recoverable orchestration; Harness is for fast Claude-Code-native team design. |

## Built with Harness

> The repos below belong to the **original upstream author** (`revfactory`) — kept as references to the original project, not part of this white-labeled fork.

### Harness 100

**[revfactory/harness-100](https://github.com/revfactory/harness-100)** — 100 production-ready agent team harnesses across 10 domains, available in both English and Korean (200 packages total). Each harness ships with 4-5 specialist agents, an orchestrator skill, and domain-specific skills — all generated by this plugin. 1,808 markdown files covering content creation, software development, data/AI, business strategy, education, legal, health, and more.

## Requirements

- [Agent Teams enabled](https://code.claude.com/docs/en/agent-teams): `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

## FAQ

<details>
<summary><b>Q1. Why "harness factory" and not "harness builder"? Isn't this competing with Archon?</b></summary>

**A.** Archon generates deterministic runtime configurations — it's a **Runtime-Configuration Factory**. Harness generates agent team architectures (team structure, message protocols, review gates) — it's a **Team-Architecture Factory**. They are **neighbor sub-layers of the same L3 Meta-Factory** and serve different needs. Pick Archon for runtime determinism, Harness for team-architecture patterns, or combine them (design architecture with Harness → deploy runtime with Archon).

**Evidence:**
- Archon self-definition: [clawfit docs/reference-levels.md](https://github.com/hongsw/clawfit/blob/main/docs/reference-levels.md)
- Sub-layer declaration: see the **Category — Where Harness Sits** section above
- Archon repo: [github.com/coleam00/Archon](https://github.com/coleam00/Archon)
</details>

<details>
<summary><b>Q2. Which runtimes are supported — Claude Code, Codex?</b></summary>

**A.** Both. myharness is **dual-runtime**: one source of truth (`skills/myharness/`) with thin per-runtime adapters. Claude Code is the primary/most-automated runtime (agent teams via the `Agent` tool); Codex is supported via `AGENTS.md` + `.agents/skills/` + native subagents / `codex exec` (invoke with `$myharness` or `/skills`). See `skills/myharness/references/runtime-adapters.md`. Gemini is used as an external review reviewer (via agy), not as a host runtime.
</details>

## License

Apache 2.0
