import React, { useEffect } from 'react';
import { Link } from 'wouter';
import { TrustAgentShell } from '../../trustagent/TrustAgentShell';
import { PartnerRevenueSimulator } from './PartnerRevenueSimulator';

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

export default function AuthorityEconomics() {
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
                {/* Header */}
                <section className={`${styles.section} pt-24 pb-12 border-b-0`}>
                    <div className="inline-block px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800 text-blue-400 text-xs font-semibold mb-6">
                        PRIVATE DEAL SHAPING TOOL
                    </div>
                    <h1 className={styles.h1}>StrategicAI Authority Economics</h1>
                    <p className="text-xl text-slate-400">Not for public distribution.</p>
                </section>

                {/* What You License */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>What Are You Licensing?</h2>
                    <p className={styles.p}>You’re not buying resale rights. You’re stepping into infrastructure.</p>
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 mb-6">
                        <h3 className="text-white font-bold mb-4">You Get:</h3>
                        <ul className="space-y-3">
                            <li className={styles.li}>• A dedicated StrategicAI instance (branded to your ecosystem)</li>
                            <li className={styles.li}>• Control over onboarding, certification, and content injection</li>
                            <li className={styles.li}>• Access to SOP libraries, AI agents, and roadmap copilots</li>
                            <li className={styles.li}>• Per-seat usage tied to your vertical, not the global pool</li>
                        </ul>
                    </div>
                    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 italic text-slate-200">
                        This is your execution layer. Not a link. Not a widget.
                    </blockquote>
                </section>

                {/* Revenue Rails */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>Where Does the Revenue Come From?</h2>
                    <p className={styles.p}>StrategicAI monetizes through 4 aligned revenue rails — all shared with you.</p>

                    <div className="overflow-x-auto rounded-lg border border-slate-800">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-slate-300">
                                <tr>
                                    <th className="p-4 border-b border-slate-800">Revenue Channel</th>
                                    <th className="p-4 border-b border-slate-800">Example Yield</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 bg-slate-900/20">
                                <tr>
                                    <td className="p-4 text-white font-medium">SMB SaaS License</td>
                                    <td className="p-4 text-slate-400">$459/mo per SMB (split 50/50)</td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-white font-medium">Strategic Roadmaps</td>
                                    <td className="p-4 text-slate-400">$5,000+ per roadmap (split 50/50)</td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-white font-medium">Execution Add-Ons</td>
                                    <td className="p-4 text-slate-400">Optional SOP Packs, AI modules, diagnostics</td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-white font-medium">Enterprise Deployments</td>
                                    <td className="p-4 text-slate-400">Negotiated rev share on mid-market rollouts</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-6 text-slate-400 italic">This isn't a one-time launch model. It's recurring, usage-based, and extensible.</p>
                </section>

                {/* Simulator */}
                <section className={styles.section}>
                    <PartnerRevenueSimulator />
                </section>

                {/* Compounds */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>How It Compounds</h2>
                    <p className={styles.p}>You’re not just selling into your audience. You’re building <strong>a strategic asset</strong>.</p>
                    <ul className="space-y-3 mb-6">
                        <li className={styles.li}>• <strong>Every certified operator</strong> becomes a monthly revenue node</li>
                        <li className={styles.li}>• <strong>Every active client</strong> renews SaaS license (TrustConsole bundled)</li>
                        <li className={styles.li}>• <strong>Support load stays flat</strong> (TrustConsole handles 80% of questions)</li>
                        <li className={styles.li}>• <strong>Your library</strong> compounds over time</li>
                    </ul>
                    <p className={styles.p}>This is <strong>platform economics</strong>, not coaching math.</p>
                </section>

                {/* The Split */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>What Does StrategicAI Keep?</h2>
                    <p className={styles.p}>We protect infrastructure. You own your brand.</p>
                    <div className="grid sm:grid-cols-2 gap-6 mt-6">
                        <div className="bg-slate-900 p-6 rounded-lg">
                            <h3 className="font-bold text-white mb-2">Revenue Split</h3>
                            <p className="text-slate-400">50/50 on net usage (after fees)</p>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-lg">
                            <h3 className="font-bold text-white mb-2">You Keep</h3>
                            <p className="text-slate-400">100% of your list, audience, and curriculum IP</p>
                        </div>
                    </div>
                </section>

                {/* Bottom Line */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>Bottom Line</h2>
                    <p className={styles.p}>You don’t need more funnels. You need <strong>leverage that compounds.</strong></p>
                    <p className={styles.p}>StrategicAI is not a tech partner. It’s the infrastructure beneath the next decade of transformation ecosystems.</p>
                    <div className="mt-8 p-6 bg-blue-900/20 border border-blue-900 rounded-lg text-center">
                        <p className="text-blue-200 font-medium">Use this lens only when they’re ready. Then slide it across the table.</p>
                    </div>
                </section>

            </main>

            <TrustAgentShell enabled={true} mode="homepage" />

            {/* Footer */}
            <footer className="border-t border-slate-800 mt-16 bg-slate-950">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between text-sm text-slate-500 gap-4">
                        <p>© {new Date().getFullYear()} Strategic AI Infrastructure. Private Use Only.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
