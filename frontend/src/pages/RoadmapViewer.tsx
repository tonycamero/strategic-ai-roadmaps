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
        <div className="text-slate-500 animate-pulse font-bold tracking-widest uppercase text-xs">Deciphering Roadmap...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 p-6">
        <div className="text-center bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl">
          <div className="text-amber-500 text-4xl mb-4">⚠️</div>
          <div className="text-slate-100 font-bold mb-4">{error}</div>
          <button
            onClick={() => setLocation('/dashboard')}
            className="text-blue-500 hover:text-blue-400 transition-colors font-bold uppercase tracking-widest text-sm"
          >
            ← Back to Control Plane
          </button>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 p-6">
        <div className="text-center bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl">
          <div className="text-blue-500 text-4xl mb-4">⌛</div>
          <div className="text-slate-400 mb-6">
            Governance Roadmap pending generation.
          </div>
          <button
            onClick={() => setLocation('/dashboard')}
            className="text-blue-500 hover:text-blue-400 transition-colors font-bold uppercase tracking-widest text-sm"
          >
            ← Back to Control Plane
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-outfit">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-slate-900 rounded-xl shadow-2xl border border-slate-800 text-blue-500 transition-transform active:scale-95"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-80 bg-slate-950 border-r border-slate-800 overflow-y-auto transition-transform duration-300 shadow-2xl shadow-black/50`}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-8 bg-blue-600 rounded-full" />
              <h2 className="text-lg font-bold text-slate-100 tracking-tight leading-none">
                Governance <br /><span className="text-blue-500">Protocols</span>
              </h2>
            </div>
            <button
              onClick={() => setLocation('/dashboard')}
              className="text-slate-500 hover:text-blue-400 transition-all p-2 rounded-lg hover:bg-slate-900"
              title="Return to System"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">
            Protocol Sections
          </div>
          <nav className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.sectionNumber);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-5 py-3 rounded-xl text-sm transition-all group relative overflow-hidden ${activeSection === section.sectionNumber
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/30 font-bold shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                    : 'text-slate-400 hover:bg-slate-900 border border-transparent'
                  }`}
              >
                {activeSection === section.sectionNumber && (
                  <div className="absolute left-0 top-0 w-1 h-full bg-blue-500" />
                )}
                <span className="relative z-10">{section.sectionName}</span>
              </button>
            ))}
          </nav>

          {/* Export button */}
          <div className="mt-10 pt-8 border-t border-slate-800">
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
              className="w-full text-left px-5 py-4 rounded-xl text-sm transition-all text-slate-100 bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center gap-3 font-bold group shadow-lg"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="group-hover:text-blue-400 transition-colors">Export Vault</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 overflow-auto bg-slate-900 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] max-w-4xl pointer-events-none opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-600/20 to-transparent blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12 lg:px-16 lg:py-24 relative z-10">
          <article className="prose prose-lg prose-invert max-w-none">
            <style>{`
              .prose { color: #94A3B8; }
              .prose h1 { font-size: 3.5rem; font-weight: 800; margin-bottom: 2.5rem; margin-top: 0; color: #FFFFFF; letter-spacing: -0.02em; line-height: 1.1; }
              .prose h2 { font-size: 2rem; font-weight: 700; margin-top: 4rem; margin-bottom: 1.5rem; color: #FFFFFF; border-bottom: 1px solid #1E293B; padding-bottom: 0.5rem; }
              .prose h3 { font-size: 1.5rem; font-weight: 700; margin-top: 2.5rem; margin-bottom: 1rem; color: #FFFFFF; }
              .prose p { margin-bottom: 1.5rem; line-height: 1.8; color: #94A3B8; font-size: 1.125rem; }
              .prose ul { margin-top: 1.5rem; margin-bottom: 1.5rem; list-style-type: none; padding-left: 0; }
              .prose li { margin-top: 0.75rem; margin-bottom: 0.75rem; color: #94A3B8; display: flex; gap: 0.75rem; position: relative; padding-left: 1.5rem; }
              .prose li::before { content: '→'; position: absolute; left: 0; color: #2563EB; font-weight: bold; }
              .prose hr { margin-top: 4rem; margin-bottom: 4rem; border-color: #1E293B; }
              .prose strong { font-weight: 700; color: #FFFFFF; }
              .prose blockquote { margin-top: 2.5rem; margin-bottom: 2.5rem; padding: 2rem; background: #0F172A; border-radius: 1rem; border-left: 4px solid #2563EB; font-style: italic; color: #FFFFFF; position: relative; }
              .prose a { color: #3B82F6; text-decoration: none; font-weight: 600; border-bottom: 1px solid transparent; transition: all 0.2s; }
              .prose a:hover { color: #60A5FA; border-bottom-color: #60A5FA; }
              .prose code { color: #FFFFFF; background-color: #0F172A; padding: 0.2rem 0.4rem; border-radius: 0.4rem; font-size: 0.875em; border: 1px solid #1E293B; }
              .prose pre { background: #020617 !important; border: 1px solid #1E293B; border-radius: 1rem; padding: 1.5rem !important; }
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
