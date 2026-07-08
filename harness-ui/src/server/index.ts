// Fastify 부트 (로컬 전용 바인딩 127.0.0.1). 보안 게이트(token/Host/Origin)는 M4.
import Fastify from "fastify";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { registerApi } from "./api/index.js";
import { makeSecurity, registerSecurity, type SecurityState } from "./security.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// projectRoot = harness-ui의 부모(하네스 레포 루트). env override 허용.
export const projectRoot = resolve(process.env.HARNESS_PROJECT_ROOT ?? resolve(__dirname, "..", "..", ".."));

// opts.security 미지정(테스트) 시 보안 게이트 없이 API만(단위 테스트 편의). 실서버는 security 주입.
export function buildServer(opts: { security?: SecurityState } = {}) {
  const app = Fastify({ logger: false });
  if (opts.security) registerSecurity(app, opts.security);
  registerApi(app, projectRoot);
  return app;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const port = Number.parseInt(process.env.PORT ?? "5174", 10);
  const security = makeSecurity(port);
  const app = buildServer({ security });
  app.listen({ host: "127.0.0.1", port }).then(() => {
    // 토큰은 fragment 로만 전달(쿼리·로그 미노출). bootstrap URL 은 별도 안내(런처 M6).
    process.stdout.write(`harness-ui api on http://127.0.0.1:${port} (bootstrap via launcher)\n`);
  }).catch((e) => { process.stderr.write(String(e) + "\n"); process.exit(1); });
}
