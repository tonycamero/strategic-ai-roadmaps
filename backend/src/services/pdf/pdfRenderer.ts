/**
 * PDF Renderer using Puppeteer Core + Sparticuz Chromium
 * Serverless-compatible PDF generation
 */

import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Singleton browser instance
let browserInstance: Browser | null = null;

// Promise queue for concurrency control (clean, no busy-wait)
class RenderQueue {
    private active = 0;
    private readonly maxConcurrent = 2;
    private waiters: Array<() => void> = [];

    async acquire(): Promise<void> {
        if (this.active < this.maxConcurrent) {
            this.active++;
            return;
        }

        // Enqueue and wait for slot
        await new Promise<void>(resolve => {
            this.waiters.push(resolve);
        });
    }

    release(): void {
        this.active--;

        // Resolve next waiter if any
        const next = this.waiters.shift();
        if (next) {
            this.active++;
            next();
        }
    }
}

const renderQueue = new RenderQueue();

/**
 * Get or create browser instance with chromium
 */
async function getBrowser(): Promise<Browser> {
    if (browserInstance && browserInstance.isConnected()) {
        return browserInstance;
    }

    // For local development, try to use local chromium
    let executablePath: string;
    try {
        executablePath = await chromium.executablePath();
    } catch (e) {
        // Fallback for local dev - use system chromium or puppeteer's bundled chromium
        executablePath = process.env.CHROME_PATH || '/usr/bin/chromium-browser';
    }

    browserInstance = await puppeteer.launch({
        args: chromium.args,
        executablePath,
        headless: true, // Fixed type error in @sparticuz/chromium
        defaultViewport: {
            width: 816,  // 8.5" at 96dpi
            height: 1056, // 11" at 96dpi
            deviceScaleFactor: 2, // Crisp rendering
        },
    });

    // Clean shutdown on process termination
    process.on('SIGTERM', async () => {
        if (browserInstance) {
            await browserInstance.close();
        }
    });

    return browserInstance;
}

/**
 * Render HTML to PDF buffer with timeout protection
 */
export async function renderPdf(options: {
    html: string;
}): Promise<Buffer> {
    // Acquire render slot from queue
    await renderQueue.acquire();

    const browser = await getBrowser();
    const page: Page = await browser.newPage();

    try {
        // Set 15 second timeout for all operations
        page.setDefaultTimeout(15000);

        await page.setContent(options.html, {
            waitUntil: 'networkidle0',
            timeout: 15000,
        });

        // Emulate screen media (we control print CSS ourselves)
        await page.emulateMediaType('screen');

        const pdfOptions: PDFOptions = {
            format: 'Letter',
            printBackground: true,  // CRITICAL for dark mode
            preferCSSPageSize: true,
            margin: {
                top: '0.6in',
                right: '0.6in',
                bottom: '0.75in',
                left: '0.6in',
            },
            timeout: 15000,
        };

        const pdfBuffer = await page.pdf(pdfOptions);
        return Buffer.from(pdfBuffer);
    } finally {
        await page.close();
        renderQueue.release();
    }
}

/**
 * Close browser instance (for graceful shutdown)
 */
export async function closeBrowser(): Promise<void> {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
    }
}
