'use client';

import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const score = payload[0]?.value;
  return (
    <div className="rounded-xl p-3 text-xs" style={{ background: '#1a1d24', border: '1px solid #2d3139', minWidth: 140 }}>
      <div className="text-xs mb-1" style={{ color: '#9ca3af' }}>{label}</div>
      <div className="text-white font-bold text-base">
        {score?.toFixed(1)}<span className="text-xs font-normal ml-1" style={{ color: '#9ca3af' }}>/10</span>
      </div>
    </div>
  );
};

const RedDot = (props) => {
  const { cx, cy, value } = props;
  if (value < 5.0) {
    return <circle cx={cx} cy={cy} r={5} fill="#b91c1c" stroke="#450a0a" strokeWidth={2} />;
  }
  return null;
};

export default function MoodAreaChart({ data }) {
  const [range, setRange] = useState('30d');
  const activeData = data[range] || [];

  return (
    <div className="rounded-2xl p-5 h-full" style={{ background: '#1a1d24', border: '1px solid #2d3139', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-[15px]">Population Emotional Well-Being</h3>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#232530', border: '1px solid #2d3139' }}>
          {['30d', '60d', '90d'].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-3 py-1 rounded-lg text-[12px] font-medium transition-all duration-150"
              style={{ background: range === r ? '#04895f' : 'transparent', color: range === r ? '#ffffff' : '#9ca3af' }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={range}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={activeData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#04895f" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#04895f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3139" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[4, 8]} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <ReferenceLine
                y={6.0} stroke="#9ca3af" strokeDasharray="4 4"
                label={{ value: 'Target', position: 'right', fill: '#9ca3af', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#04895f', strokeWidth: 1 }} />
              <Area
                type="monotone" dataKey="score"
                stroke="#04895f" strokeWidth={2} fill="url(#moodGrad)"
                dot={<RedDot />}
                activeDot={{ r: 5, fill: '#04895f', stroke: '#1a1d24', strokeWidth: 2 }}
                isAnimationActive animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
