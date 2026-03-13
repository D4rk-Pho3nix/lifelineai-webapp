'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CustomTooltip = ({ active, payload, total }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl p-3 text-xs" style={{ background: '#1a1d24', border: '1px solid #2d3139', minWidth: 160 }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
        <span className="font-semibold text-white">{d.name}</span>
      </div>
      <div className="flex gap-4 text-xs" style={{ color: '#9ca3af' }}>
        <span>{d.value}%</span>
        <span>{Math.round(d.value / 100 * (total || 100))} sessions</span>
      </div>
    </div>
  );
};

export default function TierPieChart({ data, totalSessions }) {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <div className="rounded-2xl p-5 h-full" style={{ background: '#1a1d24', border: '1px solid #2d3139', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
      <h3 className="text-white font-semibold text-[15px] mb-1">Live Tier Distribution</h3>
      <div className="flex items-center gap-1.5 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[11px]" style={{ color: '#9ca3af' }}>Live data</span>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={activeIndex !== null ? 95 : 90}
              dataKey="value"
              isAnimationActive
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-in-out"
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip total={totalSessions} />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">{totalSessions}</span>
            <span className="text-[11px]" style={{ color: '#9ca3af' }}>Sessions</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 mt-3">
        {data.map(d => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
              <span className="text-[12px]" style={{ color: '#9ca3af' }}>{d.name}</span>
            </div>
            <span className="text-[12px] font-semibold text-white">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
