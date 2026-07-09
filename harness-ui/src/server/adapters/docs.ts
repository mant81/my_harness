// F5 docs 트리 리더 (DV1 화이트루트 = docs/ 재귀). 읽기전용.
// 심링크(파일·디렉토리) 무조건 skip(외부 노출 방지) + denylist + 개수/깊이 상한(OOM·루프 방어).
// R2 HIGH: 각 하위 dir 재귀 前 realpath containment(isWithinRoot)로 white-root(docs) 재검증 —
//   Windows junction/reparse 는 lstat.isSymbolicLink() 가 미탐하므로 realpath 를 최후방어로 병용(AS4/V16).
import { readdir, realpath } from "node:fs/promises";
import { join } from "node:path";
import { notSymlinkDir } from "./statestats.js";
import { deniedDocsPath } from "../security.js";
import { isSafeDocsSegment, isWithinRoot } from "../lib/paths.js";

const MAX_TREE = 2000; // 트리 노출 파일 상한(OOM·과대 트리 방어)
const MAX_DEPTH = 12;  // 재귀 깊이 backstop

export type DocsNode =
  | { type: "dir"; name: string; path: string; children: DocsNode[] }
  | { type: "file"; name: string; path: string; ext: string };

export interface DocsTree { root: "docs"; tree: DocsNode[]; count: number; truncated: boolean }

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

export async function docsTree(projectRoot: string): Promise<DocsTree> {
  const base = join(projectRoot, "docs");
  const state = { count: 0, truncated: false };
  // DV3 앵커 선계산: white-root(docs) realpath. 해석 불가(부재)면 빈 트리(fail-closed).
  const realBaseOrNull = await realpath(base).catch(() => null);
  if (!realBaseOrNull) return { root: "docs", tree: [], count: 0, truncated: false };
  const realBase = realBaseOrNull; // 클로저 캡처용 non-null 앵커

  async function walk(dir: string, rel: string, depth: number): Promise<DocsNode[]> {
    if (depth > MAX_DEPTH || !(await notSymlinkDir(dir))) return [];
    // realpath containment 최후방어: 나열 중인 dir 이 realpath 상 docs 밖이면 나열 금지(junction/reparse).
    const realDir = await realpath(dir).catch(() => null);
    if (!realDir || !isWithinRoot(realBase, realDir)) return [];
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return []; }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    const nodes: DocsNode[] = [];
    for (const e of entries) {
      if (state.count >= MAX_TREE) { state.truncated = true; break; }
      if (e.isSymbolicLink()) continue; // 심링크 무조건 skip(Linux)
      if (!isSafeDocsSegment(e.name)) continue; // 트리↔열람 정합: 열람 불가(traversal/제어문자) 이름은 미노출
      const childRel = rel ? `${rel}/${e.name}` : e.name;
      if (deniedDocsPath(childRel)) continue; // 민감파일/dot-prefix skip
      if (e.isDirectory()) {
        const childDir = join(dir, e.name);
        // 재귀 前 realpath containment 재검증: junction/reparse(lstat 미탐)로 docs 밖을 가리키면 제외(HIGH).
        const realChild = await realpath(childDir).catch(() => null);
        if (!realChild || !isWithinRoot(realBase, realChild)) continue; // out-root → 나열·재귀 금지
        const children = await walk(childDir, childRel, depth + 1);
        nodes.push({ type: "dir", name: e.name, path: childRel, children });
      } else if (e.isFile()) {
        state.count += 1;
        nodes.push({ type: "file", name: e.name, path: childRel, ext: extOf(e.name) });
      }
    }
    return nodes;
  }

  const tree = await walk(base, "", 0);
  return { root: "docs", tree, count: state.count, truncated: state.truncated };
}
