import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.join(__dirname, '../../../');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend/src');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend/src');

function checkControllerPersistence() {
    const controllerPath = path.join(BACKEND_DIR, 'controllers/trustagentHomepage.controller.ts');
    const content = fs.readFileSync(controllerPath, 'utf8');

    // TEST A: Forced FE-TA mode exists
    if (!content.includes("const activeMode = 'feta'")) {
        throw new Error('VIOLATION: activeMode is not forced to "feta" in the controller.');
    }

    // TEST B: FE-TA logic must not touch session service or DB artifacts
    // We scan the main 'chat' function body for forbidden terms
    const chatFnMatch = content.match(/export async function chat\(req: Request, res: Response\): Promise<void> \{([^]*?)\}\s*export async function debug/);
    if (!chatFnMatch) {
        throw new Error('VIOLATION: Could not find chat function in controller for purity scan.');
    }

    const chatFnBody = chatFnMatch[1];
    const forbidden = [
        'getOrCreateSession(',
        'queryPublicAssistant(',
        'logEvent(',
        'publicAgentSessions',
        'openaiThreadId',
        'thread_'
    ];

    forbidden.forEach(term => {
        if (chatFnBody.includes(term)) {
            throw new Error(`VIOLATION: Controller chat function contains forbidden persistence/service call: ${term}`);
        }
    });
}

function checkServicePurity() {
    const servicePath = path.join(BACKEND_DIR, 'services/publicAgentSession.service.ts');
    const content = fs.readFileSync(servicePath, 'utf8');

    // TEST C: Service signature must be homepage-only
    const forbidden = [
        "mode === 'feta'",
        "feta_trustagent",
        "OPENAI_FETA",
        "assistantId.*feta"
    ];

    forbidden.forEach(ptrn => {
        const regex = new RegExp(ptrn, 'i');
        if (regex.test(content)) {
            throw new Error(`VIOLATION: Service layer still mentions FE-TA artifacts: ${ptrn}`);
        }
    });

    // Check signature explicitly
    if (content.includes("mode?: string")) {
        throw new Error('VIOLATION: Service layer still accepts "mode" in signatures.');
    }
}

function checkSynthesisDuplication() {
    // TEST D: Synthesis strings should only be in shared/src/feta/canonical.ts or markdown
    const forbiddenStrings = [
        "This isn’t an effort problem",
        "Work is getting done, but ownership dissolves",
        "The system works until volume increases"
    ];

    // Scan all src files except canonical.ts, txt files, or smoke tests
    const files = getAllFiles(BACKEND_DIR).filter(f =>
        !f.endsWith('canonical.ts') &&
        !f.endsWith('.txt') &&
        !f.includes('smoke') &&
        !f.includes('parse_feta_canon') &&
        !f.includes('check_feta_canon_violation')
    );

    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        forbiddenStrings.forEach(str => {
            if (content.includes(str)) {
                throw new Error(`VIOLATION: Duplicated canonical string found in ${path.relative(ROOT_DIR, file)}: "${str.substring(0, 20)}..."`);
            }
        });
    });
}

function checkFrontendGating() {
    const shellPath = path.join(FRONTEND_DIR, 'trustagent/TrustAgentShell.tsx');
    const content = fs.readFileSync(shellPath, 'utf8');

    // TEST: Check for mode prop capability
    if (!content.includes("mode?:") && !content.includes("mode:")) {
        throw new Error('VIOLATION: Frontend TrustAgentShell lacks "mode" awareness.');
    }
}

function checkRevealContract() {
    const shellPath = path.join(FRONTEND_DIR, 'trustagent/TrustAgentShell.tsx');
    const content = fs.readFileSync(shellPath, 'utf8');

    // TEST: Ensure reveal + cta are preserved in constructor
    const terms = [
        'reveal: response.reveal',
        'cta: response.cta || parsedCta'
    ];

    terms.forEach(term => {
        if (!content.includes(term)) {
            throw new Error(`VIOLATION: Reveal/CTA field preservation missing in frontend: ${term}`);
        }
    });

    // TEST: Ensure reveal rendering exists
    if (!content.includes('msg.reveal.headline') || !content.includes('msg.reveal.diagnosis')) {
        throw new Error('VIOLATION: Reveal rendering block missing in frontend UI.');
    }
}

function checkActivePath() {
    const homePagePath = path.join(FRONTEND_DIR, 'pages/HomePage.tsx');
    const content = fs.readFileSync(homePagePath, 'utf8');

    if (!content.includes("../trustagent/TrustAgentShell")) {
        throw new Error('VIOLATION: HomePage.tsx is NOT using the active TrustAgentShell (from trustagent/ directory).');
    }

    if (content.includes("../components/TrustAgent/TrustAgentShell")) {
        throw new Error('VIOLATION: HomePage.tsx is using legacy TrustAgentShell path.');
    }
}

function getAllFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

function run() {
    console.log('Running FE-TA Canonical Compliance Guard...');
    try {
        checkControllerPersistence();
        checkServicePurity();
        checkSynthesisDuplication();
        checkFrontendGating();
        checkRevealContract();
        checkActivePath();
        console.log('✅ All FE-TA invariants satisfied.');
    } catch (err: any) {
        console.error(`❌ FE-TA COMPLIANCE FAILURE: ${err.message}`);
        process.exit(1);
    }
}

run();
