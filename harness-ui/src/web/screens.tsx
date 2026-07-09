// 9화면(§IA: Overview·Build·Agents·Skills·Runs·Docs·Drift·Ops·Settings). 모두 읽기(mutating=Build dry-run/실행·Drift sync-plan만).
// XSS: 전 텍스트 React escape. dangerouslySetInnerHTML 는 오직 renderMarkdown(markdown-it html:false + DOMPurify) 통과분에만(F5 DV8).
import { useState, useEffect, useRef } from "react";
import { useApi, Async, Badge, Card, Table, ConfBadge, MetricCell } from "./ui.js";
import {
  type OverviewMetrics, type AgentsMetrics, type SkillsMetrics, type Coverage,
  coverageSummary, coverageWindowText, truncatedReasonText, windowEmptyNotice, overviewSuggestions,
} from "./metrics.js";
import {
  apiPost, fetchArtifact, downloadDoc, downloadArtifact,
  encodeDocPath, DownloadTooLargeError, submitRun, RunSubmitError,
  postProjectRoot, ProjectRootError, cancelActiveRuns,
  getDefinition, putDefinition, rollbackDefinition, setDefinitionEdit, DefEditError,
  type DocsNode, type DocsTree, type DocPreview,
  type SettingsInfo, type ProjectRootPreview,
  type DefKind, type DefinitionDoc, type PutDefResult,
} from "./api.js";
import {
  defEditErrorText, diffLines, diffStats, hasChanges, isDiffCoarse, sideRows,
  skillNeedsName, skillHasClaudePath, isDirty, rollbackBodyFromSave,
} from "./defedit.js";
import { projectRootErrorText, canSave, requiresOrphanChoice, type OrphanChoice } from "./settings.js";
import {
  type RunTemplate, type RunSubmitResult,
  toggleSelected, runSubmitErrorText, focusRunFromHash, runsDeepLink,
} from "./agent-run.js";
import { renderMarkdown } from "./render.js";
import { breadcrumbTrail, isMarkdownName, viewerBanner, localDocPath, localArtifactPath } from "./docs-view.js";
import {
  type RunsFilter, type RunsQueryResult, type ChipField,
  parseQuery, buildQuery, setField, clearField, clearAll, activeChips, hasActiveFilter,
  toggleOrder, pageTo, truncationNotice, pageRange, nextOffset, prevOffset,
} from "./runs-filter.js";

type Inv = { projectRoot: string; claude: { entrypoint: string | null; agents: number; skills: number }; codex: { entrypoint: string | null; agents: number; skills: number }; workspace: { exists: boolean; runs: number } };
type Rt = Record<string, { installed: boolean; version: string | null }>;
type Stats = {
  configHealth: { agents: number; skills: number; orchestratorPresent: boolean; claudePointer: boolean; agentsPointer: boolean; orphanAgents: string[]; orphanSkills: string[]; coverageConfidence: string };
  d4: { projects: Array<{ project: string; resultDocs: number; missingNextStep: number }>; workspaceAbandoned: number };
  update: { manifest: boolean; factoryDrift: string };
  evolution: Array<{ date: string; change: string; source: string }>;
};

// ── F6 관측성 계층 B (M9 · W1~W9) — 공용 커버리지 고지 + Overview/Agents/Skills 편입 ──
// W6/A90: 커버리지(스캔·집계·측정비율·기간)·절단 원인(V13)을 정직 표기. "dead/미사용" 단정 금지.
function CoverageNote({ cov }: { cov: Coverage }) {
  const trunc = truncatedReasonText(cov.truncatedReason);
  const win = coverageWindowText(cov);
  return (
    <div className="coverage-note" role="note">
      <span className="muted">ⓘ {coverageSummary(cov)}{win && ` · 기간 ${win}`}
        {cov.recordedAtSource === "mtime" && (
          <span title="birthtime 미지원 파일시스템 — mtime 기준(관측 window 정렬 비결정 가능)"> · mtime 기준</span>
        )}
      </span>
      {trunc && <span className="banner warn" role="note">⚠ {trunc}</span>}
    </div>
  );
}

// W2 Overview 효과성 카드(A63·A91) — 독립 로딩(W9/A83: metrics/overview 실패가 Overview 전체 미붕괴).
function EffectivenessCard() {
  const m = useApi<OverviewMetrics>("/api/metrics/overview");
  return (
    <Card title="효과성 지표 (F6 · 계층 B · 관측 파생)">
      <Async state={m}>{(d) => <OverviewMetricsBody m={d} />}</Async>
    </Card>
  );
}

function OverviewMetricsBody({ m }: { m: OverviewMetrics }) {
  const suggestions = overviewSuggestions(m);
  return (
    <>
      {/* 계층 A 요약(progressive disclosure) — 핵심 지표만 한 줄, 상세는 접기 */}
      <div className="metric-summary">
        <span>총 run <b>{m.runCount}</b></span>
        <span>성공률 <MetricCell mv={m.successRate} fmt="percent" /></span>
        <span>실패율 <MetricCell mv={m.failureRate} fmt="percent" /></span>
        <span>미관측 에이전트 <b>{m.unusedAgents}</b> · 스킬 <b>{m.unusedSkills}</b></span>
      </div>
      {/* W5 anti-Goodhart: 측정 → 행동유도 제안(순위/점수/자동강제 없음) */}
      {suggestions.length > 0 && (
        <ul className="suggestions" aria-label="관측 기반 제안(자동 조치 아님)">
          {suggestions.map((s) => <li key={s.key}>💡 {s.text}</li>)}
        </ul>
      )}
      {/* 계층 B 상세 접기(A91 과밀 방지) */}
      <details className="tier-b">
        <summary>상세 지표 (계층 B · 신뢰도 배지 동반)</summary>
        <Table cols={["지표", "값", "산정 근거"]} rows={[
          ["성공률", <MetricCell mv={m.successRate} fmt="percent" />, "status.state 직접 관측"],
          ["실패율", <MetricCell mv={m.failureRate} fmt="percent" />, "status.state 직접 관측"],
          ["평균 소요", <MetricCell mv={m.avgDurationMs} fmt="duration" />, "createdAt→updatedAt"],
          ["재작업률", <MetricCell mv={m.reworkRate} fmt="percent" />, "이벤트명 프록시(추정)"],
          ["리뷰 수렴(run당)", <MetricCell mv={m.reviewConvergence} fmt="float" />, "review 이벤트 평균(추정)"],
          ["총 토큰", <MetricCell mv={m.totalTokens} fmt="int" />, "events.usage 실존 시 측정·부재 시 미귀속"],
        ]} />
      </details>
      <CoverageNote cov={m.coverage} />
    </>
  );
}

// W3 Agents usage 섹션(A63) — 독립 로딩(W9). 토큰·호출·연결·선언≠관측 gap·미사용.
function AgentsUsage() {
  const m = useApi<AgentsMetrics>("/api/metrics/agents");
  return (
    <Card title="활용도 (F6 · 관측 window)">
      <Async state={m}>{(d) => (
        <>
          {d.agents.length === 0
            ? <p className="muted">선택 window 내 관측된 에이전트 없음(미측정 — 부재 단정 아님)</p>
            : <Table cols={["에이전트", "run", "호출", "완료", "실패", "토큰"]} rows={d.agents.map((a) => [
                a.agent, a.runs, a.invocations, a.completed, a.failed, <MetricCell mv={a.tokens} fmt="int" />,
              ])} />}
          {d.unusedInWindow.length > 0 && (
            <div className="unused-block" role="note">
              <p className="muted">🕳 {windowEmptyNotice("agent", d.coverage)}</p>
              <p>{d.unusedInWindow.map((n) => <Badge key={n} kind="muted">{n}</Badge>)}</p>
            </div>
          )}
          <CoverageNote cov={d.coverage} />
        </>
      )}</Async>
    </Card>
  );
}

// W4 Skills usage 섹션(A63) — 호출·점유(estimated 상한)·미사용 목록. 독립 로딩(W9).
function SkillsUsage() {
  const m = useApi<SkillsMetrics>("/api/metrics/skills");
  return (
    <Card title="활용도 (F6 · 관측 window)">
      <Async state={m}>{(d) => (
        <>
          {d.skills.length === 0
            ? <p className="muted">선택 window 내 관측된 스킬 없음(미측정 — 부재 단정 아님)</p>
            : <Table cols={["스킬", "run", "호출", "토큰(점유·상한)"]} rows={d.skills.map((s) => [
                s.skill, s.runs, s.invocations, <MetricCell mv={s.tokens} fmt="int" />,
              ])} />}
          {d.skills.length > 0 && <p className="muted"><ConfBadge confidence="estimated" /> 스킬 토큰은 경계 없음 → 상한 추정치(정확값 아님).</p>}
          {d.unusedInWindow.length > 0 && (
            <div className="unused-block" role="note">
              <p className="muted">🕳 {windowEmptyNotice("skill", d.coverage)}</p>
              <p>{d.unusedInWindow.map((n) => <Badge key={n} kind="muted">{n}</Badge>)}</p>
            </div>
          )}
          <CoverageNote cov={d.coverage} />
        </>
      )}</Async>
    </Card>
  );
}

