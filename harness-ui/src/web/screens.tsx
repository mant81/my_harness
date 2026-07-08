// 8화면(§IA: Overview·Build·Agents·Skills·Runs·Drift·Ops·Settings). 모두 읽기(mutating=Build dry-run/실행·Drift sync-plan만).
// XSS: 전 텍스트 React escape. innerHTML/dangerouslySetInnerHTML 미사용. 사용자 입력은 서버 Zod 재검증.
import { useState } from "react";
import { useApi, Async, Badge, Card, Table } from "./ui.js";
import { apiPost, fetchArtifact } from "./api.js";

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

// ── 5. Runs (A5·A6 — 목록·상세·이벤트·agent status·artifact) ──
export function Runs() {
  const st = useApi<{ runs: Array<{ runId: string; valid: boolean; status: { state: string; progress: number; updatedAt: string } | null }> }>("/api/runs");
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div className="screen">
      <h2>Runs</h2>
      <Async state={st}>{(d) => d.runs.length === 0 ? <div className="muted">실행 없음 (A5be)</div> : (
        <div className="split">
          <Table cols={["runId", "상태", "진행", "갱신"]} rows={d.runs.map((r) => [
            <button className="link" onClick={() => setSel(r.runId)}>{r.runId.slice(0, 30)}</button>,
            r.status ? <Badge kind={r.status.state === "completed" ? "ok" : r.status.state === "failed" ? "err" : "muted"}>{r.status.state}</Badge> : <Badge kind="err">무효</Badge>,
            r.status ? `${r.status.progress}%` : "—", r.status?.updatedAt?.slice(0, 19) ?? "—",
          ])} />
          {sel && <RunDetail key={sel} runId={sel} />}
        </div>
      )}</Async>
    </div>
  );
}

function RunDetail({ runId }: { runId: string }) {
  const run = useApi<{ manifest: unknown; status: { state: string; exitCode: number | null; error: string | null } | null }>(`/api/runs/${encodeURIComponent(runId)}`);
  const ev = useApi<{ events: Array<{ seq: number; type: string; message?: string }> }>(`/api/runs/${encodeURIComponent(runId)}/events`);
  const ag = useApi<{ agents: Array<{ name: string; state: string }> }>(`/api/runs/${encodeURIComponent(runId)}/agents`);
  const arts = useApi<{ files: string[] }>(`/api/runs/${encodeURIComponent(runId)}/artifacts`);
  const [art, setArt] = useState<string>("");
  return (
    <Card title={runId.slice(0, 40)}>
      <Async state={run}>{(r) => (
        <p>상태: {r.status ? <Badge kind={r.status.state === "completed" ? "ok" : r.status.state === "failed" ? "err" : "muted"}>{r.status.state}</Badge> : "무효"} {r.status?.exitCode != null && `· exit ${r.status.exitCode}`}{r.status?.error && <span className="error"> · {r.status.error}</span>}</p>
      )}</Async>
      <Async state={ag}>{(a) => a.agents.length > 0 ? <Table cols={["에이전트", "상태"]} rows={a.agents.map((x) => [x.name, x.state])} /> : <p className="muted">에이전트 상태 없음</p>}</Async>
      <Async state={ev}>{(e) => (
        <div className="events">{e.events.length === 0 ? <p className="muted">이벤트 없음</p> : e.events.slice(-30).map((x) => (
          <div key={x.seq} className="evline"><span className="seq">#{x.seq}</span> <b>{x.type}</b> {x.message ?? ""}</div>
        ))}</div>
      )}</Async>
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
