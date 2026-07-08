// Fastify 부트 (로컬 전용 바인딩 127.0.0.1). 보안 게이트(token/Host/Origin)는 M4.
import Fastify from "fastify";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { registerApi } from "./api/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// projectRoot = harness-ui의 부모(하네스 레포 루트). env override 허용.
export const projectRoot = resolve(process.env.HARNESS_PROJECT_ROOT ?? resolve(__dirname, "..", "..", ".."));

export function buildServer() {
  const app = Fastify({ logger: false });
  registerApi(app, projectRoot);
  return app;
}

// 직접 실행 시에만 listen(테스트는 buildServer만 import).
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const port = Number.parseInt(process.env.PORT ?? "5174", 10);
  const app = buildServer();
  app.listen({ host: "127.0.0.1", port }).then(() => {
    process.stdout.write(`harness-ui api on http://127.0.0.1:${port}\n`);
  }).catch((e) => { process.stderr.write(String(e) + "\n"); process.exit(1); });
}
