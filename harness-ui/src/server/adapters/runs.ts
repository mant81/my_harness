// runs reader (설계 §API /api/runs). _workspace/runs/** 스캔. 없거나 비어도 안전(A5be).
// 보안: runId SAFE_SEGMENT + symlink 거부 + realpath 경계. events는 스트리밍(무제한 read 방지).
import { constants } from "node:fs";
import { readdir, lstat, realpath, open } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import { join } from "node:path";
import { Manifest, Status, AgentState, Event, isSchemaValid } from "../schemas.js";
import { isSafeSegment, isWithinRoot } from "../lib/paths.js";

function runsDir(root: string): string { return join(root, "_workspace", "runs"); }
const MAX_LINE = 256 * 1024; // 라인 상한(과대 라인 skip)

// runId → 안전한 run 디렉토리 절대경로. base·leaf symlink/traversal/경계이탈이면 null.
async function safeRunDir(root: string, runId: string): Promise<string | null> {
  if (!isSafeSegment(runId)) return null;
  const base = runsDir(root);
  const dir = join(base, runId);
  try {
    // base(_workspace/runs)가 심링크로 프로젝트 밖을 재앵커하는 것 차단(codex#1).
    const realRoot = await realpath(root);
    const realBase = await realpath(base);
    if (!isWithinRoot(realRoot, realBase)) return null;
    const l = await lstat(dir);
    if (l.isSymbolicLink() || !l.isDirectory()) return null; // symlink run 디렉토리 거부
    const real = await realpath(dir);
    if (!isWithinRoot(realBase, real)) return null;
    return real;
  } catch { return null; }
}

// run 디렉토리 내 파일을 leaf symlink 없이 원자적으로 open(O_NOFOLLOW) — check-reopen TOCTOU 제거(codex R3).
// fd 확보 후 fstat 로 정규파일 확인. 열린 FileHandle 반환(호출측이 finally close). POSIX 기준; Windows는 O_NOFOLLOW 무시 가능(로컬 위협 낮음).
async function safeOpen(dir: string, name: string): Promise<FileHandle | null> {
  if (!/^[A-Za-z0-9._-]+$/.test(name)) return null; // 파일명 allowlist(traversal 차단)
  let h: FileHandle | null = null;
  try {
    h = await open(join(dir, name), constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    const st = await h.stat();
    if (!st.isFile()) { await h.close(); return null; }
    return h;
  } catch { if (h) await h.close().catch(() => {}); return null; }
}
async function readJsonSafe(dir: string, name: string): Promise<unknown | null> {
  const h = await safeOpen(dir, name);
  if (!h) return null;
  try { return JSON.parse(await h.readFile("utf8")); }
  catch { return null; }
  finally { await h.close().catch(() => {}); }
}

export async function listRuns(root: string): Promise<{ runs: Array<{ runId: string; status: unknown | null; valid: boolean }> }> {
  let ids: string[] = [];
  try {
    const entries = await readdir(runsDir(root), { withFileTypes: true });
    ids = entries.filter((e) => e.isDirectory() && isSafeSegment(e.name)).map((e) => e.name);
  } catch {
    return { runs: [] }; // 디렉토리 없음 = 빈(A5be)
  }
  const runs = [];
  for (const id of ids) {
    const dir = await safeRunDir(root, id);
    if (!dir) continue;
    const v = isSchemaValid(Status, await readJsonSafe(dir, "status.json"));
    runs.push({ runId: id, status: v.ok ? v.value : null, valid: v.ok });
  }
  return { runs };
}

export async function getRun(root: string, runId: string) {
  const dir = await safeRunDir(root, runId);
  if (!dir) return null;
  const manifest = isSchemaValid(Manifest, await readJsonSafe(dir, "manifest.json"));
  const status = isSchemaValid(Status, await readJsonSafe(dir, "status.json"));
  return {
    runId,
    manifest: manifest.ok ? manifest.value : null,
    status: status.ok ? status.value : null,
    manifestError: manifest.ok ? null : manifest.error,
    statusError: status.ok ? null : status.error,
  };
}

async function currentRunState(dir: string): Promise<string | null> {
  const v = isSchemaValid(Status, await readJsonSafe(dir, "status.json"));
  return v.ok ? v.value.state : null;
}

// events: cursor(after exclusive, 기본 -1로 seq 0 포함)+limit. 스트리밍(전체 read 금지).
export async function readEvents(root: string, runId: string, afterIn: number, limitIn: number) {
  const after = Number.isFinite(afterIn) ? Math.max(-1, Math.trunc(afterIn)) : -1;
  const limit = Math.min(1000, Math.max(1, Number.isFinite(limitIn) ? Math.trunc(limitIn) : 200));
  const empty = { items: [] as Event[], nextAfter: after, hasMore: false, runState: null as string | null, schemaVersion: "1" as const };
  const dir = await safeRunDir(root, runId);
  if (!dir) return empty;
  const runState = await currentRunState(dir);
  const h = await safeOpen(dir, "events.jsonl"); // O_NOFOLLOW open — leaf symlink·재open 갭 제거
  if (!h) return { ...empty, runState };
  const items: Event[] = [];
  let hasMore = false;
  try {
    for await (const line of h.readLines({ encoding: "utf8" })) { // FileHandle 스트리밍(전체 read 금지)
      if (!line || line.length > MAX_LINE) continue; // 빈/과대 라인 skip(seq 갭 가능 — 문서화)
      let obj: unknown;
      try { obj = JSON.parse(line); } catch { continue; }   // 파손 라인 skip
      const v = isSchemaValid(Event, obj);
      if (!v.ok || v.value.seq <= after) continue;
      if (items.length >= limit) { hasMore = true; break; }
      items.push(v.value);
    }
  } catch { /* 읽기 오류 → 지금까지 수집분 반환 */ }
  finally { await h.close().catch(() => {}); } // FD 확실히 close
  items.sort((a, b) => a.seq - b.seq);
  const page = items.slice(0, limit);
  return {
    items: page,
    nextAfter: page.length ? page[page.length - 1]!.seq : after,
    hasMore: hasMore || items.length > page.length,
    runState,
    schemaVersion: "1" as const,
  };
}

export async function readRunAgents(root: string, runId: string) {
  const dir = await safeRunDir(root, runId);
  if (!dir) return { agents: [] };
  const adir = join(dir, "agents");
  let files: string[] = [];
  try {
    const entries = await readdir(adir, { withFileTypes: true });
    files = entries.filter((e) => e.isFile() && e.name.endsWith(".json")).map((e) => e.name);
  } catch { return { agents: [] }; }
  const agents = [];
  for (const f of files) {
    const v = isSchemaValid(AgentState, await readJsonSafe(adir, f)); // leaf symlink 거부
    if (v.ok) agents.push(v.value);
  }
  return { agents };
}
