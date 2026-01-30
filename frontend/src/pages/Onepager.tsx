import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useRoadmap } from '../context/RoadmapContext';
import { getFallbackOnepager } from '../lib/onepagerShaper';

export default function Onepager() {
    const { payload } = useRoadmap();

    // Use payload if available, else fallback
    const spec = payload || getFallbackOnepager();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
            {/* Header */}
            <nav className="border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur-sm z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="text-xl font-semibold tracking-tight hover:text-slate-200 transition-colors flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">TA</div>
                        Strategic AI Roadmap
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
                            Home
                        </Link>
                        <Link href="/login" className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors">
                            Sign In
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="max-w-4xl mx-auto px-6 py-12 sm:py-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">

                {/* AG-TICKET-10: Hero Clarity Upgrade (3-layer structure) */}
                <section className="mb-16">
                    {/* Check if voice evidence exists (AG-TICKET-11: prefer alias, fallback to original) */}
                    {(() => {
                        const hasVoiceQuote = (spec.observations[0]?.voiceEvidence ?? spec.observations[0]?.evidenceQuote) ||
                            (spec.observations[1]?.voiceEvidence ?? spec.observations[1]?.evidenceQuote) ||
                            (spec.bottleneck.voiceEvidence ?? spec.bottleneck.evidenceQuote);

                        return (
                            <>
                                {/* AG-TICKET-12.2: Constraint Class Label (First-Class Conceptual Object) */}
                                <div className="text-lg md:text-xl font-bold tracking-[0.18em] uppercase text-blue-500 mb-3">
                                    {spec.headline.diagnosis}
                                </div>


                                {/* AG-TICKET-12.3: Canonical Constraint Definition (Fixed, Never Personalized) */}
                                <p className="text-base md:text-lg text-slate-400 font-medium mb-8 max-w-3xl leading-relaxed">
                                    {spec.headline.diagnosis === 'Scale Ceiling' && 'Growth rate is limited by manual human capacity rather than market demand. As volume increases, execution fragments because critical work depends on finite people instead of scalable systems.'}
                                    {spec.headline.diagnosis === 'Vacuum of Ownership' && 'Work stalls because responsibility is implicit rather than explicitly owned. Tasks wait indefinitely because no role, system, or mechanism is accountable for completion.'}
                                    {spec.headline.diagnosis === 'Systemic Fragility' && 'Operations depend on brittle, informal coordination that breaks under stress. The system functions only when people actively compensate for its gaps.'}
                                    {!['Scale Ceiling', 'Vacuum of Ownership', 'Systemic Fragility'].includes(spec.headline.diagnosis) && 'A structural constraint limiting organizational execution capacity.'}
                                </p>

                                {/* AG-TICKET-12.2: Diagnostic Verdict (Instance-Level H1) */}
                                <h1 className="text-4xl md:text-6xl font-semibold leading-[1.05] text-white mb-6 max-w-4xl">
                                    {spec.headline.tension}
                                </h1>

                                {/* AG-TICKET-12.2: Contextual Subtext (Why This Matters) */}
                                <p className="text-sm md:text-base text-slate-500 max-w-2xl leading-relaxed mb-12">
                                    {spec.subhead}
                                </p>

                                {/* Evidence Grid (adaptive width based on voice presence) */}
                                <div className="mt-10 grid gap-4 md:grid-cols-12">
                                    {/* Evidence Observed Block */}
                                    <div className={`${hasVoiceQuote ? 'md:col-span-7' : 'md:col-span-12'} rounded-2xl border border-slate-800 bg-slate-900/30 p-6`}>
                                        <div className="text-[11px] tracking-[0.22em] uppercase text-slate-500 mb-2">
                                            Evidence observed
                                        </div>
                                        <div className="text-lg md:text-xl font-medium leading-snug text-white">
                                            {spec.bottleneck.summary || spec.observations[0]?.claim || "Evidence will appear here after your TrustAgent session."}
                                        </div>
                                    </div>

                                    {/* From Your Words Block (conditional) */}
                                    {hasVoiceQuote && (
                                        <div className="md:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/20 p-6">
                                            <div className="text-[11px] tracking-[0.22em] uppercase text-slate-500 mb-2">
                                                From your words
                                            </div>
                                            <div className="text-base leading-relaxed text-slate-300 italic">
                                                {(spec.observations[0]?.voiceEvidence ?? spec.observations[0]?.evidenceQuote) ||
                                                    (spec.observations[1]?.voiceEvidence ?? spec.observations[1]?.evidenceQuote) ||
                                                    (spec.bottleneck.voiceEvidence ?? spec.bottleneck.evidenceQuote)}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-10 h-px w-full bg-slate-800" />
                            </>
                        );
                    })()}
                </section>

                <div className="space-y-24">
                    {/* Section: What We Found */}
                    <section id="what-we-found">
                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-blue-600 text-lg font-mono font-bold">01</span>
                            <h2 className="text-2xl font-bold tracking-tight uppercase tracking-wider text-slate-300">What We Found</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {spec.observations.map((obs, i) => (
                                <div key={i} className="p-6 border border-slate-800/50 bg-slate-900/20 rounded-xl space-y-3">
                                    <h3 className="font-semibold text-slate-200">{obs.claim}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        {obs.consequence}
                                    </p>
                                    {/* AG-TICKET-08: Evidence quote block */}
                                    {obs.evidenceQuote && (
                                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                                            <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                                                Evidence
                                            </div>
                                            <p className="text-sm text-slate-300 italic leading-relaxed">
                                                {obs.evidenceQuote}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section: Primary Bottleneck */}
                    <section id="primary-bottleneck">
                        <div className="flex items-center gap-4 mb-8 text-blue-500">
                            <span className="text-lg font-mono font-bold">02</span>
                            <h2 className="text-2xl font-bold tracking-tight uppercase tracking-wider text-slate-300">Primary Bottleneck</h2>
                        </div>
                        <div className="p-8 border-2 border-blue-900/30 bg-blue-950/10 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-4 text-blue-400 font-mono tracking-tight uppercase">
                                    {spec.bottleneck.name}
                                </h3>
                                <p className="text-lg text-slate-300 leading-relaxed max-w-3xl mb-6">
                                    {spec.bottleneck.summary}
                                </p>
                                <div className="mt-6 p-4 bg-slate-900/40 rounded-lg border border-red-900/30">
                                    <p className="text-sm text-red-400/80 font-mono uppercase tracking-widest mb-2">Why This Compounds</p>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        {spec.bottleneck.inevitability}
                                    </p>
                                </div>
                                {/* AG-TICKET-08: Bottleneck evidence quote */}
                                {spec.bottleneck.evidenceQuote && (
                                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                                            Evidence
                                        </div>
                                        <p className="text-sm text-slate-300 italic leading-relaxed">
                                            {spec.bottleneck.evidenceQuote}
                                        </p>
                                    </div>
                                )}
                                <div className="mt-8 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                                    <span className="px-3 py-1 bg-slate-800 rounded-full">Manual Processing</span>
                                    <span className="px-3 py-1 bg-slate-800 rounded-full">Reactive Communication</span>
                                    <span className="px-3 py-1 bg-slate-800 rounded-full">Systemic Fragility</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section: Next 30 Days */}
                    <section id="next-30-days">
                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-blue-600 text-lg font-mono font-bold">03</span>
                            <h2 className="text-2xl font-bold tracking-tight uppercase tracking-wider text-slate-300">Next 30 Days</h2>
                        </div>
                        <div className="space-y-6">
                            {spec.firstMoves.map((move, i) => (
                                <div key={i} className="flex gap-6 p-6 border border-slate-800/50 bg-slate-900/10 rounded-xl items-start hover:border-slate-700/50 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 text-sm font-bold text-slate-300">
                                        {i === 2 ? 'W3+' : `W${i + 1}`}
                                    </div>
                                    <div className="space-y-2 flex-grow">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-slate-200">{move.action}</h4>
                                            <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-500 uppercase">{move.time} • {move.owner}</span>
                                        </div>
                                        <p className="text-sm text-slate-400">{move.why}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section: Strategic Risks */}
                    <section id="strategic-risks">
                        <div className="flex items-center gap-4 mb-8 text-amber-500/80">
                            <span className="text-lg font-mono font-bold">04</span>
                            <h2 className="text-2xl font-bold tracking-tight uppercase tracking-wider text-slate-300">Strategic Risks</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {spec.risks.map((risk, i) => (
                                <div key={i} className="p-5 border border-amber-900/20 bg-amber-950/5 rounded-xl border-l-4 border-l-amber-700/50">
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        {risk}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* AG-TICKET-13: Inevitability CTA + Perspective Lens */}
                    <section className="mt-32 pt-16 border-t border-slate-800">
                        {/* Inevitability Header */}
                        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-6">
                            Stopping Here Locks the Constraint in Place
                        </h2>

                        {/* Consequence Block */}
                        <div className="max-w-3xl mx-auto text-center mb-8">
                            <p className="text-lg text-slate-300 leading-relaxed mb-6">
                                This page identifies the structural constraint limiting your business. Without a full Strategic AI Roadmap, that constraint will continue to compound — quietly, predictably, and at increasing cost.
                            </p>
                            <p className="text-base text-slate-400 leading-relaxed">
                                The full Strategic AI Roadmap converts this diagnosis into a sequenced execution plan, system design, and decision structure.
                            </p>
                            <p className="text-base text-slate-500 mt-4 italic">
                                This is the point where most teams hesitate — and where the constraint hardens.
                            </p>
                        </div>

                        {/* Perspective Lens Toggle */}
                        {(() => {
                            const [perspective, setPerspective] = useState<'founder' | 'exec'>('founder');

                            return (
                                <div className="max-w-2xl mx-auto">
                                    {/* Toggle UI */}
                                    <div className="flex justify-center mb-8">
                                        <div className="inline-flex bg-slate-900 border border-slate-700 rounded-lg p-1">
                                            <button
                                                onClick={() => setPerspective('founder')}
                                                className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${perspective === 'founder'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-slate-400 hover:text-white'
                                                    }`}
                                            >
                                                Founder
                                            </button>
                                            <button
                                                onClick={() => setPerspective('exec')}
                                                className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${perspective === 'exec'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-slate-400 hover:text-white'
                                                    }`}
                                            >
                                                Executive Team
                                            </button>
                                        </div>
                                    </div>

                                    {/* Lens-Specific Copy */}
                                    <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-8 mb-10">
                                        {perspective === 'founder' ? (
                                            <div className="text-slate-300 leading-relaxed space-y-4">
                                                <p>As the founder, this constraint currently resolves through you.</p>
                                                <p>Right now, you are acting as the shock absorber for systemic failure. That works until it doesn't.</p>
                                                <p className="text-slate-400">The full Strategic AI Roadmap is how this constraint is removed from your personal bandwidth and embedded into systems that operate without you in the loop.</p>
                                            </div>
                                        ) : (
                                            <div className="text-slate-300 leading-relaxed space-y-4">
                                                <p>This constraint is currently unmanaged at the organizational level.</p>
                                                <p>Without a shared execution model, each department compensates locally — creating drift, duplication, and silent conflict.</p>
                                                <p className="text-slate-400">The full Strategic AI Roadmap establishes a single execution spine so leadership decisions propagate cleanly across teams instead of fragmenting.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* CTA Button */}
                        <div className="text-center">
                            <Link
                                href={spec.cta.link}
                                className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Convert This Diagnosis Into an Execution Roadmap
                            </Link>
                            <p className="mt-4 text-sm text-slate-600 italic">
                                Organizations that stop at diagnosis typically repeat it 6–12 months later under more pressure.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <footer className="mt-32 text-center text-xs text-slate-600 font-mono tracking-widest uppercase pb-12">
                    © {new Date().getFullYear()} Strategic AI Infrastructure • CONFIDENTIAL REPRO
                </footer>

            </main>
        </div>
    );
}
