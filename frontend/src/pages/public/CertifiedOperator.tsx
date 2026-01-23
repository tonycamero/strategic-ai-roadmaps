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

export default function CertifiedOperator() {
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
                        <Link href="/partner"><span className="text-sm text-slate-400 hover:text-white cursor-pointer">Partner</span></Link>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero */}
                <section className={styles.section}>
                    <h1 className={styles.h1}>Become a Certified StrategicAI Operator</h1>
                    <h2 className="text-xl md:text-2xl text-slate-300 font-normal mb-8">Command Strategy. Deliver Clarity. Build Governance at Scale.</h2>
                    <p className={styles.p}>
                        StrategicAI is the system. Certification is your interface to operate it with precision.
                    </p>
                </section>

                {/* Why Certify */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>Why Get Certified?</h2>
                    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-slate-900/50 italic text-slate-200 mb-8">
                        Certified Operators don’t pitch automation. They run the system that delivers operational certainty.
                    </blockquote>

                    <ul className="space-y-3">
                        <li className={styles.li}>• Deliver $5K–$25K strategy roadmaps using prebuilt diagnostics</li>
                        <li className={styles.li}>• Deploy $459+/mo SaaS portals for SMBs with bundled TrustConsole</li>
                        <li className={styles.li}>• Scale your fulfillment with SOP-driven execution</li>
                        <li className={styles.li}>• Let TrustConsole handle 80% of post-delivery support</li>
                        <li className={styles.li}>• Join a trusted network of verified operators</li>
                    </ul>
                </section>

                {/* Economic Ladder */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>The Economic Ladder</h2>
                    <div className="overflow-x-auto rounded-lg border border-slate-800">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-slate-300">
                                <tr>
                                    <th className="p-4 border-b border-slate-800">Tier</th>
                                    <th className="p-4 border-b border-slate-800">Path</th>
                                    <th className="p-4 border-b border-slate-800">Outcomes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 bg-slate-900/20">
                                <tr>
                                    <td className="p-4 text-white font-medium">Operator</td>
                                    <td className="p-4 text-slate-400">Core Certification</td>
                                    <td className="p-4 text-slate-400">Run SOP-based engagements with AI-guided intake</td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-white font-medium">Strategic Operator</td>
                                    <td className="p-4 text-slate-400">Advanced Certification</td>
                                    <td className="p-4 text-slate-400">Deliver multi-team diagnostics & live ROI dashboards</td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-white font-medium">Partner-Level Licensee</td>
                                    <td className="p-4 text-slate-400">Invite-Only</td>
                                    <td className="p-4 text-slate-400">License StrategicAI to others, manage white-label tenants</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* What You Learn */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>What You Learn</h2>
                    <ul className="grid sm:grid-cols-2 gap-4 mb-6">
                        <li className="bg-slate-900 p-4 rounded text-slate-300">Strategic Intake Design (Ops/Sales/Delivery)</li>
                        <li className="bg-slate-900 p-4 rounded text-slate-300">SOP Deployment with Execution Gating</li>
                        <li className="bg-slate-900 p-4 rounded text-slate-300">Discovery Synthesis using AI Agent Chains</li>
                        <li className="bg-slate-900 p-4 rounded text-slate-300">Client ROI Dashboards (30/60/90)</li>
                    </ul>
                    <p className="text-sm text-slate-500">Includes access to: Demo Tenant, Ticket Pack Library, Execution Templates, Messaging Playbooks.</p>
                </section>

                {/* Testimonials */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>What Certified Operators Say</h2>
                    <div className="grid gap-6">
                        <div className="bg-slate-900/40 p-6 rounded-lg border border-slate-800">
                            <p className="italic text-slate-300 mb-3">"I went from $2,000 setups to $18,500 diagnostic-led projects in under 30 days."</p>
                            <p className="text-sm text-blue-400">— Certified Operator, SaaS GTM Consultant</p>
                        </div>
                        <div className="bg-slate-900/40 p-6 rounded-lg border border-slate-800">
                            <p className="italic text-slate-300 mb-3">"I used to spend 10 hours on post-launch support. Now my TrustConsole handles it overnight."</p>
                            <p className="text-sm text-blue-400">— Agency Owner, StrategicAI Operator</p>
                        </div>
                    </div>
                </section>

                {/* Apply */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>Apply to Become Certified</h2>
                    <p className={styles.p}>Spaces are limited and acceptance is reviewed manually.</p>
                    <div className="mt-8">
                        <button className={styles.ctaButton} onClick={() => window.open('mailto:tony@scend.cash?subject=Certification Application', '_blank')}>
                            Apply for Certification
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
                            <Link href="/partner"><span className="hover:text-slate-400 cursor-pointer">Partner</span></Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
