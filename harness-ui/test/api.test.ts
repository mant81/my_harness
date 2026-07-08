import { describe, it, expect } from "vitest";
import { buildServer, projectRoot } from "../src/server/index.js";

describe("api (M1) — 실제 하네스 레포 기준", () => {
  const app = buildServer();

  it("A1: server builds + /api/health", async () => {
    const r = await app.inject({ method: "GET", url: "/api/health" });
    expect(r.statusCode).toBe(200);
    expect(r.json().ok).toBe(true);
  });

  it("A3api: /api/harness returns agents/skills counts", async () => {
    const r = await app.inject({ method: "GET", url: "/api/harness" });
    expect(r.statusCode).toBe(200);
    const b = r.json();
    // 이 레포 = myHarness 팩토리: claude 에이전트≥1, 스킬≥1
    expect(b.claude.agents).toBeGreaterThanOrEqual(1);
    expect(b.claude.skills).toBeGreaterThanOrEqual(1);
    expect(b.projectRoot).toBe(projectRoot);
  });

  it("A5be: /api/runs safe when empty/absent", async () => {
    const r = await app.inject({ method: "GET", url: "/api/runs" });
    expect(r.statusCode).toBe(200);
    expect(Array.isArray(r.json().runs)).toBe(true);
  });

  it("agents/skills lists + invalid name 400", async () => {
    expect((await app.inject({ url: "/api/agents" })).statusCode).toBe(200);
    expect((await app.inject({ url: "/api/skills" })).statusCode).toBe(200);
    expect((await app.inject({ url: "/api/agents/..%2fetc" })).statusCode).toBeGreaterThanOrEqual(400);
  });
});
