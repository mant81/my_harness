// 하네스 목록 — "하네스" = 오케스트레이터 스킬(orchestrates: 선언 또는 이름 휴리스틱) + 배정 에이전트/스킬.
// 명시 엔티티가 없어 연결 그래프에서 파생(harness_scorecard 와 동일 소스). backfill(orchestrates 선언) 전엔
// 오케스트레이터 추정 스킬을 "미선언"으로 표기(빈 배정) — 배선 필요를 가시화.
import { readAgents, readSkills } from "./harness.js";

export interface HarnessEntry {
  name: string;                 // 오케스트레이터 스킬명
  runtime: string;              // claude|codex(첫 runtimePath 기준)
  orchestratesDeclared: boolean; // orchestrates: 배열 선언 여부
  agents: string[];             // 배정 대상 중 실재 에이전트
  missingAgents: string[];      // orchestrates 대상인데 파일 부재(dead_link)
  skillCount: number;           // 배정 에이전트들이 선언한 스킬(중복 제거)
  status: "linked" | "unmigrated" | "broken"; // 선언·정상 / 미선언(추정) / 대상부재
}
const isOrchestratorName = (n: string, d: string) => /orchestrat|오케스트/i.test(n + " " + d);
const skillRuntime = (rp: string): string => (rp.startsWith(".agents") ? "codex" : "claude");

export async function listHarnesses(root: string): Promise<{ harnesses: HarnessEntry[] }> {
  const agents = await readAgents(root);
  const skills = await readSkills(root);
  const agentByName = new Map(agents.map((a) => [a.name, a]));
  const out: HarnessEntry[] = [];

  for (const s of skills) {
    const orchItems = new Set<string>();
    let declared = false;
    for (const ev of Object.values(s.orchestratesByRuntimePath)) {
      if (ev.declared) { declared = true; for (const a of ev.items) orchItems.add(a); }
    }
    // 오케스트레이터 = orchestrates 선언 OR 이름/설명 휴리스틱(미선언 추정도 목록에 노출).
    if (!declared && !isOrchestratorName(s.name, s.description)) continue;

    const agentsFound: string[] = [], missing: string[] = [];
    for (const a of orchItems) (agentByName.has(a) ? agentsFound : missing).push(a);
    const skillSet = new Set<string>();
    for (const an of agentsFound) for (const sk of (agentByName.get(an)?.skills ?? [])) skillSet.add(sk);

    const status: HarnessEntry["status"] = missing.length > 0 ? "broken" : declared ? "linked" : "unmigrated";
    out.push({
      name: s.name, runtime: skillRuntime(s.runtimePaths[0] ?? ".claude"),
      orchestratesDeclared: declared, agents: agentsFound.sort(), missingAgents: missing.sort(),
      skillCount: skillSet.size, status,
    });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return { harnesses: out };
}
