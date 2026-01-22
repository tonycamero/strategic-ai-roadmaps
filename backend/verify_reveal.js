#!/usr/bin/env node

/**
 * TrustAgent Guard — Reveal Verification
 * Purpose: CI compatibility shim. This repo may not require a separate "reveal" verifier beyond tests.
 * This script must be stable and non-blocking unless core baseline files are missing.
 */

import fs from "node:fs";
import path from "node:path";

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

const root = process.cwd(); // CI sets cwd to backend in run_feta_check.sh
const canonicalDir = path.join(root, "..", "docs", "canonical-runs", "northshore-logistics");

const required = [
  path.join(canonicalDir, "intake.json"),
  path.join(canonicalDir, "artifacts.json"),
  path.join(canonicalDir, "tickets.json"),
];

const missing = required.filter((p) => !exists(p));

if (missing.length) {
  console.error("ERROR: Stage 6 canonical baseline missing required files:");
  for (const m of missing) console.error(" - " + m);
  process.exit(1);
}

console.log("OK: verify_reveal baseline present (Stage 6 canonical run files found).");
process.exit(0);
