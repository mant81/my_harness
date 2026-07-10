// shell 없는 실행 + 바이너리 해소 (설계 §5b execFile+argv, no-shell).
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const pexec = promisify(execFile);
const isWin = process.platform === "win32";

// PATH 해소 — shell 없이(`command -v` 금지). Windows=where.exe, POSIX=which.
export async function resolveBin(name: string): Promise<string | null> {
  const finder = isWin ? "where" : "which";
  try {
    const { stdout } = await pexec(finder, [name], { timeout: 5000 });
    const first = stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)[0];
    return first ?? null;
  } catch {
    return null;
  }
}

// 안전 실행: 절대경로 해소 후 argv. timeout·출력 상한. shell 미사용.
//   cwd/env 선택 — 빌드 초안(F10)은 빈 temp cwd + scrub env 로 프로젝트 파일/시크릿 접근 심층방어(HB3).
export async function safeExec(
  name: string,
  args: string[],
  opts: { timeoutMs?: number; maxBuffer?: number; cwd?: string; env?: NodeJS.ProcessEnv } = {},
): Promise<{ ok: boolean; stdout: string; stderr: string; path: string | null }> {
  const path = await resolveBin(name);
  if (!path) return { ok: false, stdout: "", stderr: `not-found:${name}`, path: null };
  try {
    const { stdout, stderr } = await pexec(path, args, {
      timeout: opts.timeoutMs ?? 5000,
      maxBuffer: opts.maxBuffer ?? 1024 * 1024,
      shell: false,
      ...(opts.cwd !== undefined ? { cwd: opts.cwd } : {}),
      ...(opts.env !== undefined ? { env: opts.env } : {}),
    });
    return { ok: true, stdout, stderr, path };
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    return { ok: false, stdout: err.stdout ?? "", stderr: err.stderr ?? err.message ?? "exec-failed", path };
  }
}
