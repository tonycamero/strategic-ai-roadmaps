import React, { useEffect } from 'react';
import { Link } from 'wouter';
import { TrustAgentShell } from '../../trustagent/TrustAgentShell';

const styles = {
    h1: "text-4xl md:text-5xl font-bold text-white mb-6 leading-tight",
    h2: "text-2xl md:text-3xl font-bold text-white mb-6",
    h3: "text-xl font-bold text-white mb-4",
    p: "text-lg text-slate-400 mb-6 leading-relaxed",
    li: "text-slate-300 mb-2 flex items-start gap-2",
    section: "max-w-4xl mx-auto px-6 py-16 border-b border-slate-800/50 last:border-0",
    ctaButton: "inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition cursor-pointer"
};

const scrollToTop = () => window.scrollTo(0, 0);

export default function AuthorityPartner() {
    useEffect(scrollToTop, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Nav */}
            <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" onClick={scrollToTop}>
                        <span className="text-xl font-medium tracking-tight text-slate-100 hover:text-blue-400 transition-colors cursor-pointer">
                            <span className="text-blue-500">Strategic</span>AI.app
                        </span>
                    </Link>
                    <div className="flex gap-6">
                        <Link href="/operator"><span className="text-sm text-slate-400 hover:text-white cursor-pointer">Get Certified</span></Link>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero */}
                <section className={styles.section}>
                    <h1 className={styles.h1}>Partner With StrategicAI</h1>
                    <h2 className="text-xl md:text-2xl text-slate-300 font-normal mb-8">License the Infrastructure. Lead the Category.</h2>
                    <p className={styles.p}>
                        StrategicAI is the Strategic Execution OS for transformation-driven consultants and educators.
                        If you serve an audience of agency owners, automation consultants, or systems builders, this is the infrastructure you've been waiting to compound.
                    </p>
                </section>

                {/* Why Partner */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>Why Partner?</h2>
                    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-slate-900/50 italic text-slate-200 mb-8">
                        Most "partner programs" offer affiliate links. StrategicAI offers <strong>authority equity.</strong>
                    </blockquote>

                    <div className="grid gap-8">
                        <div>
                            <h3 className={styles.h3}>License the Platform</h3>
                            <p className={styles.p}>Give your audience a governed execution system — not another course or SaaS hack.</p>
                        </div>
                        <div>
                            <h3 className={styles.h3}>Earn Recurring Revenue</h3>
                            <p className={styles.p}>Certification royalties and platform revenue-share — starting at a $459/mo floor with zero platform fees.</p>
                        </div>
                        <div>
                            <h3 className={styles.h3}>White-Label Option</h3>
                            <p className={styles.p}>Co-brand the StrategicAI portal with your name, curriculum, or certification.</p>
                        </div>
                        <div>
                            <h3 className={styles.h3}>Preloaded SOPs & Ticket Packs</h3>
                            <p className={styles.p}>Distribute your playbooks inside the ecosystem. Turn your IP into operational infrastructure.</p>
                        </div>
                        <div>
                            <h3 className={styles.h3}>Built-In TrustConsole</h3>
                            <p className={styles.p}>Every SaaS license includes TrustConsole — the always-on roadmap interface for client self-service.</p>
                        </div>
                        <div>
                            <h3 className={styles.h3}>Governed Delivery at Scale</h3>
                            <p className={styles.p}>Enforces SOP compliance, discovery gating, and roadmap quality through hard-coded workflows.</p>
                        </div>
                    </div>
                </section>

                {/* Who It's For */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>Who It's For</h2>
                    <ul className="space-y-3">
                        <li className={styles.li}>• <strong>Educators & Coaches</strong> with large agency/student bases</li>
                        <li className={styles.li}>• <strong>Platform Builders</strong> running CRMs, AI tools, or SaaS ecosystems</li>
                        <li className={styles.li}>• <strong>Strategic Communities</strong> who want to own infrastructure, not just curriculum</li>
                    </ul>
                </section>

                {/* Examples */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>Use Case Examples</h2>
                    <ul className="space-y-3">
                        <li className={styles.li}>• An agency educator licenses the system to standardize delivery across their coaching network.</li>
                        <li className={styles.li}>• A SaaS operator integrates StrategicAI as the execution layer behind their accelerator programs.</li>
                        <li className={styles.li}>• A systems strategist offers StrategicAI as the backend of their consulting method.</li>
                    </ul>
                </section>

                {/* How It Works */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>How the Authority License Works</h2>
                    <ul className="grid sm:grid-cols-2 gap-4">
                        <li className="bg-slate-900 p-4 rounded text-slate-300">Dedicated StrategicAI instance for your audience</li>
                        <li className="bg-slate-900 p-4 rounded text-slate-300">Your branding and curriculum embedded</li>
                        <li className="bg-slate-900 p-4 rounded text-slate-300">Certification passes for team members</li>
                        <li className="bg-slate-900 p-4 rounded text-slate-300">Revenue share on all platform activity</li>
                    </ul>
                </section>

                {/* Ready to Lead */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>Ready to Lead?</h2>
                    <p className={styles.p}>The next generation of authority brands won’t just teach strategy — they’ll <strong>operate the system that delivers it.</strong></p>
                    <div className="mt-8">
                        <button className={styles.ctaButton} onClick={() => window.open('mailto:tony@scend.cash?subject=Partner Application', '_blank')}>
                            Apply to Become a StrategicAI Partner
                        </button>
                    </div>
                </section>

            </main>

            <TrustAgentShell enabled={true} mode="homepage" />

            {/* Footer */}
            <footer className="border-t border-slate-800 mt-16 bg-slate-950">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between text-sm text-slate-500 gap-4">
                        <p>© {new Date().getFullYear()} Strategic AI Infrastructure. All rights reserved.</p>
                        <div className="flex gap-6">
                            <Link href="/"><span className="hover:text-slate-400 cursor-pointer">Home</span></Link>
                            <Link href="/economics"><span className="hover:text-slate-400 cursor-pointer">Economics</span></Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
