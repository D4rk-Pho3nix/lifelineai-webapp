'use client';

import { useState } from 'react';

const HOURS = [0, 3, 6, 9, 12, 15, 18, 21];
const HOUR_LABELS = ['12AM', '3AM', '6AM', '9AM', '12PM', '3PM', '6PM', '9PM'];

function getCellColor(value) {
  if (value === 0)   return '#1a1d24';
  if (value <= 5)    return '#1e2d27';
  if (value <= 12)   return 'rgba(4,137,95,0.2)';
  if (value <= 25)   return 'rgba(4,137,95,0.5)';
  if (value <= 38)   return '#04895f';
  return '#16a34a';
}

function formatHour(h) {
  if (h === 0) return '12:00 AM';
  if (h < 12)  return `${h}:00 AM`;
  if (h === 12) return '12:00 PM';
  return `${h - 12}:00 PM`;
}

export default function PeakHoursHeatmap({ data }) {
  const [tooltip, setTooltip] = useState(null);

  return (
    <div className="rounded-2xl p-6 h-full flex flex-col" style={{ background: '#1a1d24', border: '1px solid #2d3139' }}>
      <h3 className="text-white font-bold text-lg mb-4">User Outreach Heatmap (by Hour)</h3>

      <div className="flex-1 flex flex-col justify-between">
        {/* Hour labels */}
        <div className="flex mb-1 ml-9">
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="flex-1 text-center text-[9px]"
              style={{ color: HOURS.includes(h) ? '#9ca3af' : 'transparent', minWidth: 12 }}
            >
              {HOURS.includes(h) ? HOUR_LABELS[HOURS.indexOf(h)] : '·'}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 flex flex-col justify-evenly">
          {data.map((row) => (
            <div key={row.day} className="flex items-center">
              <div className="w-8 text-[11px] flex-shrink-0 text-right pr-2" style={{ color: '#9ca3af' }}>
                {row.day}
              </div>
              {row.hours.map((val, hi) => (
                <div
                  key={hi}
                  className="flex-1 h-5 mx-px rounded-sm cursor-pointer"
                  style={{ background: getCellColor(val), minWidth: 10, transition: 'transform 0.1s' }}
                  onMouseEnter={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({
                      x: rect.left + rect.width / 2,
                      y: rect.top - 8,
                      text: `${row.day} ${formatHour(hi)} — ${val} sessions`,
                    });
                    e.currentTarget.style.transform = 'scale(1.3)';
                  }}
                  onMouseLeave={e => {
                    setTooltip(null);
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Color legend */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[11px]" style={{ color: '#9ca3af' }}>Low</span>
          {['#1e2d27', 'rgba(4,137,95,0.2)', 'rgba(4,137,95,0.5)', '#04895f', '#16a34a'].map((c, i) => (
            <div key={i} className="w-5 h-3 rounded-sm" style={{ background: c }} />
          ))}
          <span className="text-[11px]" style={{ color: '#9ca3af' }}>Peak</span>
        </div>

        <p className="text-[11px] mt-2" style={{ color: '#9ca3af' }}>
          📍 Peak activity: <span className="text-white font-medium">10 PM – 2 AM</span>
        </p>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-1.5 rounded-lg text-xs text-white pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            background: '#1a1d24',
            border: '1px solid #2d3139',
            whiteSpace: 'nowrap',
            animation: 'tooltip-fade 0.15s ease-out forwards',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
