const fs = require("fs")
const crypto = require("crypto")
const path = require("path")

const schemaPath = path.resolve(__dirname, "backend/src/db/schema.ts")

if (!fs.existsSync(schemaPath)) {
  console.error("Schema file not found at " + schemaPath)
  process.exit(1)
}

const content = fs.readFileSync(schemaPath)
const hash = crypto.createHash("sha256").update(content).digest("hex")

console.log(hash)
