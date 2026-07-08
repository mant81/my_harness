import { describe, it, expect } from "vitest";
import { buildServer } from "../src/server/index.js";
import { makeSecurity } from "../src/server/security.js";
describe("auth-bypass 회귀 (인코딩·authority-form)", () => {
  const sec = makeSecurity(5174); const app = buildServer({ security: sec }); const H = "127.0.0.1:5174";
  const urls = ["/api/harness", "/%61pi/harness", "/API/harness", "/api//harness",
    "http://127.0.0.1:5174/api/harness", "http://evil.com/api/harness", "/%2561pi/harness"];
  for (const url of urls) {
    it(`no-token ${url} → non-200`, async () => {
      const r = await app.inject({ method: "GET", url, headers: { host: H } });
      console.log(url, "→", r.statusCode);
      expect(r.statusCode).not.toBe(200); // unauth 200 = 우회
    });
  }
});
