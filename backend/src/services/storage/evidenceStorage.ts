import fs from 'fs';
import path from 'path';

// Optional import handling for environment where it might be missing during dev
let put: any;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const blob = require('@vercel/blob');
    put = blob.put;
} catch (e) {
    // soft fail, will error only if used
}

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'evidence');

// Ensure local dir exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface StoredArtifact {
    storageKey: string;
    publicUrl: string;
    provider: 'vercel_blob' | 'local';
}

export async function putEvidenceArtifact(
    buffer: Buffer,
    filename: string,
    mimeType: string
): Promise<StoredArtifact> {
    const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

    if (process.env.NODE_ENV === 'production' && !useBlob) {
        throw new Error("BLOB_READ_WRITE_TOKEN required in production");
    }

    if (useBlob) {
        if (!put) throw new Error("Vercel Blob SDK not installed");

        // VERCEL BLOB STRATEGY
        try {
            const blob = await put(`evidence/${Number(new Date())}-${filename}`, buffer, {
                access: 'public',
                contentType: mimeType
            });
            return {
                storageKey: blob.url,
                publicUrl: blob.url,
                provider: 'vercel_blob'
            };
        } catch (error) {
            console.error("Vercel Blob upload failed:", error);
            throw new Error("Blob upload failed");
        }
    } else {
        // LOCAL STRATEGY
        const uniqueName = `${Date.now()}-${filename}`;
        const filePath = path.join(UPLOAD_DIR, uniqueName);
        fs.writeFileSync(filePath, buffer);

        // Construct public URL - assuming express serves /uploads
        // Note: Use full URL in prod if needed, but relative works for web view. 
        // For PDF generation, we might need absolute or file path.
        // We will handle this in the PDF renderer.
        const publicUrl = `/uploads/evidence/${uniqueName}`;

        return {
            storageKey: uniqueName,
            publicUrl,
            provider: 'local'
        };
    }
}

export async function getEvidenceArtifactBytes(urlOrKey: string): Promise<Buffer> {
    if (urlOrKey.startsWith('http')) {
        const res = await fetch(urlOrKey);
        if (!res.ok) throw new Error(`Failed to fetch artifact: ${res.statusText}`);
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } else {
        // Local file strategy
        // urlOrKey might be "/uploads/evidence/..." or just "uniqueName"
        let filename = urlOrKey;
        if (filename.startsWith('/uploads/evidence/')) {
            filename = filename.replace('/uploads/evidence/', '');
        }
        const filePath = path.join(UPLOAD_DIR, filename);
        if (!fs.existsSync(filePath)) throw new Error(`Local artifact not found at ${filePath}`);
        return fs.readFileSync(filePath);
    }
}
