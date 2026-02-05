
const STOPWORDS = new Set([
    'the', 'and', 'to', 'of', 'a', 'in', 'is', 'that', 'for', 'it', 'on', 'with', 'as', 'are', 'this', 'but', 'be', 'at', 'or', 'from', 'an', 'not', 'by', 'we', 'our', 'my', 'have', 'do', 'can', 'will', 'be', 'has', 'was', 'so', 'if', 'your', 'you', 'all', 'more', 'about', 'some', 'what', 'which', 'their', 'they', 'when', 'up', 'out', 'one',
    'without', 'could', 'should', 'would', 'first', 'last', 'into', 'over', 'back'
]);

const DOMAIN_ALLOWLIST = new Set([
    'erp', 'crm', 'api', 'ai', 'kpi', 'roi', 'sql', 'db', 'app', 'saas', 'b2b', 'b2c', 'hr', 'ops', 'hubspot', 'netsuite', 'sf', 'salesforce', 'jira', 'asana'
]);

function isDomainBearing(word: string): boolean {
    if (DOMAIN_ALLOWLIST.has(word)) return true;
    return word.length >= 4;
}

function extractKeywords(text: string, count: number = 10): string[] {
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    const freq: Record<string, number> = {};

    words.forEach(w => {
        if (!STOPWORDS.has(w)) {
            freq[w] = (freq[w] || 0) + 1;
        }
    });

    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([w]) => w);

    // Safety check filter
    const domainBearing = sorted.filter(w => isDomainBearing(w));

    return domainBearing.slice(0, count);
}

const text = "Stop missing calls and opportunities. Dispatch and admin are stretched thin. We need to organize our work better.";

const keywords = extractKeywords(text, 10);
console.log("Keywords:", keywords);

const THEMES = [
    { label: "Operational Stabilization", triggers: ['chaos', 'order', 'stable', 'fix', 'break', 'down', 'issue', 'consisten', 'followup', 'organize', 'plan', 'schedul', 'manag', 'track', 'email', 'review', 'work', 'labor', 'admin', 'paper', 'excel', 'bottleneck', 'delay', 'wait', 'queue', 'error', 'call', 'phone', 'dispatch', 'rout', 'service', 'client'] }
];

const themeSignals = THEMES.map(theme => ({
    theme: theme.label,
    matchedKeywords: keywords.filter(k => theme.triggers.some(t => k.includes(t)))
}));

console.log("Signals:", JSON.stringify(themeSignals, null, 2));
