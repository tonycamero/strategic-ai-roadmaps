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

export default function Features() {
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
                        <Link href="/smb"><span className="text-sm text-slate-400 hover:text-white cursor-pointer">SMBs</span></Link>
                        <Link href="/operator"><span className="text-sm text-slate-400 hover:text-white cursor-pointer">Certified Operators</span></Link>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero */}
                <section className={styles.section}>
                    <h1 className={styles.h1}>For Consultants Who Want to Deliver Like a Scaled Agency</h1>
                    <p className={styles.p}>
                        StrategicAI.app turns your 1:1 insights into repeatable, governed systems your SMB clients can trust.
                        You bring the strategy. We handle the infrastructure.
                    </p>
                    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-slate-900/50 italic text-slate-200">
                        This isn't just a delivery tool. It's your <strong>operating layer</strong> for SMB transformation.
                    </blockquote>
                </section>

                {/* What You Get */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>What You Get</h2>

                    <div className="space-y-8">
                        <div>
                            <h3 className={styles.h3}>Intake Engines</h3>
                            <ul className="space-y-1 ml-4 list-disc text-slate-400">
                                <li>Role-based portals collect Sales, Ops, and Executive intel.</li>
                                <li>No more chasing docs or misaligned assumptions.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className={styles.h3}>Roadmap Generator</h3>
                            <ul className="space-y-1 ml-4 list-disc text-slate-400">
                                <li>AI drafts 80% of the transformation plan.</li>
                                <li>You finalize with strategic oversight.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className={styles.h3}>Execution System</h3>
                            <ul className="space-y-1 ml-4 list-disc text-slate-400">
                                <li>SOPs trigger real workflows.</li>
                                <li>Clients stop asking "what next?"</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className={styles.h3}>TrustConsole™</h3>
                            <ul className="space-y-1 ml-4 list-disc text-slate-400">
                                <li>Clients can ask roadmap questions 24/7.</li>
                                <li>Grounded in KPIs, ticket activity, and progress.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className={styles.h3}>ROI Dashboard</h3>
                            <ul className="space-y-1 ml-4 list-disc text-slate-400">
                                <li>Show time saved, margin recovered, and operational lift.</li>
                                <li>Clients see results, not confusion.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Why SMBs Love It */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>Why SMBs Love It (and You Win)</h2>
                    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-slate-900/50 italic text-slate-200 mb-6">
                        StrategicAI helps you sell transformation — without becoming a helpdesk.
                    </blockquote>

                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="bg-slate-900/50 p-4 rounded border border-slate-800">
                            <h4 className="font-bold text-white mb-2">Clarity Without Chaos</h4>
                            <p className="text-sm text-slate-400">SMB teams finally see what they're working on and why.</p>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded border border-slate-800">
                            <h4 className="font-bold text-white mb-2">Execution That Sticks</h4>
                            <p className="text-sm text-slate-400">SOPs and automations keep them on track long after you leave.</p>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded border border-slate-800">
                            <h4 className="font-bold text-white mb-2">You Stay the Expert</h4>
                            <p className="text-sm text-slate-400">The platform answers their day-to-day questions. You stay focused on strategy.</p>
                        </div>
                    </div>
                </section>

                {/* Launch Fast */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>Launch in Days, Not Months</h2>
                    <p className={styles.p}>StrategicAI is designed for solo consultants, fractional operators, and lean firms.</p>
                    <ul className="space-y-3 mb-6">
                        <li className={styles.li}>• Deploy to a new client in &lt; 48 hours</li>
                        <li className={styles.li}>• Use your own SOPs or start with ours</li>
                        <li className={styles.li}>• Keep the relationship, let us power the delivery</li>
                    </ul>
                </section>

                {/* What's Included */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>What's Included with Every SMB Tenant</h2>
                    <div className="flex flex-wrap gap-3">
                        <span className="bg-blue-900/30 text-blue-300 border border-blue-800 px-3 py-1 rounded">Interactive Roadmap</span>
                        <span className="bg-blue-900/30 text-blue-300 border border-blue-800 px-3 py-1 rounded">Execution Tickets</span>
                        <span className="bg-blue-900/30 text-blue-300 border border-blue-800 px-3 py-1 rounded">ROI Dashboards</span>
                        <span className="bg-blue-900/30 text-blue-300 border border-blue-800 px-3 py-1 rounded">TrustConsole™ with 24/7 Access</span>
                    </div>
                    <p className="mt-8 italic text-slate-400">StrategicAI becomes the system your clients never knew they needed.</p>
                </section>

                {/* CTA */}
                <section className={styles.section}>
                    <Link href="/operator">
                        <span className={styles.ctaButton}>See Operator Certification Path</span>
                    </Link>
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
                            <Link href="/operator"><span className="hover:text-slate-400 cursor-pointer">Certified Operator</span></Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
