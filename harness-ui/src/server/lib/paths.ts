// <state_home> 경로 어댑터 (설계 §9-STATE) + 안전 경로 검증(SAFE_SEGMENT).
import { homedir } from "node:os";
import { join, resolve, relative, isAbsolute, sep } from "node:path";

export function stateHome(): string {
  if (process.env.HARNESS_STATE_HOME) return process.env.HARNESS_STATE_HOME; // 테스트/오버라이드
  const home = homedir();
  switch (process.platform) {
    case "darwin": return join(home, "Library", "Application Support", "harness-ui");
    case "win32": return join(process.env.LOCALAPPDATA ?? join(home, "AppData", "Local"), "harness-ui");
    default: return join(process.env.XDG_STATE_HOME ?? join(home, ".local", "state"), "harness-ui");
  }
}

export const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/;

// 경로 세그먼트 allowlist (빈/`.`/`..`/메타 거부).
export function isSafeSegment(seg: string): boolean {
  if (!seg || seg === "." || seg === "..") return false;
  return SAFE_SEGMENT.test(seg);
}

// resolved 경로가 root 하위인지 (경계 검사). realpath는 호출측에서 fd 앵커링과 함께.
export function isWithinRoot(root: string, target: string): boolean {
  const r = resolve(root);
  const t = resolve(target);
  const rel = relative(r, t);
  if (rel === "") return true;
  if (isAbsolute(rel)) return false;
  return rel.split(sep)[0] !== ".."; // 첫 세그먼트만 ".." 검사(파일명 "..b" 오거부 방지)
}
