import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { VideoThumbnail } from '../components/VideoModal';
import { TrustAgentShell } from '../trustagent/TrustAgentShell';

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function getRoleBasedRoute(role: string): string {
  if (role === 'superadmin') return '/superadmin';
  // All authenticated users go to dashboard
  // Intake pages will redirect back if needed
  return '/dashboard';
}

const HomePage: React.FC = () => {
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
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" onClick={scrollToTop}>
            <span className="text-xl font-semibold text-white hover:text-slate-200 transition cursor-pointer">
              Tony Camero
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <a href="#about" className="text-sm text-slate-400 hover:text-white transition">
              About
            </a>
            <Link href="/cohort" onClick={scrollToTop}>
              <span className="text-sm text-slate-400 hover:text-white transition cursor-pointer">
                Cohort
              </span>
            </Link>
            <a href="#contact" className="text-sm text-slate-400 hover:text-white transition">
              Contact
            </a>
            <Link href="/login">
              <span className="text-sm text-slate-400 hover:text-white transition cursor-pointer">
                Login
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold text-white mb-4">
            Tony Camero
          </h1>
          <h2 className="text-2xl font-semibold text-slate-300 mb-6">
            Builder. Operator. Strategic AI Architect.
          </h2>
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            I help professional-service firms implement the systems and infrastructure they need to scale — without complexity, bloat, or noise.
          </p>
          <div className="flex gap-4">
            <Link href="/cohort" onClick={scrollToTop}>
              <span className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition cursor-pointer">
                Explore Strategic AI Cohort →
              </span>
            </Link>
            <a href="#about" className="inline-flex items-center px-6 py-3 rounded-lg border border-slate-700 hover:border-slate-600 text-white font-medium transition">
              About Tony
            </a>
          </div>
        </div>
      </section>

      {/* Strategic AI Cohort CTA Block */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-900/50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-3">
            Strategic AI Infrastructure – Eugene Q1 2026
          </h3>
          <p className="text-slate-300 mb-4 leading-relaxed">
            A highly selective program for 10 Eugene-based professional-service teams.
          </p>
          <p className="text-slate-400 mb-6 leading-relaxed">
            If your firm runs on expertise, human relationships, and operational execution, this program upgrades your follow-up systems, workflow intelligence, and team performance into a modern, AI-driven infrastructure.
          </p>
          <Link href="/cohort" onClick={scrollToTop}>
            <span className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition cursor-pointer">
              Enter the Program →
            </span>
          </Link>
        </div>
      </section>

      {/* About Tony */}
      <section id="about" className="max-w-6xl mx-auto px-6 py-16">
        <h3 className="text-3xl font-bold text-white mb-6">About Tony</h3>
        <div className="max-w-3xl space-y-4 text-slate-300 leading-relaxed">
          <p>
            Tony Camero is a founder and operator specializing in systems that enable teams, communities, and markets to function with clarity, trust, and autonomy.
          </p>
          <p>
            His background spans:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-400">
            <li>AI-enabled business infrastructure</li>
            <li>Messaging, payments, and identity systems</li>
            <li>High-compliance real-world verticals (financial, cannabis, civic)</li>
            <li>Distributed architectures that reduce friction and multiply leverage</li>
          </ul>
          <p>
            Tony builds technology for people — not for platforms.
          </p>
        </div>
      </section>

      {/* Current Work */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h3 className="text-3xl font-bold text-white mb-8">Current Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
            <h4 className="text-xl font-semibold text-white mb-4">
              Strategic AI Roadmaps
            </h4>
            <p className="text-slate-400 mb-4">
              Infrastructure and workflow automation for professional teams.
            </p>

            {/* Video Thumbnail */}
            <div className="mb-4">
              <VideoThumbnail
                title="Strategic AI Roadmaps"
                description="Transform chaos into momentum"
                videoSrc="/videos/promo.mp4"
              />
            </div>

            <Link href="/cohort" onClick={scrollToTop}>
              <span className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer">
                View Cohort →
              </span>
            </Link>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
            <h4 className="text-xl font-semibold text-white mb-2">
              Scend Technologies
            </h4>
            <p className="text-slate-400 mb-4">
              Stablecoin, messaging, and identity stack for regulated industries.
            </p>
            <a href="https://scend.cash" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-medium">
              Visit Scend →
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="max-w-6xl mx-auto px-6 py-16">
        <h3 className="text-3xl font-bold text-white mb-6">Contact Tony</h3>
        <p className="text-slate-300 mb-6 max-w-2xl">
          For advisory, collaboration, or cohort eligibility inquiries:
        </p>
        <a href="mailto:tony@scend.cash" className="inline-flex items-center px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-medium transition">
          tony@scend.cash
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <p>© 2025 Tony Camero. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/cohort" onClick={scrollToTop}>
                <span className="hover:text-slate-400 transition cursor-pointer">Cohort</span>
              </Link>
              <Link href="/login">
                <span className="hover:text-slate-400 transition cursor-pointer">Login</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* TrustAgent - only show when not authenticated */}
      {!isAuthenticated && (
        <TrustAgentShell enabled={true} />
      )}
    </div>
  );
};

export default HomePage;
