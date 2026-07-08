// API 클라이언트 — session 토큰(Bearer) 첨부. 쿼리 토큰 금지(§0-VOID). XSS: 반환값은 React 가 escape.
let SESSION: string | null = null;

// fragment(#) 토큰 → session 교환. strip 을 fetch 이전에 동기 수행(A34: 왕복 중 주소창 노출 방지).
export async function bootstrapSession(): Promise<string | null> {
  const hash = location.hash.startsWith("#") ? decodeURIComponent(location.hash.slice(1)) : "";
  const cached = sessionStorage.getItem("harness-session");
  if (!hash) { SESSION = cached; return cached; }
  history.replaceState(null, "", location.pathname + location.search); // ★ fetch 이전 동기 strip
  try {
    const r = await fetch("/api/auth/exchange", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ bootstrap: hash }),
    });
    if (!r.ok) return null;
    const { session } = await r.json();
    sessionStorage.setItem("harness-session", session);
    SESSION = session;
    return session;
  } catch { return null; }
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return SESSION ? { authorization: `Bearer ${SESSION}`, ...extra } : extra;
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const r = await fetch(path, { headers: authHeaders() });
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

// artifact 다운로드 URL(토큰 헤더 필요 → fetch 후 blob). 파일명 표시용만.
export async function fetchArtifact(runId: string, name: string): Promise<string> {
  const r = await fetch(`/api/runs/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(name)}`, { headers: authHeaders() });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.text();
}
