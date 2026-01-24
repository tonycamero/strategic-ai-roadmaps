try {
    const pdf = require('pdfkit');
    console.log('Success resolving pdfkit');
} catch (e) {
    console.error('Failed to resolve:', e.message);
    console.error('Require stack:', e.requireStack);
}
