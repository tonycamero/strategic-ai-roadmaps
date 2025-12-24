import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { CommandStrip } from '../components/dashboard/CommandStrip';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'wouter';
import ReactMarkdown from 'react-markdown';
import { getOwnerDocumentLabel } from '../types/documents';

export default function DiagnosticReview() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.listDocuments(),
  });

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const documents = documentsData?.documents || [];
  
  // Filter and sort diagnostic docs in desired order
  const titleOrder = [
    'Company Diagnostic Map',
    'AI Leverage & Opportunity Map',
    'Strategic Roadmap Skeleton',
    'Discovery Call Preparation Questions',
  ];
  
  const diagnosticDocs = documents
    .filter((doc: any) => titleOrder.includes(doc.title))
    .sort((a: any, b: any) => {
      return titleOrder.indexOf(a.title) - titleOrder.indexOf(b.title);
    });

  const activeDoc = activeDocId 
    ? documents.find((d: any) => d.id === activeDocId)
    : diagnosticDocs[0];

  // Auto-select first doc
  useEffect(() => {
    if (!activeDocId && diagnosticDocs.length > 0) {
      setActiveDocId(diagnosticDocs[0].id);
    }
  }, [activeDocId, diagnosticDocs]);

  // Fetch document content when active doc changes
  useEffect(() => {
    if (!activeDocId) return;

    setLoadingContent(true);
    setDocContent(null);

    const token = localStorage.getItem('token');
    fetch(`/api/documents/${activeDocId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setDocContent(data.document.content);
      })
      .catch(err => {
        console.error('Failed to load document content:', err);
        setDocContent('Failed to load document content.');
      })
      .finally(() => setLoadingContent(false));
  }, [activeDocId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <CommandStrip
        firmName={user?.name || 'Organization'}
        cohort="Eugene Q1 2026"
        onScheduleCall={() => window.location.href = 'mailto:tony@scend.cash?subject=Schedule Discovery Call'}
        onOpenRoadmap={() => setLocation('/roadmap')}
        onLogout={handleLogout}
        isSuperadmin={(user?.role as string) === 'superadmin'}
        onSuperadminClick={() => setLocation('/superadmin')}
        isRoadmapGenerated={false}
      />

      <div className="p-6">
        {isLoading ? (
          <div className="text-slate-400">Loading diagnostics...</div>
        ) : diagnosticDocs.length === 0 ? (
          <div className="max-w-4xl mx-auto bg-slate-900/60 border border-slate-800 rounded-lg p-8 text-center">
            <p className="text-slate-400">No diagnostic documents available yet.</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-800 overflow-x-auto">
              {diagnosticDocs.map((doc: any) => {
                const { title: displayTitle } = getOwnerDocumentLabel(doc);
                const isActive = doc.id === activeDocId;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setActiveDocId(doc.id)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                      isActive
                        ? 'text-blue-400 border-blue-500'
                        : 'text-slate-400 border-transparent hover:text-slate-200'
                    }`}
                  >
                    {displayTitle}
                  </button>
                );
              })}
            </div>

            {/* Active Document */}
            {activeDoc && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-8">
                <div className="prose prose-invert prose-slate max-w-none">
                  {loadingContent ? (
                    <div className="text-slate-400">Loading document content...</div>
                  ) : docContent ? (
                    <ReactMarkdown>{docContent}</ReactMarkdown>
                  ) : (
                    <div className="text-slate-400">No content available.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
