// 런타임 감지 (설계 §API /api/runtimes). claude/codex/agy 설치·버전·경로.
import { safeExec } from "../lib/exec.js";

export type RuntimeInfo = { installed: boolean; version: string | null; path: string | null };

async function probe(bin: string): Promise<RuntimeInfo> {
  // safeExec 이 내부에서 PATH 해소(중복 resolve 제거). path 없으면 미설치.
  const r = await safeExec(bin, ["--version"], { timeoutMs: 5000 });
  if (!r.path) return { installed: false, version: null, path: null };
  const version = r.ok ? (r.stdout.trim().split(/\r?\n/)[0] ?? null) : null;
  return { installed: true, version, path: r.path };
}

export async function detectRuntimes(): Promise<Record<string, RuntimeInfo>> {
  const [claude, codex, agy] = await Promise.all([probe("claude"), probe("codex"), probe("agy")]);
  return { claude, codex, agy };
}
