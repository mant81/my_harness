// API 라우트 등록. 보안 미들웨어(token/Host/Origin/denylist)는 security.ts.
import { constants } from "node:fs";
import { open, readdir, realpath, lstat } from "node:fs/promises";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import { detectRuntimes } from "../adapters/runtime.js";
import { harnessInventory, readAgents, readSkills } from "../adapters/harness.js";
import { listRuns, getRun, readEvents, readRunAgents, queryRuns } from "../adapters/runs.js";
import { detectDrift, syncPlan } from "../adapters/drift.js";
import { stateStats, settings } from "../adapters/statestats.js";
import { RunsQuery } from "../schemas.js";
import { isSafeSegment, isWithinRoot } from "../lib/paths.js";
import { deniedPath } from "../security.js";
import { RunRequest, launchRun } from "../exec-run.js";
import { cancelRun } from "../supervisor/reconcile.js";
import { join as pjoin } from "node:path";

const ARTIFACT_MAX = 8 * 1024 * 1024; // 8MB 상한

export function registerApi(app: FastifyInstance, projectRoot: string): void {
  app.get("/api/runtimes", async () => detectRuntimes());

  app.get("/api/harness", async () => harnessInventory(projectRoot));

  // :name 은 논리적 이름(메모리 배열 필터 — FS 접근 아님). 공백 포함 이름 허용, 길이만 제한.
  const okName = (n: string) => n.length > 0 && n.length <= 200;

  app.get("/api/agents", async () => ({ agents: await readAgents(projectRoot) }));
  app.get<{ Params: { name: string } }>("/api/agents/:name", async (req, reply) => {
    if (!okName(req.params.name)) return reply.code(400).send({ error: "invalid-name" });
    const found = (await readAgents(projectRoot)).find((a) => a.name === req.params.name);
    return found ?? reply.code(404).send({ error: "not-found" });
  });

  app.get("/api/skills", async () => ({ skills: await readSkills(projectRoot) }));
  app.get<{ Params: { name: string } }>("/api/skills/:name", async (req, reply) => {
    if (!okName(req.params.name)) return reply.code(400).send({ error: "invalid-name" });
    const found = (await readSkills(projectRoot)).find((s) => s.name === req.params.name);
    return found ?? reply.code(404).send({ error: "not-found" });
  });

  // 무인자(raw 쿼리 부재) → 기존 listRuns({runs} 계약 불변). 인자 → RunsQuery 검증 후 queryRuns.
  // presence 판단은 Zod default 적용 前 raw 쿼리로(default가 무인자를 인자로 오판 방지).
  app.get<{ Querystring: Record<string, unknown> }>("/api/runs", async (req, reply) => {
    if (Object.keys(req.query ?? {}).length === 0) return listRuns(projectRoot);
    const parsed = RunsQuery.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: "invalid-query", detail: parsed.error.issues });
    return queryRuns(projectRoot, parsed.data);
  });
  app.get<{ Params: { runId: string } }>("/api/runs/:runId", async (req, reply) => {
    const r = await getRun(projectRoot, req.params.runId);
    return r ?? reply.code(404).send({ error: "not-found" });
  });
  app.get<{ Params: { runId: string }; Querystring: { after?: string; limit?: string } }>(
    "/api/runs/:runId/events",
    async (req) => {
      // after 미지정 = -1(seq 0 포함). 지정 시 그 값 이후(exclusive).
      const after = req.query.after !== undefined ? Number.parseInt(req.query.after, 10) : -1;
      const limit = Number.parseInt(req.query.limit ?? "200", 10);
      return readEvents(projectRoot, req.params.runId, after, limit); // 클램프는 adapter 내부
    },
  );
  app.get<{ Params: { runId: string } }>("/api/runs/:runId/agents", async (req) =>
    readRunAgents(projectRoot, req.params.runId));

  // artifact list + serve(untrusted): SAFE_SEGMENT·denylist·심링크 거부·O_NOFOLLOW·nosniff·attachment·크기 상한.
  app.get<{ Params: { runId: string } }>("/api/runs/:runId/artifacts", async (req, reply) => {
    if (!isSafeSegment(req.params.runId)) return reply.code(400).send({ error: "invalid-runId" });
    const dir = join(projectRoot, "_workspace", "runs", req.params.runId, "artifacts");
    try {
      const e = await readdir(dir, { withFileTypes: true });
      return { files: e.filter((x) => x.isFile() && !x.isSymbolicLink()).map((x) => x.name) };
    } catch { return { files: [] }; }
  });
  app.get<{ Params: { runId: string; "*": string } }>("/api/runs/:runId/artifacts/*", async (req, reply) => {
    if (!isSafeSegment(req.params.runId)) return reply.code(400).send({ error: "invalid-runId" });
    const rel = req.params["*"] ?? "";
    const segs = rel.split("/");
    if (segs.length === 0 || !segs.every(isSafeSegment) || deniedPath(rel)) return reply.code(400).send({ error: "invalid-path" });
    const runsRoot = join(projectRoot, "_workspace", "runs");
    const base = join(runsRoot, req.params.runId, "artifacts");
    const target = join(base, ...segs);
    if (!isWithinRoot(base, target)) return reply.code(400).send({ error: "out-of-bounds" });
    // 앵커를 **walk 이전에 선계산**(base swap 창 축소, agy R4). realBase 가 project 내여야.
    const realRoot = await realpath(projectRoot);
    const realBase = await realpath(base).catch(() => null);
    if (!realBase || !isWithinRoot(realRoot, realBase)) return reply.code(400).send({ error: "bad-base" });
    // **base 컴포넌트(runId·artifacts)부터** leaf 부모까지 전 경로 symlink 구조적 거부(base-symlink→in-project 노출 차단).
    const walk = [join(runsRoot, req.params.runId), base, ...segs.slice(0, -1).map((_, i) => join(base, ...segs.slice(0, i + 1)))];
    for (const seg of walk) {
      const l = await lstat(seg).catch(() => null);
      if (!l || l.isSymbolicLink()) return reply.code(400).send({ error: "symlink-in-path" });
    }
    // leaf O_NOFOLLOW 로 먼저 open(check-reopen TOCTOU 제거). 그 뒤 fstat(크기·정규) + realpath 이중 앵커.
    let fh;
    try { fh = await open(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)); }
    catch { return reply.code(404).send({ error: "not-found" }); }
    try {
      const st = await fh.stat();
      if (!st.isFile()) return reply.code(404).send({ error: "not-file" });
      if (st.size > ARTIFACT_MAX) return reply.code(413).send({ error: "too-large" });
      // target 이 (선계산된) realBase 내인지 — 내부 symlink→타경로 차단.
      const real = await realpath(target);
      if (!isWithinRoot(realBase, real)) return reply.code(400).send({ error: "escape" });
      // dev/ino 바인딩: open 한 fd 와 현재 경로가 같은 inode 인지(open↔check 사이 부모 swap 탐지).
      const l = await lstat(target).catch(() => null);
      if (!l || l.ino !== st.ino || l.dev !== st.dev) return reply.code(409).send({ error: "path-changed" });
      const buf = Buffer.alloc(Math.min(st.size, ARTIFACT_MAX)); // 크기 상한 내로만 read(open 후 성장 방어)
      await fh.read(buf, 0, buf.length, 0);
      reply.header("Content-Type", "text/plain; charset=utf-8");
      reply.header("Content-Disposition", `attachment; filename="${segs[segs.length - 1]!.replace(/[^A-Za-z0-9._-]/g, "_")}"`);
      reply.header("X-Content-Type-Options", "nosniff");
      return reply.send(buf);
    } finally { await fh.close().catch(() => {}); }
  });

  // drift
  app.get("/api/drift", async () => ({ findings: await detectDrift(projectRoot) }));
  app.post("/api/drift/sync-plan", async () => syncPlan(projectRoot)); // 무변경(계획만)

  // overview 상태·통계(A35-A38) + settings
  app.get("/api/overview/state-stats", async () => stateStats(projectRoot));
  app.get("/api/settings", async () => settings(projectRoot));

  // ops status(A7·A8): 런타임 설치·버전 + usage=참조(TTY 제약).
  app.get("/api/ops/status", async () => {
    const rt = await detectRuntimes();
    return {
      updatedAt: new Date().toISOString(),
      runtimes: Object.fromEntries(Object.entries(rt).map(([k, v]) => [k, {
        installed: v.installed, version: v.version, health: v.installed ? "ok" : "absent",
        authenticated: "unknown", usage: { available: false, reason: "interactive slash command not available from non-TTY" },
      }])),
    };
  });

  // 실행(M5, 위험작업): Zod 검증 → dry-run(파일 미기록 미리보기) 또는 spawn.
  app.post("/api/runs", async (req, reply) => {
    const parsed = RunRequest.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid-request", detail: parsed.error.issues });
    return launchRun(projectRoot, parsed.data);
  });
  app.post<{ Params: { runId: string } }>("/api/runs/:runId/cancel", async (req, reply) => {
    if (!isSafeSegment(req.params.runId)) return reply.code(400).send({ error: "invalid-runId" });
    const runDir = pjoin(projectRoot, "_workspace", "runs", req.params.runId);
    return cancelRun(runDir, req.params.runId);
  });

  app.get("/api/health", async () => ({ ok: true }));
  // /healthz — **비인증 liveness**(/api/ 아니므로 게이트 통과). 런처 멱등 판정용. 데이터 없음.
  app.get("/healthz", async () => ({ ok: true }));
}
