import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useLocation } from 'wouter';
interface RoadmapSection {
  id: string;
  sectionNumber: number;
  sectionName: string;
  status: string;
  wordCount: number | null;
  lastUpdatedAt: Date | null;
}

interface RoadmapViewerProps {
  tenantId?: string; // Optional - for superadmin preview
}

export default function RoadmapViewer({ tenantId }: RoadmapViewerProps) {
  const [, setLocation] = useLocation();
  const [sections, setSections] = useState<RoadmapSection[]>([]);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const mainRef = useRef<HTMLDivElement>(null);

  // Fetch sections list
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const token = localStorage.getItem('token');
        const url = tenantId 
          ? `/api/roadmap/sections?tenantId=${tenantId}`
          : '/api/roadmap/sections';
        
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch roadmap sections');
        }

        const data = await res.json();
        setSections(data.sections);
        
        // Set first section as active if available
        if (data.sections.length > 0) {
          setActiveSection(data.sections[0].sectionNumber);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [tenantId]);

  // Fetch section content when activeSection changes
  useEffect(() => {
    const fetchContent = async () => {
      if (activeSection === null) return;

      // Scroll to top when section changes
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }

      try {
        const token = localStorage.getItem('token');
        const url = tenantId
          ? `/api/roadmap/sections/${activeSection}?tenantId=${tenantId}`
          : `/api/roadmap/sections/${activeSection}`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch section content');
        }

        const data = await res.json();
        setContent(data.contentMarkdown);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchContent();
  }, [activeSection, tenantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-slate-400">Loading roadmap...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={() => setLocation('/dashboard')}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <div className="text-slate-400 mb-4">
            No roadmap available yet.
          </div>
          <button
            onClick={() => setLocation('/dashboard')}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 rounded-lg shadow-lg border border-slate-800"
      >
        <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-72 bg-slate-950 border-r border-slate-800 overflow-y-auto transition-transform duration-300`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-medium text-slate-100">
              Strategic AI Roadmaps
            </h2>
            <button
              onClick={() => setLocation('/dashboard')}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              title="Back to Dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>


          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.sectionNumber);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  activeSection === section.sectionNumber
                    ? 'bg-blue-900/40 text-blue-300 border border-blue-700 font-medium'
                    : 'text-slate-300 hover:bg-slate-900/60'
                }`}
              >
                {section.sectionName}
              </button>
            ))}
          </nav>
          
          {/* Export button */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  const url = tenantId
                    ? `/api/roadmap/export?tenantId=${tenantId}`
                    : '/api/roadmap/export';
                  
                  const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  
                  if (!res.ok) throw new Error('Export failed');
                  
                  const blob = await res.blob();
                  const downloadUrl = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = downloadUrl;
                  a.download = 'Strategic_AI_Roadmap.md';
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(downloadUrl);
                } catch (error) {
                  console.error('Export error:', error);
                  alert('Failed to export roadmap');
                }
              }}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors text-slate-300 hover:bg-slate-900/60 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Roadmap
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 overflow-auto bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 py-8 lg:px-12 lg:py-12">
          <article className="prose prose-lg prose-invert max-w-none">
            <style>{`
              .prose { color: #cbd5e1; }
              .prose h1 { font-size: 2.25rem; font-weight: 600; margin-bottom: 2rem; margin-top: 0; color: #f1f5f9; }
              .prose h2 { font-size: 1.875rem; font-weight: 600; margin-top: 3rem; margin-bottom: 1.5rem; color: #e2e8f0; }
              .prose h3 { font-size: 1.5rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #e2e8f0; }
              .prose p { margin-bottom: 1.5rem; line-height: 1.75; color: #cbd5e1; }
              .prose ul { margin-top: 1.5rem; margin-bottom: 1.5rem; }
              .prose li { margin-top: 0.5rem; margin-bottom: 0.5rem; color: #cbd5e1; }
              .prose hr { margin-top: 3rem; margin-bottom: 3rem; border-color: #334155; }
              .prose strong { font-weight: 600; color: #f1f5f9; }
              .prose blockquote { margin-top: 2rem; margin-bottom: 2rem; padding-left: 1.5rem; border-left: 4px solid #3b82f6; font-style: italic; color: #94a3b8; }
              .prose a { color: #60a5fa; text-decoration: none; }
              .prose a:hover { color: #93c5fd; }
              .prose code { color: #e2e8f0; background-color: #1e293b; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.875em; }
            `}</style>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
