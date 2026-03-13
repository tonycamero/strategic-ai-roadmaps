const fs = require("fs")
const crypto = require("crypto")

const schemaPath = "src/db/schema.ts"
const baselinePath = "scripts/guardrails/schema.hash"

if (!fs.existsSync(schemaPath)) {
  console.error("Schema file not found.")
  process.exit(1)
}

const content = fs.readFileSync(schemaPath)
const hash = crypto.createHash("sha256").update(content).digest("hex")

if (!fs.existsSync(baselinePath)) {
  fs.writeFileSync(baselinePath, hash)
  console.log("Schema baseline created.")
  process.exit(0)
}

const baseline = fs.readFileSync(baselinePath).toString()

if (baseline !== hash) {
  console.error("SCHEMA AUTHORITY VIOLATION")
  console.error("schema.ts was modified without migration ticket")
  console.error("Actual hash:   |" + hash + "| (length: " + hash.length + ")")
  console.error("Expected hash: |" + baseline + "| (length: " + baseline.length + ")")
  process.exit(1)
}

console.log("Schema integrity verified.")
