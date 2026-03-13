'use client';

import { crisisLiveFeedData, kpiData } from '@/src/data/mockData';
import CrisisLiveFeed from '../components/CrisisLiveFeed';
import { AlertTriangle, Clock, Phone, MicVocal } from 'lucide-react';

export default function CrisisAlertsPage() {
  const active = crisisLiveFeedData.filter(r => r.status === 'Active').length;
  return (
    <div className="space-y-6">
      {/* Hero alert */}
      <div className="rounded-2xl p-6 animate-tier3-pulse" style={{ background: '#1a1d24', border: '2px solid #b91c1c', boxShadow: '0 0 24px rgba(185,28,28,0.15)' }}>
        <div className="flex items-center gap-3">
          <AlertTriangle size={28} style={{ color: '#b91c1c' }} className="animate-pulse" />
          <div>
            <div className="text-white text-xl font-bold">{kpiData.tier3Alerts} Active Tier III Alerts</div>
            <div className="text-sm" style={{ color: '#9ca3af' }}>Immediate attention required — critical distress signals detected</div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <AlertTriangle size={20} />, label: 'Total Escalations Today', value: crisisLiveFeedData.length, color: '#b91c1c' },
          { icon: <Clock size={20} />, label: 'Avg Resolution Time', value: '18 min', color: '#d97706' },
          { icon: <Phone size={20} />, label: 'Hotline Connections', value: 7, color: '#04895f' },
          { icon: <MicVocal size={20} />, label: 'Voice Calls Made', value: 3, color: '#04895f' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-4" style={{ background: '#1a1d24', border: '1px solid #2d3139' }}>
            <div style={{ color: stat.color }}>{stat.icon}</div>
            <div className="text-2xl font-bold text-white mt-2">{stat.value}</div>
            <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        {['All', 'Tier III', 'Tier II', 'Active', 'Pending', 'Resolved'].map(f => (
          <button key={f} className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150"
            style={{ background: f === 'All' ? '#04895f' : '#232530', color: f === 'All' ? '#fff' : '#9ca3af', border: '1px solid #2d3139' }}>
            {f}
          </button>
        ))}
      </div>

      <CrisisLiveFeed data={crisisLiveFeedData} />
    </div>
  );
}
