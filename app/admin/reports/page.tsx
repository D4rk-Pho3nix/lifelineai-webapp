'use client';

import { useState } from 'react';
import { kpiData, tierDistributionData, moodTrendData } from '@/src/data/mockData';
import { FileText, Download, Loader2, Calendar } from 'lucide-react';

const PAST_REPORTS = [
  { name: 'Mar W1 — Weekly Summary', date: '2026-03-07', size: '2.4 MB' },
  { name: 'Feb Monthly Report',      date: '2026-03-01', size: '5.1 MB' },
  { name: 'Feb W4 — Weekly Summary', date: '2026-02-28', size: '2.6 MB' },
  { name: 'Feb W3 — Weekly Summary', date: '2026-02-21', size: '2.2 MB' },
];

const SDG_METRICS = [
  { sdg: 'SDG 3', label: 'Good Health & Well-Being', align: 'High', color: '#16a34a' },
  { sdg: 'SDG 5', label: 'Gender Equality',           align: 'Medium', color: '#d97706' },
  { sdg: 'SDG 10', label: 'Reduced Inequalities',    align: 'High', color: '#16a34a' },
  { sdg: 'SDG 16', label: 'Peace, Justice',          align: 'Medium', color: '#d97706' },
  { sdg: 'SDG 17', label: 'Partnerships for Goals',  align: 'High', color: '#16a34a' },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#232530', border: '1px solid #2d3139' }}>
          {(['weekly', 'monthly'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-4 py-2 rounded-lg text-[12px] font-medium capitalize transition-all duration-150"
              style={{ background: period === p ? '#04895f' : 'transparent', color: period === p ? '#fff' : '#9ca3af' }}>
              {p}
            </button>
          ))}
        </div>
        <button onClick={handleGenerate} disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 disabled:opacity-60"
          style={{ background: '#04895f', color: '#fff' }}>
          {generating ? (
            <><Loader2 size={15} className="animate-spin" /> Generating…</>
          ) : (
            <><FileText size={15} /> Generate PDF Report</>
          )}
        </button>
      </div>

      {/* Preview card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: '#1a1d24', border: '1px solid #2d3139', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
          <h3 className="text-white font-semibold text-[15px] mb-4">Report Preview</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Users',          value: kpiData.totalUsers },
              { label: 'Active Sessions',       value: kpiData.activeSessions },
              { label: 'Tier III Alerts',        value: kpiData.tier3Alerts },
              { label: 'Escalations Resolved',  value: kpiData.escalationsResolved },
              { label: 'Avg Mood Score',         value: `${kpiData.avgMoodScore}/10` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #2d3139' }}>
                <span className="text-sm" style={{ color: '#9ca3af' }}>{label}</span>
                <span className="text-sm font-semibold text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SDG alignment */}
        <div className="rounded-2xl p-5" style={{ background: '#1a1d24', border: '1px solid #2d3139', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
          <h3 className="text-white font-semibold text-[15px] mb-4">SDG Alignment</h3>
          <div className="space-y-3">
            {SDG_METRICS.map(s => (
              <div key={s.sdg} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: `${s.color}20`, color: s.color }}>{s.sdg}</span>
                  <span className="text-[13px] text-white">{s.label}</span>
                </div>
                <span className="text-[11px] font-medium" style={{ color: s.color }}>{s.align}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Past reports */}
      <div className="rounded-2xl" style={{ background: '#1a1d24', border: '1px solid #2d3139', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #2d3139' }}>
          <h3 className="text-white font-semibold text-[15px]">Recent Reports</h3>
        </div>
        <div className="divide-y" style={{ borderColor: '#2d3139' }}>
          {PAST_REPORTS.map(r => (
            <div key={r.name} className="flex items-center justify-between px-5 py-4 transition-colors duration-150"
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#232530'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <div className="flex items-center gap-3">
                <FileText size={16} style={{ color: '#04895f' }} />
                <div>
                  <div className="text-white text-[13px] font-medium">{r.name}</div>
                  <div className="text-[11px]" style={{ color: '#9ca3af' }}>{r.date} · {r.size}</div>
                </div>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] transition-all duration-150"
                style={{ background: '#232530', color: '#9ca3af', border: '1px solid #2d3139' }}>
                <Download size={12} /> Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
