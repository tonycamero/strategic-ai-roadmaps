const fs = require("fs")
const path = require("path")

const repoRoot = "src/services"

function scanDirectory(dir) {
  let files = []

  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir)

  for (const item of items) {
    const full = path.join(dir, item)

    if (fs.statSync(full).isDirectory()) {
      files = files.concat(scanDirectory(full))
    } else {
      files.push(full)
    }
  }

  return files
}

const files = scanDirectory(repoRoot)

const violations = []

for (const file of files) {
  const content = fs.readFileSync(file).toString()

  if (file.includes("stage5") && content.includes("generateTicketsFromFindings")) {
    violations.push("Stage-5 attempting ticket generation: " + file)
  }

  if (file.includes("stage6") && content.includes("compileRoadmapGraph")) {
    violations.push("Stage-6 attempting Stage-7 compilation: " + file)
  }

  if (file.includes("stage7") && content.includes("generateTicketsFromFindings")) {
    violations.push("Stage-7 attempting ticket generation: " + file)
  }
}

if (violations.length > 0) {
  console.error("STAGE BOUNDARY VIOLATION")
  for (const v of violations) {
    console.error(v)
  }
  process.exit(1)
}

console.log("Stage boundary contracts verified.")
