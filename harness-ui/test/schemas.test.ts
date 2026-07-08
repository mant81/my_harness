import { describe, it, expect } from "vitest";
import { Status, isSchemaValid } from "../src/server/schemas.js";

const validStatus = {
  schemaVersion: "1", runId: "r1", state: "running", phase: "Phase 1", progress: 42,
  updatedAt: "2026-07-09T10:00:00+09:00", heartbeatAt: "2026-07-09T10:00:00+09:00",
  serverPid: 1, serverStartTime: "x", childPid: 2, childStartTime: "y",
  childProcessGroupId: 2, exitCode: null, exitSignal: null, cancelRequestedAt: null,
  stateReason: null, summary: "", error: null,
};

describe("schemas / schema-valid", () => {
  it("valid Status parses", () => {
    expect(isSchemaValid(Status, validStatus).ok).toBe(true);
  });
  it("invalid state rejected", () => {
    const r = isSchemaValid(Status, { ...validStatus, state: "bogus" });
    expect(r.ok).toBe(false);
  });
  it("progress out of range rejected", () => {
    expect(isSchemaValid(Status, { ...validStatus, progress: 200 }).ok).toBe(false);
  });
  it("Windows childProcessGroupId string accepted", () => {
    expect(isSchemaValid(Status, { ...validStatus, childProcessGroupId: "pid:2" }).ok).toBe(true);
  });
});
