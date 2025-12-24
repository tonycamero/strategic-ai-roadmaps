import { useState } from 'react';
import { VideoThumbnail } from '../components/VideoModal';
import { HamburgerButton } from '../components/mobile/HamburgerButton';
import { NavDrawer } from '../components/mobile/NavDrawer';

export default function TonyCameroLanding() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Mobile Navigation Drawer */}
      <NavDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Navigation */}
      <nav className="border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur-sm z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <a href="#top" className="text-xl font-semibold tracking-tight hover:text-slate-200 transition-colors">
            Tony Camero
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <a onClick={() => scrollToSection('featured-projects')} className="text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
              Projects
            </a>
            <a href="/ai" className="text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
              Strategic AI
            </a>
            <a onClick={() => scrollToSection('about')} className="text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
              About
            </a>
            <a onClick={() => scrollToSection('contact')} className="text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
              Contact
            </a>
            <a href="/signup" className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              Create My Roadmap
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <HamburgerButton
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <HeroSection />

      {/* Featured Projects */}
      <FeaturedProjectsSection />

      {/* About Tony */}
      <AboutSection />

      {/* Current Focus: Strategic AI */}
      <CurrentFocusSection />

      {/* Experimental Promo Videos */}
      <PromoVideosSection />

      {/* Social Proof (Optional) */}
      <SocialProofStrip />

      {/* Contact */}
      <ContactSection />

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500">
          © 2026 Tony Camero. Building technologies that elevate communities.
        </div>
      </footer>
    </div>
  );
}

function HeroSection() {
  return (
    <section id="top" className="py-12 sm:py-20 md:py-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Tony Camero
        </h1>
        <div className="text-lg sm:text-xl md:text-2xl text-slate-400 mb-8 space-y-2">
          <p>Builder • Ecosystem Architect • Financial Innovator</p>
        </div>
        <p className="text-base sm:text-lg text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto">
          I design systems that strengthen communities, modernize finance, and streamline how identity, trust, and value move in the real world. My work spans digital finance, community infrastructure, and now AI-powered business systems.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-block text-center touch-manipulation"
          >
            Create My Roadmap
          </a>
          <a
            href="mailto:tony@scend.cash"
            className="w-full sm:w-auto px-8 py-4 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-slate-100 font-medium rounded-lg transition-colors inline-block text-center touch-manipulation"
          >
            Contact
          </a>
        </div>
      </div>
    </section>
  );
}

function FeaturedProjectsSection() {
  const projects = [
    {
      title: 'Scend Trust Ecosystem',
      subtitle: 'A new financial backbone for communities.',
      description: 'Powers local economies with trusted payments, identity, messaging, and reward systems previously available only to major institutions.',
      link: 'https://scend.cash'
    },
    {
      title: 'TRST — The Digital Dollar for Local Economies',
      subtitle: 'A stable, fee-less digital dollar designed to circulate inside communities.',
      description: 'Enables payroll, vendor payments, community rewards, and everyday peer-to-peer transactions in local economies.',
      link: 'https://scend.cash'
    },
    {
      title: 'Strategic AI',
      subtitle: 'AI-driven growth systems for small and mid-sized businesses.',
      description: 'An on-demand AI layer that optimizes follow-up, automates workflows, improves visibility, and reduces operational friction.',
      link: '/ai'
    }
  ];

  return (
    <section id="featured-projects" className="py-12 sm:py-20 border-t border-slate-800 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Featured Projects</h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto">
            A selection of systems built around trust, identity, payments, and operational intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {projects.map((project, idx) => (
            <div
              key={idx}
              className="border border-slate-800 rounded-xl p-6 bg-slate-900/30 hover:bg-slate-900/50 transition-colors flex flex-col"
            >
              <h3 className="text-xl font-bold mb-2">{project.title}</h3>
              <p className="text-blue-400 text-sm mb-3">{project.subtitle}</p>
              <p className="text-slate-300 text-sm leading-relaxed mb-6 flex-grow">{project.description}</p>
              <a
                href={project.link}
                target={project.link.startsWith('http') ? '_blank' : undefined}
                rel={project.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
              >
                View Project →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CurrentFocusSection() {
  return (
    <section id="current-focus" className="py-12 sm:py-20 border-t border-slate-800 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8">Current Focus: Strategic AI</h2>
        <div className="space-y-6 text-base sm:text-lg text-slate-300 leading-relaxed">
          <p>
            I'm currently applying my systems architecture work to everyday businesses. Service-based companies are losing 15–30% of their revenue to friction—broken workflows, inconsistent follow-up, and manual processes.
          </p>
          <p>
            Strategic AI is a growth system that diagnoses operational bottlenecks and deploys AI where it actually matters, giving owners a clear roadmap instead of more tools.
          </p>
        </div>
        <div className="mt-8">
          <a
            href="/ai"
            className="inline-block w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-center touch-manipulation"
          >
            Explore Strategic AI
          </a>
        </div>
      </div>
    </section>
  );
}

function PromoVideosSection() {
  return (
    <section id="promo-videos" className="py-12 sm:py-20 border-t border-slate-800 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Experimental AI-Generated Promo Videos</h2>
          <p className="text-slate-400">
            These are creative experiments exploring AI-generated storytelling, not formal product trailers.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <VideoThumbnail
            title="Strategic AI Roadmaps"
            videoSrc="/videos/promo.mp4"
            thumbnailSrc="/thumbnails/strategic-ai-thumb.jpg"
          />
          <VideoThumbnail
            title="CraftTrust"
            videoSrc="/videos/crafttrust-promo.mp4"
            thumbnailSrc="/thumbnails/crafttrust-thumb.jpg"
          />
          <VideoThumbnail
            title="TrustMesh"
            videoSrc="/videos/trustmesh-promo.mp4"
            thumbnailSrc="/thumbnails/trustmesh-thumb.jpg"
          />
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="py-12 sm:py-20 border-t border-slate-800 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8">About Tony</h2>
        <div className="space-y-6 text-base sm:text-lg text-slate-300 leading-relaxed">
          <p>
            I build systems that empower people and communities by increasing trust, reducing friction, and modernizing how value and reputation move. Across fintech, identity, culture, and now operational AI, my work focuses on one principle:
          </p>
          <p className="text-xl font-semibold text-slate-100 py-2">
            When systems work better, communities work better.
          </p>
          <p>
            I partner with teams, founders, cities, and organizations to design the infrastructure that enables more resilient financial and social ecosystems.
          </p>
        </div>
      </div>
    </section>
  );
}

function SocialProofStrip() {
  return (
    <section className="py-12 border-t border-slate-800 bg-slate-900/20">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-sm text-slate-500">
          Supported by work with local communities, merchants, service providers, and innovators across finance, identity, and operations.
        </p>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="py-12 sm:py-20 border-t border-slate-800 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">Let's Build Together</h2>
        <p className="text-base sm:text-lg text-slate-300 mb-12 leading-relaxed">
          If you want to explore collaboration, investment, licensing, or pilot deployments — let's talk.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <a
            href="mailto:tony@scend.cash"
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-block text-center touch-manipulation"
          >
            Email: tony@scend.cash
          </a>
        </div>

        <p className="mt-12 text-slate-400 italic">
          Let's build the systems our communities deserve.
        </p>
      </div>
    </section>
  );
}
