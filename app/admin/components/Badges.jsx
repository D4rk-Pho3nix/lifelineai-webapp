'use client';

const TIER_STYLES = {
  1: { bg: '#052e16', color: '#16a34a', label: 'Tier I' },
  2: { bg: '#431407', color: '#d97706', label: 'Tier II' },
  3: { bg: '#450a0a', color: '#b91c1c', label: 'Tier III' },
};

export function TierBadge({ tier }) {
  const style = TIER_STYLES[tier] || TIER_STYLES[1];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
}

const STATUS_STYLES = {
  Active:   { bg: 'rgba(185,28,28,0.15)',  color: '#b91c1c', pulse: true },
  Pending:  { bg: 'rgba(217,119,6,0.15)', color: '#d97706', pulse: false },
  Resolved: { bg: 'rgba(22,163,74,0.15)',  color: '#16a34a', pulse: false },
  'In Progress': { bg: 'rgba(217,119,6,0.15)', color: '#d97706', pulse: false },
};

export function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES['Pending'];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${style.pulse ? 'animate-pulse' : ''}`}
      style={{ background: style.bg, color: style.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.color }} />
      {status}
    </span>
  );
}
