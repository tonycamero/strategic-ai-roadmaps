import { execSync } from "node:child_process";

try {
  const result = execSync(
    `rg -n "from ['\\"]\\.{1,2}/[^'\\"]+['\\"]" src | rg -v "\\.(ts|js|json|node)['\\"]\\s*;"`,
    { stdio: "pipe" }
  ).toString();

  if (result.trim()) {
    console.error("❌ Extensionless relative imports detected:\n");
    console.error(result);
    process.exit(1);
  }

  console.log("✅ No extensionless relative imports.");
} catch {
  console.log("✅ No extensionless relative imports.");
}
