// Fastify 부트 (로컬 전용 바인딩 127.0.0.1). 보안 게이트(token/Host/Origin)는 M4.
import Fastify from "fastify";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { realpath } from "node:fs/promises";
import { registerApi } from "./api/index.js";
import { makeSecurity, registerSecurity, type SecurityState } from "./security.js";
import { loadConfigFromDisk, projectsHomeFromEnv } from "./lib/config.js";
import { validateProjectRoot, type ValidateResult } from "./lib/projectroot.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// 하드코딩 기본 = harness-ui의 부모(하네스 레포 루트). 항상 안전(최종 폴백).
const HARDCODED_ROOT = resolve(__dirname, "..", "..", "..");
// projectRoot 모듈 상수(동기·하위호환). env override 허용 — 단위 테스트/buildServer 기본값.
//   실서버 부팅(isMain)은 resolveBootProjectRoot 로 D1~D7 재검증한 effectiveRoot 를 주입한다.
export const projectRoot = resolve(process.env.HARNESS_PROJECT_ROOT ?? HARDCODED_ROOT);

// A70/A71 부팅 precedence: env HARNESS_PROJECT_ROOT > config.projectRoot > 하드코딩 기본.
//   S-D2 세 소스 전부 D1~D7 재검증(env 예외 없음). 이기는 소스가 unsafe면 그 값만 무효화·다음 소스 폴백.
//   S-D3 필드 독립: projectRoot 무효화가 definitionEditEnabled/evals 를 초기화하지 않음(config 는 loadConfig 로 전 필드 복구).
//   deps 주입형(테스트 용이) — 미주입 시 실 env/disk 에서 읽는다.
export interface BootResolution {
  root: string;
  source: "env" | "config" | "default";
  rejected: Array<{ source: "env" | "config"; reason: string }>;
}
export async function resolveBootProjectRoot(deps?: {
  env?: string | null;
  configProjectRoot?: string | null;
  projectsHome?: string | null;
  hardcoded?: string;
}): Promise<BootResolution> {
  const hardcoded = deps?.hardcoded ?? HARDCODED_ROOT;
  const env = deps?.env !== undefined ? deps.env : (process.env.HARNESS_PROJECT_ROOT ?? null);
  const projectsHome = deps?.projectsHome !== undefined ? deps.projectsHome : projectsHomeFromEnv();
  const configProjectRoot = deps?.configProjectRoot !== undefined
    ? deps.configProjectRoot
    : (await loadConfigFromDisk()).projectRoot;

  const rejected: BootResolution["rejected"] = [];
  const candidates: Array<{ val: string | null | undefined; source: "env" | "config" }> = [
    { val: env, source: "env" },
    { val: configProjectRoot, source: "config" },
  ];
  for (const c of candidates) {
    if (!c.val) continue;
    let v: ValidateResult;
    if (projectsHome) {
      v = await validateProjectRoot(c.val, projectsHome); // 경계 프로비저닝 시 D1~D7 완전 검증
    } else {
      // 미프로비저닝: containment 판정 불가 → env/config 소스를 신뢰하지 않고 폴백만(경계 없이 임의경로 채택 금지).
      rejected.push({ source: c.source, reason: "boundary-not-provisioned" });
      continue;
    }
    if (v.ok) return { root: v.effectiveRoot, source: c.source, rejected };
    rejected.push({ source: c.source, reason: v.error }); // unsafe → 그 값만 무효화·다음 소스로
  }
  // 하드코딩 기본은 항상 안전(realpath best-effort — 실패해도 원본 사용).
  const root = await realpath(hardcoded).catch(() => hardcoded);
  return { root, source: "default", rejected };
}

// opts.security 미지정(테스트) 시 보안 게이트 없이 API만(단위 테스트 편의). 실서버는 security 주입.
// opts.projectRoot 미지정 시 모듈 상수(하위호환). 실 부팅은 검증된 effectiveRoot 주입.
export function buildServer(opts: { security?: SecurityState; projectRoot?: string } = {}) {
  const app = Fastify({ logger: false });
  if (opts.security) registerSecurity(app, opts.security);
  registerApi(app, opts.projectRoot ?? projectRoot);
  return app;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  void (async () => {
    const port = Number.parseInt(process.env.PORT ?? "5174", 10);
    const security = makeSecurity(port);
    const boot = await resolveBootProjectRoot();
    const app = buildServer({ security, projectRoot: boot.root });
    try {
      await app.listen({ host: "127.0.0.1", port });
      const { writeBootstrap } = await import("./launcher.js");
      await writeBootstrap(security.bootstrap).catch(() => {}); // 런처가 읽을 0600 파일(토큰은 stdout 미출력)
      process.stdout.write(`harness-ui api on http://127.0.0.1:${port} (projectRoot source=${boot.source}, bootstrap via launcher)\n`);
    } catch (e) {
      process.stderr.write(String(e) + "\n");
      process.exit(1);
    }
  })();
}
