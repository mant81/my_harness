// M1 최소 web — API 연결 확인(화면은 M4). 디자인 시스템은 DESIGN.md 기준 M4.
async function boot() {
  const el = document.getElementById("app")!;
  try {
    const [rt, hn] = await Promise.all([
      fetch("/api/runtimes").then((r) => r.json()),
      fetch("/api/harness").then((r) => r.json()),
    ]);
    el.textContent = `Harness UI v0.5 (M1) — claude:${rt.claude?.installed} codex:${rt.codex?.installed} · agents:${hn.claude?.agents} skills:${hn.claude?.skills} runs:${hn.workspace?.runs}`;
  } catch (e) {
    el.textContent = "API 연결 실패: " + String(e);
  }
}
boot();
