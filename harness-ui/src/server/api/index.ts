// API 라우트 등록 (M1: read-only). 보안 미들웨어(token/Host/Origin)는 M4.
import type { FastifyInstance } from "fastify";
import { detectRuntimes } from "../adapters/runtime.js";
import { harnessInventory, readAgents, readSkills } from "../adapters/harness.js";
import { listRuns, getRun, readEvents, readRunAgents } from "../adapters/runs.js";

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

  app.get("/api/runs", async () => listRuns(projectRoot));
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

  app.get("/api/health", async () => ({ ok: true }));
}
