// 공용 UI 프리미티브 — 로딩/에러/빈상태·데이터훅·테이블·배지. React 가 텍스트 escape(XSS 방어).
import { useEffect, useState, useCallback } from "react";
import { apiGet } from "./api.js";

// GET 데이터 훅 — 로딩/에러/재조회. path 변경 시 재요청.
export function useApi<T>(path: string | null): { data: T | null; err: string | null; loading: boolean; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [n, setN] = useState(0);
  const reload = useCallback(() => setN((x) => x + 1), []);
  useEffect(() => {
    if (!path) return;
    let live = true;
    setData(null); setLoading(true); setErr(null); // path 변경 시 이전 data 클리어(stale 렌더 방지, agy R2)
    apiGet<T>(path)
      .then((d) => { if (live) { setData(d); setLoading(false); } })
      .catch((e) => { if (live) { setErr(String(e)); setLoading(false); } });
    return () => { live = false; };
  }, [path, n]);
  return { data, err, loading, reload };
}

export function Async<T>({ state, children }: { state: ReturnType<typeof useApi<T>>; children: (d: T) => React.ReactNode }) {
  if (state.loading && !state.data) return <div className="muted">불러오는 중…</div>;
  if (state.err) return <div className="error">오류: {state.err}</div>;
  if (!state.data) return <div className="muted">데이터 없음</div>;
  return <>{children(state.data)}</>;
}

export function Badge({ kind, children }: { kind: "ok" | "warn" | "err" | "muted"; children: React.ReactNode }) {
  return <span className={`badge ${kind}`}>{children}</span>;
}

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="card"><h3>{title}</h3>{children}</section>;
}

// 안전 테이블 — 셀은 문자열/노드. innerHTML 미사용.
export function Table({ cols, rows }: { cols: string[]; rows: (React.ReactNode)[][] }) {
  if (rows.length === 0) return <div className="muted">항목 없음</div>;
  return (
    <div className="tablewrap">
      <table>
        <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
