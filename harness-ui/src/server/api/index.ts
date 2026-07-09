// API 라우트 등록. 보안 미들웨어(token/Host/Origin/denylist)는 security.ts.
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import { detectRuntimes } from "../adapters/runtime.js";
import { harnessInventory, readAgents, readSkills, findAgent, agentFingerprint, resolveEditableAgent, resolveEditableSkill, type DefResolution } from "../adapters/harness.js";
import {
  canonicalizeDefinition, safeDefPath, readDefSafe, sha256, writeBackup, readBackup,
  writeDefSafe, withDefLock, MAX_DEF_BYTES, type DefKind,
} from "../adapters/defedit.js";
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
import { projectsHomeFromEnv, updateConfig, loadConfigFromDisk } from "../lib/config.js";
import { validateProjectRoot, revalidateForPersist } from "../lib/projectroot.js";
import { listEvalLoops, loopTrend, scorecardDetail, loopProposal } from "../adapters/evals.js";
import { loadEvalsConfig, updateEvalsConfig, EvalsConfigBody } from "../lib/evalsconfig.js";

// PV3: activeRunsWarning 산출. listRuns 재사용(신규 스캐너 금지) → status.json running 카운트.
//   재시작 시 고아될 라이브 supervised run 판정(owner 레지스트리 cross-restart 는 미사용 — 열린질문 4).
const ACTIVE_RUN_STATES = new Set<string>(["running"]);

