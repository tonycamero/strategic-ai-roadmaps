import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getOwnerDocumentLabel } from '../types/documents';

interface DocumentData {
  id: string;
  title: string;
  description: string | null;
  category: string;
  sopNumber: string | null;
  outputNumber: string | null;
  mimeType: string;
  fileSize: number;
  originalFilename: string;
  isPublic: boolean;
  createdAt: string;
  content: string | null;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

async function fetchDocument(docId: string): Promise<{ document: DocumentData }> {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/documents/${docId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch document');
  }
  return response.json();
}

function extractToc(markdown: string): TocItem[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const toc: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    toc.push({ id, text, level });
  }

  return toc;
}

function downloadMarkdownAsPdf(title: string, markdown: string) {
  // Simple text-based PDF fallback: create a text file
  // In production, you'd use a library like jspdf-autotable or server-side rendering
  const blob = new Blob([markdown], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function CaseStudyViewer() {
  const { logout } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/case-study/:docId');
  const [, ownerParams] = useRoute('/owner/case-study/:docId');
  const [, saParams] = useRoute('/superadmin/firms/:tenantId/case-study/:docId');

  // Determine doc ID from route
  const docId = params?.docId || ownerParams?.docId || saParams?.docId;

  const [docData, setDocData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);

  useEffect(() => {
    if (!docId) {
      setError('No document ID provided');
      setLoading(false);
      return;
    }

    fetchDocument(docId)
      .then((data) => {
        setDocData(data.document);
        if (data.document.content) {
          setToc(extractToc(data.document.content));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [docId]);

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const handleBack = () => {
    if (saParams) {
      setLocation(`/superadmin/firms/${saParams.tenantId}`);
    } else {
      setLocation('/dashboard');
    }
  };

  const handleDownload = () => {
    if (docData && docData.content) {
      downloadMarkdownAsPdf(docData.title, docData.content);
    }
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(`heading-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-slate-400">Loading case study...</div>
      </div>
    );
  }

  if (error || !docData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-red-400">Error: {error || 'Document not found'}</div>
      </div>
    );
  }

  const ownerLabel = getOwnerDocumentLabel(docData);
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-semibold text-slate-100">{ownerLabel.title}</h1>
              {ownerLabel.subtitle && (
                <p className="text-sm text-slate-400 mt-1">{ownerLabel.subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Download
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* TOC Sidebar */}
          {toc.length > 0 && (
            <div className="lg:col-span-1">
              <div className="sticky top-8 bg-slate-900/40 rounded-xl border border-slate-800 p-4">
                <h2 className="text-sm font-semibold text-slate-200 mb-3">Table of Contents</h2>
                <nav className="space-y-2">
                  {toc.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => scrollToHeading(item.id)}
                      className={`block w-full text-left text-sm text-slate-400 hover:text-blue-400 transition-colors ${
                        item.level === 1 ? 'font-medium' : ''
                      }`}
                      style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                    >
                      {item.text}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          )}

          {/* Markdown Content */}
          <div className={toc.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {docData.content ? (
              <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-6">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl md:text-3xl font-semibold text-slate-100 mt-2 mb-4" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl md:text-2xl font-semibold text-slate-100 mt-3 mb-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-slate-100 mt-3 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="text-slate-300 leading-7 mb-3" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-1 mb-3" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-6 space-y-1 mb-3" {...props} />,
                    li: ({node, ...props}) => <li className="text-slate-300" {...props} />,
                    blockquote: ({node, ...props}) => (
                      <blockquote className="border-l-4 border-slate-700 pl-4 text-slate-300 italic my-3" {...props} />
                    ),
                    code: ({node, inline, className, children, ...props}: any) => (
                      inline ? (
                        <code className="bg-slate-800/80 text-slate-200 px-1.5 py-0.5 rounded" {...props}>{children}</code>
                      ) : (
                        <pre className="bg-slate-900 border border-slate-800 rounded-lg p-4 overflow-auto text-slate-200">
                          <code {...props}>
                            {children}
                          </code>
                        </pre>
                      )
                    ),
                    table: ({node, ...props}) => (
                      <div className="overflow-x-auto my-3">
                        <table className="w-full text-left border-collapse" {...props} />
                      </div>
                    ),
                    th: ({node, ...props}) => <th className="border-b border-slate-700 px-3 py-2 text-slate-200" {...props} />,
                    td: ({node, ...props}) => <td className="border-b border-slate-800 px-3 py-2 text-slate-300" {...props} />,
                    hr: ({node, ...props}) => <hr className="border-slate-800 my-6" {...props} />,
                  }}
                >
                  {docData.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-slate-400">No content available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
