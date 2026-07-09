// 셸 — 좌측 사이드바 9화면 내비(§IA: 랜딩 없음, 첫 화면=Overview 대시보드). hash 라우팅(외부 router 무의존).
import { useState, useEffect } from "react";
import { Overview, Build, Agents, Skills, Runs, Docs, Drift, Ops, Settings } from "./screens.js";

const SCREENS = [
  { id: "overview", label: "Overview", C: Overview },
  { id: "build", label: "Build", C: Build },
  { id: "agents", label: "Agents", C: Agents },
  { id: "skills", label: "Skills", C: Skills },
  { id: "runs", label: "Runs", C: Runs },
  { id: "docs", label: "Docs", C: Docs },
  { id: "drift", label: "Drift", C: Drift },
  { id: "ops", label: "Ops", C: Ops },
  { id: "settings", label: "Settings", C: Settings },
] as const;

export function App() {
  const [cur, setCur] = useState<string>(() => location.hash.replace(/^#\/?/, "") || "overview");
  useEffect(() => {
    const on = () => setCur(location.hash.replace(/^#\/?/, "") || "overview");
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const active = SCREENS.find((s) => s.id === cur) ?? SCREENS[0];
  const Body = active.C;
  return (
    <div className="app">
      <nav className="sidebar">
        <div className="brand">Harness UI <span className="ver">v0.6</span></div>
        {SCREENS.map((s) => (
          <a key={s.id} href={`#/${s.id}`} className={s.id === active.id ? "navlink on" : "navlink"}>{s.label}</a>
        ))}
      </nav>
      <main className="body"><Body /></main>
    </div>
  );
}
