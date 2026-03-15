/**
 * ROI Strip Component
 * EXEC-TICKET-ROI-01
 *
 * Four KPI cards rendered at the top of the Executive Console Overview.
 * Responsive: grid-cols-4 desktop / grid-cols-2 tablet / grid-cols-1 mobile.
 */

export interface RoiStripProps {
  revenueUnlock: string;
  hoursRecovered: string;
  throughputLift: string;
  speedToValue: string;
}

interface KpiCard {
  label: string;
  value: string;
  sub: string;
  accent: string;         // Tailwind color token (without the 'text-' prefix)
  dotColor: string;       // Full Tailwind class for the glow dot
  borderColor: string;    // Full Tailwind class for card border
  bgColor: string;        // Full Tailwind class for card bg
}

export default function RoiStrip({ revenueUnlock, hoursRecovered, throughputLift, speedToValue }: RoiStripProps) {
  const cards: KpiCard[] = [
    {
      label:       'Revenue Unlock',
      value:       revenueUnlock,
      sub:         'Annual opportunity',
      accent:      'emerald',
      dotColor:    'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]',
      borderColor: 'border-emerald-500/20',
      bgColor:     'bg-emerald-950/10',
    },
    {
      label:       'Hours Recovered',
      value:       hoursRecovered,
      sub:         'Operational capacity freed',
      accent:      'indigo',
      dotColor:    'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.7)]',
      borderColor: 'border-indigo-500/20',
      bgColor:     'bg-indigo-950/10',
    },
    {
      label:       'Throughput Increase',
      value:       throughputLift,
      sub:         'Production capacity lift',
      accent:      'amber',
      dotColor:    'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.7)]',
      borderColor: 'border-amber-500/20',
      bgColor:     'bg-amber-950/10',
    },
    {
      label:       'Speed to Value',
      value:       speedToValue,
      sub:         'Time to measurable impact',
      accent:      'violet',
      dotColor:    'bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.7)]',
      borderColor: 'border-violet-500/20',
      bgColor:     'bg-violet-950/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, sub, accent, dotColor, borderColor, bgColor }) => (
        <div
          key={label}
          className={`p-5 border rounded-2xl ${bgColor} ${borderColor} flex flex-col gap-3 group transition-all hover:scale-[1.01]`}
        >
          {/* Label row */}
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] text-${accent}-400/80`}>
              {label}
            </span>
          </div>

          {/* Primary value */}
          <div className={`text-xl font-black leading-tight text-${accent}-300`}>
            {value}
          </div>

          {/* Sub-label */}
          <div className="text-[10px] text-slate-500 leading-snug">
            {sub}
          </div>
        </div>
      ))}
    </div>
  );
}
