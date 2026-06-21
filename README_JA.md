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
  <a href="#カテゴリー--harness-はどこに位置するか"><img src="https://img.shields.io/badge/Layer-L3%20Meta--Factory-orange" alt="Layer"></a>
  <a href="#カテゴリー--harness-はどこに位置するか"><img src="https://img.shields.io/badge/Sub--layer-Team--Architecture%20Factory-teal" alt="Sub-layer"></a>
  <a href="#"><img src="https://img.shields.io/badge/README-EN%20%7C%20KO%20%7C%20JA-lightgrey" alt="i18n"></a>
</p>

# Harness — Claude Code のためのチームアーキテクチャファクトリー

[English](README.md) | [한국어](README_KO.md) | **日本語**

> **Harness は Claude Code 向けのチームアーキテクチャファクトリーです。** **「ハーネスを構成して」** (日本語) ·  **"build a harness for this project"** (English) · **"하네스 구성해줘"** (한국어) と伝えるだけで、プラグインがドメイン記述をエージェントチームとそのチームが使うスキルへと変換します — あらかじめ定義された 6 種類のチームアーキテクチャパターンから 1 つを選んで。

## 概要

Harnessは、Claude Codeのエージェントチームシステムを活用し、複雑なタスクを専門エージェントチームに分解・統制するアーキテクチャツールです。「ハーネスを構成して」と伝えるだけで、ドメインに適したエージェント定義（`.claude/agents/`）とスキル（`.claude/skills/`）を自動生成します。

## カテゴリー — Harness はどこに位置するか

Harness は Claude Code エコシステムの **L3 Meta-Factory** 層 — 他のハーネスそのものではなく「他のハーネスを生成する層」 — に位置します。その層の中で、**Team-Architecture Factory** というサブ層を選択します。

