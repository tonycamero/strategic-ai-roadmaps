import React from 'react';

export interface RoleEvidenceCardProps {
    roleId: string;
    roleName: string;
    headline: string;
    signals: string[];
    diagnosis: string;
    className?: string;
}

const VERDICTS: Record<string, string> = {
    owner: "You are absorbing system failures instead of enforcing structure.",
    sales: "Revenue depends on heroics instead of enforced follow-up.",
    ops: "Execution speed exceeds system control.",
    delivery: "Momentum decays after handoff due to unclear ownership."
};

export const RoleEvidenceCard: React.FC<RoleEvidenceCardProps> = ({
    roleId,
    roleName,
    headline,
    signals,
    diagnosis,
    className = ""
}) => {
    return (
        <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors ${className}`}>
            <h4 className="text-sm font-black text-white uppercase tracking-wide mb-3">{roleName}</h4>
            <p className="text-xs font-bold text-white mb-3 bg-white/5 p-2 rounded border-l-2 border-emerald-500">
                {VERDICTS[roleId] || "System check required."}
            </p>
            <div className="min-h-[60px] mb-4">
                <p className="text-sm font-bold text-blue-400 leading-snug">{headline}</p>
            </div>
            <div className="space-y-3 mb-4">
                {(signals || []).slice(0, 2).map((s: string, si: number) => (
                    <div key={si} className="text-[10px] py-1 px-2 bg-slate-950 rounded border border-slate-800 text-slate-400">
                        {s}
                    </div>
                ))}
            </div>
            <p className="text-xs text-slate-500 italic border-t border-slate-800 pt-3">
                "{diagnosis}"
            </p>
        </div>
    );
};
