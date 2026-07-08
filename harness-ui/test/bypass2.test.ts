import { describe, it, expect } from "vitest";
import { buildServer } from "../src/server/index.js";
import { makeSecurity } from "../src/server/security.js";
describe("auth-bypass 추가 벡터 실증", () => {
  const sec = makeSecurity(5174); const app = buildServer({ security: sec }); const H = "127.0.0.1:5174";
  const cases: Array<[string,string]> = [
    ["GET","//api/harness"], ["GET","/%2f/api/harness"], ["GET","/api/%2e%2e/settings"],
    ["GET","\\api\\harness"], ["OPTIONS","/api/harness"], ["HEAD","/api/harness"],
    ["GET","/api/harness/"], ["GET","/api/harness%00"], ["GET","/./api/harness"],
  ];
  for (const [method,url] of cases) {
    it(`${method} ${url} no-token → non-200`, async () => {
      const r = await app.inject({ method: method as any, url, headers: { host: H } });
      console.log(method, url, "→", r.statusCode);
      expect(r.statusCode).not.toBe(200);
    });
  }
});
