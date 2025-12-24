/**
 * Download Helper
 * Handles PDF downloads from API endpoints
 */

/**
 * POST to PDF endpoint and trigger browser download
 */
export async function postPdfAndDownload(
    url: string,
    body: any,
    filename: string
): Promise<void> {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'PDF generation failed' }));
            throw new Error(error.error || 'PDF download failed');
        }

        // Get PDF blob
        const blob = await response.blob();

        // Create download link
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('[Download] PDF download failed:', error);
        throw error;
    }
}