// ── 1. Overview (A2·A3·A35-A38 · F6 W2 효과성 카드) ──
export function Overview() {
  const inv = useApi<Inv>("/api/harness");
  const rt = useApi<Rt>("/api/runtimes");
  const st = useApi<Stats>("/api/overview/state-stats");
  return (
    <div className="screen">
      <h2>Overview</h2>
      {/* F6 W2: 효과성 카드는 자체 metrics/overview 페치로 독립 로딩(W9/A83 — 실패해도 아래 카드 미붕괴) */}
      <EffectivenessCard />
      <Async state={rt}>{(r) => (
        <Card title="런타임 (A2)">
          <Table cols={["런타임", "설치", "버전"]} rows={Object.entries(r).map(([k, v]) => [
            k, v.installed ? <Badge kind="ok">설치됨</Badge> : <Badge kind="muted">없음</Badge>, v.version ?? "—",
          ])} />
        </Card>
      )}</Async>
      <Async state={inv}>{(v) => (
        <Card title="인벤토리 (A3)">
          <Table cols={["런타임", "진입점", "에이전트", "스킬"]} rows={[
            ["claude", v.claude.entrypoint ?? <Badge kind="warn">없음</Badge>, v.claude.agents, v.claude.skills],
            ["codex", v.codex.entrypoint ?? <Badge kind="muted">없음</Badge>, v.codex.agents, v.codex.skills],
          ]} />
          <p className="muted">projectRoot: {v.projectRoot} · runs: {v.workspace.runs}</p>
        </Card>
      )}</Async>
      <Async state={st}>{(s) => (
        <>
          <Card title="구성 건강도 (A35 · heuristic)">
            <Table cols={["항목", "값"]} rows={[
              ["오케스트레이터", s.configHealth.orchestratorPresent ? <Badge kind="ok">있음</Badge> : <Badge kind="warn">없음</Badge>],
              ["CLAUDE.md / AGENTS.md", <>{s.configHealth.claudePointer ? "✓" : "✗"} / {s.configHealth.agentsPointer ? "✓" : "✗"}</>],
              ["고아 에이전트", s.configHealth.orphanAgents.length ? <Badge kind="warn">{s.configHealth.orphanAgents.join(", ")}</Badge> : "0"],
              ["고아 스킬", s.configHealth.orphanSkills.length ? <Badge kind="warn">{s.configHealth.orphanSkills.join(", ")}</Badge> : "0"],
              ["커버리지 신뢰도", s.configHealth.coverageConfidence],
            ]} />
          </Card>
          <Card title="D4 규율 (A36) · 업데이트 (A37)">
            <Table cols={["프로젝트", "결과서", "다음단계 누락"]} rows={s.d4.projects.map((p) => [
              // A59: 결과서(docs/) 클릭 → Docs 뷰어 진입
              <a className="link" href="#/docs" title="Docs 뷰어에서 결과서 열람">{p.project}</a>,
              p.resultDocs, p.missingNextStep ? <Badge kind="err">{p.missingNextStep}</Badge> : <Badge kind="ok">0</Badge>,
            ])} />
            <p className="muted">_workspace 방치: {s.d4.workspaceAbandoned} · manifest: {String(s.update.manifest)} · factoryDrift: {s.update.factoryDrift} · <a className="link" href="#/docs">문서 뷰어 열기 →</a></p>
          </Card>
          <Card title="진화 이력 (A38)">
            <Table cols={["날짜", "변경", "출처"]} rows={s.evolution.slice(-12).reverse().map((e) => [e.date, e.change, e.source])} />
          </Card>
        </>
      )}</Async>
    </div>
  );
}

// ── 2. Build (A9a — dry-run 폼 골격 + 실행) ──
export function Build() {
  const [runtime, setRuntime] = useState<"codex" | "claude">("codex");
  const [mode, setMode] = useState("audit");
  const [domain, setDomain] = useState("");
  const [perm, setPerm] = useState<"read-only" | "workspace-write">("read-only");
  const [dry, setDry] = useState(true);
  const [out, setOut] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true); setOut("");
    try {
      const r = await apiPost("/api/runs", { runtime, mode, domain, permissionMode: perm, dryRun: dry });
      setOut(JSON.stringify(r, null, 2));
    } catch (e) { setOut(String(e)); }
    finally { setBusy(false); }
  };
  return (
    <div className="screen">
      <h2>Build</h2>
      <Card title="실행 요청 (A9a · dry-run 기본)">
        <div className="form">
          <label>런타임<select value={runtime} onChange={(e) => setRuntime(e.target.value as "codex" | "claude")}><option value="codex">codex</option><option value="claude">claude</option></select></label>
          <label>모드<input value={mode} onChange={(e) => setMode(e.target.value)} maxLength={40} /></label>
          <label>권한<select value={perm} onChange={(e) => setPerm(e.target.value as "read-only" | "workspace-write")}><option value="read-only">read-only</option><option value="workspace-write">workspace-write</option></select></label>
          <label className="full">작업(domain)<textarea value={domain} onChange={(e) => setDomain(e.target.value)} maxLength={4000} rows={4} /></label>
          <label className="check"><input type="checkbox" checked={dry} onChange={(e) => setDry(e.target.checked)} /> dry-run(미리보기만)</label>
          <button disabled={busy || !domain} onClick={submit}>{busy ? "실행 중…" : dry ? "미리보기" : "실행"}</button>
        </div>
        {out && <pre className="out">{out}</pre>}
        {!dry && <p className="warn-text">⚠ 실 실행은 CLI 프로세스를 spawn합니다.</p>}
      </Card>
    </div>
  );
}

// ── 3. Agents (A3 · F2 M10 프리필 New Run) ──
export function Agents() {
  const st = useApi<{ agents: Array<{ name: string; runtime: string; sourcePath: string; role: string; skills: string[] }> }>("/api/agents");
  const set = useApi<SettingsInfo>("/api/settings"); // F7: definitionEditEnabled(편집 버튼 게이트·A81)
  const [sel, setSel] = useState<string | null>(null);
  const [runFor, setRunFor] = useState<string | null>(null); // F2: New Run 프리필 폼 대상 에이전트
  const [editFor, setEditFor] = useState<string | null>(null); // F7: 정의 편집 대상 에이전트
  const gateOn = set.data?.definitionEditEnabled === true;
  return (
    <div className="screen">
      <h2>Agents</h2>
      <Async state={st}>{(d) => (
        <div className="split">
          <Table cols={["이름", "런타임", "역할"]} rows={d.agents.map((a) => [
            <button className="link" onClick={() => setSel(a.name)}>{a.name}</button>, a.runtime, (a.role || "—").slice(0, 60),
          ])} />
          {sel && (() => { const a = d.agents.find((x) => x.name === sel); return a ? (
            <Card title={a.name}>
              <p className="muted">{a.sourcePath} · {a.runtime}</p>
              <p>{a.role || "(설명 없음)"}</p>
              {a.skills.length > 0 && <p>스킬: {a.skills.join(", ")}</p>}
              <div className="detail-actions">
                {/* F2 W1/A67: 프리필 New Run 진입점(라벨 RF2 정합) */}
                <button className="primary" onClick={() => setRunFor(a.name)}>이 에이전트에게 요청 (New Run)</button>
                {/* F7 A80/A81: 정의 편집 진입(게이트 off·codex → 비활성 + 이유 툴팁 + Settings 딥링크) */}
                <EditButton
                  reason={!gateOn ? "정의 편집이 비활성입니다" : a.runtime !== "claude" ? "codex 에이전트 정의 편집은 v0.7 비대상입니다" : null}
                  showSettingsLink={!gateOn}
                  onEdit={() => setEditFor(a.name)}
                />
              </div>
            </Card>
          ) : null; })()}
        </div>
      )}</Async>
      {/* F2 W1/A83: 프리필 폼은 상세 카드와 독립 카드로 렌더 — run-template 로드 실패가 Agents 화면 전체를 무너뜨리지 않음 */}
      {runFor && <AgentRunForm key={runFor} name={runFor} onClose={() => setRunFor(null)} />}
      {/* F7 A80/A83: 편집기는 독립 카드(3-state·로드/저장/rollback 실패가 화면 전체 미붕괴) */}
      {editFor && <DefinitionEditor key={"agent:" + editFor} kind="agent" name={editFor} onClose={() => setEditFor(null)} />}
      {/* F6 W3: usage 섹션은 자체 metrics/agents 페치로 독립 로딩(W9/A83) */}
      <AgentsUsage />
    </div>
  );
}

// F2 M10 — 에이전트 프리필 New Run 폼(대화형 아님·최초 1회 제출·fire-and-observe).
// run-template 을 로드(A83 독립 3-state) → Build 동형 편집폼. allowedTools 는 D 체크박스로만(A100·U⊆D 구조 보장).
const TARGET_ENUM = ["agents", "skills", "orchestrator"] as const;

