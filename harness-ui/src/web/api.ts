// API 클라이언트 — session 토큰(Bearer) 첨부. 쿼리 토큰 금지(§0-VOID). XSS: 반환값은 React 가 escape.
import type { RunSubmitResult } from "./agent-run.js";
// 세션 단일 출처 = sessionStorage(모듈 인스턴스 분리·리로드에도 일관). getSession() 이 유일 판독기.
const KEY = "harness-session";
function getSession(): string | null { try { return sessionStorage.getItem(KEY); } catch { return null; } }
function setSession(s: string): void { try { sessionStorage.setItem(KEY, s); } catch { /* private mode */ } }
function clearSession(): void { try { sessionStorage.removeItem(KEY); } catch { /* noop */ } }

// fragment(#) 토큰 → session 교환. strip 을 fetch 이전에 동기 수행(A34: 왕복 중 주소창 노출 방지).
// hash 있으면 항상 재교환(무효 캐시 덮어씀). 없으면 캐시 사용. 교환 성공분만 신뢰.
// ★ router hash(`#/...`)는 화면 라우팅·딥링크(`#/runs?run=`)용 — bootstrap 토큰으로 오소비 금지.
//   런처 fragment 토큰은 `#<hex>`(§A34·`#/` 로 시작 안 함)만 해당 → 새 탭/리로드서 run focus 보존.
export async function bootstrapSession(): Promise<string | null> {
  const isToken = location.hash.startsWith("#") && !location.hash.startsWith("#/");
  const hash = isToken ? decodeURIComponent(location.hash.slice(1)) : "";
  if (!hash) return getSession(); // router hash(또는 hash 없음) → 캐시 세션 사용·hash 보존
  history.replaceState(null, "", location.pathname + location.search); // ★ fetch 이전 동기 strip(토큰만 제거)
  try {
    const r = await fetch("/api/auth/exchange", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ bootstrap: hash }),
    });
    if (!r.ok) { clearSession(); return null; } // 무효 토큰 → 잔존 캐시도 제거(stale 마스킹 방지)
    const { session } = await r.json();
    setSession(session);
    return session;
  } catch { return null; }
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const s = getSession();
  return s ? { authorization: `Bearer ${s}`, ...extra } : extra;
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const r = await fetch(path, { headers: authHeaders() });
  if (r.status === 401) { clearSession(); throw new Error(`401 인증 만료 — 런처 링크로 재접속`); } // stale 세션 폐기(무한 401 방지)
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json() as Promise<T>;
}

// mutating: same-origin(Origin 자동)·content-type json. 서버가 Origin/Host/token 검증.
export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const r = await fetch(path, {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const detail = await r.json().catch(() => ({}));
    throw new Error(`${r.status}: ${JSON.stringify(detail)}`);
  }
  return r.json() as Promise<T>;
}

// ── F2 에이전트 프리필 New Run(M10) ──
// POST /api/runs 거부(400 unauthorized-tool·409 agent-definition-changed)를 구조 보존 승격.
// error/detail 을 그대로 담아 UI 가 한국어로 매핑(agent-run.runSubmitErrorText·A100 — 조용한 드롭 금지).
export class RunSubmitError extends Error {
  constructor(public readonly status: number, public readonly code: string, public readonly detail?: string[]) {
    super(code);
    this.name = "RunSubmitError";
  }
}

// 실행 제출 — apiPost(문자열 throw)와 달리 status/error/detail 구조 보존(400/409 인라인 매핑용).
export async function submitRun(body: unknown): Promise<RunSubmitResult> {
  const r = await fetch("/api/runs", {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (r.status === 401) { clearSession(); throw new Error("401 인증 만료 — 런처 링크로 재접속"); }
  if (!r.ok) {
    const d = await r.json().catch(() => ({} as { error?: string; detail?: unknown }));
    const detail = Array.isArray(d.detail) ? d.detail.map((x: unknown) => String(x)) : undefined;
    throw new RunSubmitError(r.status, String(d.error ?? r.status), detail);
  }
  return r.json() as Promise<RunSubmitResult>;
}

// ── F5 문서/artifact 뷰어(M8) ──
// 서버 계약(server-builder 확정·이대로 소비):
//   GET /api/docs → { root, tree, count, truncated }
//   GET /api/docs/* → 미리보기 { path,name,mime,size,renderable,binary,truncated,content }
//   GET /api/docs/*?download=1 → attachment raw(8MB 초과 413)
//   GET /api/runs/:runId/artifacts(/*) → 기존(다운로드 전용·raw text)
export type DocsNode =
  | { type: "dir"; name: string; path: string; children: DocsNode[] }
  | { type: "file"; name: string; path: string; ext: string };
export type DocsTree = { root: "docs"; tree: DocsNode[]; count: number; truncated: boolean };
export type DocPreview = {
  path: string; name: string; mime: string; size: number;
  renderable: boolean; binary: boolean; truncated: boolean; content: string | null;
};

// 상대경로 → URL(세그먼트별 인코딩·구분자 슬래시 보존). 서버가 rel.split("/") 로 세그먼트 재검증.
export function encodeDocPath(rel: string): string {
  return rel.split("/").map(encodeURIComponent).join("/");
}

// 413 too-large(다운로드 하드상한 초과) — UI 에서 로컬 열기 안내(A98)용 크기·상한 반송.
export class DownloadTooLargeError extends Error {
  constructor(public readonly size: number, public readonly max: number) {
    super("too-large");
    this.name = "DownloadTooLargeError";
  }
}

// 다운로드 → blob 저장(토큰 헤더 필요 → fetch). 413 은 DownloadTooLargeError(크기·상한)로 승격.
async function saveBlob(url: string, filename: string): Promise<void> {
  const r = await fetch(url, { headers: authHeaders() });
  if (r.status === 413) {
    const d = await r.json().catch(() => ({} as { size?: number; max?: number }));
    throw new DownloadTooLargeError(Number(d.size ?? 0), Number(d.max ?? 0));
  }
  if (r.status === 401) { clearSession(); throw new Error("401 인증 만료 — 런처 링크로 재접속"); }
  if (!r.ok) throw new Error(`${r.status}`);
  const blob = await r.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(href);
}

export function downloadDoc(rel: string, filename: string): Promise<void> {
  return saveBlob(`/api/docs/${encodeDocPath(rel)}?download=1`, filename);
}

export function downloadArtifact(runId: string, name: string): Promise<void> {
  return saveBlob(`/api/runs/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(name)}`, name);
}

// artifact 미리보기 텍스트(다운로드 전용 라우트 → raw text). 413 은 TooLarge 로 승격.
export async function fetchArtifact(runId: string, name: string): Promise<string> {
  const r = await fetch(`/api/runs/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(name)}`, { headers: authHeaders() });
  if (r.status === 413) {
    const d = await r.json().catch(() => ({} as { size?: number; max?: number }));
    throw new DownloadTooLargeError(Number(d.size ?? 0), Number(d.max ?? 0));
  }
  if (r.status === 401) { clearSession(); throw new Error("401 인증 만료 — 런처 링크로 재접속"); }
  if (!r.ok) throw new Error(`${r.status}`);
  return r.text();
}
