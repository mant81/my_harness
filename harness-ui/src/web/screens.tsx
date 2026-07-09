// 9화면(§IA: Overview·Build·Agents·Skills·Runs·Docs·Drift·Ops·Settings). 모두 읽기(mutating=Build dry-run/실행·Drift sync-plan만).
// XSS: 전 텍스트 React escape. dangerouslySetInnerHTML 는 오직 renderMarkdown(markdown-it html:false + DOMPurify) 통과분에만(F5 DV8).
import { useState, useEffect } from "react";
import { useApi, Async, Badge, Card, Table, ConfBadge, MetricCell } from "./ui.js";
import {
  type OverviewMetrics, type AgentsMetrics, type SkillsMetrics, type Coverage,
  coverageSummary, coverageWindowText, truncatedReasonText, windowEmptyNotice, overviewSuggestions,
} from "./metrics.js";
import {
  apiPost, fetchArtifact, downloadDoc, downloadArtifact,
  encodeDocPath, DownloadTooLargeError,
  type DocsNode, type DocsTree, type DocPreview,
} from "./api.js";
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

// ── 3. Agents (A3) ──
export function Agents() {
  const st = useApi<{ agents: Array<{ name: string; runtime: string; sourcePath: string; role: string; skills: string[] }> }>("/api/agents");
  const [sel, setSel] = useState<string | null>(null);
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
            </Card>
          ) : null; })()}
        </div>
      )}</Async>
      {/* F6 W3: usage 섹션은 자체 metrics/agents 페치로 독립 로딩(W9/A83) */}
      <AgentsUsage />
    </div>
  );
}

// ── 4. Skills (A4·A43 triggers) ──
export function Skills() {
  const st = useApi<{ skills: Array<{ name: string; description: string; triggers: string; references: string[]; runtimePaths: string[] }> }>("/api/skills");
  const [sel, setSel] = useState<string | null>(null);
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
            </Card>
          ) : null; })()}
        </div>
      )}</Async>
      {/* F6 W4: usage 섹션은 자체 metrics/skills 페치로 독립 로딩(W9/A83) */}
      <SkillsUsage />
    </div>
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
  const [sel, setSel] = useState<string | null>(null);
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

// ── 8. Settings ──
export function Settings() {
  const st = useApi<{ projectRoot: string; mutationEnabled: boolean }>("/api/settings");
  return (
    <div className="screen">
      <h2>Settings</h2>
      <Async state={st}>{(s) => (
        <Card title="설정 (조회 전용)">
          <Table cols={["항목", "값"]} rows={[
            ["projectRoot", s.projectRoot],
            ["파일수정 API", s.mutationEnabled ? <Badge kind="warn">활성</Badge> : <Badge kind="ok">비활성(v0.5)</Badge>],
          ]} />
        </Card>
      )}</Async>
    </div>
  );
}
