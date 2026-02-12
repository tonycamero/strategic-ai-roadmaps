import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function listFiles() {
  const out = execSync("git ls-files src | rg '\\.ts$'", { encoding: "utf8" });
  return out.split("\n").filter(Boolean);
}

function hasExt(p) {
  return /\.(?:[cm]?ts|[cm]?js|json|node)$/.test(p);
}

function fixText(text) {
  // normalize garbage extensions first
  text = text.replace(/\.ts\.ts(['"])/g, ".ts$1");
  text = text.replace(/\.js\.ts(['"])/g, ".ts$1");

  // static imports: from "../x/y";
  text = text.replace(
    /(from\s+['"])(\.{1,2}\/[^'"]+)(['"]\s*;)/g,
    (m, a, p, b) => (hasExt(p) ? m : `${a}${p}.ts${b}`)
  );

  // dynamic imports: import("../x/y")
  text = text.replace(
    /(import\(\s*['"])(\.{1,2}\/[^'"]+)(['"]\s*\))/g,
    (m, a, p, b) => (hasExt(p) ? m : `${a}${p}.ts${b}`)
  );

  // re-normalize in case we created doubles
  text = text.replace(/\.ts\.ts(['"])/g, ".ts$1");
  text = text.replace(/\.js\.ts(['"])/g, ".ts$1");

  return text;
}

let changed = 0;
for (const file of listFiles()) {
  const abs = path.resolve(file);
  const before = fs.readFileSync(abs, "utf8");
  const after = fixText(before);
  if (after !== before) {
    fs.writeFileSync(abs, after, "utf8");
    changed++;
  }
}

console.log(`[fix-relative-imports] changed files: ${changed}`);
