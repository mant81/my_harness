// e2e — 현 하네스(myHarness 레포) 기준 종단 검증.
// 실 HTTP 부팅 → bootstrap→session 교환(fragment 흉내) → 실 inventory/drift/state-stats/runtimes/ops → dry-run.
// 실행: HARNESS_STATE_HOME=<tmp> npx tsx test/e2e.mjs
import { buildServer, projectRoot } from "../src/server/index.ts";
import { makeSecurity } from "../src/server/security.ts";

const PORT = 5199;
const HOST = `127.0.0.1:${PORT}`;
const ORIGIN = `http://127.0.0.1:${PORT}`;
let fail = 0;
const ok = (c, m) => { console.log(`${c ? "PASS" : "FAIL"} — ${m}`); if (!c) fail++; };

const sec = makeSecurity(PORT);
const app = buildServer({ security: sec });
await app.listen({ port: PORT, host: "127.0.0.1" });
console.log(`e2e projectRoot=${projectRoot}`);

const j = async (path, opt = {}) => {
  const r = await fetch(`${ORIGIN}${path}`, { ...opt, headers: { host: HOST, ...(opt.headers ?? {}) } });
  return { code: r.status, body: await r.json().catch(() => null) };
};

try {
  // 0. 비인증 게이트: 토큰 없이 401
  ok((await j("/api/harness")).code === 401, "게이트: 토큰 없는 /api/harness → 401");
  // /healthz 는 비인증 통과
  ok((await j("/healthz")).code === 200, "liveness: /healthz 비인증 200");

  // 1. bootstrap→session 교환(client fragment 읽어 POST 흉내)
  const b0 = sec.bootstrap;
  const ex = await j("/api/auth/exchange", {
    method: "POST", headers: { origin: ORIGIN, "content-type": "application/json" },
    body: JSON.stringify({ bootstrap: b0 }),
  });
  ok(ex.code === 200 && typeof ex.body?.session === "string", "auth: bootstrap→session 교환 200");
  const S = ex.body.session;
  const auth = { authorization: `Bearer ${S}` };
  // 재사용 불가(rotate)
  const again = await j("/api/auth/exchange", { method: "POST", headers: { origin: ORIGIN, "content-type": "application/json" }, body: JSON.stringify({ bootstrap: b0 }) });
  ok(again.code === 401, "auth: 동일 bootstrap 재사용 → 401(single-use)");

  // 2. 실 inventory — 이 레포의 실제 에이전트/스킬 읽기(카운트는 claude/codex 별 집계)
  const inv = await j("/api/harness", { headers: auth });
  ok(inv.code === 200, "inventory: /api/harness 200");
  const nAgents = (inv.body?.claude?.agents ?? 0) + (inv.body?.codex?.agents ?? 0);
  const nSkills = (inv.body?.claude?.skills ?? 0) + (inv.body?.codex?.skills ?? 0);
  ok(nAgents >= 4, `inventory: 에이전트 ${nAgents}개(≥4)`);
  ok(nSkills >= 3, `inventory: 스킬 ${nSkills}개(≥3)`);
  ok(inv.body?.claude?.entrypoint === "CLAUDE.md", "inventory: CLAUDE.md 진입점 검출");
  // 실 에이전트 배열 — repo-qa 존재
  const ag = await j("/api/agents", { headers: auth });
  ok(ag.code === 200 && (ag.body?.agents ?? []).some((a) => a.name === "repo-qa"), "agents: repo-qa 에이전트 검출");

  // 3. 실 drift — claude↔codex, CLAUDE.md↔AGENTS.md
  const dr = await j("/api/drift", { headers: auth });
  ok(dr.code === 200 && Array.isArray(dr.body?.findings), `drift: /api/drift 200 (findings ${dr.body?.findings?.length ?? "?"})`);

  // 4. 실 state-stats — A35-A38
  const ss = await j("/api/overview/state-stats", { headers: auth });
  ok(ss.code === 200, "state-stats: /api/overview/state-stats 200");
  ok(ss.body?.configHealth && ss.body?.evolution, "state-stats: configHealth+evolution 존재");

  // 5. runtimes + ops/status
  const rt = await j("/api/runtimes", { headers: auth });
  ok(rt.code === 200 && typeof rt.body === "object", "runtimes: /api/runtimes 200");
  const ops = await j("/api/ops/status", { headers: auth });
  ok(ops.code === 200 && ops.body?.runtimes, "ops: /api/ops/status 200");

  // 6. dry-run 실행(파일 미기록 미리보기) — codex/claude argv 조립 검증
  const dryC = await j("/api/runs", {
    method: "POST", headers: { ...auth, origin: ORIGIN, "content-type": "application/json" },
    body: JSON.stringify({ runtime: "codex", mode: "audit", domain: "list files", dryRun: true }),
  });
  ok(dryC.code === 200 && dryC.body?.dryRun === true && dryC.body?.preview?.args?.[0] === "exec", `dry-run codex: preview.args (${JSON.stringify(dryC.body?.preview?.args ?? []).slice(0, 60)}…)`);
  // flag injection 방어: model 에 leading-dash → 400(valid 필드 + 악성 model 만)
  const inj = await j("/api/runs", {
    method: "POST", headers: { ...auth, origin: ORIGIN, "content-type": "application/json" },
    body: JSON.stringify({ runtime: "claude", mode: "audit", domain: "x", model: "--evil", dryRun: true }),
  });
  ok(inj.code === 400, "dry-run: model=--evil(flag injection) → 400");

  // 7. cross-origin mutating 거부
  const xo = await j("/api/runs", {
    method: "POST", headers: { ...auth, origin: "http://evil.com", "content-type": "application/json" },
    body: JSON.stringify({ runtime: "codex", mode: "audit", domain: "x", dryRun: true }),
  });
  ok(xo.code === 403, "origin: cross-origin POST → 403");

} finally {
  await app.close();
}
console.log(`\ne2e: ${fail === 0 ? "ALL PASS" : fail + " FAIL"}`);
process.exit(fail === 0 ? 0 : 1);
