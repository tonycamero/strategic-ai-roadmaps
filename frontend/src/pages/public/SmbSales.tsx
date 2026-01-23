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

export default function SmbSales() {
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
                        <Link href="/features"><span className="text-sm text-slate-400 hover:text-white cursor-pointer">Features</span></Link>
                        <Link href="/login"><span className="text-sm text-slate-400 hover:text-white cursor-pointer">Login</span></Link>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero */}
                <section className={styles.section}>
                    <h1 className={styles.h1}>StrategicAI for SMBs</h1>
                    <h2 className="text-xl md:text-2xl text-slate-300 font-normal mb-8">Your Business, Organized. Your Strategy, Alive.</h2>
                </section>

                {/* What You Get */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>What You Get (Without the Headaches)</h2>
                    <p className={styles.p}>
                        <strong>StrategicAI gives you a powerful operating system for business execution</strong> — without bloated software, disjointed apps, or "consultants" who disappear after the plan.
                    </p>
                    <ul className="space-y-3 mb-8">
                        <li className={styles.li}>• A living roadmap you can actually follow</li>
                        <li className={styles.li}>• Clear execution tickets for your team</li>
                        <li className={styles.li}>• A 24/7 TrustConsole that explains what matters</li>
                        <li className={styles.li}>• Real ROI dashboards showing what's working</li>
                    </ul>
                    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-slate-900/50 italic text-slate-200">
                        Built by consultants. Delivered as infrastructure.
                    </blockquote>
                </section>

                {/* How It Works */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>How It Works</h2>
                    <div className="grid gap-8 mt-8">
                        <div>
                            <h3 className={styles.h3}>Step 1: Strategic Intake</h3>
                            <p className={styles.p}>Your Consultant runs a role-based discovery across your team: Sales, Ops, Leadership, and more.</p>
                        </div>
                        <div>
                            <h3 className={styles.h3}>Step 2: AI-Powered Roadmap</h3>
                            <p className={styles.p}>Our system turns discovery into a dynamic, personalized roadmap for your business.</p>
                        </div>
                        <div>
                            <h3 className={styles.h3}>Step 3: Execution System</h3>
                            <p className={styles.p}>Each roadmap item turns into simple, trackable tasks. SOPs included. No confusion.</p>
                        </div>
                        <div>
                            <h3 className={styles.h3}>Step 4: 24/7 TrustConsole</h3>
                            <p className={styles.p}>Ask anything: "What's the goal of this sprint?" or "Are we hitting our KPIs?" The TrustConsole has the answer.</p>
                        </div>
                        <div>
                            <h3 className={styles.h3}>Step 5: ROI Dashboards</h3>
                            <p className={styles.p}>Track actual business outcomes: leads saved, time recovered, campaigns launched.</p>
                        </div>
                    </div>
                </section>

                {/* Why SMBs */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>Why SMBs Use StrategicAI</h2>
                    <ul className="grid sm:grid-cols-2 gap-4 mb-8">
                        <li className="bg-slate-900 p-4 rounded-lg text-slate-300">No more PDF plans that die in inboxes</li>
                        <li className="bg-slate-900 p-4 rounded-lg text-slate-300">Everyone knows what to do</li>
                        <li className="bg-slate-900 p-4 rounded-lg text-slate-300">No need to chase your consultant</li>
                        <li className="bg-slate-900 p-4 rounded-lg text-slate-300">You see the ROI in real time</li>
                    </ul>
                    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-slate-900/50 italic text-slate-200">
                        Your consultant runs the discovery. StrategicAI runs the system.
                    </blockquote>
                </section>

                {/* Client View */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>What You See As a Client</h2>
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="border border-slate-800 rounded-lg p-6 bg-slate-900/30">
                            <h3 className="font-bold text-white mb-2">Interactive Roadmap</h3>
                            <p className="text-slate-400 text-sm">Updated as you evolve.</p>
                        </div>
                        <div className="border border-slate-800 rounded-lg p-6 bg-slate-900/30">
                            <h3 className="font-bold text-white mb-2">Live ROI Dashboard</h3>
                            <p className="text-slate-400 text-sm">Real business metrics.</p>
                        </div>
                        <div className="border border-slate-800 rounded-lg p-6 bg-slate-900/30">
                            <h3 className="font-bold text-white mb-2">Execution Tickets</h3>
                            <p className="text-slate-400 text-sm">Linked to each roadmap item.</p>
                        </div>
                        <div className="border border-slate-800 rounded-lg p-6 bg-slate-900/30">
                            <h3 className="font-bold text-white mb-2">TrustConsole Chat</h3>
                            <p className="text-slate-400 text-sm">Answers strategic questions 24/7.</p>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className={styles.section}>
                    <h2 className={styles.h2}>Ready to Run Your Business Like a Pro?</h2>
                    <p className={styles.p}>No need to learn new tools. No chasing contractors.<br />Just clarity, visibility, and a machine that runs your plan.</p>
                    <div className="mt-8">
                        <button className={styles.ctaButton} onClick={() => window.open('mailto:tony@scend.cash', '_blank')}>
                            Ask your Consultant about StrategicAI
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
                            <Link href="/features"><span className="hover:text-slate-400 cursor-pointer">Features</span></Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
