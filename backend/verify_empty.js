
async function run() {
    try {
        const response = await fetch('http://localhost:3001/api/public/trustagent/homepage/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "", mode: "homepage" })
        });
        const data = await response.json();
        console.log('--- EMPTY MESSAGE RESPONSE ---');
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(err);
    }
}
run();
