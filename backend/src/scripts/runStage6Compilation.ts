import { Stage6CompilationService } from "../services/stage6Compilation.service";

async function run() {
  const selectionEnvelopeId = "6878dff3-eef8-47d5-bc03-0ff06554568e";

  console.log("Activating Stage 6...");

  const result = await Stage6CompilationService.activateStage6(
    selectionEnvelopeId
  );

  console.log("Stage 6 completed:");
  console.log(result);
}

run().catch((err) => {
  console.error("Stage 6 failed:", err);
  process.exit(1);
});