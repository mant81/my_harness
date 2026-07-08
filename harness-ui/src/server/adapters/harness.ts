// 하네스 인벤토리 (설계 §API /api/harness, /api/agents, /api/skills).
// 정적 파일 파싱: .claude/agents/*.md, .claude/skills/*/SKILL.md, .codex/agents/*.toml, .agents/skills/.
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

async function exists(p: string): Promise<boolean> {
  try { await stat(p); return true; } catch { return false; }
}
async function listFiles(dir: string, ext: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile() && e.name.endsWith(ext)).map((e) => e.name);
  } catch { return []; }
}
async function listDirs(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch { return []; }
}

// 프론트matter(간이): --- ... --- 블록에서 key: value 추출. BOM 제거·멀티라인 값 누적·따옴표 안전 제거.
function stripQuotes(s: string): string {
  const t = s.trim();
  if (t.length >= 2 && ((t[0] === '"' && t[t.length - 1] === '"') || (t[0] === "'" && t[t.length - 1] === "'"))) {
    return t.slice(1, -1);
  }
  return t;
}
function parseFrontmatter(textIn: string): Record<string, string> {
  const text = textIn.replace(/^\uFEFF/, ""); // BOM 제거
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out: Record<string, string> = {};
  let key: string | null = null;
  const buf: string[] = [];
  const flush = () => { if (key) out[key] = stripQuotes(buf.join(" ").trim()); key = null; buf.length = 0; };
  for (const line of m[1]!.split(/\r?\n/)) {
    // 새 키 = 비들여쓰기 `key:` (YAML). 연속행 = **들여쓴** 라인만(비들여쓰기 "Note:" 오분할 차단, agy#3).
    const isIndented = /^\s/.test(line);
    const kv = !isIndented ? line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/) : null;
    if (kv) { flush(); key = kv[1]!; buf.push(kv[2]!); }
    else if (key && isIndented && line.trim()) { buf.push(line.trim()); }
  }
  flush();
  return out;
}

export type AgentInfo = { name: string; runtime: "claude" | "codex"; sourcePath: string; role: string; skills: string[] };
export type SkillInfo = { name: string; runtimePaths: string[]; description: string; references: string[]; triggers: string };

export async function readAgents(root: string): Promise<AgentInfo[]> {
  const out: AgentInfo[] = [];
  const cdir = join(root, ".claude", "agents");
  for (const f of await listFiles(cdir, ".md")) {
    const text = await readFile(join(cdir, f), "utf8").catch(() => "");
    const fm = parseFrontmatter(text);
    out.push({
      name: fm.name ?? f.replace(/\.md$/, ""), runtime: "claude", sourcePath: join(".claude/agents", f),
      role: fm.description ?? "", skills: [],
    });
  }
  const xdir = join(root, ".codex", "agents");
  for (const f of await listFiles(xdir, ".toml")) {
    const text = await readFile(join(xdir, f), "utf8").catch(() => "");
    const nm = text.match(/^\s*name\s*=\s*["'](.+?)["']/m);
    out.push({ name: nm?.[1] ?? f.replace(/\.toml$/, ""), runtime: "codex", sourcePath: join(".codex/agents", f), role: "", skills: [] });
  }
  return out;
}

export async function readSkills(root: string): Promise<SkillInfo[]> {
  const out: SkillInfo[] = [];
  const seen = new Set<string>();
  for (const base of [".claude/skills", ".agents/skills"]) {
    const sdir = join(root, base);
    for (const dir of await listDirs(sdir)) {
      const skillMd = join(sdir, dir, "SKILL.md");
      if (!(await exists(skillMd))) continue;
      const text = await readFile(skillMd, "utf8").catch(() => "");
      const fm = parseFrontmatter(text);
      const canonical = fm.name ?? dir;           // dedupe는 frontmatter name 기준(codex#5)
      const refs = await listFiles(join(sdir, dir, "references"), ".md");
      if (seen.has(canonical)) {
        const cur = out.find((s) => s.name === canonical);
        if (cur && !cur.runtimePaths.includes(base + "/" + dir)) cur.runtimePaths.push(base + "/" + dir);
        continue;
      }
      seen.add(canonical);
      out.push({
        name: canonical, runtimePaths: [base + "/" + dir],
        description: fm.description ?? "", references: refs, triggers: fm.description ?? "",
      });
    }
  }
  return out;
}

export async function harnessInventory(root: string) {
  const agents = await readAgents(root);
  const skills = await readSkills(root);
  return {
    projectRoot: root,
    claude: {
      entrypoint: (await exists(join(root, "CLAUDE.md"))) ? "CLAUDE.md" : null,
      agents: agents.filter((a) => a.runtime === "claude").length,
      skills: skills.filter((s) => s.runtimePaths.some((p) => p.startsWith(".claude"))).length,
    },
    codex: {
      entrypoint: (await exists(join(root, "AGENTS.md"))) ? "AGENTS.md" : null,
      agents: agents.filter((a) => a.runtime === "codex").length,
      skills: skills.filter((s) => s.runtimePaths.some((p) => p.startsWith(".agents"))).length,
    },
    workspace: { exists: await exists(join(root, "_workspace")), runs: (await listDirs(join(root, "_workspace", "runs"))).length },
  };
}
