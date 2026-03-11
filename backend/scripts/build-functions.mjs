import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const outdir = "netlify/functions-dist";
fs.mkdirSync(outdir, { recursive: true });

await build({
  entryPoints: ["src/api.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  outfile: "netlify/functions-dist/api.js",
  format: "cjs",
  sourcemap: true,
  logLevel: "info",
  packages: "bundle"
});