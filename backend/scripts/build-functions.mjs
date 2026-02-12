import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const outdir = "netlify/functions-dist";
fs.mkdirSync(outdir, { recursive: true });

await build({
  entryPoints: ["netlify/functions/api.ts"],
  outfile: path.join(outdir, "api.js"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  sourcemap: true,
  logLevel: "info",
});
