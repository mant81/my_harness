// F5 뷰어 순수 헬퍼(브레드크럼·렌더 판정·로컬 경로). UI 상태·shape 로직 → 단위 테스트 대상(TDD).
// posix 경로만(서버 rel 은 항상 "/" 구분). 로컬 절대경로 표시는 A98(다운로드 413 시 "로컬에서 열기") 안내용.

// 브레드크럼 — "design/spec.md" → [{name:"docs",path:""},{name:"design",path:"design"},{name:"spec.md",path:"design/spec.md"}].
// 루트("docs") 항상 선두. 각 항목의 path 는 누적(클릭 시 트리 포커스용). 파일/디렉토리 무관.
export function breadcrumbTrail(rel: string): Array<{ name: string; path: string }> {
  const trail: Array<{ name: string; path: string }> = [{ name: "docs", path: "" }];
  const segs = (rel ?? "").split("/").filter(Boolean);
  let acc = "";
  for (const s of segs) {
    acc = acc ? `${acc}/${s}` : s;
    trail.push({ name: s, path: acc });
  }
  return trail;
}

// 마크다운 렌더 대상 확장자(md/markdown). 그 외(txt/json/log·artifact)는 raw 텍스트로만 표시.
const MD_EXT = new Set(["md", "markdown"]);
export function isMarkdownName(name: string): boolean {
  const i = name.lastIndexOf(".");
  return i > 0 && MD_EXT.has(name.slice(i + 1).toLowerCase());
}

// posix join(로컬 절대경로 표시용) — 빈 세그먼트 제거·"/" 결합. projectRoot 는 서버 settings 그대로.
function joinPosix(...parts: string[]): string {
  return parts.filter(Boolean).join("/").replace(/\/+/g, "/");
}
export function localDocPath(projectRoot: string, rel: string): string {
  return joinPosix(projectRoot, "docs", rel);
}
export function localArtifactPath(projectRoot: string, runId: string, name: string): string {
  return joinPosix(projectRoot, "_workspace", "runs", runId, "artifacts", name);
}

// 미리보기 배너 판정(색 비의존·아이콘+텍스트). 서버 preview 메타 → 배너 종류.
//  binary → "미리보기 불가(바이너리)" · not-renderable → "미리보기 불가(이 형식)" · null → 미리보기 가능.
export type ViewerBanner = "binary" | "not-renderable" | null;
export function viewerBanner(p: { renderable: boolean; binary: boolean }): ViewerBanner {
  if (!p.renderable) return "not-renderable";
  if (p.binary) return "binary";
  return null;
}
