// portable CLI 엔트리(설계 §5-1) — esbuild 로 scripts/harness-scorecard.mjs 로 번들(무의존·서버 불요).
// 슬림 하네스에서 오케스트레이터가 `node scripts/harness-scorecard.mjs [root]` 실행 → 계층A JSON stdout.
import { computeHarnessScorecard } from "./scorecard.js";

const root = process.argv[2] || process.cwd();
computeHarnessScorecard(root, { now: new Date().toISOString().slice(0, 10) }) // waiver 만료 판정용 현재일
  .then((sc) => { process.stdout.write(JSON.stringify(sc, null, 2) + "\n"); })
  .catch((e) => { process.stderr.write(String(e?.stack || e) + "\n"); process.exit(1); });
