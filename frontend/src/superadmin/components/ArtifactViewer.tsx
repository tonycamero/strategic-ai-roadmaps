// frontend/src/superadmin/components/ArtifactViewer.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArtifactViewerProps {
    artifact: any;
}

/**
 * Frontend Rendering Adapter: Narrative Synthesis
 * Transforms structured JSON artifacts into formatted Markdown narratives on-the-fly.
 */
function extractArtifactText(artifact: any): string {
    if (!artifact) return "";

    try {
        const raw = artifact.raw || artifact;
        // If the artifact doesn't have an explicit 'outputs' key but is an object, treat it as the outputs
        const outputs = artifact.outputs || (!artifact.raw && typeof artifact === 'object' && !Array.isArray(artifact) ? artifact : {});

        // 1. Array of artifacts (Recursive extraction)
        if (Array.isArray(artifact)) {
            return artifact.map(item => extractArtifactText(item)).join("\n\n---\n\n");
        }

        // 2. Simple string (Priority)
        if (typeof outputs === "string") return outputs;
        if (typeof artifact === "string") return artifact;

        // 3. Structured Content (Exec Brief / Diagnostic sections)
        // Check both 'outputs.content' and 'raw.synthesis.content' or 'raw' directly
        const contentSource = outputs.content || raw.synthesis?.content || raw.content;

        if (contentSource && typeof contentSource === 'object') {
            return Object.entries(contentSource)
                .map(([key, val]) => {
                    const text = typeof val === 'object' ? (val as any).markdown || (val as any).content || JSON.stringify(val) : val;
                    if (!text) return null;
                    const label = key.replace(/([A-Z])/g, ' $1').toUpperCase();
                    return `## ${label}\n\n${text}`;
                })
                .filter(Boolean)
                .join("\n\n---\n\n");
        }

        // 4. Diagnostic sections directly on raw
        if (raw.overview || raw.aiOpportunities || raw.roadmapSkeleton) {
            const sections = {
                overview: raw.overview,
                aiOpportunities: raw.aiOpportunities,
                roadmapSkeleton: raw.roadmapSkeleton,
                discoveryQuestions: raw.discoveryQuestions
            };
            return Object.entries(sections)
                .map(([key, val]) => {
                    const text = typeof val === 'object' ? (val as any).markdown || (val as any).content || JSON.stringify(val) : val;
                    if (!text) return null;
                    const label = key.replace(/([A-Z])/g, ' $1').toUpperCase();
                    return `## ${label}\n\n${text}`;
                })
                .filter(Boolean)
                .join("\n\n---\n\n");
        }

        // 5. Generic Object Flattening
        if (typeof outputs === 'object' && Object.keys(outputs).length > 0) {
            return Object.entries(outputs)
                .map(([key, val]) => {
                    const text = typeof val === 'object' ? JSON.stringify(val) : val;
                    return `## ${key.toUpperCase()}\n\n${text}`;
                })
                .join("\n\n---\n\n");
        }

        // 6. Final fallback (Delta/Manual)
        return raw.delta || artifact.delta || JSON.stringify(artifact, null, 2);
    } catch (err) {
        console.error("[ArtifactViewer] rendering error", err);
        return "[artifact rendering error]";
    }
}

const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ artifact }) => {
    const text = extractArtifactText(artifact);

    return (
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-6 shadow-lg backdrop-blur-sm">
            {text ? (
                <div className="prose prose-invert prose-sm max-w-none 
                    prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-headings:text-indigo-400
                    prose-p:text-slate-300 prose-p:leading-relaxed
                    prose-li:text-slate-300
                    prose-hr:border-slate-800
                    artifact-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {text}
                    </ReactMarkdown>
                </div>
            ) : (
                <div className="flex items-center justify-center p-8 border border-dashed border-slate-800 rounded-lg bg-slate-950/40">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">
                        No content available
                    </span>
                </div>
            )}
        </div>
    );
};

export default ArtifactViewer;
