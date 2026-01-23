import { useState } from 'react';

export function PartnerRevenueSimulator() {
    const [certifiedOperators, setCertifiedOperators] = useState(5);
    const [clientsPerOperator, setClientsPerOperator] = useState(10);

    const roadmapRevenuePerClient = 5000;
    const saasRevenuePerClient = 459 * 12; // Annual SaaS, includes TrustConsole

    const totalClients = certifiedOperators * clientsPerOperator;
    const totalRoadmapRevenue = totalClients * roadmapRevenuePerClient;
    const totalSaaSRevenue = totalClients * saasRevenuePerClient;

    const totalGrossRevenue = totalRoadmapRevenue + totalSaaSRevenue;
    const partnerTake = totalGrossRevenue * 0.5;
    const strategicAITake = totalGrossRevenue * 0.5;

    return (
        <div className="w-full max-w-3xl mx-auto rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 bg-slate-950/50">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Partner Revenue Simulator
                </h2>
                <p className="text-sm text-slate-400 mt-1">Estimate your recurring returns with the Authority Model.</p>
            </div>

            <div className="p-8 grid gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-300">
                            Certified Operators in Your Network
                            <span className="block text-xs text-slate-500 font-normal mt-1">
                                How many consultants/agencies will you certify?
                            </span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={certifiedOperators}
                            onChange={(e) => setCertifiedOperators(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-lg"
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-300">
                            Clients per Operator
                            <span className="block text-xs text-slate-500 font-normal mt-1">
                                Average deployments per operator?
                            </span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={clientsPerOperator}
                            onChange={(e) => setClientsPerOperator(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-lg"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-6 bg-slate-950/80 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                        <span className="text-slate-400">Total Active Clients</span>
                        <span className="text-slate-100 font-mono font-bold text-lg">{totalClients.toLocaleString()}</span>
                    </div>

                    <div className="space-y-2 py-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Gross Roadmap Rev (One-Time)</span>
                            <span className="text-slate-400 font-mono">${totalRoadmapRevenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Gross SaaS Rev (Annual Recurring)</span>
                            <span className="text-slate-400 font-mono">${totalSaaSRevenue.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex justify-between items-end">
                        <div>
                            <div className="text-sm font-medium text-blue-400 mb-1">Your Partner Share (50%)</div>
                            <div className="text-3xl font-bold text-white font-mono tracking-tight">
                                ${partnerTake.toLocaleString()}
                                <span className="text-sm text-slate-500 font-normal ml-2 relative -top-1">/ year</span>
                            </div>
                        </div>
                        <div className="text-xs text-slate-600">
                            StrategicAI Take: ${strategicAITake.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
