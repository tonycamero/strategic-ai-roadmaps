const fs = require("fs")

const controllerPath =
"src/controllers/superadmin.controller.ts"

if (!fs.existsSync(controllerPath)) {
  console.log("Controller not found — skipping guard")
  process.exit(0)
}

const content = fs.readFileSync(controllerPath).toString()

const forbiddenPatterns = [
"for (const finding",
".map((finding",
"ticketDraft",
"buildTicketFromFinding",
"generateRawTickets",
"aiTicketGenerator",
"ticketArchitect"
]

for (const pattern of forbiddenPatterns) {
  if (content.includes(pattern)) {
    console.error("STAGE-6 ARCHITECTURE VIOLATION")
    console.error(
      "Ticket generation logic detected inside controller"
    )
    process.exit(1)
  }
}

console.log("Controller boundary verified.")