function AgentRunForm({ name, onClose }: { name: string; onClose: () => void }) {
  const tmpl = useApi<RunTemplate>(`/api/agents/${encodeURIComponent(name)}/run-template`);
  return (
    <Card title={`New Run · ${name}`}>
      <button className="link" onClick={onClose}>✕ 닫기</button>
      {/* A83: 폼 영역만 독립 로딩/에러(3-state) — 실패해도 상세 카드·usage 유지 */}
      <Async state={tmpl}>{(t) => <AgentRunFormBody template={t} />}</Async>
    </Card>
  );
}

function AgentRunFormBody({ template }: { template: RunTemplate }) {
  const D = template.suggestedAllowedTools;
  const [runtime, setRuntime] = useState<"codex" | "claude">(template.runtime);
  const [mode, setMode] = useState("build");
  const [domain, setDomain] = useState(template.domainTemplate);
  const [perm, setPerm] = useState<"read-only" | "workspace-write">(template.permissionMode);
  const [permConfirmed, setPermConfirmed] = useState(false); // A85: workspace-write 상향 명시 확인
  const [targets, setTargets] = useState<string[]>(() => TARGET_ENUM.filter((x) => template.targets.includes(x)));
  const [tools, setTools] = useState<string[]>(() => [...D]); // U=D 기본(사용자는 D 내에서 뺄 수만)
  const [dry, setDry] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RunSubmitResult | null>(null);
  const [err, setErr] = useState<string | null>(null); // 400/409 인라인 매핑(A100)

  const permBlocked = perm === "workspace-write" && !permConfirmed; // A85 미확인 시 제출 차단
  const changePerm = (v: "read-only" | "workspace-write") => { setPerm(v); if (v === "read-only") setPermConfirmed(false); };
  const toggleTarget = (t: string, on: boolean) =>
    setTargets((prev) => on ? [...new Set([...prev, t])] : prev.filter((x) => x !== t));

  const submit = async () => {
    setBusy(true); setErr(null); setResult(null);
    try {
      const r = await submitRun({
        runtime, mode, domain, permissionMode: perm, targets,
        allowedTools: tools, dryRun: dry,
        agent: template.agent, agentFingerprint: template.fingerprint, // 지문 echo(stale 폼 → 409)
      });
      setResult(r);
    } catch (e) {
      if (e instanceof RunSubmitError) setErr(runSubmitErrorText(e.status, e.code, e.detail));
      else setErr(String(e));
    } finally { setBusy(false); }
  };

  return (
    <div className="form">
      <label>런타임
        <select value={runtime} onChange={(e) => setRuntime(e.target.value as "codex" | "claude")}>
          <option value="codex">codex</option><option value="claude">claude</option>
        </select>
      </label>
      <label>모드<input value={mode} onChange={(e) => setMode(e.target.value)} maxLength={40} /></label>
      <label>권한
        <select value={perm} onChange={(e) => changePerm(e.target.value as "read-only" | "workspace-write")}>
          <option value="read-only">read-only (기본·보수적)</option>
          <option value="workspace-write">workspace-write</option>
        </select>
      </label>
      <label className="full">작업(domain)<textarea value={domain} onChange={(e) => setDomain(e.target.value)} maxLength={4000} rows={4} /></label>

      {/* F2 W2/A100: allowedTools = 에이전트 정의 D 체크박스로만(자유입력 없음 → U⊆D 구조 보장) */}
      <fieldset className="tool-fieldset full">
        <legend>도구 (allowedTools)</legend>
        <p className="muted">이 에이전트가 선언한 도구만 선택 가능 · D 밖 추가 불가(뺄 수만).</p>
        {D.length === 0
          ? <p className="muted">🕳 이 에이전트는 도구를 선언하지 않았습니다(도구 없이 실행).</p>
          : D.map((t) => (
              <label key={t} className="check">
                <input type="checkbox" checked={tools.includes(t)}
                  onChange={(e) => setTools((prev) => toggleSelected(prev, t, e.target.checked, D))} />
                {t}
              </label>
            ))}
      </fieldset>

      {/* targets(정의 프리필·enum 편집) */}
      <fieldset className="target-fieldset full">
        <legend>대상(targets)</legend>
        {TARGET_ENUM.map((t) => (
          <label key={t} className="check">
            <input type="checkbox" checked={targets.includes(t)} onChange={(e) => toggleTarget(t, e.target.checked)} />
            {t}
          </label>
        ))}
      </fieldset>

      <label className="check"><input type="checkbox" checked={dry} onChange={(e) => setDry(e.target.checked)} /> dry-run(미리보기만)</label>

      {/* A85: 권한 상향 위험 확인(색 아님·아이콘+텍스트·명시 확인 게이트) */}
      {perm === "workspace-write" && (
        <div className="banner warn full" role="note">
          <p>⚠ workspace-write 는 파일 쓰기 권한을 상향합니다. run-template 기본은 read-only 입니다.</p>
          <label className="check"><input type="checkbox" checked={permConfirmed} onChange={(e) => setPermConfirmed(e.target.checked)} /> 권한 상향을 확인합니다</label>
        </div>
      )}

      <button className="primary" disabled={busy || !domain || !mode || permBlocked} onClick={submit}>
        {busy ? "제출 중…" : dry ? "미리보기" : "실행"}
      </button>
      {!dry && <p className="warn-text">⚠ 실 실행은 CLI 프로세스를 spawn합니다(fire-and-observe · 대화형 아님).</p>}

      {/* A100: 서버 거부(400 unauthorized-tool·409 agent-definition-changed) 인라인 — 조용한 드롭 아님 */}
      {err && <p className="banner err full" role="alert">⚠ {err}</p>}

      {/* A87: 제출 성공 착지 배너 + runId 딥링크(→ Runs에서 관찰) */}
      {result && (result.dryRun
        ? <div className="banner full" role="status">
            <p>👁 미리보기(파일 미기록) · runId <code className="path">{result.runId}</code></p>
            <pre className="out">{JSON.stringify(result.preview, null, 2)}</pre>
          </div>
        : <div className="banner ok full" role="status">
            <p>✓ 실행이 생성되었습니다 · runId <code className="path">{result.runId}</code></p>
            <a className="link" href={runsDeepLink(result.runId)}>→ Runs에서 관찰</a>
          </div>)}
    </div>
  );
}

// ── 4. Skills (A4·A43 triggers) ──
export function Skills() {
  const st = useApi<{ skills: Array<{ name: string; description: string; triggers: string; references: string[]; runtimePaths: string[] }> }>("/api/skills");
  const set = useApi<SettingsInfo>("/api/settings"); // F7: definitionEditEnabled(편집 버튼 게이트·A81)
  const [sel, setSel] = useState<string | null>(null);
  const [editFor, setEditFor] = useState<string | null>(null); // F7: 정의 편집 대상 스킬
  const gateOn = set.data?.definitionEditEnabled === true;
  return (
    <div className="screen">
      <h2>Skills</h2>
      <Async state={st}>{(d) => (
        <div className="split">
          <Table cols={["이름", "트리거(발췌)"]} rows={d.skills.map((s) => [
            <button className="link" onClick={() => setSel(s.name)}>{s.name}</button>, (s.triggers || "—").slice(0, 80),
          ])} />
          {sel && (() => { const s = d.skills.find((x) => x.name === sel); return s ? (
            <Card title={s.name}>
              <p className="muted">{s.runtimePaths.join(", ")}</p>
              <p>{s.description || "(설명 없음)"}</p>
              {s.references.length > 0 && <p>참조: {s.references.join(", ")}</p>}
              <div className="detail-actions">
                {/* F7 A80/A81: 정의 편집 진입(게이트 off·codex-only → 비활성 + 이유 툴팁 + Settings 딥링크) */}
                <EditButton
                  reason={!gateOn ? "정의 편집이 비활성입니다" : !skillHasClaudePath(s.runtimePaths) ? "codex 전용 스킬 정의 편집은 v0.7 비대상입니다" : null}
                  showSettingsLink={!gateOn}
                  onEdit={() => setEditFor(s.name)}
                />
              </div>
            </Card>
          ) : null; })()}
        </div>
      )}</Async>
      {/* F7 A80/A83: 편집기는 독립 카드(3-state) */}
      {editFor && <DefinitionEditor key={"skill:" + editFor} kind="skill" name={editFor} onClose={() => setEditFor(null)} />}
      {/* F6 W4: usage 섹션은 자체 metrics/skills 페치로 독립 로딩(W9/A83) */}
      <SkillsUsage />
    </div>
  );
}

// ── F7 정의 편집기 (M12 · A80·A81·A85·A86·A93 · 첫 mutating·중대) ──
// XSS: textarea·diff·merge 는 전부 React escape(순수 텍스트) — dangerouslySetInnerHTML 금지(마크다운 렌더 아님).