| 層 | 担当領域 | 共存する隣人 |
|----|----------|--------------|
| **L3 — Meta-Factory / Team-Architecture Factory** (当プロジェクト) | ドメイン記述 → エージェントチーム + スキル、事前定義された 6 種のチームパターン経由 | — |
| L3 — Meta-Factory / Runtime-Configuration Factory | 決定的で再現可能なランタイム構成 | [coleam00/Archon](https://github.com/coleam00/Archon) |
| L3 — Meta-Factory / Codex Runtime Port | 同一コンセプトの Codex ランタイム版 | [SaehwanPark/meta-harness](https://github.com/SaehwanPark/meta-harness) |
| L2 — Cross-Harness Workflow | 複数ハーネスにまたがるスキル・ルール・フックの標準化 | [affaan-m/ECC](https://github.com/affaan-m/everything-claude-code) |

> Archon は決定的なランタイム構成を生成します。Harness はチームアーキテクチャ（パイプライン・ファンアウト/ファンイン・エキスパートプール・プロデューサー-レビューア・スーパーバイザー・階層的委任）と、エージェントが使うスキルを生成します。同じ L3 の異なるサブ層です。ランタイムの決定性が欲しければ Archon、チームアーキテクチャが欲しければ Harness、あるいは両者を組み合わせて利用できます。

## 主な機能

- **エージェントチーム設計** — パイプライン、ファンアウト/ファンイン、エキスパートプール、プロデューサー-レビューア、スーパーバイザー、階層的委任の6種アーキテクチャパターンに対応
- **スキル生成** — Progressive Disclosureパターンによるコンテキストの効率的管理を備えたスキルを自動生成
- **オーケストレーション** — エージェント間のデータ受け渡し、エラーハンドリング、チーム連携プロトコルを内蔵
- **検証体制** — トリガー検証、ドライランテスト、With-skill vs Without-skill 比較テスト
- **2層品質ゲート** — 内部のプロデューサー-レビューアQA **に加え** 外部独立レビューループ（`external-review-loop`）：独立レビューアCLIが各段階の成果物をレビューし、オーケストレーターが実コードと照合して全件判定（確認/部分/繰越/却下）、確認分のみTDDで修正。レビューアは**エンジン多様性**で選ぶ — ランナー自身のエンジンを除外し、AIが自分の盲点を自分でレビューしないようにする（Claude Code → codex + agy；Codex → claude + agy）。**収束ループ** — loop-until-dry＋ラウンド上限＋判定台帳（dedup vs seen、却下の再浮上防止）＋修正分の再レビュー。先にツール連携を点検（`check-review-tools.sh` がランナー除外の `REVIEWERS:` を出力）し、外部レビューアが無ければスキルを生成しない。
- **ループ自己評価** — 各ループが `loop_scorecard.json`（alignment_score・判定カウント・正規化ラウンド・コスト・終了ラベル）を発行 → 段階的な自己改善（測定→手動レポート→提案→自動）、自己強化防止（提案のみ＋承認・ローリングウィンドウ・最小サンプル；recall は Ground Truth のみ）。詳細：`references/loop-self-eval.md`。
- **ドクトリン注入** — 生成されたコード/修正エージェントにTDD（`tdd-doctrine.md`）・開発ルール（`dev-rules.md`）を実パスで注入。リスク等級（軽量/標準/重大）でゲート強度を調整。
- **デュアルランタイム（Claude Code + Codex）** — 単一の出典（`skills/myharness/`）＋ランタイム別の薄いアダプター。ファクトリーが `CLAUDE.md`・`AGENTS.md` ポインターを両方出力し、オーケストレーションを分岐（Claude エージェントチーム — `Agent` ツール ↔ Codex ネイティブ subagents / `codex exec`）。Phase 7 のランタイム同期で drift を防止。詳細：`references/runtime-adapters.md`。
- **ビルド済みハーネスの更新（Claude `/myharness update` · Codex `$myharness update`）** — プラグイン更新後、ファクトリーのドクトリン/スクリプトを既にビルド済みのハーネスへ再伝播しつつ、**ローカルの編集を上書きから保護**する。生成時に記録した `.harness-manifest.json` のベースラインで `harness-update.sh` がファイルごとにハッシュ分類 — SAME / UPDATABLE（自動）/ USER-MODIFIED（既定は保留；明示的な承認時に正本へ丸ごと置換、部分マージなし）/ UNKNOWN（保守 — manifest なし）/ NEW。独自ルールは `*.local.*` ファイルに分離すれば update-safe。詳細：`references/harness-update.md`。
- **コスト・並行性の制御** — モデルルーティング（高推論 → `opus`、単純タスク → 軽量モデル）、並行数上限＋バックプレッシャー（既定 3・最大 5）、外部レビュー予算（skip-when-no-delta・`.fast-pass`）、smoke/full テストモードで大規模ファンアウトのコストを抑制。移植性ツール（`timeout`/`gtimeout` 検出・プロセス整理）。

## 哲学 — スキル ↔ エージェント

生成されたハーネスは **誰が** と **どうやって** を分離し、自身を進化するシステムとして扱う：

- **関心の分離** — *エージェント*は「誰が」（専門家ペルソナ＋作業原則）、*スキル*は「どうやって」（手順＋ツール）。いずれもファイル（`.claude/agents/*.md`、`skills/*/SKILL.md`）でインライン禁止 → セッション横断で再利用。1エージェント＝1つの集中した役割、1エージェント↔1〜Nスキル（共有可）。
- **エージェントチームが既定** — 2名以上はメッセージ・共有タスクリスト・`_workspace/` ファイルで自己調整。発見の共有・対立の議論・抜け漏れ補完が品質を高める。
- **2層品質ゲート** — 内部のプロデューサー-レビューアQA **＋** 外部独立レビューループ（エンジン多様性のレビュアー — ランナーエンジンを除外）。オーケストレーターが全課題を実コードと照合して判定 — 合意は証拠ではない。リスク等級（軽量/標準/重大）で強度を調整。
- **ドクトリン注入** — コード/修正エージェントにTDD（`tdd-doctrine.md`）・開発ルール（`dev-rules.md`）を実パスで注入（サブエージェントはグローバル規則を継承しない）。
- **強制ではなくWhy、DRYなポインター** — 原則は*理由*を説明し（エッジケースの判断）、単一の出典を参照（複製禁止）。
- **進化するシステム** — フィードバックを適切な層へ（成果物→スキル、役割→エージェント、順序→オーケストレーター、トリガー→description）ルーティングし、退行防止のため履歴を記録。

> 要約：**オーケストレーター**が誰が/いつ/順序を決め、**エージェント**が「誰が」、**スキル**が「どうやって」、2層ゲートが品質を誠実に保つ。

## ハーネス進化メカニズム (Harness Evolution Mechanism)

ハーネス進化メカニズムは「何が効いて、何が効かなかったか」のデルタをファクトリーへフィードバックし、次世代が測定可能なかたちで改善されるようにします。生成されたハーネスが実プロジェクトで使用されると、**進化ワークフロー（Phase 7）** — Claude `/myharness`・Codex `$myharness` で呼び出し — が初期アーキテクチャとリリース時アーキテクチャのデルタを捕捉し、ファクトリーへ戻します。次回、同様のドメインでの生成は、このフィードバックを反映して「リリース状態により近いドラフト」から始まります。

```
初期ハーネス ──▶ 実プロジェクト利用 ──▶ リリース版ハーネス
                                              │
                                              ▼ (Phase 7 進化でデルタ取得)
                                        ┌───────────────┐
                                        │  ファクトリー │◀── より良い次世代ドラフト
                                        └───────────────┘
```

これを **ハーネス進化メカニズム (Harness Evolution Mechanism; KR: 하네스 진화 메커니즘)** と呼びます。

## ワークフロー

```
Phase 1: ドメイン分析
    ↓
Phase 2: チームアーキテクチャ設計（Agent Teams vs サブエージェント）
    ↓
Phase 3: エージェント定義の生成（.claude/agents/）
    ↓
Phase 4: スキル生成（.claude/skills/）
    ↓
Phase 5: 統合とオーケストレーション（+ 2層品質ゲート、デュアルランタイム出力）
    ↓
Phase 6: 検証とテスト
    ↓
Phase 7: ハーネス進化（フィードバック → 継続更新；デュアルランタイム同期）
```

## インストール

### マーケットプレイス経由

#### マーケットプレイスの追加
```shell
/plugin marketplace add cookyman74/my_harness
```

#### プラグインのインストール
```shell
/plugin install myharness@myharness-marketplace
```

### グローバルスキルとして直接インストール

```shell
# skillsディレクトリを ~/.claude/skills/myharness/ にコピー
cp -r skills/myharness ~/.claude/skills/myharness
```

### Codex CLI（デュアルランタイム）

Codex は `~/.codex/skills/`（ユーザーグローバル）からスキルを検出し、untrusted プロジェクトでもスキルはロードされます。リポジトリの `install.sh` がライブのファクトリーをシンボリックリンクし、レビューツールを点検します：

```shell
bash install.sh
# → ~/.codex/skills/myharness → skills/myharness（シンボリックリンク、常に最新）
# → repo .agents/skills/myharness（trusted プロジェクト用）
# → AGENTS.md（Codex が自動ロード）
```

Codex では **`$myharness`**、**`/skills`** メニュー、または description に合致する依頼（例：「ハーネスを構成して」）で呼び出します。`/myharness` は Codex の構文では **ありません**（カスタムスラッシュ未対応）。インストール後はスキル一覧の再読み込みのため Codex セッションを再起動してください。

## プラグイン構成

```
my_harness/
├── .claude-plugin/
│   └── plugin.json                 # プラグインマニフェスト (name: myharness)
├── skills/
│   └── myharness/
│       ├── SKILL.md                # メインスキル定義（7フェーズワークフロー）
│       ├── references/
│       │   ├── factory-map.md             # 航法: 最小経路·実装状態·ループ地図（最初に読む）
│       │   ├── agent-design-patterns.md   # 6種のアーキテクチャパターン
│       │   ├── orchestrator-template.md   # チーム/サブ/Codex オーケストレーターテンプレート
│       │   ├── team-examples.md           # 実践チーム構成例
│       │   ├── skill-writing-guide.md     # スキル作成ガイド
│       │   ├── skill-testing-guide.md     # テスト・評価方法論
│       │   ├── qa-agent-guide.md          # QAエージェント統合ガイド
│       │   ├── external-review-loop.md    # 外部レビューゲート、エンジン多様（収束ループ＋テンプレート）
│       │   ├── loop-self-eval.md          # ループ scorecard（測定のみ; 3·4段階は実験的）
│       │   ├── self-improvement-loop.md   # ベンチマーク基準の成果物改善（設計のみ）
│       │   ├── tdd-doctrine.md            # TDDドクトリン（コードエージェント注入用）
│       │   ├── dev-rules.md               # 開発ルール（コードエージェント注入用）
│       │   ├── runtime-adapters.md        # Claude Code / Codex デュアルランタイム設計
│       │   └── harness-update.md          # ビルド済みハーネス更新（ローカル編集を保護）
│       └── scripts/
│           ├── check-review-tools.sh      # レビュアー連携チェック（ランナー除外）
│           ├── build-scorecard.sh         # verdicts から loop_scorecard 計算
│           └── harness-update.sh          # ビルド済みハーネス更新（manifest/plan/apply）
├── AGENTS.md                       # Codex ランタイムのエントリポイント
├── install.sh                      # デュアルランタイムインストーラー（Claude + Codex）
└── README.md
```

## 使い方

Claude Codeで以下のように呼び出します：

```
Build a harness for this project
Design an agent team for this domain
Set up a harness
```

### 実行モード

| モード | 説明 | 推奨ケース |
|--------|------|------------|
| **Agent Teams**（デフォルト） | Agent ツール（teammate spawn） + SendMessage + TaskCreate | エージェント2名以上、コラボレーションが必要な場合 |
| **サブエージェント** | Agentツール直接呼び出し | 単発タスク、エージェント間通信不要の場合 |

<p align="center">
  <img src="harness_team.png" alt="Harness Agent Team" width="500">
</p>

### アーキテクチャパターン

| パターン | 説明 |
|----------|------|
| パイプライン | 順次依存タスク |
| ファンアウト/ファンイン | 並列独立タスク |
| エキスパートプール | 状況に応じた選択的呼び出し |
| プロデューサー-レビューア | 生成後の品質レビュー |
| スーパーバイザー | 中央エージェントによる動的タスク分配 |
| 階層的委任 | 上位→下位への再帰的委任 |

## 出力

Harnessが生成するファイル：

```
your-project/
├── .claude/
│   ├── agents/          # エージェント定義ファイル
│   │   ├── analyst.md
│   │   ├── builder.md
│   │   └── qa.md
│   └── skills/          # スキルファイル
│       ├── analyze/
│       │   └── SKILL.md
│       └── build/
│           ├── SKILL.md
│           └── references/
```

## ユースケース — そのまま使えるプロンプト

Harnessインストール後、以下のプロンプトをClaude Codeにコピーしてお使いください：

**ディープリサーチ**
```
Build a harness for deep research. I need an agent team that can investigate
any topic from multiple angles — web search, academic sources, community
sentiment — then cross-validate findings and produce a comprehensive report.
```

**ウェブサイト制作**
```
Build a harness for full-stack website development. The team should handle
design, frontend (React/Next.js), backend (API), and QA testing in a
coordinated pipeline from wireframe to deployment.
```

**ウェブトゥーン制作**
```
Build a harness for webtoon episode production. I need agents for story
writing, character design prompts, panel layout planning, and dialogue
editing. They should review each other's work for style consistency.
```

**YouTube コンテンツ企画**
```
Build a harness for YouTube content creation. The team should research
trending topics, write scripts, optimize titles/tags for SEO, and plan
thumbnail concepts — all coordinated by a supervisor agent.
```

**コードレビュー**
```
Build a harness for comprehensive code review. I want parallel agents
checking architecture, security vulnerabilities, performance bottlenecks,
and code style — then merging all findings into a single report.
```

**技術ドキュメント作成**
```
Build a harness that generates API documentation from this codebase.
Agents should analyze endpoints, write descriptions, generate usage
examples, and review for completeness.
```

**データパイプライン設計**
```
Build a harness for designing data pipelines. I need agents for schema
design, ETL logic, data validation rules, and monitoring setup that
delegate sub-tasks hierarchically.
```

**マーケティングキャンペーン**
```
Build a harness for marketing campaign creation. The team should research
the target market, write ad copy, design visual concepts, and set up
A/B test plans with iterative quality review.
```

## 共存 — Harness と隣人たち

Harness は Claude Code / エージェントフレームワークのエコシステムで一人ではありません。以下のリポジトリは隣接する層に位置しており、いずれも「X は ···、Harness は ···」という並列構造で記述されているため、用途に応じて選んだり、複数を組み合わせて利用できます。

| リポジトリ | 相手のポジション | Harness との関係 |
|------------|------------------|------------------|
| [coleam00/Archon](https://github.com/coleam00/Archon) | "harness builder" — 決定的で再現可能なランタイム構成 | **同じ L3、隣のサブ層。** Archon は Runtime-Configuration Factory、Harness は Team-Architecture Factory。ランタイム決定性は Archon、チームアーキテクチャは Harness、または両者の組み合わせ。 |
| [SaehwanPark/meta-harness](https://github.com/SaehwanPark/meta-harness) | 同一コンセプトの Codex 移植 | **同じ L3、異なるランタイム。** Claude Code では Harness、Codex では meta-harness。 |
| [affaan-m/ECC](https://github.com/affaan-m/everything-claude-code) | "Agent harness performance & workflow layer" — 既存ハーネスの上に乗る標準化層 | **異なる層。** ECC は複数ハーネスの上の標準化層、Harness はハーネスを生成するファクトリー。直列的に組み合わせ可能。 |
| [wshobson/agents](https://github.com/wshobson/agents) | サブエージェント / スキルカタログ (182 agents, 149 skills) | **ファクトリー ↔ 部品供給。** wshobson は「ショッピングするカタログ」、Harness は「チーム設計」。Harness が生成したチーム内に wshobson のエントリを部品として取り込み可能。 |
| [LangGraph](https://langchain-ai.github.io/langgraph/) | ステートグラフ・オーケストレーション、LLM-agnostic | **異なるトラック。** 長時間実行・状態復元が要なら LangGraph、Claude Code ネイティブでの素早いチーム設計が要なら Harness。 |

## Harnessで構築されたプロジェクト

### Harness 100

**[revfactory/harness-100](https://github.com/revfactory/harness-100)** — 10ドメイン、100のプロダクションレディなエージェントチームハーネス（英韓200パッケージ）。各ハーネスには4〜5名の専門エージェント、オーケストレータースキル、ドメイン特化スキルが含まれており、すべて本プラグインで生成されました。コンテンツ制作、ソフトウェア開発、データ/AI、ビジネス戦略、教育、法律、ヘルスケアなど1,808のMarkdownファイル。

## 要件

- [Agent Teams機能の有効化](https://code.claude.com/docs/en/agent-teams)：`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

## FAQ

<details>
<summary><b>Q1. なぜ "harness builder" ではなく "harness factory" なのですか？ Archon と競合しませんか？</b></summary>

**A.** Archon は決定的なランタイム構成を生成する **Runtime-Configuration Factory** であり、Harness はエージェントチームアーキテクチャ（チーム構造・メッセージプロトコル・レビューゲート）を生成する **Team-Architecture Factory** です。両者は **同じ L3 Meta-Factory 層の隣接するサブ層** で、用途が異なります。決定的なランタイムが必要なら Archon、6 つのチームアーキテクチャパターンの事前定義が必要なら Harness。両者を組み合わせる（アーキテクチャ設計 → ランタイム配置）ことも可能です。

**Evidence:**
- Archon 自己定義: [clawfit docs/reference-levels.md](https://github.com/hongsw/clawfit/blob/main/docs/reference-levels.md)
- サブ層宣言: 本 README の **カテゴリー — Harness はどこに位置するか** セクション
- Archon リポジトリ: [github.com/coleam00/Archon](https://github.com/coleam00/Archon)
</details>

<details>
<summary><b>Q2. どのランタイムをサポートしますか — Claude Code、Codex？</b></summary>

**A.** 両方。myharness は **デュアルランタイム**：単一の出典（`skills/myharness/`）＋ランタイム別の薄いアダプター。Claude Code が主（最も自動化 — `Agent` ツールのエージェントチーム）、Codex は `AGENTS.md`＋`.agents/skills/`＋ネイティブ subagents / `codex exec` で対応（`$myharness` または `/skills` で呼び出し）。詳細：`skills/myharness/references/runtime-adapters.md`。Gemini はホストランタイムではなく外部レビュー（agy 経由）のレビュアーとして使用。
</details>

## ライセンス

Apache 2.0
