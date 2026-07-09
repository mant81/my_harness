// 하네스 인벤토리 (설계 §API /api/harness, /api/agents, /api/skills).
// 정적 파일 파싱: .claude/agents/*.md, .claude/skills/*/SKILL.md, .codex/agents/*.toml, .agents/skills/.
import { constants } from "node:fs";
import { readFile, readdir, stat, open } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { ARGV_TOKEN, isSafeSegment } from "../lib/paths.js";

// 정의 스캔 바운드(agy#2 OOM/DoS 방어): 파일당 read 상한 + 디렉토리당 개수 상한.
const MAX_DEF_BYTES = 262144;   // 정의 파일당 read 상한(256KB) — 거대 파일 OOM 차단
const MAX_AGENT_FILES = 500;    // 디렉토리당 스캔 개수 상한 — 전건 read 폭발 차단

async function exists(p: string): Promise<boolean> {
  try { await stat(p); return true; } catch { return false; }
}
async function listFiles(dir: string, ext: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile() && e.name.endsWith(ext)).map((e) => e.name).slice(0, MAX_AGENT_FILES);
  } catch { return []; }
}
// O_NOFOLLOW open → fstat 정규파일·크기 검사 → 상한 내 바운드 read. 비정규/초과/오픈실패 = null(스킵).
// 전체 readFile 대신 크기캡 read 로 거대 정의 파일 OOM 을 차단(statestats.readCapped 동형).
async function readCappedDef(p: string): Promise<string | null> {
  let fh;
  try { fh = await open(p, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)); }
  catch { return null; }
  try {
    const st = await fh.stat();
    if (!st.isFile() || st.size > MAX_DEF_BYTES) return null; // 초과 파일 skip — read 미수행(OOM 방어)
    const buf = Buffer.alloc(st.size);
    await fh.read(buf, 0, st.size, 0);
    return buf.toString("utf8");
  } catch { return null; }
  finally { await fh.close().catch(() => {}); }
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

// F2(M10): tools = U⊆D 상한 D의 소스(정의 frontmatter → argv-token 필터). targets/domainTemplate/permissionMode = run-template 프리필 초안.
export type AgentInfo = {
  name: string; runtime: "claude" | "codex"; sourcePath: string; role: string; skills: string[];
  tools: string[]; targets: string[]; domainTemplate: string; permissionMode: string | null;
};
export type SkillInfo = { name: string; runtimePaths: string[]; description: string; references: string[]; triggers: string };

const MAX_TOOLS = 40;      // argv 배열 상한(RunRequest.allowedTools.max(40) 정합)
const MAX_TOOL_LEN = 60;   // 개별 tool 길이 상한(.max(60) 정합)
const TARGET_ENUM = ["agents", "skills", "orchestrator"]; // RunRequest.targets enum

