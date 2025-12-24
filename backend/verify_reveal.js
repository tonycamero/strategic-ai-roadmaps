var https = require('http');

const data = JSON.stringify({
    sessionId: "test-reveal-" + Date.now(),
    message: "H0_YES"
});

// Helper to send request
function send(stepName, message, sessionId) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/public/trustagent/homepage/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify({ sessionId, message }))
            }
        }, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    console.log(`\n[${stepName}] Response:`, JSON.stringify(parsed, null, 2));
                    resolve(parsed);
                } catch (e) {
                    console.error(`[${stepName}] Failed to parse:`, body);
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(JSON.stringify({ sessionId, message }));
        req.end();
    });
}

async function runTest() {
    const sessionId = "test-reveal-" + Date.now();

    // 1. H0 -> Yes
    await send("1. H0_YES", "H0_YES", sessionId);

    // 2. Q1 -> A1_FU
    await send("2. Q1_ANS", "A1_FU", sessionId);

    // 3. Q2 -> A2_MAN
    await send("3. Q2_ANS", "A2_MAN", sessionId);

    // 4. Q3 -> A3_FOUN (Should trigger Reveal)
    const finalRes = await send("4. Q3_ANS (Reveal)", "A3_FOUN", sessionId);

    if (finalRes.reveal && finalRes.reveal.headline) {
        console.log("\n✅ SUCCESS: Reveal payload received!");
        console.log("Headline:", finalRes.reveal.headline);
    } else {
        console.error("\n❌ FAILURE: Missing reveal payload.");
        process.exit(1);
    }
}

runTest();
