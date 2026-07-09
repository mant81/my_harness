// API 라우트 등록. 보안 미들웨어(token/Host/Origin/denylist)는 security.ts.
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import { detectRuntimes } from "../adapters/runtime.js";
import { harnessInventory, readAgents, readSkills } from "../adapters/harness.js";
import { listRuns, getRun, readEvents, readRunAgents, queryRuns } from "../adapters/runs.js";
import { detectDrift, syncPlan } from "../adapters/drift.js";
import { stateStats, settings } from "../adapters/statestats.js";
import { docsTree } from "../adapters/docs.js";
import { RunsQuery } from "../schemas.js";
import { z } from "zod";
import { overview as metricsOverview, agents as metricsAgents, skills as metricsSkills, type MetricsOptions } from "../adapters/metrics.js";
import { MAX_RUNS_SCAN } from "../adapters/runs.js";
import { isSafeSegment, isSafeDocsSegment } from "../lib/paths.js";
import { openSafeFile, sendDownload, sendPreview, DOWNLOAD_MAX, VIEW_MAX } from "../lib/servefile.js";
import { deniedPath, deniedDocsPath } from "../security.js";
import { RunRequest, launchRun } from "../exec-run.js";
import { cancelRun } from "../supervisor/reconcile.js";
import { join as pjoin } from "node:path";

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

  // artifact list + serve(untrusted): 공용 경화 리더(openSafeFile) 소비 — SAFE_SEGMENT·denylist·심링크 거부·
  // O_NOFOLLOW·dev/ino 바인딩·CSP·nosniff·attachment·크기 상한. base 앵커 = runId/artifacts.
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
    const runsRoot = join(projectRoot, "_workspace", "runs");
    const base = join(runsRoot, req.params.runId, "artifacts");
    const segs = (req.params["*"] ?? "").split("/");
    const r = await openSafeFile(projectRoot, base, segs, {
      denyPath: deniedPath, ancestors: [join(runsRoot, req.params.runId)],
    });
    if (!r.ok) return reply.code(r.code).send({ error: r.error });
    try { return await sendDownload(reply, r, DOWNLOAD_MAX); }
    finally { await r.fh.close().catch(() => {}); }
  });

  // F5 docs 뷰어(DV1~DV9): 트리(화이트루트 docs/ 재귀) + 파일 열람. 읽기전용(I8).
  // 미리보기(기본) = JSON {content,mime,renderable,binary,truncated,size}(원문 텍스트·sanitize는 클라).
  // ?download=1 = attachment 원본(다운로드 前 413·중간중단 금지). 두 응답 모두 엄격 CSP + nosniff.
  app.get("/api/docs", async () => docsTree(projectRoot));
  app.get<{ Params: { "*": string }; Querystring: { download?: string } }>("/api/docs/*", async (req, reply) => {
    const rel = req.params["*"] ?? "";
    const segs = rel.split("/");
    const base = join(projectRoot, "docs");
    const r = await openSafeFile(projectRoot, base, segs, { denyPath: deniedDocsPath, isSafeSeg: isSafeDocsSegment });
    if (!r.ok) return reply.code(r.code).send({ error: r.error });
    try {
      if (req.query.download !== undefined) return await sendDownload(reply, r, DOWNLOAD_MAX);
      return await sendPreview(reply, r, rel, VIEW_MAX);
    } finally { await r.fh.close().catch(() => {}); }
  });

  // F6 metrics(M9 · 계층 B 읽기전용 집계). 입력 clamp·Zod. 빈/손상/디렉토리없음 → 안전 빈 응답(에러 아님).
  //   from/to = ISO window(선택). limit = 집계 편입 run 상한(1..MAX_RUNS_SCAN clamp).
  const MetricsQuery = z.object({
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
    limit: z.preprocess((v) => {
      if (v === undefined || v === null || v === "") return undefined;
      const n = typeof v === "number" ? v : Number.parseInt(String(v), 10);
      if (!Number.isFinite(n)) return undefined;
      return Math.min(MAX_RUNS_SCAN, Math.max(1, Math.trunc(n)));
    }, z.number().int().min(1).max(MAX_RUNS_SCAN).optional()),
  });
  const parseMetricsOpts = (q: unknown): MetricsOptions => {
    const p = MetricsQuery.safeParse(q ?? {});
    if (!p.success) return {}; // 잘못된 window → 전체 집계로 안전 폴백(에러 아님·A5be)
    const fromMs = p.data.from ? Date.parse(p.data.from) : null;
    const toMs = p.data.to ? Date.parse(p.data.to) : null;
    return { fromMs: Number.isFinite(fromMs) ? fromMs : null, toMs: Number.isFinite(toMs) ? toMs : null, limit: p.data.limit ?? null };
  };
  app.get<{ Querystring: Record<string, unknown> }>("/api/metrics/overview", async (req) =>
    metricsOverview(projectRoot, parseMetricsOpts(req.query)));
  app.get<{ Querystring: Record<string, unknown> }>("/api/metrics/agents", async (req) =>
    metricsAgents(projectRoot, parseMetricsOpts(req.query)));
  app.get<{ Querystring: Record<string, unknown> }>("/api/metrics/skills", async (req) =>
    metricsSkills(projectRoot, parseMetricsOpts(req.query)));

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