// 나열 분해 공통 전처리(agy#1): 대괄호·따옴표 제거 후 콤마/공백 split.
// claude `.md`(YAML `Read, Grep`·리스트 잔재 "- Read")와 codex `.toml`(배열 `["Read","Bash"]`) 양쪽에서
// 순수 토큰만 남긴다 — 미제거 시 `["Read` 같은 오염 토큰이 argv 필터에 전부 드롭돼 D 가 항상 빈 배열이 됨.
function splitList(raw: string): string[] {
  return raw.replace(/[[\]"']/g, " ").split(/[,\s]+/);
}

// frontmatter/toml `tools` → 배열 분해·argv-token 필터·dedupe·clamp.
// argv 요소 안전(leading-dash 차단)·경로 조립 아님. YAML 대시("-")·괄호 스펙(Bash(git:*)) 등 비-token 은 필터로 드롭.
export function deriveTools(raw: string | undefined): string[] {
  if (!raw) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const tok of splitList(raw)) {
    const t = tok.trim();
    if (!t || t.length > MAX_TOOL_LEN || !ARGV_TOKEN.test(t) || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= MAX_TOOLS) break;
  }
  return out;
}

function deriveTargets(raw: string | undefined): string[] {
  if (!raw) return [];
  const out: string[] = [];
  for (const tok of splitList(raw)) {
    const t = tok.trim();
    if (TARGET_ENUM.includes(t) && !out.includes(t)) out.push(t);
    if (out.length >= 8) break;
  }
  return out;
}

// 정의 지문(stale 폼 탐지·통합감사 R4-#1). 프리필/D 에 영향 주는 정규화 필드만 해싱 →
// 무관한 편집(주석 등)엔 불변, sourcePath·tools·targets·domain·permissionMode 변경 시에만 변동. 삭제는 findAgent=undefined 로 별도 처리.
export function agentFingerprint(a: AgentInfo): string {
  const canon = JSON.stringify({
    n: a.name, r: a.runtime, p: a.sourcePath,
    t: [...a.tools].sort(), g: [...a.targets].sort(), d: a.domainTemplate, m: a.permissionMode,
  });
  return createHash("sha256").update(canon).digest("hex").slice(0, 16);
}

// 단일 파일 → AgentInfo 구성(전건 스캔·단건 fast-path 공유 — 동일 구성 보장으로 지문 일치).
// sourcePath 는 POSIX 리터럴 결합("/") — OS 구분자 무관 결정적 지문(agy#3). 파일 접근엔 미사용(표시·지문 전용).
function buildClaudeAgent(f: string, text: string): AgentInfo {
  const fm = parseFrontmatter(text);
  return {
    name: fm.name ?? f.replace(/\.md$/, ""), runtime: "claude", sourcePath: ".claude/agents/" + f,
    role: fm.description ?? "", skills: [],
    tools: deriveTools(fm.tools), targets: deriveTargets(fm.targets),
    domainTemplate: fm.domainTemplate ?? "", permissionMode: fm.permissionMode ?? null,
  };
}
function buildCodexAgent(f: string, text: string): AgentInfo {
  const nm = text.match(/^\s*name\s*=\s*["'](.+?)["']/m);
  // codex .toml `tools = ["Read", ...]` / `targets = [...]` — 배열 문법은 splitList 가 정제(agy#1).
  const toolsM = text.match(/^\s*tools\s*=\s*(.+)$/m);
  const targetsM = text.match(/^\s*targets\s*=\s*(.+)$/m);
  return {
    name: nm?.[1] ?? f.replace(/\.toml$/, ""), runtime: "codex", sourcePath: ".codex/agents/" + f,
    role: "", skills: [],
    tools: deriveTools(toolsM?.[1]), targets: deriveTargets(targetsM?.[1]),
    domainTemplate: "", permissionMode: null,
  };
}

// run-template·POST U⊆D 재도출의 단일 진입점(동일 재도출 함수 — 템플릿/제출 D 일치 보장).
// fast-path(agy#2): 이름=파일명 규약이면 후보 1~2개만 크기캡 read — 전 디렉토리 read 폭발 회피.
// 불일치(fm.name≠파일명)·비안전 세그먼트 시 전건 스캔 폴백(정확성 유지).
export async function findAgent(root: string, name: string): Promise<AgentInfo | undefined> {
  if (isSafeSegment(name)) {
    const claudeFile = name + ".md";
    const ct = await readCappedDef(join(root, ".claude", "agents", claudeFile));
    if (ct !== null) { const a = buildClaudeAgent(claudeFile, ct); if (a.name === name) return a; }
    const codexFile = name + ".toml";
    const xt = await readCappedDef(join(root, ".codex", "agents", codexFile));
    if (xt !== null) { const a = buildCodexAgent(codexFile, xt); if (a.name === name) return a; }
  }
  return (await readAgents(root)).find((a) => a.name === name);
}

export async function readAgents(root: string): Promise<AgentInfo[]> {
  const out: AgentInfo[] = [];
  const cdir = join(root, ".claude", "agents");
  for (const f of await listFiles(cdir, ".md")) {
    const text = await readCappedDef(join(cdir, f));
    if (text === null) continue; // 초과/비정규/오픈실패 skip(OOM 방어)
    out.push(buildClaudeAgent(f, text));
  }
  const xdir = join(root, ".codex", "agents");
  for (const f of await listFiles(xdir, ".toml")) {
    const text = await readCappedDef(join(xdir, f));
    if (text === null) continue;
    out.push(buildCodexAgent(f, text));
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
