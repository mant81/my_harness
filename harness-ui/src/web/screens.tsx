// 8화면(§IA: Overview·Build·Agents·Skills·Runs·Drift·Ops·Settings). 모두 읽기(mutating=Build dry-run/실행·Drift sync-plan만).
// XSS: 전 텍스트 React escape. innerHTML/dangerouslySetInnerHTML 미사용. 사용자 입력은 서버 Zod 재검증.
import { useState, useEffect } from "react";
import { useApi, Async, Badge, Card, Table } from "./ui.js";
import { apiPost, fetchArtifact } from "./api.js";
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

// ── 1. Overview (A2·A3·A35-A38) ──
export function Overview() {
  const inv = useApi<Inv>("/api/harness");
  const rt = useApi<Rt>("/api/runtimes");
  const st = useApi<Stats>("/api/overview/state-stats");
  return (
    <div className="screen">
      <h2>Overview</h2>
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
              p.project, p.resultDocs, p.missingNextStep ? <Badge kind="err">{p.missingNextStep}</Badge> : <Badge kind="ok">0</Badge>,
            ])} />
            <p className="muted">_workspace 방치: {s.d4.workspaceAbandoned} · manifest: {String(s.update.manifest)} · factoryDrift: {s.update.factoryDrift}</p>
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
  const [art, setArt] = useState<string>("");
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
      <Async state={arts}>{(f) => f.files.length > 0 ? (
        <div>
          <p className="muted">산출물:</p>
          {f.files.map((name) => <button key={name} className="link" onClick={() => fetchArtifact(runId, name).then(setArt).catch((e) => setArt(String(e)))}>{name}</button>)}
          {art && <pre className="out">{art.slice(0, 4000)}</pre>}
        </div>
      ) : <p className="muted">산출물 없음</p>}</Async>
    </Card>
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
