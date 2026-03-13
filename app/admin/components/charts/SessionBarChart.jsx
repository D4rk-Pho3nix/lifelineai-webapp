'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-xl p-3 text-xs" style={{ background: '#1a1d24', border: '1px solid #2d3139', minWidth: 140 }}>
      <div className="font-semibold text-white mb-2">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4 mb-1">
          <span style={{ color: p.fill }}>{p.name}</span>
          <span className="font-medium text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = () => (
  <div className="flex justify-center gap-5 mt-3">
    {[
      { label: 'Tier I — Stable',    color: '#16a34a' },
      { label: 'Tier II — Moderate', color: '#d97706' },
      { label: 'Tier III — Critical',color: '#b91c1c' },
    ].map(({ label, color }) => (
      <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: '#9ca3af' }}>
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
        {label}
      </div>
    ))}
  </div>
);

export default function SessionBarChart({ data }) {
  return (
    <div className="rounded-2xl p-5 h-full" style={{ background: '#1a1d24', border: '1px solid #2d3139', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-[15px]">Session Volume by Tier</h3>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3139" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="tier1" name="Tier I"   stackId="a" fill="#16a34a" radius={[0,0,0,0]}
            isAnimationActive animationDuration={800} animationBegin={200} animationEasing="ease-out" />
          <Bar dataKey="tier2" name="Tier II"  stackId="a" fill="#d97706" radius={[0,0,0,0]}
            isAnimationActive animationDuration={800} animationBegin={200} animationEasing="ease-out" />
          <Bar dataKey="tier3" name="Tier III" stackId="a" fill="#b91c1c" radius={[4,4,0,0]}
            isAnimationActive animationDuration={800} animationBegin={200} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
      <CustomLegend />
    </div>
  );
}
