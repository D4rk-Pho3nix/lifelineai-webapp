'use client';

import { feedbackData } from '@/src/data/mockData';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { TierBadge } from '../components/Badges';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-xs" style={{ background: '#1a1d24', border: '1px solid #2d3139' }}>
      <div className="text-white font-semibold mb-1">{label}</div>
      <div style={{ color: '#04895f' }}>{payload[0].value}% satisfaction</div>
    </div>
  );
};

export default function FeedbackPage() {
  const d = feedbackData;
  return (
    <div className="space-y-6">
      {/* Satisfaction trend + Radar side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Satisfaction line chart */}
        <div className="rounded-2xl p-5" style={{ background: '#1a1d24', border: '1px solid #2d3139', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
          <h3 className="text-white font-semibold text-[15px] mb-4">Satisfaction Score Trend</h3>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={d.satisfactionTrend} margin={{ top: 8, right: 24, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3139" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[65, 90]} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <ReferenceLine y={80} stroke="#9ca3af" strokeDasharray="4 4"
                label={{ value: 'Target 80%', position: 'right', fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#04895f', strokeWidth: 1 }} />
              <Line
                type="monotone" dataKey="score" stroke="#04895f" strokeWidth={2}
                dot={{ fill: '#04895f', r: 4 }} activeDot={{ r: 6 }}
                isAnimationActive animationDuration={1200}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Radar chart */}
        <div className="rounded-2xl p-5" style={{ background: '#1a1d24', border: '1px solid #2d3139', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
          <h3 className="text-white font-semibold text-[15px] mb-4">AI Response Quality Radar</h3>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={d.radarData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
              <PolarGrid stroke="#2d3139" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[60, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <Radar
                name="Score" dataKey="score"
                stroke="#04895f" fill="#04895f" fillOpacity={0.35}
                isAnimationActive animationDuration={1000}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Verbatim feedback */}
      <div className="rounded-2xl p-5" style={{ background: '#1a1d24', border: '1px solid #2d3139', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
        <h3 className="text-white font-semibold text-[15px] mb-4">Anonymized User Feedback</h3>
        <div className="space-y-3">
          {d.verbatim.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: '#232530', border: '1px solid #2d3139' }}>
              <TierBadge tier={item.tier as 1|2|3} />
              <div className="flex-1">
                <div className="text-white text-[13px]">{item.text}</div>
                <div className="text-[11px] mt-1" style={{ color: '#9ca3af' }}>{item.id} · {item.ts}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
