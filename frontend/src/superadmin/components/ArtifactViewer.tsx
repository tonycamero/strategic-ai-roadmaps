// frontend/src/superadmin/components/ArtifactViewer.tsx
import React from 'react';

interface ArtifactViewerProps {
    artifact: any;
}

/**
 * Universal text extractor for various artifact shapes.
 * Priority: delta (manager override) > outputs (string) > outputs.markdown > outputs.content (JSON)
 */
function extractArtifactText(artifact: any): string {
    if (!artifact) return "";

    try {
        // 1. Operator override/manual delta first
        if (artifact.raw?.delta) {
            return artifact.raw.delta;
        }

        // 2. Plain string output
        if (typeof artifact.outputs === "string") {
            return artifact.outputs;
        }

        // 3. Explicit markdown sub-field
        if (artifact.outputs?.markdown) {
            return artifact.outputs.markdown;
        }

        // 4. Structured JSON content
        if (artifact.outputs?.content) {
            return JSON.stringify(artifact.outputs.content, null, 2);
        }

        // 5. Fallback for Note delta if not in raw
        if (artifact.delta) {
            return artifact.delta;
        }

        // 6. Generic fallback
        return typeof artifact === 'string' ? artifact : JSON.stringify(artifact, null, 2);
    } catch (err) {
        console.error("[ArtifactViewer] rendering error", err);
        return "[artifact rendering error]";
    }
}

const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ artifact }) => {
    const text = extractArtifactText(artifact);

    return (
        <>
            <style>{`
                .artifact-render {
                    white-space: pre-wrap;
                    word-break: break-word;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                    font-size: 13px;
                    line-height: 1.5;
                    color: #e2e8f0;
                }
            `}</style>
            <pre className="artifact-render">
                {text || (
                    <span className="text-slate-500 italic uppercase tracking-widest text-[10px]">
                        No content available
                    </span>
                )}
            </pre>
        </>
    );
};

export default ArtifactViewer;
