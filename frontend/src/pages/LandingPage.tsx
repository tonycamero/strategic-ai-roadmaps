import { useState, FormEvent, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { submitLeadRequest, LeadRequestData } from '../api/leadRequest';

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
  const scrollToForm = () => {
    document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHow = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur-sm z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <a className="text-xl font-semibold tracking-tight hover:text-slate-200 transition-colors">
              Strategic AI Roadmaps
            </a>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/">
              <a className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
                Home
              </a>
            </Link>
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
              How it Works
            </a>
            <a href="#application-form" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Apply
            </a>
            <Link href="/login">
              <a className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
                Login
              </a>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection onScrollToForm={scrollToForm} onScrollToHow={scrollToHow} />

      {/* Who This Is For */}
      <WhoSection />

      {/* What You Get */}
      <WhatYouGetSection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Readiness Checklist */}
      <ChecklistSection />

      {/* Application Form */}
      <ApplicationFormSection />

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500">
          © 2026 Strategic AI Infrastructure. Eugene Q1 2026 Cohort.
        </div>
      </footer>
    </div>
  );
}

function HeroSection({
  onScrollToForm,
  onScrollToHow,
}: {
  onScrollToForm: () => void;
  onScrollToHow: () => void;
}) {
  return (
    <section className="py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Primary Content */}
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-4">
              Eugene • Q1 2026 Cohort
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Strategic AI Infrastructure for serious firms only.
            </h1>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              We are selecting up to 10 Eugene-based professional service teams for a hands-on AI infrastructure buildout. You bring a working business. We bring the systems that scale it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onScrollToForm}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Request Inclusion in the Cohort
              </button>
              <button
                onClick={onScrollToHow}
                className="px-6 py-3 text-slate-300 hover:text-slate-100 font-medium transition-colors"
              >
                See how the cohort works →
              </button>
            </div>
          </div>

          {/* Right: Cohort Snapshot Card */}
          <div className="border border-slate-800 rounded-xl p-6 bg-slate-900/50">
            <div className="text-xs uppercase tracking-wide text-slate-400 font-medium mb-4">
              Cohort Snapshot
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Cohort:</span>
                <span className="font-medium">Eugene Q1 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target firms:</span>
                <span className="font-medium">10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-green-400 font-medium">Actively shortlisting</span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 text-sm">Focus:</span>
                <div className="mt-2 text-sm text-slate-300">
                  Real Estate, Legal, Financial, High-touch services
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhoSection() {
  const cards = [
    {
      title: 'Real Estate & Mortgage Brokerages',
      description: 'Luxury listings, investment properties, high-volume transaction teams.',
    },
    {
      title: 'Legal & Compliance Firms',
      description: 'Boutique practices managing high-stakes client work and document flows.',
    },
    {
      title: 'Agencies & Consultancies',
      description: 'Service firms selling expertise, not commodities, with complex delivery.',
    },
    {
      title: 'Healthcare & Specialty Clinics',
      description: 'Private practices with patient coordination and operational overhead.',
    },
  ];

  return (
    <section className="py-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Who this is for</h2>
          <p className="text-lg text-slate-400">
            Owner-led teams that are already winning and want leverage, not gimmicks.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="border border-slate-800 rounded-xl p-6 bg-slate-900/30 hover:bg-slate-900/50 transition-colors"
            >
              <h3 className="font-semibold mb-2">{card.title}</h3>
              <p className="text-sm text-slate-400">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatYouGetSection() {
  const deliverables = [
    {
      title: 'Strategic AI Infrastructure Roadmap',
      description:
        'A mapped view of your workflows, CRM, and communication systems with clear priorities for automation.',
    },
    {
      title: 'Workflow and Automation Blueprint',
      description:
        'Concrete plays for intake, follow-up, handoffs, and delivery, designed for your team structure.',
    },
    {
      title: 'Pilot Implementation Plan',
      description:
        'A realistic 60–90 day plan to deploy the first AI teammates and automation loops.',
    },
  ];

  return (
    <section className="py-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What you walk away with</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {deliverables.map((item, idx) => (
            <div
              key={idx}
              className="border border-slate-800 rounded-xl p-8 bg-slate-900/30"
            >
              <div className="text-4xl font-bold text-slate-700 mb-4">{idx + 1}</div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: '1',
      title: 'Initial call',
      description: '30 minutes to understand your team, offer, and systems.',
    },
    {
      number: '2',
      title: 'Deep-dive and Roadmap build',
      description:
        'Working session plus internal analysis to design your Strategic AI Infrastructure Roadmap.',
    },
    {
      number: '3',
      title: 'Pilot selection',
      description:
        'If there is a fit, we agree on a paid pilot to implement the highest-leverage pieces.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 border-t border-slate-800 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How the cohort works</h2>
        </div>
        <div className="space-y-8">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex gap-6 items-start border border-slate-800 rounded-xl p-6 bg-slate-900/30"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
                {step.number}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 p-6 border border-slate-800 rounded-xl bg-slate-900/20">
          <p className="text-slate-300 leading-relaxed">
            There are more qualified firms than cohort slots. The cohort is our way of concentrating attention on 10 teams we believe can turn this into meaningful revenue and operational lift in 2026.
          </p>
        </div>
      </div>
    </section>
  );
}

function ChecklistSection() {
  const items = [
    'You manage a team of 5–50 people and sell expertise, not commodities.',
    'You already have customers and a working offer.',
    'You use some kind of CRM or contact system, even if it is messy.',
    'You feel the drag of manual follow-up, inconsistent workflows, or owner bottleneck.',
    'You want a partner to build durable systems, not just drop tools on your team.',
  ];

  return (
    <section className="py-20 border-t border-slate-800">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Are you a fit for this cohort?
          </h2>
        </div>
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex gap-4 items-start p-4 border border-slate-800 rounded-lg bg-slate-900/30"
            >
              <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-slate-300">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 p-6 border border-slate-800 rounded-xl bg-slate-900/20 text-center">
          <p className="text-slate-300">
            If this sounds like you, you are exactly the kind of firm we want in the Eugene Q1 2026 cohort.
          </p>
        </div>
      </div>
    </section>
  );
}

function ApplicationFormSection() {
  const [formData, setFormData] = useState<LeadRequestData>({
    name: '',
    email: '',
    company: '',
    role: '',
    teamSize: 0,
    currentCrm: '',
    bottleneck: '',
    source: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await submitLeadRequest(formData);
      setSuccess(true);
      // Clear form
      setFormData({
        name: '',
        email: '',
        company: '',
        role: '',
        teamSize: 0,
        currentCrm: '',
        bottleneck: '',
        source: '',
      });
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="application-form"
      className="py-20 border-t border-slate-800 scroll-mt-20"
    >
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Request inclusion in the Eugene Q1 2026 cohort
          </h2>
          <p className="text-lg text-slate-400">
            We review each request by hand. Expect a personal reply, not a sequence.
          </p>
        </div>

        {success && (
          <div className="mb-8 p-6 border border-green-800 rounded-xl bg-green-900/20 text-green-100">
            <p className="font-medium mb-2">Thank you.</p>
            <p>
              Your firm has been added to the Eugene Q1 2026 review queue. We will follow up directly to schedule a call.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-8 p-6 border border-red-800 rounded-xl bg-red-900/20 text-red-100">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Company name *
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Role / Title *
              </label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Team size *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.teamSize || ''}
                onChange={(e) =>
                  setFormData({ ...formData, teamSize: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Current CRM *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Salesforce, HubSpot, Excel"
                value={formData.currentCrm}
                onChange={(e) =>
                  setFormData({ ...formData, currentCrm: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              What is the biggest operational or follow-up bottleneck in your business right now? *
            </label>
            <textarea
              required
              rows={5}
              value={formData.bottleneck}
              onChange={(e) => setFormData({ ...formData, bottleneck: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              How did you hear about this cohort?
            </label>
            <input
              type="text"
              placeholder="Optional"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-lg"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </section>
  );
}