// F7 PUT/rollback 요청 스키마(Zod 신뢰경계). 해시는 sha256 hex 64자 고정. content 는 char 상한(byte 상한은
//   핸들러에서 재검증 — UTF-8 byte ≥ char). evalProposal 은 파싱만(존재 시 fail-closed 거부·DW11).
const EvalProposalSchema = z.object({ nonce: z.string(), envelope: z.unknown() }).passthrough();
const PutDefBody = z.object({
  content: z.string().max(1048576), // 느슨한 char 상한(Fastify bodyLimit 정합) — byte 상한(MAX_DEF_BYTES)은 핸들러가 권위 검증
  baseHash: z.string().length(64),
  pathId: z.string().length(64),
  evalProposal: EvalProposalSchema.optional(),
}).strict();
const RollbackBody = z.object({
  expectedCurrentHash: z.string().length(64),
  backupHash: z.string().length(64),
}).strict();
async function countActiveRuns(projectRoot: string): Promise<number> {
  const { runs } = await listRuns(projectRoot);
  return runs.filter((r) => {
    if (!r.valid || !r.status || typeof r.status !== "object") return false;
    const state = (r.status as { state?: unknown }).state;
    return typeof state === "string" && ACTIVE_RUN_STATES.has(state);
  }).length;
}

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

  // F2(M10·A64): 에이전트 프리필 초안(정의에서 재도출·클라 주장 무시·read-only·side-effect 0).
  // :name 은 FS 재도출 진입점 → isSafeSegment 상향(../·공백/메타 거부, `/api/agents/:name` 의 okName 보다 엄격).
  // suggestedAllowedTools = 정의 tools = U⊆D 상한 D. permissionMode 는 항상 보수적 read-only(상향은 사용자 명시).
  app.get<{ Params: { name: string } }>("/api/agents/:name/run-template", async (req, reply) => {
    if (!isSafeSegment(req.params.name)) return reply.code(400).send({ error: "invalid-name" });
    const info = await findAgent(projectRoot, req.params.name);
    if (!info) return reply.code(404).send({ error: "not-found" });
    return {
      agent: info.name,
      runtime: info.runtime,
      domainTemplate: info.domainTemplate,
      targets: info.targets,
      suggestedAllowedTools: info.tools,
      permissionMode: "read-only",
      fingerprint: agentFingerprint(info),
    };
  });

  app.get("/api/skills", async () => ({ skills: await readSkills(projectRoot) }));
  app.get<{ Params: { name: string } }>("/api/skills/:name", async (req, reply) => {
    if (!okName(req.params.name)) return reply.code(400).send({ error: "invalid-name" });
    const found = (await readSkills(projectRoot)).find((s) => s.name === req.params.name);
    return found ?? reply.code(404).send({ error: "not-found" });
  });

  // ── F7(M12) 정의 편집기 — DW1~DW11. I8 읽기전용 원칙의 유일 예외(`.claude` 정의 편집만·게이트 스코프) ──
  // mutating(PUT/rollback/설정)은 security.ts onRequest 훅이 Host/Origin/token 자동 게이트(추가 배선 불요·/api 하위).
  // DW1 매 요청 strict boolean 판독 — 부재/손상/판독불가 config → false(fail-closed) → 403.
  async function isEditEnabled(): Promise<boolean> {
    try { return (await loadConfigFromDisk()).definitionEditEnabled === true; }
    catch { return false; } // unsupported-schema 등 throw → fail-closed
  }
  const editName = (n: string) => n.length > 0 && n.length <= 200; // :name 논리 이름(경로 아님)
  const resolveDef = (kind: DefKind, name: string): Promise<DefResolution> =>
    kind === "agent" ? resolveEditableAgent(projectRoot, name) : resolveEditableSkill(projectRoot, name);
  // DefResolution 오류 → HTTP 코드. not-found=404·ambiguous/codex-only=409(비결정 해소·범위밖 명시).
  const resErr = (e: Exclude<DefResolution, { ok: true }>["error"]) =>
    e === "not-found" ? 404 : 409;

  // GET 정의: 이름→정규 sourcePath 서버 재조회(DW2) → 안전 read(DW3) → content+baseHash+pathId+mtime+editable.
  function registerDefRoutes(kind: DefKind) {
    const seg = kind === "agent" ? "agents" : "skills";
    app.get<{ Params: { name: string } }>(`/api/${seg}/:name/definition`, async (req, reply) => {
      if (!editName(req.params.name)) return reply.code(400).send({ error: "invalid-name" });
      const r = await resolveDef(kind, req.params.name);
      if (!r.ok) return reply.code(resErr(r.error)).send({ error: r.error });
      const abs = await safeDefPath(projectRoot, r.sourcePath, kind);
      if (!abs) return reply.code(400).send({ error: "path-unsafe" });
      const f = await readDefSafe(abs);
      if (!f) return reply.code(404).send({ error: "not-found" });
      return {
        name: req.params.name, sourcePath: r.sourcePath, pathId: sha256(r.sourcePath),
        content: f.content, baseHash: sha256(f.content), mtimeMs: f.mtimeMs,
        editable: await isEditEnabled(),
      };
    });

    // PUT 저장: 게이트(DW1)·evalProposal fail-closed(DW11)·pathId 일치·낙관적 동시성(DW6)·무결성(DW5)·
    //   백업(DW7)·원자 쓰기(DW4). 저장은 파일 기록만·실행 트리거 안 함(DW9).
    app.put<{ Params: { name: string } }>(`/api/${seg}/:name/definition`, async (req, reply) => {
      if (!(await isEditEnabled())) return reply.code(403).send({ error: "edit-disabled" });
      if (!editName(req.params.name)) return reply.code(400).send({ error: "invalid-name" });
      const parsed = PutDefBody.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "bad-input", detail: parsed.error.issues });
      // DW11: evalProposal 존재 = F8 제안 적용 경로(crypto 미구현·M13 의존) → fail-closed 거부.
      //   무음 일반편집 통과 절대 금지(통합-2 F8→F7 우회 차단). 부재 = 일반 편집(DW1~DW7).
      if (parsed.data.evalProposal !== undefined) return reply.code(409).send({ error: "proposal-not-available" });
      const { content, baseHash, pathId } = parsed.data;
      if (Buffer.byteLength(content, "utf8") > MAX_DEF_BYTES) return reply.code(400).send({ error: "too-large" });

      const r = await resolveDef(kind, req.params.name);
      if (!r.ok) return reply.code(resErr(r.error)).send({ error: r.error });
      if (sha256(r.sourcePath) !== pathId) return reply.code(409).send({ error: "path-id-mismatch" }); // GET↔PUT 다른 정의 타격 차단
      const abs = await safeDefPath(projectRoot, r.sourcePath, kind);
      if (!abs) return reply.code(400).send({ error: "path-unsafe" });
      // MED(codex·lost-update): read-hash-backup-write 를 정의별 뮤텍스로 단일 임계구역화 —
      //   같은 baseHash 동시 두 PUT 중 하나만 성공, 다른 하나는 재-read 로 stale(409).
      return withDefLock(r.sourcePath, async () => {
        const cur = await readDefSafe(abs);
        if (!cur) return reply.code(404).send({ error: "not-found" });
        const prevHash = sha256(cur.content);
        if (prevHash !== baseHash) return reply.code(409).send({ error: "stale-write", currentHash: prevHash });
        const canon = canonicalizeDefinition(content, kind, req.params.name);
        // agy#1(HIGH): canonical 출력이 read cap 초과면 write 前 400 too-large(디스크 미기록·은폐 불가).
        if (!canon.ok) {
          if (canon.error === "too-large") return reply.code(400).send({ error: "too-large" });
          return reply.code(400).send({ error: "integrity", detail: canon.error });
        }
        // 백업(직전 1개·opaque 파일명) 성공 후 경화 원자 교체. 백업 실패 시 저장 중단(되돌리기 불가 상태 방지).
        try { await writeBackup(r.sourcePath, cur.content); }
        catch { return reply.code(400).send({ error: "backup-failed" }); }
        // DW3/DW4 경화쓰기(부모 체인 재검증·TOCTOU 스왑 감지). 스왑 등 위반 = fail-closed 400.
        try { await writeDefSafe(projectRoot, r.sourcePath, kind, canon.canonical); }
        catch { return reply.code(400).send({ error: "path-unsafe" }); }
        return {
          ok: true, prevHash, newHash: sha256(canon.canonical), pathId, sourcePath: r.sourcePath,
          codexDriftWarning: true, // DW8/F7.7: Codex 듀얼(.codex/.agents) 피어는 v0.7 비대상 — drift 경고만.
        };
      });
    });

    // POST rollback: 게이트 → 현재 해시==expectedCurrentHash(DW6) → 백업 해시==backupHash(변조 거부) →
    //   백업 DW5 재검증(손상본 복원 차단) → DW3 재실행 → 원자 복원.
    app.post<{ Params: { name: string } }>(`/api/${seg}/:name/definition/rollback`, async (req, reply) => {
      if (!(await isEditEnabled())) return reply.code(403).send({ error: "edit-disabled" });
      if (!editName(req.params.name)) return reply.code(400).send({ error: "invalid-name" });
      const parsed = RollbackBody.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "bad-input", detail: parsed.error.issues });
      const { expectedCurrentHash, backupHash } = parsed.data;
      const r = await resolveDef(kind, req.params.name);
      if (!r.ok) return reply.code(resErr(r.error)).send({ error: r.error });
      const abs = await safeDefPath(projectRoot, r.sourcePath, kind);
      if (!abs) return reply.code(400).send({ error: "path-unsafe" });
      // 정의별 뮤텍스(PUT 과 동일 키) — rollback 의 read-hash-check-write 도 단일 임계구역.
      return withDefLock(r.sourcePath, async () => {
        const cur = await readDefSafe(abs);
        if (!cur) return reply.code(404).send({ error: "not-found" });
        const curHash = sha256(cur.content);
        if (curHash !== expectedCurrentHash) return reply.code(409).send({ error: "stale-rollback", currentHash: curHash });
        const backup = await readBackup(r.sourcePath);
        if (backup === null) return reply.code(404).send({ error: "no-backup" });
        if (sha256(backup) !== backupHash) return reply.code(409).send({ error: "backup-hash-mismatch" }); // 손상/변조 백업 거부
        const canon = canonicalizeDefinition(backup, kind, req.params.name); // 손상본 복원 차단(DW5 재검증)
        // agy#1(HIGH): 복원본 canonical 도 read cap 이내여야 write(은폐 유발 복원 차단).
        if (!canon.ok) {
          if (canon.error === "too-large") return reply.code(400).send({ error: "too-large" });
          return reply.code(400).send({ error: "integrity", detail: canon.error });
        }
        // DW3/DW4 경화쓰기(부모 체인 재검증·TOCTOU 스왑 감지).
        try { await writeDefSafe(projectRoot, r.sourcePath, kind, canon.canonical); }
        catch { return reply.code(400).send({ error: "path-unsafe" }); }
        return { ok: true, prevHash: curHash, restoredHash: sha256(canon.canonical), pathId: sha256(r.sourcePath) };
      });
    });
  }
  registerDefRoutes("agent");
  registerDefRoutes("skill");

  // DW1/DW8: 게이트 노브 토글(mutating·F3.7 원자 RMW·타 필드 보존). Zod strict boolean(그 외 400).
  const DefEditBody = z.object({ enabled: z.boolean() }).strict();
  app.post("/api/settings/definition-edit", async (req, reply) => {
    const parsed = DefEditBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "bad-input", detail: parsed.error.issues });
    const next = await updateConfig({ definitionEditEnabled: parsed.data.enabled }); // projectRoot/projectsHome/evals 보존
    return { ok: true, definitionEditEnabled: next.definitionEditEnabled };
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

  // F3(M11·A68~A71·A99·A101): projectRoot 편집. **mutating** → security.ts onRequest 훅이 Host/Origin/token
  //   자동 게이트(추가 배선 불요). config 만 쓰기(I8 예외·프로젝트 파일 무변경). 라이브 재바인딩 비목표(requiresRestart).
  //   신뢰경계 = env SSOT(HARNESS_PROJECTS_HOME). 미프로비저닝 → 409 boundary-not-provisioned(편집 비활성).
  const ProjectRootBody = z.object({
    path: z.string().min(1).max(4096),
    dryRun: z.boolean().optional().default(false),
  }).strict();
  app.post("/api/settings/project-root", async (req, reply) => {
    const parsed = ProjectRootBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "bad-input", detail: parsed.error.issues });
    const { path: inputPath, dryRun } = parsed.data;
    const projectsHome = projectsHomeFromEnv(); // env SSOT
    if (!projectsHome) return reply.code(409).send({ error: "boundary-not-provisioned" });
    // 공통 검증(양 모드): D1 → D4 → D3 → D2/D6 → D5.
    const v = await validateProjectRoot(inputPath, projectsHome);
    if (!v.ok) return reply.code(400).send({ error: v.error });
    const activeRunsWarning = await countActiveRuns(projectRoot); // PV3: status.json running 카운트(listRuns 재사용)
    if (dryRun) {
      // 프리뷰: 디스크 미변경(취소 시 무변경·A101).
      return { ok: true, effectiveRoot: v.effectiveRoot, activeRunsWarning, requiresRestart: true, written: false };
    }
    // 쓰기: D7 TOCTOU 재검증(지속 직전 realpath 재확인) → config RMW(projectRoot 만·타 필드 보존).
    const v2 = await revalidateForPersist(inputPath, projectsHome, v.effectiveRoot);
    if (!v2.ok) return reply.code(400).send({ error: v2.error });
    await updateConfig({ projectRoot: v2.effectiveRoot });
    return {
      accepted: true, requiresRestart: true, effectiveRoot: v2.effectiveRoot,
      appliedAt: new Date().toISOString(), activeRunsWarning,
    };
  });

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
  // F2(M10): agent 지정 시 제출 시점 정의 재조회·D 재도출(템플릿 시점 D 신뢰 금지·R4-#1) → U⊆D 강제.
  //   D 밖 도구 → 400 unauthorized-tool(조용한 드롭 금지). 정의 부재/지문 변경(stale 폼) → 409 agent-definition-changed.
  //   agent 미지정 일반 New Run = D 상한 없음 = v0.5 계약 그대로.
  app.post("/api/runs", async (req, reply) => {
    const parsed = RunRequest.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid-request", detail: parsed.error.issues });
    const r = parsed.data;
    if (r.agent) {
      const info = await findAgent(projectRoot, r.agent); // 제출 시점 재도출(TOCTOU 방어)
      const hasTools = r.allowedTools.length > 0;
      if (!info) {
        // 상한 검증 불가(비어있지 않은 U) 또는 클라가 지문을 echo(stale 폼) → 명시 반려. 태그만(빈 U·지문 없음) 은 무해 허용.
        if (hasTools || r.agentFingerprint) return reply.code(409).send({ error: "agent-definition-changed" });
      } else {
        if (r.agentFingerprint && r.agentFingerprint !== agentFingerprint(info)) {
          return reply.code(409).send({ error: "agent-definition-changed" });
        }
        const D = new Set(info.tools);
        const extra = r.allowedTools.filter((t) => !D.has(t)); // U \ D
        if (extra.length) return reply.code(400).send({ error: "unauthorized-tool", detail: extra });
      }
    }
    return launchRun(projectRoot, r);
  });
  app.post<{ Params: { runId: string } }>("/api/runs/:runId/cancel", async (req, reply) => {
    if (!isSafeSegment(req.params.runId)) return reply.code(400).send({ error: "invalid-runId" });
    const runDir = pjoin(projectRoot, "_workspace", "runs", req.params.runId);
    return cancelRun(runDir, req.params.runId);
  });

  // ── F8(M13) Eval 대시보드 — 축소안(Part A 읽기 + Part B 제안·자동금지 + Part C config) ──
  //   암호 원장(체인 rollup·키링·durable nonce·HMAC 서명·receipt)은 v0.7 이월(미구현). 제안 적용 =
  //   사용자가 F7 편집기로 수동 편집(evalProposal 은 F7 DW11 에서 fail-closed·409 proposal-not-available 유지).
  //   Part A/B GET = side-effect 0(순수 조회·ingest/서명/append 없음). Part C POST 만 mutating(config RMW).

  // Part C: config 읽기(GET·side-effect 0)·쓰기(POST·mutating → security.ts Host/Origin/token 자동 게이트).
  //   static 세그먼트 "config" 는 Fastify radix 우선 → `/api/evals/:loop` 파라미터보다 먼저 매칭(loop 오인 없음).
  app.get("/api/evals/config", async () => loadEvalsConfig());
  app.post("/api/evals/config", async (req, reply) => {
    const parsed = EvalsConfigBody.safeParse(req.body);
    // adoptionStage:4(union 실패)·floor 미만 임계(.min 실패)·미지 필드(strict) → 400(silent-clamp 아님).
    if (!parsed.success) return reply.code(400).send({ error: "bad-input", detail: parsed.error.issues });
    const next = await updateEvalsConfig(parsed.data); // evals 서브객체 원자 RMW(타 필드 보존·뮤텍스)
    return { ok: true, config: next };
  });

  // Part A: loop 목록·최근 요약(GET·읽기전용).
  app.get("/api/evals", async () => listEvalLoops(projectRoot));
  // Part A: 추세(GET·읽기전용). :loop 은 어댑터가 isSafeSegment 검증(위반 → found:false).
  app.get<{ Params: { loop: string } }>("/api/evals/:loop", async (req) => loopTrend(projectRoot, req.params.loop));
  // Part B: 제안 카드(GET·읽기전용 판정·자동 적용 절대 없음). 단계<3·데이터부족 → 비활성 사유.
  //   static "proposal" 세그먼트가 `/api/evals/:loop/:stage/:run`(4-세그) 보다 얕아 충돌 없음.
  app.get<{ Params: { loop: string } }>("/api/evals/:loop/proposal", async (req) =>
    loopProposal(projectRoot, req.params.loop, await loadEvalsConfig()));
  // Part A: scorecard 상세(GET·읽기전용). 세그먼트는 어댑터가 검증·안전 해석.
  app.get<{ Params: { loop: string; stage: string; run: string } }>(
    "/api/evals/:loop/:stage/:run",
    async (req) => scorecardDetail(projectRoot, req.params.loop, req.params.stage, req.params.run));

  app.get("/api/health", async () => ({ ok: true }));
  // /healthz — **비인증 liveness**(/api/ 아니므로 게이트 통과). 런처 멱등 판정용. 데이터 없음.
  app.get("/healthz", async () => ({ ok: true }));
}
