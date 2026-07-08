// 상태 스키마 정본 (설계 §5). schema-valid = 아래 Zod `.parse()` 통과.
import { z } from "zod";

export const RunState = z.enum([
  "queued", "running", "blocked", "failed", "completed", "cancelled", "stale",
]);
export type RunState = z.infer<typeof RunState>;

export const Runtime = z.enum(["claude", "codex"]);
export type Runtime = z.infer<typeof Runtime>;

const iso = z.string().datetime({ offset: true });

export const Manifest = z.object({
  schemaVersion: z.literal("1"),
  runId: z.string(),
  projectRoot: z.string(),
  runtime: Runtime,
  mode: z.string(),
  createdAt: iso,
  requestedBy: z.string(),
  goal: z.string(),
  agents: z.array(z.string()),
  targets: z.array(z.string()),
  permissionMode: z.string(),
  model: z.string(),
  supervisorVersion: z.string(),
});
export type Manifest = z.infer<typeof Manifest>;

export const Usage = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  cacheReadTokens: z.number().int().nonnegative(),
  cacheCreationTokens: z.number().int().nonnegative(),
}).partial();

export const Status = z.object({
  schemaVersion: z.literal("1"),
  runId: z.string(),
  state: RunState,
  phase: z.string(),
  progress: z.number().min(0).max(100),
  updatedAt: iso,
  heartbeatAt: iso,
  serverPid: z.number().int(),
  serverStartTime: z.string(),
  childPid: z.number().int().nullable(),
  childStartTime: z.string().nullable(),
  childProcessGroupId: z.union([z.number().int(), z.string()]).nullable(),
  exitCode: z.number().int().nullable(),
  exitSignal: z.string().nullable(),
  cancelRequestedAt: iso.nullable(),
  stateReason: z.string().nullable(),
  summary: z.string(),
  error: z.string().nullable(),
});
export type Status = z.infer<typeof Status>;

export const Event = z.object({
  seq: z.number().int().nonnegative(),
  ts: iso,
  level: z.enum(["info", "warn", "error", "debug"]),
  agent: z.string().nullable(),
  skill: z.string().nullable(),
  phase: z.string(),
  event: z.string(),
  message: z.string(),
  usage: Usage.nullable(),
});
export type Event = z.infer<typeof Event>;

export const AgentState = z.object({
  schemaVersion: z.literal("1"),
  name: z.string(),
  runtime: Runtime,
  state: RunState,
  phase: z.string(),
  task: z.string(),
  startedAt: iso,
  updatedAt: iso,
  inputFiles: z.array(z.string()),
  outputFiles: z.array(z.string()),
  error: z.string().nullable(),
});
export type AgentState = z.infer<typeof AgentState>;

export const DriftFinding = z.object({
  id: z.string(),
  severity: z.enum(["ok", "missing-runtime-peer", "content-mismatch", "stale", "unsupported"]),
  runtime: Runtime,
  paths: z.array(z.string()),
  evidence: z.string(),
  suggestedAction: z.string(),
});
export type DriftFinding = z.infer<typeof DriftFinding>;

// schema-valid 헬퍼: parse 성공 여부 + 사유.
export function isSchemaValid<T>(schema: z.ZodType<T>, data: unknown): { ok: true; value: T } | { ok: false; error: string } {
  const r = schema.safeParse(data);
  return r.success ? { ok: true, value: r.data } : { ok: false, error: r.error.issues.map((i) => `${i.path.join(".")}:${i.message}`).join("; ") };
}
