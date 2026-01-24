import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import {
  Check,
  X,
  Zap,
  Sparkles,
  Workflow,
  Cpu,
  BarChart3,
  Building2,
  Users,
  UserCheck,
  Eye,
  Lock,
  LayoutDashboard,
  ArrowRight
} from 'lucide-react';

function getRoleBasedRoute(role: string): string {
  if (role === 'superadmin') return '/superadmin';
  if (role === 'ops' || role === 'sales' || role === 'delivery') {
    return `/intake/${role}`;
  }
  return '/dashboard';
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation(getRoleBasedRoute(user.role));
    }
  }, [isAuthenticated, user, setLocation]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-400 font-sans selection:bg-blue-600/20">
      {/* Navigation */}
      <nav className="border-b border-slate-800 sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/">
            <a className="text-xl font-medium tracking-tight text-slate-100 hover:text-blue-400 transition-colors">
              <span className="text-blue-500">Strategic</span>AI.app
            </a>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/login">
              <a className="text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors">
                Login
              </a>
            </Link>
            <Link href="/diagnostic">
              <a className="text-sm font-bold px-5 py-2.5 bg-blue-600 text-white rounded-lg transition-all shadow-lg shadow-blue-600/10 hover:bg-blue-700 hover:-translate-y-0.5">
                Apply for Certification
              </a>
            </Link>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section className="relative pt-24 pb-32 md:pt-40 md:pb-52 overflow-hidden bg-slate-950">
        {/* Background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-800/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in shadow-[0_0_15px_rgba(37,99,235,0.1)]">
            <Sparkles className="w-3 h-3" />
            <span>The Future of Strategic Consulting</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tight text-slate-100 mb-8 leading-[1.05]">
            The Operating System for <span className="text-blue-500">Strategic Execution</span> <span className="block text-4xl md:text-5xl mt-4 text-slate-400 font-semibold">— Powered by AI Intelligence</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 mb-12 leading-relaxed max-w-3xl mx-auto font-light">
            StrategicAI.app turns intake chaos into governance-grade roadmaps, diagnostics, and tenant-isolated strategy consoles — at scale.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <Link href="/operator">
              <a className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-2xl shadow-blue-600/20 text-lg hover:-translate-y-1">
                Become a Certified Operator
              </a>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-8 text-sm text-slate-500 font-semibold tracking-wide uppercase">
            <Link href="/login">
              <a className="hover:text-blue-400 transition-colors flex items-center gap-2">Launch App <ArrowRight className="w-4 h-4" /></a>
            </Link>
            <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
            <Link href="/diagnostic">
              <a className="hover:text-blue-400 transition-colors">Join Live Demo</a>
            </Link>
            <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
            <Link href="/cohort">
              <a className="hover:text-blue-400 transition-colors">See a Sample Roadmap</a>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM */}
      <section className="py-32 border-t border-slate-800 bg-slate-900 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-6 tracking-tight">
              Most Transformation Dies in a PDF.
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* The Problem */}
            <div className="space-y-6">
              <h3 className="uppercase tracking-[0.05em] text-slate-500 text-sm font-bold mb-8">The Friction</h3>
              {[
                'Snapshots break',
                'Clients get confused',
                'Consultants disappear'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-400 transition-all hover:bg-slate-800 shadow-sm">
                  <X className="w-5 h-5 text-red-500 opacity-90" />
                  <span className="font-semibold text-lg">{item}</span>
                </div>
              ))}
            </div>

            {/* The Solution */}
            <div className="space-y-6">
              <h3 className="uppercase tracking-[0.05em] text-slate-500 text-sm font-bold mb-8 text-blue-400">The Flow</h3>
              {[
                'Captures truth from the front lines',
                'Synthesizes strategy automatically',
                'Enforces execution with governance logic',
                'Keeps clients aligned with a bundled 24/7 TrustConsole'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-6 bg-slate-900/60 border border-blue-900/30 rounded-xl text-blue-300 transition-all card-glow-hover">
                  <Check className="w-5 h-5 text-emerald-400 opacity-90" />
                  <span className="font-semibold text-lg">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. PLATFORM FEATURES */}
      <section className="py-32 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-6 tracking-tight">
              From Friction to Flow — <span className="text-slate-500">Governed by System, Not Hope</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Role-Based Intake Engines', desc: 'Break the CEO echo chamber. Capture insight from Sales, Ops, and Delivery.', icon: Zap },
              { title: 'Automated Discovery Synthesis', desc: 'AI drafts the roadmap before a human touches a doc.', icon: Sparkles },
              { title: 'SOP-Driven Fulfillment Engine', desc: 'Turn strategy into repeatable execution tickets.', icon: Workflow },
              { title: 'TrustConsole', desc: 'Every tenant gets a bundled, authenticated AI that answers roadmap questions 24/7 using real KPIs, sprints, and ROI data.', icon: Cpu },
              { title: '30/60/90 ROI Dashboards', desc: 'Prove value in time saved, leads recovered, and ops efficiency.', icon: BarChart3 }
            ].map((feature, i) => (
              <div key={i} className={`flex items-start gap-6 p-8 bg-slate-900/40 border border-slate-800 rounded-3xl hover:border-blue-500/20 transition-all card-glow-hover group cursor-default ${i === 4 ? 'md:col-span-2' : ''}`}>
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-blue-900/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-500">
                  <feature.icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-100 text-xl mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-lg font-light">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHO IT'S FOR */}
      <section className="py-32 border-t border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-100 tracking-tight">Who It’s For</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Agency Owners */}
            <div className="p-10 bg-slate-950/50 border border-slate-800 rounded-[2rem] flex flex-col hover:border-blue-500/30 transition-all group card-glow-hover">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mb-8 border border-slate-800 group-hover:scale-110 transition-transform duration-500">
                <Building2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100 mb-6 tracking-tight">Agency Owners</h3>
              <ul className="text-slate-400 mb-8 leading-relaxed font-light space-y-2">
                <li>• Upgrade from implementer to strategic operator</li>
                <li>• Productize high-ticket roadmaps</li>
                <li>• Defend margin with scope enforcement</li>
              </ul>
              <div className="mt-auto">
                <Link href="/operator">
                  <a className="inline-flex items-center gap-2 text-slate-100 font-bold hover:text-emerald-400 transition-colors">
                    Get Certified <ArrowRight className="w-4 h-4" />
                  </a>
                </Link>
              </div>
            </div>

            {/* Authority Brands */}
            <div className="p-10 bg-gradient-to-b from-blue-900/10 to-slate-950/50 border border-blue-900/20 rounded-[2rem] flex flex-col relative overflow-hidden group card-glow-hover">
              <div className="w-16 h-16 rounded-2xl bg-blue-900/20 flex items-center justify-center mb-8 border border-blue-900/20 group-hover:scale-110 transition-transform duration-500">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100 mb-6 tracking-tight">Authority Brands</h3>
              <ul className="text-slate-400 mb-8 leading-relaxed font-light space-y-2">
                <li>• License the platform to your tribe</li>
                <li>• White-label the portal</li>
                <li>• Create recurring rev streams without support debt</li>
              </ul>
              <div className="mt-auto">
                <Link href="/partner">
                  <a className="inline-flex items-center gap-2 text-slate-100 font-bold hover:text-blue-400 transition-colors">
                    Partner with StrategicAI <ArrowRight className="w-4 h-4" />
                  </a>
                </Link>
              </div>
            </div>

            {/* Consultants */}
            <div className="p-10 bg-slate-950/50 border border-slate-800 rounded-[2rem] flex flex-col hover:border-blue-500/30 transition-all group card-glow-hover">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mb-8 border border-slate-800 group-hover:scale-110 transition-transform duration-500">
                <UserCheck className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100 mb-6 tracking-tight">Consultants & COOs</h3>
              <ul className="text-slate-400 mb-8 leading-relaxed font-light space-y-2">
                <li>• Run McKinsey-grade discovery solo</li>
                <li>• Auto-generate deliverables</li>
                <li>• Let the <strong>TrustConsole</strong> handle strategic support</li>
              </ul>
              <div className="mt-auto">
                <Link href="/features">
                  <a className="inline-flex items-center gap-2 text-slate-100 font-bold hover:text-emerald-400 transition-colors">
                    See Consultant Use Case <ArrowRight className="w-4 h-4" />
                  </a>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-16 max-w-4xl mx-auto text-center border-l-4 border-blue-500 pl-6 py-2 bg-slate-900/30 rounded-r-xl">
            <p className="text-lg text-slate-300 italic">
              "Agencies and Partners use StrategicAI to productize strategic roadmaps, scale fulfillment with lean teams, and eliminate post-delivery chaos with a persistent TrustConsole — now bundled with every SaaS portal."
            </p>
          </div>
        </div>
      </section>

      {/* 5. SYSTEM SNAPSHOT */}
      <section className="py-32 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-100 tracking-tight">
              What Comes Alive Inside StrategicAI
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { icon: Eye, title: 'Truth Watchtower', desc: 'Track lifecycle stages across your portfolio' },
              { icon: Workflow, title: 'SOP Engine', desc: 'Turn intake into diagnostics and deliverables' },
              { icon: Lock, title: 'Workflow Gating', desc: 'Enforce quality with execution locks' },
              { icon: Cpu, title: 'TrustConsole', desc: 'Grounded answers to "What’s next?" — now included with every subscription' },
              { icon: LayoutDashboard, title: 'Living Strategy Dashboard', desc: 'ROI on every sprint, every initiative' }
            ].map((block, i) => (
              <div key={i} className="p-8 bg-slate-900/40 border border-slate-800 rounded-[2rem] text-center hover:bg-slate-900 hover:border-blue-500/20 transition-all card-glow-hover group">
                <div className="w-16 h-16 rounded-2xl bg-blue-900/10 flex items-center justify-center text-blue-400 mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                  <block.icon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-100 mb-3 text-lg tracking-tight">{block.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-light">{block.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. COPILOT MODULE */}
      <section className="py-32 border-t border-slate-800 bg-slate-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-600/10 blur-[100px] rounded-full" />
              <img
                src="/images/screener-copilot.png"
                alt="TrustConsole Interface"
                className="relative rounded-3xl border border-slate-700 shadow-xl shadow-blue-500/10 w-full opacity-80"
              />
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-8 tracking-tight">
                Your Client’s TrustConsole — <span className="text-emerald-400">Built In</span>
              </h2>
              <ul className="space-y-6">
                {[
                  'TrustConsole answers roadmap Q&A 24/7',
                  'Grounded in SOPs, tickets, and KPI context',
                  'Acts as tenant-native memory and coach',
                  'Every tenant gets a dedicated TrustConsole'
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-4 text-xl text-slate-300 font-light">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7. WHAT EVERY TENANT GETS */}
      <section className="py-32 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-100 tracking-tight mb-6">
              What’s Included with Every <span className="text-slate-500">StrategicAI Tenant</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                label: 'Interactive Roadmap',
                blurb: 'Digital twin of their transformation strategy',
                img: '/images/screener-roadmap.png'
              },
              {
                label: 'Execution Tickets',
                blurb: 'SOP-backed, sprint-ready task generation',
                img: '/images/screener-tickets.png'
              },
              {
                label: 'ROI Dashboards',
                blurb: 'Visibility into cost savings + speed gains',
                img: '/images/screener-roi.png'
              }
            ].map((item, i) => (
              <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden hover:border-blue-500/20 transition-all shadow-lg group card-glow-hover">
                <div className="p-8 pb-0">
                  <h3 className="text-2xl font-bold text-slate-100 mb-3 tracking-tight">{item.label}</h3>
                  <p className="text-slate-400 mb-8 font-light">{item.blurb}</p>
                </div>
                <div className="px-8 pb-8">
                  <img
                    src={item.img}
                    alt={item.label}
                    className="rounded-2xl border border-slate-800 group-hover:scale-[1.02] transition-transform duration-700 opacity-80"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. OUTCOME QUOTE */}
      <section className="py-40 border-t border-slate-800 bg-slate-900 relative">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <blockquote className="text-3xl md:text-5xl font-bold text-slate-100 leading-[1.2] mb-16 tracking-tight">
            “You deliver clarity. You own the plan. The platform runs the machine.”
          </blockquote>

          <div className="flex flex-col md:flex-row justify-center items-center gap-12 text-slate-500 font-semibold tracking-wide text-sm uppercase">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-400" />
              <span>Clients manage themselves</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-400" />
              <span>Your team runs on SOPs</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-400" />
              <span>Strategic support is handled by TrustConsole</span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. CTA BLOCK */}
      <section className="py-40 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-slate-100 mb-10 tracking-tight">
            Become a Certified <span className="text-blue-500">StrategicAI Operator</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-3xl mx-auto">
            {[
              'Full platform access',
              'Certification curriculum',
              'License upgrade path'
            ].map((point, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-slate-900/60 border border-slate-700 rounded-2xl text-slate-300 font-medium shadow-lg">
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{point}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-8">
            <Link href="/operator">
              <a className="px-12 py-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-2xl shadow-blue-600/20 text-xl hover:-translate-y-1">
                Apply Now
              </a>
            </Link>
            <div className="flex gap-8 text-sm text-slate-500 font-bold uppercase tracking-widest">
              <Link href="/login">
                <a className="hover:text-blue-400 transition-colors">Launch App</a>
              </Link>
              <span className="w-1.5 h-1.5 bg-slate-800 rounded-full my-auto" />
              <Link href="/diagnostic">
                <a className="hover:text-blue-400 transition-colors">Join Live Demo</a>
              </Link>
              <span className="w-1.5 h-1.5 bg-slate-800 rounded-full my-auto" />
              <Link href="/cohort">
                <a className="hover:text-blue-400 transition-colors">See a Sample Roadmap</a>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 10. WHAT THIS IS / ISN'T */}
      <section className="py-32 border-t border-slate-800 bg-slate-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16">
            {/* What This Isn't */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 font-bold text-slate-500 uppercase tracking-widest text-sm">
                <X className="w-4 h-4" /> What This Isn't
              </div>
              <div className="space-y-4">
                {[
                  'Not a chatbot',
                  'Not a prompt library',
                  'Not an automation gimmick'
                ].map((item, i) => (
                  <p key={i} className="text-slate-400 text-xl font-light pl-6 border-l border-slate-800">{item}</p>
                ))}
              </div>
            </div>

            {/* What This Is */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 font-bold text-blue-500 uppercase tracking-widest text-sm">
                <Check className="w-4 h-4" /> What This Is
              </div>
              <div className="space-y-4">
                {[
                  'Governed execution system',
                  'Built for high-trust transformation',
                  'Scales strategy without support bloat'
                ].map((item, i) => (
                  <p key={i} className="text-slate-100 text-xl font-medium pl-6 border-l-2 border-blue-500/50">{item}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-900/40 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
            <Link href="/">
              <a className="text-2xl font-bold tracking-tight text-slate-100">
                <span className="text-blue-500">Strategic</span>AI.app
              </a>
            </Link>
            <div className="flex items-center gap-10 text-sm font-semibold tracking-wide uppercase text-slate-500">
              <Link href="/login"><a className="hover:text-blue-400 transition-colors">Login</a></Link>
              <Link href="/diagnostic"><a className="hover:text-blue-400 transition-colors">Certification</a></Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-900 text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
            <div>© {new Date().getFullYear()} Strategic AI Infrastructure. All rights reserved.</div>
            <div className="flex gap-8 mt-4 md:mt-0">
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
