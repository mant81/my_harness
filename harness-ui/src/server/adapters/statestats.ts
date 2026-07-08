// Overview 상태·통계 계층 A (설계 §7b·A35-A38). 정적 파일에서 도출(실행 무관). check-artifacts 셸아웃 금지(TS 네이티브).
import { constants } from "node:fs";
import { readdir, stat, lstat, open } from "node:fs/promises";
import { join } from "node:path";
import { readAgents, readSkills } from "./harness.js";

const MAX_DOCS = 1000;        // 프로젝트당 결과서 스캔 상한
const MAX_DOC_BYTES = 262144; // 파일당 read 상한(256KB)

async function exists(p: string): Promise<boolean> { try { await stat(p); return true; } catch { return false; } }
async function notSymlinkDir(dir: string): Promise<boolean> {
  try { const l = await lstat(dir); return l.isDirectory() && !l.isSymbolicLink(); } catch { return false; }
}
async function listMd(dir: string): Promise<string[]> {
  if (!(await notSymlinkDir(dir))) return []; // symlink 디렉토리 거부(외부 노출 방지)
  try {
    const e = await readdir(dir, { withFileTypes: true });
    return e.filter((x) => x.isFile() && !x.isSymbolicLink() && x.name.endsWith(".md") && !x.name.startsWith("_"))
      .map((x) => x.name).slice(0, MAX_DOCS);
  } catch { return []; }
}
// O_NOFOLLOW open → fstat 정규파일 → 상한 내 바운드 read(전체 read OOM·symlink 회피).
async function readCapped(p: string): Promise<string> {
  let fh;
  try { fh = await open(p, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)); }
  catch { return ""; }
  try {
    const st = await fh.stat();
    if (!st.isFile()) return "";
    const n = Math.min(st.size, MAX_DOC_BYTES);
    const buf = Buffer.alloc(n);
    await fh.read(buf, 0, n, 0);
    return buf.toString("utf8");
  } catch { return ""; }
  finally { await fh.close().catch(() => {}); }
}

export async function stateStats(root: string) {
  const agents = await readAgents(root);
  const skills = await readSkills(root);

  // A35 구성 건강도. 커버리지=heuristic(선언 파싱). 고아=측정.
  const skillNames = new Set(skills.map((s) => s.name));
  const orphanSkills = skills.filter((s) => !agents.some((a) => a.skills.includes(s.name))).map((s) => s.name); // 선언 링크 없음(heuristic)
  const orphanAgents = agents.filter((a) => a.skills.length === 0).map((a) => a.name);
  const configHealth = {
    agents: agents.length, skills: skills.length,
    orchestratorPresent: skills.some((s) => /orchestrat|오케스트/i.test(s.name + s.description)),
    claudePointer: await exists(join(root, "CLAUDE.md")),
    agentsPointer: await exists(join(root, "AGENTS.md")),
    orphanAgents, orphanSkills,
    coverageConfidence: "heuristic" as const,
    _unusedSkillNames: [...skillNames].length,
  };

  // A36 D4 규율(TS 네이티브 — 셸 금지). docs/*/working_history 결과서 + `## 다음 단계 참조` + _workspace 방치.
  const docs = join(root, "docs");
  const projects: Array<{ project: string; resultDocs: number; missingNextStep: number }> = [];
  try {
    for (const p of (await readdir(docs, { withFileTypes: true })).filter((e) => e.isDirectory())) {
      const wh = join(docs, p.name, "working_history");
      const md = await listMd(wh);
      let missing = 0;
      for (const f of md) {
        const t = await readCapped(join(wh, f));
        if (!/^#{2,}\s+([0-9]+[.)]\s*)?다음 단계 참조\s*$/m.test(t)) missing += 1;
      }
      if (md.length > 0) projects.push({ project: p.name, resultDocs: md.length, missingNextStep: missing });
    }
  } catch { /* docs 없음 */ }
  const abandoned = (await listMd(join(root, "_workspace", "design"))).length + (await listMd(join(root, "_workspace", "plans"))).length;
  const d4 = { projects, workspaceAbandoned: abandoned };

  // A37 하네스 업데이트 상태. .harness-manifest.json(빌드 하네스) — factory 경로 미설정 시 factory-drift=unknown.
  let update: { manifest: boolean; factoryDrift: "unknown" | "n/a" } = { manifest: false, factoryDrift: "unknown" };
  update.manifest = await exists(join(root, ".harness-manifest.json")) || await exists(join(root, ".claude", "skills"));

  // A38 진화 이력. CLAUDE.md + AGENTS.md 변경이력 표 파싱(마크다운 테이블 행).
  const evolution: Array<{ date: string; change: string; source: string }> = [];
  for (const [file, src] of [["CLAUDE.md", "CLAUDE"], ["AGENTS.md", "AGENTS"]] as const) {
    const t = await readCapped(join(root, file));
    for (const line of t.split(/\r?\n/)) {
      const m = line.match(/^\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*([^|]+?)\s*\|/);
      if (m) evolution.push({ date: m[1]!, change: m[2]!.slice(0, 200), source: src });
    }
  }
  evolution.sort((a, b) => a.date.localeCompare(b.date));

  return { configHealth, d4, update, evolution };
}

export async function settings(root: string) {
  return {
    projectRoot: root,
    mutationEnabled: false, // v0.5 파일수정 API 비활성
    // CLI 경로/기본모델/sandbox 는 /api/runtimes·환경에서. 여기선 조회만.
  };
}
