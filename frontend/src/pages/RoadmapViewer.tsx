import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';

interface RoadmapNode {
  sopTicketId: string;
  stage: number;
  namespace: string;
}

interface RoadmapEdge {
  fromTicketId: string;
  toTicketId: string;
  dependencyType: string;
}

interface RoadmapGraphData {
  graphId: string | null;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}

interface RoadmapViewerProps {
  tenantId?: string; // Optional - for superadmin preview
}

export default function RoadmapViewer({ tenantId }: RoadmapViewerProps) {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const [graphData, setGraphData] = useState<RoadmapGraphData | null>(null);
  const [activeStage, setActiveStage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const mainRef = useRef<HTMLDivElement>(null);

  const searchParams = new URLSearchParams(window.location.search);
  const queryTenantId = searchParams.get("tenantId");

  // Determine which tenantId to use (Prop > Query > Current User)
  const effectiveTenantId = tenantId || queryTenantId || (currentUser as any)?.tenantId;
  console.log("Resolved tenantId:", effectiveTenantId);

  // Fetch graph data
  useEffect(() => {
    const fetchGraph = async () => {
      if (!effectiveTenantId) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const url = `/api/roadmap/graph/${effectiveTenantId}`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch execution graph');
        }

        const data: RoadmapGraphData = await res.json();
        setGraphData(data);

        // Set first stage as active if available
        if (data && data.nodes && data.nodes.length > 0) {
          const stages = Array.from(new Set(data.nodes.map(n => n.stage))).sort((a, b) => a - b);
          setActiveStage(stages[0]);
        }
      } catch (err: any) {
        console.error('Graph fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, [effectiveTenantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-slate-500 animate-pulse font-bold tracking-widest uppercase text-xs">Deciphering Execution Graph...</div>
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

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 p-6">
        <div className="text-center bg-slate-900 border border-slate-800 p-10 rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="text-blue-500 text-5xl mb-6">🗺️</div>
          <h2 className="text-xl font-bold text-white mb-2 font-outfit">Operational Map</h2>
          <p className="text-slate-400 mb-8 leading-relaxed font-outfit text-sm">
            The Operational Map is a live execution DAG generated from your Strategic Roadmap. 
            Once your roadmap is finalized and the execution engine is activated, the tactical dependencies will appear here.
          </p>
          <div className="flex flex-col gap-3">
             <button
              onClick={() => setLocation('/diagnostic-review')}
              className="w-full py-4 bg-white hover:bg-slate-100 text-slate-950 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all"
            >
              View Strategic Roadmap Document
            </button>
            <button
              onClick={() => setLocation('/executive')}
              className="w-full py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all border border-slate-700"
            >
              Back to Executive Console
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stages = Array.from(new Set(graphData.nodes.map(n => n.stage))).sort((a, b) => a - b);
  const activeNodes = graphData.nodes.filter(n => n.stage === activeStage);

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
                Roadmap <br /><span className="text-blue-500">Execution</span>
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
            Execution Phases
          </div>
          <nav className="space-y-2">
            {stages.map((stageNum) => (
              <button
                key={stageNum}
                onClick={() => {
                  setActiveStage(stageNum);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-5 py-3 rounded-xl text-sm transition-all group relative overflow-hidden ${activeStage === stageNum
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/30 font-bold shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                  : 'text-slate-400 hover:bg-slate-900 border border-transparent'
                  }`}
              >
                {activeStage === stageNum && (
                  <div className="absolute left-0 top-0 w-1 h-full bg-blue-500" />
                )}
                <span className="relative z-10">Phase {stageNum}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 overflow-auto bg-slate-900 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] max-w-4xl pointer-events-none opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-600/20 to-transparent blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12 lg:px-16 lg:py-24 relative z-10">
          <header className="mb-12">
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
              Phase {activeStage} <span className="text-blue-500">Execution</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
              Strategic deployment of capabilities mapped to technical SOP ticket instances.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeNodes.map((node) => {
              // Find dependent tickets
              const dependencies = graphData.edges
                .filter(e => e.toTicketId === node.sopTicketId)
                .map(e => {
                  const fromNode = graphData.nodes.find(n => n.sopTicketId === e.fromTicketId);
                  return fromNode ? `${fromNode.namespace} (P${fromNode.stage})` : 'Unknown';
                });

              return (
                <div key={node.sopTicketId} className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="px-3 py-1 bg-blue-600/10 border border-blue-600/30 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-400">
                      {node.namespace}
                    </div>
                    <div className="text-[10px] font-mono text-slate-600 uppercase tracking-tighter">
                      ID: {node.sopTicketId.split('-')[0]}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    Deployment Package
                  </h3>

                  <p className="text-sm text-slate-400 mb-6 line-clamp-2">
                    Automated ticket generation for capability deployment and verification.
                  </p>

                  {dependencies.length > 0 && (
                    <div className="pt-4 border-t border-slate-800">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Dependencies</div>
                      <div className="flex flex-wrap gap-2">
                        {dependencies.map((dep, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-500">
                            {dep}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