// A81: 편집 진입 버튼. reason!=null → 비활성 + 이유 툴팁(색 비의존·텍스트 병기·빈 비활성 금지) + Settings 딥링크.
function EditButton({ reason, showSettingsLink, onEdit }: { reason: string | null; showSettingsLink: boolean; onEdit: () => void }) {
  if (!reason) return <button className="primary edit-btn" onClick={onEdit}>✎ 정의 편집</button>;
  return (
    <span className="edit-disabled-wrap">
      <button className="edit-btn" disabled aria-disabled="true" title={reason}>✎ 정의 편집</button>
      <span className="muted edit-reason" role="note">🔒 {reason}
        {showSettingsLink && <> · <a className="link" href="#/settings">Settings에서 켜기 →</a></>}
      </span>
    </span>
  );
}

// 통합 diff 미리보기(로드본→편집본) — +/−/space 마크로 색 비의존(A92). 순수 텍스트 렌더.
function DiffView({ before, after }: { before: string; after: string }) {
  if (!hasChanges(before, after)) return <p className="muted" role="status">변경 없음</p>;
  const ops = diffLines(before, after);
  const stats = diffStats(ops);
  return (
    <div className="def-diff" role="group" aria-label="변경 미리보기(로드본 → 편집본)">
      <p className="muted">추가 +{stats.added} / 삭제 −{stats.removed} 라인{isDiffCoarse(before, after) && " · 대용량 정의 — 개략 비교(전체 교체)"}</p>
      <div className="out def-diff-body">
        {ops.map((o, i) => (
          <div key={i} className={`dl dl-${o.kind}`}>
            <span className="dl-mark" aria-hidden="true">{o.kind === "add" ? "+" : o.kind === "del" ? "−" : " "}</span>
            <span className="dl-text">{o.text === "" ? " " : o.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// A93 병합 뷰 — 디스크 현재본 ↔ 내 편집분(보존) 나란히 비교. 편집분 유실 방지의 시각적 근거.
function MergeView({ disk, edited }: { disk: string; edited: string }) {
  const rows = sideRows(diffLines(disk, edited));
  return (
    <div className="def-merge" role="group" aria-label="디스크 현재본과 내 편집분 나란히 비교">
      <div className="def-merge-head"><span>디스크 현재본</span><span>내 편집분 (보존됨)</span></div>
      <div className="def-merge-body">
        {rows.map((r, i) => (
          <div key={i} className={`mr mr-${r.kind}`}>
            <span className="mr-cell mr-left">{r.left ?? " "}</span>
            <span className="mr-cell mr-right">{r.right ?? " "}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// A93 stale-write 충돌 상태(편집분 보존 병합). diskContent=null → 디스크 현재본 재조회 실패 폴백.
type StaleConflict = { currentHash: string; diskContent: string | null };

function DefinitionEditor({ kind, name, onClose }: { kind: DefKind; name: string; onClose: () => void }) {
  const [doc, setDoc] = useState<DefinitionDoc | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [edited, setEdited] = useState<string>("");
  const [baseHash, setBaseHash] = useState<string>(""); // 낙관적 동시성 기준(저장·adopt 시 갱신)
  const [showDiff, setShowDiff] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<PutDefResult | null>(null);
  const [rolledBack, setRolledBack] = useState(false);
  const [rbBusy, setRbBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null); // 400/403/409 인라인(A80)
  const [conflict, setConflict] = useState<StaleConflict | null>(null); // A93
  const [copied, setCopied] = useState(false);

  // 정의 로드(이름→서버 정규경로 재조회). A83: 편집기 카드 안에서만 3-state.
  useEffect(() => {
    let live = true;
    setDoc(null); setLoadErr(null); setSaveResult(null); setConflict(null); setErr(null);
    getDefinition(kind, name)
      .then((d) => { if (live) { setDoc(d); setEdited(d.content); setBaseHash(d.baseHash); } })
      .catch((e) => { if (live) setLoadErr(e instanceof DefEditError ? defEditErrorText(e.code, e.status, e.detail) : String(e)); });
    return () => { live = false; };
  }, [kind, name]);

  const dirty = doc != null && isDirty(doc.content, edited);

  // A86: 미저장 이탈 경고(브라우저 unload). 앱 내 닫기는 confirm() 게이트(아래 doClose).
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const doClose = () => {
    if (dirty && !window.confirm("저장하지 않은 편집 내용이 있습니다. 편집기를 닫을까요?")) return;
    onClose();
  };

  const editable = doc?.editable === true;

  // 저장 실행(확인 다이얼로그에서 호출). 성공 → 재조회로 canonical 반영·rollback 준비. 실패 → 인라인/A93.
  const doSave = async () => {
    if (!doc) return;
    setSaving(true); setErr(null);
    try {
      const res = await putDefinition(kind, name, { content: edited, baseHash, pathId: doc.pathId });
      setConfirmOpen(false); setConflict(null); setRolledBack(false);
      setSaveResult(res); setBaseHash(res.newHash);
      // canonical 재직렬화본을 재조회해 diff 기준 갱신(실패해도 저장 성공 배너 유지·A83).
      try { const d = await getDefinition(kind, name); setDoc(d); setEdited(d.content); setBaseHash(d.baseHash); } catch { /* 재조회 실패 격리 */ }
    } catch (e) {
      setConfirmOpen(false);
      if (e instanceof DefEditError && e.status === 409 && e.code === "stale-write") {
        // A93: 자동 재로드 금지 — 편집분(edited) 보존한 채 디스크 현재본 조회해 병합 뷰.
        const ch = e.currentHash ?? "";
        setErr(defEditErrorText(e.code, e.status));
        getDefinition(kind, name)
          .then((d) => setConflict({ currentHash: e.currentHash ?? d.baseHash, diskContent: d.content }))
          .catch(() => setConflict({ currentHash: ch, diskContent: null }));
      } else {
        setErr(e instanceof DefEditError ? defEditErrorText(e.code, e.status, e.detail) : String(e));
      }
    } finally { setSaving(false); }
  };

  // A93: 디스크 최신본 기준으로 재저장 준비 — baseHash 를 디스크 현재 해시로 채택(편집분은 그대로 유지·의도적 덮어쓰기).
  const adoptDiskBase = () => {
    if (!conflict) return;
    setBaseHash(conflict.currentHash);
    setConflict(null); setErr(null);
  };

  const copyEdited = async () => {
    try { await navigator.clipboard.writeText(edited); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { setCopied(false); }
  };

  // "되돌리기" = POST rollback(expectedCurrentHash=newHash·backupHash=prevHash). 성공 → 재조회 반영.
  const doRollback = async () => {
    if (!saveResult) return;
    setRbBusy(true); setErr(null);
    try {
      await rollbackDefinition(kind, name, rollbackBodyFromSave(saveResult));
      setSaveResult(null); setRolledBack(true);
      const d = await getDefinition(kind, name); setDoc(d); setEdited(d.content); setBaseHash(d.baseHash);
    } catch (e) {
      setErr(e instanceof DefEditError ? defEditErrorText(e.code, e.status, e.detail) : String(e));
    } finally { setRbBusy(false); }
  };

  return (
    <Card title={`정의 편집 · ${name}`}>
      <button className="link" onClick={doClose}>✕ 닫기</button>
      {loadErr && <p className="banner err" role="alert">⚠ {loadErr}</p>}
      {!doc && !loadErr && <p className="muted">불러오는 중…</p>}
      {doc && (
        <>
          <p className="muted"><code className="path">{doc.sourcePath}</code>{dirty && <span className="warn-text"> · 미저장 변경 있음</span>}</p>

          {!editable && (
            <p className="banner warn" role="note">🔒 정의 편집이 비활성입니다 — 뷰어 전용. <a className="link" href="#/settings">Settings에서 켜기 →</a></p>
          )}

          {/* name 필수 안내(name 없는 스킬 저장 전 힌트·400 integrity field:name 예방) */}
          {editable && skillNeedsName(kind, edited) && (
            <p className="banner warn" role="note">⚠ 이 스킬 정의에 <code>name:</code> 필드가 없습니다 — 저장하려면 frontmatter 에 <code>name: {name}</code> 를 명시하세요.</p>
          )}

          <label className="def-textarea-label">
            정의 원문 (frontmatter + 본문)
            <textarea className="def-textarea" value={edited} onChange={(e) => setEdited(e.target.value)}
              readOnly={!editable} aria-label="정의 원문 편집" spellCheck={false} rows={20} />
          </label>

          <div className="def-editor-toolbar">
            <button className="link" aria-pressed={showDiff} onClick={() => setShowDiff((v) => !v)}>
              {showDiff ? "변경 미리보기 접기" : "변경 미리보기 (diff)"}
            </button>
            {editable && (
              <button className="primary" disabled={!dirty || saving} onClick={() => { setErr(null); setConfirmOpen(true); }}>
                저장…
              </button>
            )}
          </div>

          {showDiff && <DiffView before={doc.content} after={edited} />}

          {/* 400/403/409 인라인 에러(조용한 드롭 금지·A80) */}
          {err && <p className="banner err" role="alert">⚠ {err}</p>}

          {/* A93 stale-write 편집분 보존 병합 뷰 — 자동 재로드 금지·편집 textarea 보존 */}
          {conflict && (
            <div className="banner warn def-conflict" role="alert">
              <p>⚠ 디스크의 정의가 편집 중 변경되었습니다. <b>편집 내용은 그대로 보존</b>됩니다(덮어쓰기 전 확인).</p>
              <div className="def-conflict-actions">
                <button onClick={copyEdited}>📋 편집분 클립보드 복사{copied && " ✓"}</button>
                <button onClick={adoptDiskBase} title="디스크 최신본을 기준으로 삼아 편집분으로 덮어쓸 준비를 합니다(편집분 유지).">디스크 최신본 기준으로 재저장 준비</button>
              </div>
              {conflict.diskContent != null
                ? <MergeView disk={conflict.diskContent} edited={edited} />
                : <p className="muted">디스크 현재본을 불러오지 못했습니다 — 편집분을 복사해 수동 병합하세요.</p>}
            </div>
          )}

          {/* A79/A85 저장 성공 착지 — 편집≠실행 안내 + Codex drift 경고 + 되돌리기 */}
          {saveResult && (
            <div className="banner ok def-saved" role="status">
              <p>✓ 저장됨 · 이전 해시 <code className="path">{saveResult.prevHash.slice(0, 12)}</code> → 새 해시 <code className="path">{saveResult.newHash.slice(0, 12)}</code></p>
              <p className="muted">이 저장은 정의 파일 기록만 합니다(실행 아님) — 실행하려면 <b>New Run / Ask Agent</b> 로 진행하세요.</p>
              {saveResult.codexDriftWarning && (
                <p className="warn-text">⚠ Codex 듀얼(.codex/.agents) 피어는 자동 갱신되지 않습니다 — drift 발생 가능(v0.7 비대상).</p>
              )}
              <button disabled={rbBusy} onClick={doRollback}>{rbBusy ? "되돌리는 중…" : "↩ 되돌리기 (직전 백업 복원)"}</button>
            </div>
          )}
          {rolledBack && <p className="banner ok" role="status">↩ 직전 백업으로 되돌렸습니다.</p>}
        </>
      )}

      {/* A85: 비가역 파일 변경 확인 다이얼로그(포커스 트랩·ESC 는 ConfirmDialog) */}
      {confirmOpen && doc && (
        <ConfirmDialog title="정의 파일 저장 확인" onCancel={() => setConfirmOpen(false)}>
          <p className="muted">아래 정의 파일을 <b>비가역적으로 변경</b>합니다(직전 1개 백업 후 원자 교체). 취소하면 어떤 쓰기도 하지 않습니다.</p>
          <p><code className="path">{doc.sourcePath}</code></p>
          <DiffView before={doc.content} after={edited} />
          {err && <p className="banner err" role="alert">⚠ {err}</p>}
          <div className="modal-actions">
            <button onClick={() => setConfirmOpen(false)} disabled={saving}>취소 (변경 없음)</button>
            <button className="primary" disabled={saving} onClick={doSave}>{saving ? "저장 중…" : "저장 (파일 쓰기)"}</button>
          </div>
        </ConfirmDialog>
      )}
    </Card>
  );
}

// ── 5. Runs (A5·A6·A52 — 필터/검색/정렬/페이지·목록·상세) ──
// 서버 enum(schemas.ts RunState/Runtime) 과 정확히 일치.
const RUN_STATES = ["queued", "running", "blocked", "failed", "completed", "cancelled", "stale"] as const;
const RUNTIMES = ["claude", "codex"] as const;
const SORT_OPTS: Array<[RunsFilter["sort"], string]> = [
  ["recordedAt", "기록 시각"], ["updatedAt", "갱신 시각"], ["state", "상태"],
];
const stateKind = (s: string | null): "ok" | "err" | "warn" | "muted" =>
  s === "completed" ? "ok" : s === "failed" || s === "cancelled" ? "err" : s === "blocked" || s === "stale" ? "warn" : "muted";

export function Runs() {
  const [filter, setFilter] = useState<RunsFilter>(() => parseQuery(location.search));
  // A87: Agents New Run 딥링크(#/runs?run=<id>) 도착 시 해당 run 을 초기 선택 + 착지 배너.
  const [focus] = useState<string | null>(() => focusRunFromHash(location.hash));
  const [sel, setSel] = useState<string | null>(() => focusRunFromHash(location.hash));
  const qs = buildQuery(filter);
  // 필터 → 쿼리스트링 → refetch(path 변경 시 useApi 자동 재요청). 항상 인자 분기 → 신규 shape.
  const st = useApi<RunsQueryResult>("/api/runs?" + qs);
  // W2 URL 쿼리 반영(공유·새로고침 보존) — hash 라우팅(#/runs) 보존.
  useEffect(() => {
    history.replaceState(null, "", location.pathname + "?" + qs + location.hash);
  }, [qs]);

  const chips = activeChips(filter);
  return (
    <div className="screen">
      <h2>Runs</h2>
      {/* A87: New Run 딥링크 착지 배너(방금 생성한 run 관찰) */}
      {focus && sel === focus && (
        <div className="banner ok" role="status">👁 방금 생성한 run 을 관찰 중 · <code className="path">{focus}</code></div>
      )}
      {/* A83: 필터바는 fetch 상태와 독립 렌더 — 목록 로딩/에러가 필터바를 무너뜨리지 않음 */}
      <FilterBar filter={filter} onApply={setFilter} />
      {chips.length > 0 && (
        <div className="chips" role="group" aria-label="활성 필터">
          {chips.map((c) => (
            <span key={c.key} className="chip">
              <span className="chip-label">{c.label}: {c.value}</span>
              <button className="chip-x" aria-label={`${c.label} 필터 제거`} title={`${c.label} 필터 제거`}
                onClick={() => setFilter(clearField(filter, c.key as ChipField))}>✕</button>
            </span>
          ))}
          <button className="link chip-clear" onClick={() => setFilter(clearAll())}>필터 초기화</button>
        </div>
      )}
      <Async state={st}>{(d) => (
        <>
          <ResultBar data={d} onPage={(o) => setFilter(pageTo(filter, o))} />
          {d.items.length === 0 ? (
            <div className="empty" role="status">
              <p className="muted">🔍 조건에 맞는 run 없음</p>
              {hasActiveFilter(filter)
                ? <button className="link" onClick={() => setFilter(clearAll())}>필터 초기화</button>
                : <p className="muted">아직 실행 이력이 없습니다.</p>}
            </div>
          ) : (
            <div className="split">
              <Table cols={["runId", "상태", "런타임", "모드", "목표", "기록 시각"]} rows={d.items.map((r) => [
                <button className="link" onClick={() => setSel(r.runId)}>{r.runId.slice(0, 30)}</button>,
                <Badge kind={stateKind(r.state)}>{r.state ?? "무효"}</Badge>,
                r.runtime ?? "—", r.mode ?? "—",
                r.goal ? r.goal.slice(0, 60) : <span className="muted">—</span>,
                r.recordedAt.slice(0, 19),
              ])} />
              {sel && <RunDetail key={sel} runId={sel} />}
            </div>
          )}
        </>
      )}</Async>
    </div>
  );
}

// 필터바 — 텍스트/셀렉트 드래프트를 "검색"으로 일괄 적용(키스트로크 refetch 방지).
// filter prop 변경(칩 제거·초기화·페이지) 시에만 드래프트 재동기 → 입력 중 clobber 없음.
function FilterBar({ filter, onApply }: { filter: RunsFilter; onApply: (f: RunsFilter) => void }) {
  const [draft, setDraft] = useState<RunsFilter>(filter);
  useEffect(() => { setDraft(filter); }, [filter]);
  const set = (k: ChipField, v: string) => setDraft(setField(draft, k, v));
  // ISO(offset) ↔ datetime-local(YYYY-MM-DDTHH:mm) 표시 왕복.
  const toLocal = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const submit = (e: React.FormEvent) => { e.preventDefault(); onApply({ ...draft, offset: 0 }); };
  return (
    <form className="filterbar" onSubmit={submit}>
      <label>상태
        <select value={draft.state ?? ""} onChange={(e) => set("state", e.target.value)}>
          <option value="">전체</option>
          {RUN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label>런타임
        <select value={draft.runtime ?? ""} onChange={(e) => set("runtime", e.target.value)}>
          <option value="">전체</option>
          {RUNTIMES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label>모드<input value={draft.mode ?? ""} maxLength={40} onChange={(e) => set("mode", e.target.value)} /></label>
      <label>에이전트<input value={draft.agent ?? ""} maxLength={120} onChange={(e) => set("agent", e.target.value)} /></label>
      <label>기록 시각(파일시스템) 이후<input type="datetime-local" value={toLocal(draft.from)} onChange={(e) => set("from", e.target.value ? new Date(e.target.value).toISOString() : "")} /></label>
      <label>기록 시각(파일시스템) 이전<input type="datetime-local" value={toLocal(draft.to)} onChange={(e) => set("to", e.target.value ? new Date(e.target.value).toISOString() : "")} /></label>
      <label className="grow">검색어<input value={draft.q ?? ""} maxLength={200} placeholder="목표·모드·에이전트·요청자" onChange={(e) => set("q", e.target.value)} /></label>
      <label>정렬
        <select value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: e.target.value as RunsFilter["sort"], offset: 0 })}>
          {SORT_OPTS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      </label>
      <button type="button" className="order-toggle" aria-label={`정렬 방향 — 현재 ${draft.order === "desc" ? "내림차순" : "오름차순"}`}
        onClick={() => setDraft(toggleOrder(draft))}>
        {draft.order === "desc" ? "↓ 내림차순" : "↑ 오름차순"}
      </button>
      <button type="submit">검색</button>
    </form>
  );
}

// 결과 카운트·절단 고지·mtime 비결정 고지·페이지네이션.
function ResultBar({ data, onPage }: { data: RunsQueryResult; onPage: (offset: number) => void }) {
  const range = pageRange(data);
  const notice = truncationNotice(data.truncatedReason);
  // 페이지 이동은 서버가 실제 적용한 offset/limit(clamp된) 기준 — 클라 filter.limit 로 오점프 방지.
  const prevDisabled = data.offset <= 0;
  const nextDisabled = !data.hasMore;
  return (
    <div className="resultbar">
      <div className="result-meta">
        <span className="count">총 {data.total}건{range && <span className="muted"> · {range.start}–{range.end} 표시</span>}</span>
        {notice && (
          <span className="trunc-warn" role="note" title={notice.tip}>
            ⚠ {notice.label} <span className="muted">— {notice.tip}</span>
          </span>
        )}
        {data.recordedAtSource === "mtime" && (
          <span className="src-note muted" title="birthtime 미지원 파일시스템 — mtime(최근 상태갱신) 기준. 정렬·기간이 비결정적일 수 있음.">
            ⓘ 기록 시각 = mtime(정렬 비결정 가능)
          </span>
        )}
      </div>
      <div className="pager">
        <button disabled={prevDisabled} aria-label="이전 페이지" onClick={() => onPage(prevOffset(data))}>◂ 이전</button>
        <button disabled={nextDisabled} aria-label="다음 페이지" onClick={() => onPage(nextOffset(data))}>다음 ▸</button>
      </div>
    </div>
  );
}

// events 응답(서버 계약 readEvents: { items, nextAfter, hasMore, runState, schemaVersion }) → 표시 행(최근 30건).
// 서버 Event 스키마 필드는 `event`(≠ 구 `type`). 계약 미러 — shape 회귀 방지(테스트 고정).
export function runEventRows(e: { items: Array<{ seq: number; event: string; message?: string }> }): Array<{ seq: number; event: string; message: string }> {
  return e.items.slice(-30).map((x) => ({ seq: x.seq, event: x.event, message: x.message ?? "" }));
}

function RunDetail({ runId }: { runId: string }) {
  const run = useApi<{ manifest: unknown; status: { state: string; exitCode: number | null; error: string | null } | null }>(`/api/runs/${encodeURIComponent(runId)}`);
  const ev = useApi<{ items: Array<{ seq: number; event: string; message?: string }>; nextAfter: number; hasMore: boolean; runState: string | null; schemaVersion: string }>(`/api/runs/${encodeURIComponent(runId)}/events`);
  const ag = useApi<{ agents: Array<{ name: string; state: string }> }>(`/api/runs/${encodeURIComponent(runId)}/agents`);
  const arts = useApi<{ files: string[] }>(`/api/runs/${encodeURIComponent(runId)}/artifacts`);
  const set = useApi<{ projectRoot: string }>("/api/settings");
  const [artName, setArtName] = useState<string | null>(null);
  const [artText, setArtText] = useState<string | null>(null);
  const [artErr, setArtErr] = useState<React.ReactNode>(null);
  const projectRoot = set.data?.projectRoot ?? "";
  const openArt = (name: string) => {
    setArtName(name); setArtText(null); setArtErr(null);
    fetchArtifact(runId, name)
      .then(setArtText)
      .catch((e) => {
        if (e instanceof DownloadTooLargeError)
          setArtErr(<>⚠ 파일이 너무 큼 · 로컬에서 열기: <code className="path">{localArtifactPath(projectRoot, runId, name)}</code></>);
        else setArtErr(<>불러오기 실패: {String(e)}</>);
      });
  };
  return (
    <Card title={runId.slice(0, 40)}>
      <Async state={run}>{(r) => (
        <p>상태: {r.status ? <Badge kind={r.status.state === "completed" ? "ok" : r.status.state === "failed" ? "err" : "muted"}>{r.status.state}</Badge> : "무효"} {r.status?.exitCode != null && `· exit ${r.status.exitCode}`}{r.status?.error && <span className="error"> · {r.status.error}</span>}</p>
      )}</Async>
      <Async state={ag}>{(a) => a.agents.length > 0 ? <Table cols={["에이전트", "상태"]} rows={a.agents.map((x) => [x.name, x.state])} /> : <p className="muted">에이전트 상태 없음</p>}</Async>
      <Async state={ev}>{(e) => { const rows = runEventRows(e); return (
        <div className="events">{rows.length === 0 ? <p className="muted">이벤트 없음</p> : rows.map((x) => (
          <div key={x.seq} className="evline"><span className="seq">#{x.seq}</span> <b>{x.event}</b> {x.message}</div>
        ))}</div>
      ); }}</Async>
      {/* A83: 산출물 패널은 트리·이벤트와 독립 로딩. 한 산출물 실패(413/오류)가 다른 패널 미붕괴 */}
      <Async state={arts}>{(f) => f.files.length > 0 ? (
        <div>
          <p className="muted">산출물:</p>
          <div className="artlist">
            {f.files.map((name) => (
              <button key={name} className={"link" + (name === artName ? " on" : "")} aria-current={name === artName ? "true" : undefined}
                onClick={() => openArt(name)}>📄 {name}</button>
            ))}
          </div>
          {artErr && <p className="banner err" role="alert">{artErr}</p>}
          {artName && artText != null && !artErr && (
            <FileViewer model={{
              name: artName, content: artText, renderable: true, binary: false, truncated: false,
              size: artText.length, localPath: localArtifactPath(projectRoot, runId, artName),
              download: () => downloadArtifact(runId, artName),
            }} />
          )}
        </div>
      ) : <p className="muted">산출물 없음</p>}</Async>
    </Card>
  );
}

// ── F5 공유 뷰어 컴포넌트 (A59·A89·A98·DV8) ──
// docs 미리보기·run artifact 를 공통 렌더. 렌더↔raw 토글·다운로드·잘림/바이너리/413 배너. 읽기전용.
type ViewerModel = {
  name: string; content: string | null; renderable: boolean; binary: boolean;
  truncated: boolean; size: number; localPath: string; download: () => Promise<void>;
};

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function FileViewer({ model }: { model: ViewerModel }) {
  const mdEligible = isMarkdownName(model.name) && model.renderable && model.content != null;
  const [mode, setMode] = useState<"render" | "raw">(mdEligible ? "render" : "raw");
  const [dlErr, setDlErr] = useState<React.ReactNode>(null);
  const [busy, setBusy] = useState(false);
  // 파일 전환 시 토글/에러 초기화(A89 — 새 파일은 렌더 기본).
  useEffect(() => { setMode(mdEligible ? "render" : "raw"); setDlErr(null); }, [model.name]); // eslint-disable-line react-hooks/exhaustive-deps
  const banner = viewerBanner(model);
  const doDownload = async () => {
    setBusy(true); setDlErr(null);
    try { await model.download(); }
    catch (e) {
      if (e instanceof DownloadTooLargeError)
        setDlErr(<>파일이 너무 큼({fmtBytes(e.size)} · 상한 {fmtBytes(e.max)}) — 로컬에서 열기: <code className="path">{model.localPath}</code></>);
      else setDlErr(<>다운로드 실패: {String(e)}</>);
    } finally { setBusy(false); }
  };
  return (
    <div className="viewer">
      <div className="viewer-toolbar">
        {mdEligible && (
          <div className="seg-toggle" role="group" aria-label="표시 방식">
            <button className={mode === "render" ? "on" : ""} aria-pressed={mode === "render"} onClick={() => setMode("render")}>렌더</button>
            <button className={mode === "raw" ? "on" : ""} aria-pressed={mode === "raw"} onClick={() => setMode("raw")}>원문(raw)</button>
          </div>
        )}
        <span className="viewer-size muted">{fmtBytes(model.size)}</span>
        <button className="dl-btn" disabled={busy} onClick={doDownload}>{busy ? "다운로드 중…" : "⤓ 다운로드"}</button>
      </div>
      {model.truncated && <p className="banner warn" role="note">✂ 미리보기 잘림(상한까지 표시) · 전체 내용은 다운로드로 확인</p>}
      {dlErr && <p className="banner err" role="alert">⚠ {dlErr}</p>}
      {banner === "binary" && <p className="banner" role="note">⛔ 미리보기 불가(바이너리) · 다운로드로 확인</p>}
      {banner === "not-renderable" && <p className="banner" role="note">⛔ 미리보기 불가(이 형식) · 다운로드로 확인</p>}
      {!banner && model.content != null && (
        mode === "render" && mdEligible
          // DV8: renderMarkdown(markdown-it html:false + DOMPurify allowlist + scheme 화이트리스트 + img/svg 차단) 통과분만 주입.
          ? <div className="md-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(model.content) }} />
          // raw/텍스트는 React escape(비실행).
          : <pre className="out">{model.content}</pre>
      )}
    </div>
  );
}

// 파일 트리(재귀·읽기전용·A89). 키보드 조작(button)·현재 선택 aria-current.
function DocTree({ nodes, selected, onSelect }: { nodes: DocsNode[]; selected: string | null; onSelect: (path: string) => void }) {
  return (
    <ul className="doctree" role="tree">
      {nodes.map((n) => n.type === "dir" ? (
        <li key={n.path} role="treeitem" aria-expanded="true">
          <span className="tree-dir">📁 {n.name}</span>
          {n.children.length > 0 && <DocTree nodes={n.children} selected={selected} onSelect={onSelect} />}
        </li>
      ) : (
        <li key={n.path} role="none">
          <button role="treeitem" className={"tree-file link" + (n.path === selected ? " on" : "")}
            aria-current={n.path === selected ? "true" : undefined} onClick={() => onSelect(n.path)}>📄 {n.name}</button>
        </li>
      ))}
    </ul>
  );
}

// 브레드크럼(A89) — 읽기전용 경로 표시.
function Breadcrumb({ rel }: { rel: string }) {
  const trail = breadcrumbTrail(rel);
  return (
    <nav className="breadcrumb" aria-label="파일 경로">
      {trail.map((t, i) => (
        <span key={t.path}>
          {i > 0 && <span className="sep" aria-hidden="true"> / </span>}
          <span className={i === trail.length - 1 ? "crumb cur" : "crumb"}>{t.name}</span>
        </span>
      ))}
    </nav>
  );
}

// docs 파일 미리보기 패널 — 트리와 독립 로딩(A83). 3-state.
function DocPanel({ rel, projectRoot }: { rel: string; projectRoot: string }) {
  const prev = useApi<DocPreview>(`/api/docs/${encodeDocPath(rel)}`);
  return (
    <Card title={rel}>
      <Breadcrumb rel={rel} />
      <Async state={prev}>{(p) => (
        <FileViewer model={{
          name: p.name, content: p.content, renderable: p.renderable, binary: p.binary,
          truncated: p.truncated, size: p.size, localPath: localDocPath(projectRoot, rel),
          download: () => downloadDoc(rel, p.name),
        }} />
      )}</Async>
    </Card>
  );
}

// ── 6. Docs (F5·A53·A59·A89·A98 — 문서/artifact 뷰어) ──
export function Docs() {
  const tree = useApi<DocsTree>("/api/docs");
  const set = useApi<{ projectRoot: string }>("/api/settings");
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div className="screen">
      <h2>Docs</h2>
      <div className="split">
        {/* A83: 트리 패널은 미리보기와 독립 로딩. 미리보기 실패가 트리를 무너뜨리지 않음 */}
        <Card title="문서 트리 · docs/ (읽기전용)">
          <Async state={tree}>{(t) => t.tree.length === 0 ? (
            <div className="empty" role="status"><p className="muted">📂 docs/ 에 문서 없음</p></div>
          ) : (
            <>
              {t.truncated && <p className="banner warn" role="note">✂ 트리 절단 · {t.count}개까지 표시</p>}
              <DocTree nodes={t.tree} selected={sel} onSelect={setSel} />
            </>
          )}</Async>
        </Card>
        {sel
          ? <DocPanel key={sel} rel={sel} projectRoot={set.data?.projectRoot ?? ""} />
          : <Card title="미리보기"><p className="muted">좌측에서 파일을 선택하세요.</p></Card>}
      </div>
    </div>
  );
}

// ── 6. Drift (A4 · full + sync-plan 미리보기) ──
type Finding = { id: string; severity: string; runtime: string; paths: string[]; evidence: string; suggestedAction: string };
export function Drift() {
  const st = useApi<{ findings: Finding[] }>("/api/drift");
  const [plan, setPlan] = useState<string>("");
  const kind = (s: string) => s === "ok" ? "ok" : s === "stale" ? "warn" : "err";
  return (
    <div className="screen">
      <h2>Drift</h2>
      <button onClick={() => apiPost("/api/drift/sync-plan", {}).then((p) => setPlan(JSON.stringify(p, null, 2))).catch((e) => setPlan(String(e)))}>동기화 계획 미리보기(무변경)</button>
      {plan && <pre className="out">{plan}</pre>}
      <Async state={st}>{(d) => d.findings.length === 0 ? <div className="muted">drift 없음</div> : (
        <Table cols={["심각도", "런타임", "경로", "근거", "제안"]} rows={d.findings.map((f) => [
          <Badge kind={kind(f.severity) as "ok" | "warn" | "err"}>{f.severity}</Badge>, f.runtime, f.paths.join(", "), f.evidence, f.suggestedAction,
        ])} />
      )}</Async>
    </div>
  );
}

// ── 7. Ops (A7·A8) ──
export function Ops() {
  const st = useApi<{ updatedAt: string; runtimes: Record<string, { installed: boolean; version: string | null; health: string; authenticated: string; usage: { available: boolean; reason?: string } }> }>("/api/ops/status");
  return (
    <div className="screen">
      <h2>Ops</h2>
      <Async state={st}>{(s) => (
        <Card title={`런타임 상태 · ${s.updatedAt.slice(0, 19)}`}>
          <Table cols={["런타임", "건강", "버전", "인증", "usage"]} rows={Object.entries(s.runtimes).map(([k, v]) => [
            k, <Badge kind={v.health === "ok" ? "ok" : "muted"}>{v.health}</Badge>, v.version ?? "—", v.authenticated,
            v.usage.available ? "가능" : <span className="muted" title={v.usage.reason}>불가</span>,
          ])} />
        </Card>
      )}</Async>
    </div>
  );
}

// ── A85/A99 확인 다이얼로그(A92 — 포커스 트랩·ESC·키보드) ──
// projectRoot 변경 = 비가역 config 쓰기이므로 dryRun 프리뷰 후 명시 확인 게이트. 취소 시 어떤 쓰기도 안 함(A101).
function ConfirmDialog({ title, onCancel, children }: { title: string; onCancel: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const focusables = () => Array.from(
      box.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')
    ).filter((x) => !x.hasAttribute("disabled") && x.tabIndex !== -1);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onCancel(); return; }
      if (e.key !== "Tab") return;
      const f = focusables();
      const first = f[0], last = f[f.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    box.addEventListener("keydown", onKey);
    return () => box.removeEventListener("keydown", onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="cfm-title" ref={ref}>
        <h3 id="cfm-title">{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ── 8. Settings (F3 M11 — projectRoot 편집·A68~A71·A85·A94·A97·A99·A101) ──
export function Settings() {
  const st = useApi<SettingsInfo>("/api/settings");
  return (
    <div className="screen">
      <h2>Settings</h2>
      {/* A83: 현재값·편집폼이 하나의 3-state 로 — 조회 실패가 화면 전체를 무너뜨리지 않음 */}
      <Async state={st}>{(s) => <SettingsBody info={s} onSaved={st.reload} />}</Async>
    </div>
  );
}

function SettingsBody({ info, onSaved }: { info: SettingsInfo; onSaved: () => void }) {
  const [path, setPath] = useState("");
  const [preview, setPreview] = useState<ProjectRootPreview | null>(null); // dryRun 프리뷰(확인 다이얼로그 오픈 트리거)
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);   // 검증(dryRun) 인라인 에러
  const [savedAt, setSavedAt] = useState<string | null>(null); // 저장 성공 토스트

  const provisioned = info.projectsHomeProvisioned;

  // "검증" → dryRun:true 프리뷰(디스크 미변경). 성공 시 확인 다이얼로그 오픈. 400/409 → 한국어 인라인(A5).
  const doValidate = async () => {
    setBusy(true); setErr(null); setSavedAt(null); setPreview(null);
    try {
      const r = await postProjectRoot(path.trim(), true);
      if ("ok" in r) setPreview(r); // dryRun 응답(written:false)
    } catch (e) {
      if (e instanceof ProjectRootError) setErr(projectRootErrorText(e.code, e.status));
      else setErr(String(e));
    } finally { setBusy(false); }
  };

  return (
    <>
      <Card title="설정">
        <Table cols={["항목", "값"]} rows={[
          ["projectRoot (현재 유효값)", <code className="path">{info.projectRoot}</code>],
          ["projectsHome (경계)", info.projectsHome ? <code className="path">{info.projectsHome}</code> : <Badge kind="warn">미설정</Badge>],
          ["정의 편집(F7)", info.definitionEditEnabled ? <Badge kind="warn">활성</Badge> : <Badge kind="ok">비활성</Badge>],
          ["파일수정 API", info.mutationEnabled ? <Badge kind="warn">활성</Badge> : <Badge kind="ok">비활성(조회 전용)</Badge>],
        ]} />
      </Card>

      {/* W-D/A97: 미프로비저닝 → 편집 폼 비활성 + 정확한 프로비저닝 액션(데드엔드 방지) */}
      {!provisioned ? (
        <Card title="projectRoot 편집 (사용 불가)">
          <div className="banner warn" role="note">
            <p>⚠ 프로젝트 경계가 아직 프로비저닝되지 않았습니다.</p>
            <p className="muted">
              편집을 활성화하려면 <code className="path">HARNESS_PROJECTS_HOME</code> 환경변수로 프로젝트 경계를 지정하고 서버를 재시작하세요.
            </p>
            {info.projectsHome && (
              <p className="muted">감지된 경로 후보: <code className="path">{info.projectsHome}</code></p>
            )}
          </div>
          <fieldset className="form" disabled aria-disabled="true">
            <label className="full">프로젝트 루트 경로
              <input value="" placeholder="경계 프로비저닝 후 사용 가능" readOnly />
            </label>
          </fieldset>
        </Card>
      ) : (
        <Card title="projectRoot 편집 (A71 · 재시작 후 반영)">
          <div className="form">
            <label className="full">새 프로젝트 루트 경로 (절대경로)
              <input value={path} onChange={(e) => { setPath(e.target.value); setErr(null); }}
                placeholder={info.projectsHome ? `${info.projectsHome}/…` : "/absolute/path/to/project"}
                aria-invalid={err ? "true" : undefined} maxLength={4096} spellCheck={false} />
            </label>
            <p className="muted full">경계(projectsHome) 하위의 하네스 디렉토리만 허용됩니다 · 검증(미리보기) 후 확인해야 저장됩니다(디스크 미변경).</p>
            <button className="primary" disabled={busy || !path.trim()} onClick={doValidate}>
              {busy && !preview ? "검증 중…" : "검증 (미리보기)"}
            </button>
          </div>
          {err && <p className="banner err" role="alert">⚠ {err}</p>}
          {savedAt && (
            <p className="banner ok" role="status">✓ 저장됨 · 재시작 후 반영됩니다 ({savedAt.slice(0, 19)})</p>
          )}
        </Card>
      )}

      {/* F7 A78/A85: 정의 편집 게이트 토글 — off 기본·고위험 인지 후 활성. off 시 편집기 뷰어 전용 */}
      <DefinitionEditToggle enabled={info.definitionEditEnabled} onSaved={onSaved} />

      {/* A85/A99/A101: dryRun 프리뷰 확인 다이얼로그 → "저장"=dryRun:false 쓰기. 취소 시 어떤 쓰기도 안 함 */}
      {preview && (
        <ProjectRootConfirm
          path={path.trim()}
          preview={preview}
          onCancel={() => setPreview(null)}
          onSaved={(appliedAt) => { setPreview(null); setSavedAt(appliedAt); setPath(""); onSaved(); }}
        />
      )}
    </>
  );
}

// A85/A99/A101 확인 다이얼로그 — 프리뷰 결과 표시 + activeRunsWarning>0 시 2선택 + "저장"(dryRun:false).
function ProjectRootConfirm({ path, preview, onCancel, onSaved }: {
  path: string; preview: ProjectRootPreview; onCancel: () => void; onSaved: (appliedAt: string) => void;
}) {
  const warn = preview.activeRunsWarning;
  const [choice, setChoice] = useState<OrphanChoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const doSave = async () => {
    setBusy(true); setErr(null);
    try {
      // A99 (a): 활성 run 취소 후 재시작(cancel 경로 재사용) → 그다음 실제 쓰기.
      if (choice === "cancel-first") await cancelActiveRuns();
      const r = await postProjectRoot(path, false); // dryRun:false = 실제 config 쓰기
      if ("accepted" in r) onSaved(r.appliedAt);
    } catch (e) {
      if (e instanceof ProjectRootError) setErr(projectRootErrorText(e.code, e.status));
      else setErr(String(e));
    } finally { setBusy(false); }
  };

  return (
    <ConfirmDialog title="프로젝트 루트 변경 확인" onCancel={onCancel}>
      <p className="muted">아래 경로로 <b>config 를 변경</b>합니다. 이 변경은 <b>서버 재시작 후</b> 반영됩니다(라이브 재바인딩 아님).</p>
      <Table cols={["항목", "값"]} rows={[
        ["적용될 유효 루트", <code className="path">{preview.effectiveRoot}</code>],
        ["재시작 필요", "예 (requiresRestart)"],
        ["활성 run", warn > 0 ? <Badge kind="warn">{warn}건</Badge> : <Badge kind="ok">없음</Badge>],
      ]} />

      {/* W-B1/A99: activeRunsWarning>0 일 때만 2선택 명시(과경고 금지) */}
      {requiresOrphanChoice(warn) && (
        <fieldset className="form" style={{ marginTop: 12 }}>
          <legend>활성 run 처리 (A99 · 명시 선택 필요)</legend>
          <label className="check">
            <input type="radio" name="orphan" checked={choice === "cancel-first"}
              onChange={() => setChoice("cancel-first")} />
            활성 run 취소 후 재시작 (통제 유지 · 진행 중 {warn}건을 취소)
          </label>
          <label className="check">
            <input type="radio" name="orphan" checked={choice === "headless-continue"}
              onChange={() => setChoice("headless-continue")} />
            헤드리스 계속 승인 (⚠ 통제 상실 · 재시작 후에도 계속 실행되어 API 토큰이 소진될 수 있음)
          </label>
        </fieldset>
      )}

      {err && <p className="banner err" role="alert">⚠ {err}</p>}

      <div className="modal-actions">
        <button onClick={onCancel} disabled={busy}>취소 (변경 없음)</button>
        <button className="primary" disabled={busy || !canSave(warn, choice)} onClick={doSave}>
          {busy ? "저장 중…" : "저장 (config 쓰기)"}
        </button>
      </div>
    </ConfirmDialog>
  );
}

// F7 A78/A85 — 정의 편집 게이트 토글. off 기본(fail-closed). 켜기 = 고위험(첫 파일 쓰기 기능) → 확인 다이얼로그.
// 끄기는 위험 감소이므로 직접 적용. off 시 편집기 뷰어 전용(GET editable=false → PUT/rollback 403).
function DefinitionEditToggle({ enabled, onSaved }: { enabled: boolean; onSaved: () => void }) {
  const [confirmOn, setConfirmOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const apply = async (next: boolean) => {
    setBusy(true); setErr(null);
    try {
      await setDefinitionEdit(next);
      setConfirmOn(false);
      onSaved();
    } catch (e) {
      setErr(e instanceof DefEditError ? defEditErrorText(e.code, e.status, e.detail) : String(e));
    } finally { setBusy(false); }
  };

  return (
    <Card title="정의 편집 게이트 (F7 · A78 · 고위험)">
      <p className="muted">
        {enabled ? <><Badge kind="warn">활성</Badge> 에이전트/스킬 정의 파일(.claude) 편집이 허용됩니다.</>
                 : <><Badge kind="ok">비활성</Badge> 편집기는 뷰어 전용입니다(파일 쓰기 불가).</>}
      </p>
      <div className="detail-actions">
        {enabled
          ? <button disabled={busy} onClick={() => apply(false)}>{busy ? "적용 중…" : "정의 편집 끄기 (뷰어 전용으로)"}</button>
          : <button className="primary" disabled={busy} onClick={() => { setErr(null); setConfirmOn(true); }}>정의 편집 켜기…</button>}
      </div>
      {err && <p className="banner err" role="alert">⚠ {err}</p>}

      {/* A85: 활성화는 첫 파일 쓰기 기능 → 고위험 명시 확인 게이트 */}
      {confirmOn && (
        <ConfirmDialog title="정의 편집 활성화 확인 (고위험)" onCancel={() => setConfirmOn(false)}>
          <p className="muted">
            정의 편집을 켜면 UI 에서 <b>.claude 정의 파일(에이전트/스킬)을 직접 수정</b>할 수 있게 됩니다.
            이는 읽기전용 원칙의 유일한 예외이며 <b>파일이 곧 실행 정의</b>이므로 손상 시 실행에 직접 영향을 줍니다.
          </p>
          <p className="warn-text">⚠ 편집자=실행자 전제(로컬 단일 사용자). 저장은 원자 교체·직전 1개 백업으로 되돌릴 수 있습니다.</p>
          {err && <p className="banner err" role="alert">⚠ {err}</p>}
          <div className="modal-actions">
            <button onClick={() => setConfirmOn(false)} disabled={busy}>취소</button>
            <button className="primary" disabled={busy} onClick={() => apply(true)}>{busy ? "적용 중…" : "활성화"}</button>
          </div>
        </ConfirmDialog>
      )}
    </Card>
  );
}
