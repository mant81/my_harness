// M1 최소 web + M6 토큰 부트스트랩. fragment(#) 토큰을 읽어 session 교환. **strip 을 fetch 이전에 동기 수행**(A34: 네트워크 왕복 중 주소창/히스토리 노출 방지).
async function bootstrapSession(): Promise<string | null> {
  const hash = location.hash.startsWith("#") ? decodeURIComponent(location.hash.slice(1)) : "";
  if (!hash) return sessionStorage.getItem("harness-session");
  history.replaceState(null, "", location.pathname + location.search); // ★ fetch 이전 동기 strip
  try {
    const r = await fetch("/api/auth/exchange", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ bootstrap: hash }),
    });
    if (!r.ok) return null;
    const { session } = await r.json();
    sessionStorage.setItem("harness-session", session);
    return session;
  } catch { return null; }
}

async function boot() {
  const el = document.getElementById("app")!;
  const session = await bootstrapSession();
  if (!session) { el.textContent = "인증 필요 — 런처로 접속하세요(1회용 링크)."; return; }
  const h = { authorization: `Bearer ${session}` };
  try {
    const [rt, hn] = await Promise.all([
      fetch("/api/runtimes", { headers: h }).then((r) => r.json()),
      fetch("/api/harness", { headers: h }).then((r) => r.json()),
    ]);
    el.textContent = `Harness UI v0.5 — claude:${rt.claude?.installed} codex:${rt.codex?.installed} · agents:${hn.claude?.agents} skills:${hn.claude?.skills} runs:${hn.workspace?.runs}`;
  } catch (e) { el.textContent = "API 오류: " + String(e); }
}
boot();
