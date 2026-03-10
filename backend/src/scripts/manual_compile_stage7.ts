import { Stage7GraphCompilerService } from '../services/stage7GraphCompiler.service';

async function main() {
    const envelopeId = "b7a5d3ba-cf76-4510-88ab-2c0d454c8107";
    console.log(`[ManualTrigger] Starting Stage-7 compilation for envelope: ${envelopeId}`);
    try {
        const result = await Stage7GraphCompilerService.compileAndPersistGraph(envelopeId);
        console.log("[ManualTrigger] Compilation Successful:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("[ManualTrigger] Compilation Failed:", error);
        process.exit(1);
    }
}

main();
