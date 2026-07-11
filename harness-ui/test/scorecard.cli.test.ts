// M-A A6(T7) — portable CLI(무의존 번들) stdout JSON + fail-open(diag 없음→null).
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const pexec = promisify(execFile);
const CLI = join(process.cwd(), "scripts", "harness-scorecard.mjs");

describe("portable CLI — 번들 실행", () => {
  let root: string;
  beforeAll(async () => {
    // 번들 존재 확인(npm run build:scorecard-cli 산출). 없으면 스킵 안내.
    await access(CLI).catch(() => { throw new Error("scripts/harness-scorecard.mjs 없음 — `npm run build:scorecard-cli` 먼저"); });
  });
  afterEach(async () => { if (root) await rm(root, { recursive: true, force: true }); });

  it("node CLI [root] → 계층A JSON stdout·diag null(fail-open)", async () => {
    root = await mkdtemp(join(tmpdir(), "hui-cli-"));
    await mkdir(join(root, ".claude", "agents"), { recursive: true });
    await writeFile(join(root, ".claude", "agents", "a.md"), "---\nname: a\nskills: [s1]\n---\n");
    await mkdir(join(root, ".claude", "skills", "s1"), { recursive: true });
    await writeFile(join(root, ".claude", "skills", "s1", "SKILL.md"), "---\nname: s1\ndescription: d\n---\n");
    const { stdout } = await pexec("node", [CLI, root]);
    const sc = JSON.parse(stdout);
    expect(sc.schema_version).toBe(1);
    expect(sc.scope.runtime).toBe("built");   // skills/myharness 없음
    expect(sc.diag).toBeNull();               // 계층B 미호출(fail-open)
    expect(sc.config_hash).toMatch(/^[0-9a-f]{32}$/);
    expect(sc.counts.agents).toBe(1);
  });
});
