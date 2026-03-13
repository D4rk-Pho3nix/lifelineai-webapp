'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDashboardData } from '@/src/hooks/useDashboardData';
import KPICard from './components/KPICard';
import SessionBarChart from './components/charts/SessionBarChart';
import TierPieChart from './components/charts/TierPieChart';
import PeakHoursHeatmap from './components/charts/PeakHoursHeatmap';
import {
  Users, Activity, AlertTriangle, CheckCircle, Heart, TrendingUp, Clock
} from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useRouter } from 'next/navigation';

function getMoodColor(score: number) {
  if (score < 4) return '#b91c1c';
  if (score <= 6.5) return '#d97706';
  return '#16a34a';
}

export default function AdminDashboard() {
  const {
    kpiData,
    tierDistributionData,
    weeklySessionData,
    peakHoursData,
    counsellorMetrics,
    stressorTrendData,
    severityFunnelData,
    weekOverWeekData,
    isLoading,
  } = useDashboardData();

  const router = useRouter();
  const moodColor = getMoodColor(kpiData.avgMoodScore);
  const totalActiveSessions = tierDistributionData.reduce((sum, d) => sum + d.value, 0);

  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
    academic: true,
    burnout: true,
    isolation: true,
    relationships: true,
    financial: true,
  });

  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  // Calculate colors for counsellor metrics
  const getPrevalenceColor = (percent: number) => {
    if (percent > 40) return '#b91c1c';
    if (percent > 30) return '#d97706';
    return '#04895f';
  };

  const prevalenceColor = getPrevalenceColor(counsellorMetrics?.moderateSeverePercent || 0);

  const getDistressColor = (score: number) => {
    if (score > 7) return '#b91c1c';
    if (score >= 5) return '#d97706';
    return '#16a34a';
  };

  const distressColor = getDistressColor(counsellorMetrics?.avgDistressScore || 0);

  const getQueueColor = (count: number) => {
    if (count > 20) return '#b91c1c';
    if (count > 10) return '#d97706';
    return '#04895f';
  };

  const queueColor = getQueueColor(counsellorMetrics?.counsellorQueueCount || 0);

  // Custom tooltips
  const CustomStressorTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl p-4" style={{ background: '#1a1d24', border: '1px solid #2d3139' }}>
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm" style={{ color: entry.color }}>
              <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
              <span>{entry.name}: {entry.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomDonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = severityFunnelData?.[0]?.value || 1;
      const percent = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="rounded-xl p-3" style={{ background: '#1a1d24', border: '1px solid #2d3139' }}>
          <p className="text-white font-semibold text-sm">{data.name}</p>
          <p style={{ color: data.payload.fill }} className="text-sm">
            {data.value} students ({percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomWeekTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl p-4" style={{ background: '#1a1d24', border: '1px solid #2d3139' }}>
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm" style={{ color: entry.color }}>
              <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
              <span>{entry.name}: {entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const toggleLine = (dataKey: string) => {
    setVisibleLines(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };

  return (
    <div className="space-y-6">
      {/* ROW 1 — Original Dashboard KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard
          label="Total Users"
          value={kpiData.totalUsers}
          numericValue={kpiData.totalUsers}
          icon={<Users size={18} />}
          trend={kpiData.totalUsersChange}
        />
        <KPICard
          label="Active Sessions"
          value={kpiData.activeSessions}
          numericValue={kpiData.activeSessions}
          icon={<Activity size={18} />}
          isLive
        />
        <KPICard
          label="Tier III Alerts"
          value={kpiData.tier3Alerts}
          numericValue={kpiData.tier3Alerts}
          icon={<AlertTriangle size={18} />}
          isTier3Alert={kpiData.tier3Alerts > 0}
        />
        <KPICard
          label="Escalations Resolved"
          value={kpiData.escalationsResolved}
          numericValue={kpiData.escalationsResolved}
          icon={<CheckCircle size={18} />}
          trend="+2"
        />
        <KPICard
          label="Avg Mood Score"
          value={`${kpiData.avgMoodScore}/10`}
          numericValue={kpiData.avgMoodScore * 10}
          icon={<Heart size={18} />}
          trend={kpiData.avgMoodChange}
          valueColor={moodColor}
        />
      </div>

      {/* ROW 2 — Bar + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <SessionBarChart data={weeklySessionData} />
        </div>
        <div className="lg:col-span-2">
          <TierPieChart data={tierDistributionData} totalSessions={totalActiveSessions} />
        </div>
      </div>

      {/* COUNSELLOR HUB SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {/* Subtitle chip */}
        <div className="flex items-center gap-2 mb-6">
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ 
              background: 'rgba(4, 137, 95, 0.1)', 
              border: '1px solid rgba(4, 137, 95, 0.3)',
              color: '#04895f'
            }}
          >
            <span 
              className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" 
              style={{ background: '#04895f' }}
            />
            Campus Mental Health Overview — Real-time
          </div>
        </div>

        {/* Counsellor Hub KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1 - Prevalence Rate */}
          <motion.div
            className="rounded-2xl p-5 transition-all duration-200"
            style={{ 
              background: '#1a1d24', 
              border: `1px solid ${prevalenceColor}40`,
              boxShadow: `0 0 20px ${prevalenceColor}20`
            }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${prevalenceColor}20` }}>
                <TrendingUp size={20} style={{ color: prevalenceColor }} />
              </div>
              <div 
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                style={{ 
                  background: (counsellorMetrics?.weekOverWeekChange || 0) > 0 ? 'rgba(185, 28, 28, 0.1)' : 'rgba(22, 163, 74, 0.1)',
                  color: (counsellorMetrics?.weekOverWeekChange || 0) > 0 ? '#b91c1c' : '#16a34a'
                }}
              >
                {(counsellorMetrics?.weekOverWeekChange || 0) > 0 ? '↑' : '↓'} {Math.abs(counsellorMetrics?.weekOverWeekChange || 0)}%
              </div>
            </div>
            <div className="text-white/60 text-xs font-medium mb-1">Moderate/Severe Prevalence</div>
            <div className="text-white text-2xl font-bold mb-1">{counsellorMetrics?.moderateSeverePercent || 0}%</div>
            <div className="text-white/50 text-xs">{counsellorMetrics?.moderateSevereCount || 0} students</div>
          </motion.div>

          {/* Card 2 - Severe Only */}
          <motion.div
            className="rounded-2xl p-5 transition-all duration-200"
            style={{ 
              background: '#1a1d24', 
              border: (counsellorMetrics?.severeOnlyPercent || 0) > 5 ? '1px solid rgba(185, 28, 28, 0.4)' : '1px solid #2d3139',
              boxShadow: (counsellorMetrics?.severeOnlyPercent || 0) > 5 ? '0 0 16px rgba(185, 28, 28, 0.15)' : 'none'
            }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(185, 28, 28, 0.2)' }}>
                <AlertTriangle size={20} style={{ color: '#b91c1c' }} />
              </div>
            </div>
            <div className="text-white/60 text-xs font-medium mb-1">Severe Symptoms Only</div>
            <div className="text-white text-2xl font-bold mb-1">{counsellorMetrics?.severeOnlyPercent || 0}%</div>
            <div className="text-white/50 text-xs">{counsellorMetrics?.severeOnlyCount || 0} students</div>
          </motion.div>

          {/* Card 3 - Counsellor Queue */}
          <motion.div
            className="rounded-2xl p-5 transition-all duration-200"
            style={{ 
              background: '#1a1d24', 
              border: `1px solid ${queueColor}40`,
              boxShadow: `0 0 20px ${queueColor}20`
            }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${queueColor}20` }}>
                <Clock size={20} style={{ color: queueColor }} />
              </div>
            </div>
            <div className="text-white/60 text-xs font-medium mb-1">Awaiting Counsellor</div>
            <div className="text-white text-2xl font-bold mb-1">{counsellorMetrics?.counsellorQueueCount || 0}</div>
            <div className="text-white/50 text-xs mb-2">Needs appointment assignment</div>
            <button
              onClick={() => router.push('/admin/referrals')}
              className="flex items-center gap-1 text-xs font-medium transition-colors duration-200"
              style={{ color: '#04895f' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#036b4a'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#04895f'}
            >
              View Queue →
            </button>
          </motion.div>

          {/* Card 4 - Campus Distress Score */}
          <motion.div
            className="rounded-2xl p-5 transition-all duration-200"
            style={{ 
              background: '#1a1d24', 
              border: `1px solid ${distressColor}40`,
              boxShadow: `0 0 20px ${distressColor}20`
            }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${distressColor}20` }}>
                <Activity size={20} style={{ color: distressColor }} />
              </div>
            </div>
            <div className="text-white/60 text-xs font-medium mb-1">Avg Campus Distress</div>
            <div className="text-white text-2xl font-bold mb-1">{counsellorMetrics?.avgDistressScore || 0}/10</div>
            <div className="text-white/50 text-xs">
              {(counsellorMetrics?.avgDistressScore || 0) < 5 ? 'Low distress' : (counsellorMetrics?.avgDistressScore || 0) <= 7 ? 'Moderate distress' : 'High distress'}
            </div>
          </motion.div>
        </div>

        {/* Trending Stressors (LEFT) + User Outreach Heatmap (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* LEFT - Trending Stressors Multi-Line Chart */}
          <motion.div
            className="rounded-2xl p-6 flex flex-col"
            style={{ background: '#1a1d24', border: '1px solid #2d3139' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h3 className="text-white font-bold text-lg mb-4">Trending Stressors — Week Over Week</h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={stressorTrendData || []} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3139" />
                  <XAxis dataKey="week" stroke="#9ca3af" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
                  <Tooltip content={<CustomStressorTooltip />} />
                  {visibleLines.academic && (
                    <Line 
                      type="monotone" 
                      dataKey="academic" 
                      stroke="#b91c1c" 
                      strokeWidth={2} 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 5 }}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                  )}
                  {visibleLines.burnout && (
                    <Line 
                      type="monotone" 
                      dataKey="burnout" 
                      stroke="#d97706" 
                      strokeWidth={2} 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 5 }}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                  )}
                  {visibleLines.isolation && (
                    <Line 
                      type="monotone" 
                      dataKey="isolation" 
                      stroke="#7c3aed" 
                      strokeWidth={2} 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 5 }}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                  )}
                  {visibleLines.relationships && (
                    <Line 
                      type="monotone" 
                      dataKey="relationships" 
                      stroke="#0284c7" 
                      strokeWidth={2} 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 5 }}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                  )}
                  {visibleLines.financial && (
                    <Line 
                      type="monotone" 
                      dataKey="financial" 
                      stroke="#ea580c" 
                      strokeWidth={2} 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 5 }}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend with toggle */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { key: 'academic', label: 'Academic', color: '#b91c1c' },
                { key: 'burnout', label: 'Burnout', color: '#d97706' },
                { key: 'isolation', label: 'Isolation', color: '#7c3aed' },
                { key: 'relationships', label: 'Relations', color: '#0284c7' },
                { key: 'financial', label: 'Financial', color: '#ea580c' },
              ].map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => toggleLine(key)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    background: visibleLines[key] ? `${color}20` : '#232530',
                    border: `1px solid ${visibleLines[key] ? color : '#2d3139'}`,
                    color: visibleLines[key] ? color : '#9ca3af',
                    opacity: visibleLines[key] ? 1 : 0.5,
                  }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* RIGHT - User Outreach Heatmap */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <PeakHoursHeatmap data={peakHoursData} />
          </motion.div>
        </div>

        {/* Severity Distribution + Week-over-Week */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          {/* LEFT - Severity Breakdown Donut */}
          <motion.div
            className="lg:col-span-2 rounded-2xl p-6"
            style={{ background: '#1a1d24', border: '1px solid #2d3139' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <h3 className="text-white font-bold text-lg mb-4">Current Severity Distribution</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={(severityFunnelData || []).slice(1)}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {(severityFunnelData || []).slice(1).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomDonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center label */}
            <div className="text-center -mt-36 pointer-events-none">
              <div className="text-white text-3xl font-bold">{severityFunnelData?.[0]?.value || 0}</div>
              <div className="text-white/60 text-xs">Screened</div>
            </div>

            {/* Legend */}
            <div className="mt-20 space-y-2">
              {(severityFunnelData || []).slice(1).map((item, index) => {
                const percent = ((item.value / (severityFunnelData?.[0]?.value || 1)) * 100).toFixed(1);
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ background: item.color }} />
                      <span className="text-white/80 text-xs">{item.label}</span>
                    </div>
                    <span className="text-white/60 text-xs">{item.value} ({percent}%)</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* RIGHT - Week-over-Week Change Chart */}
          <motion.div
            className="lg:col-span-3 rounded-2xl p-6"
            style={{ background: '#1a1d24', border: '1px solid #2d3139' }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <h3 className="text-white font-bold text-lg mb-4">Moderate & Severe Cases — Week-over-Week</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart 
                data={weekOverWeekData || []}
                onClick={(data) => {
                  if (data && data.activeLabel) {
                    setSelectedWeek(data.activeLabel);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3139" />
                <XAxis dataKey="week" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomWeekTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="square"
                />
                <ReferenceLine 
                  y={25} 
                  stroke="#04895f" 
                  strokeDasharray="5 5" 
                  label={{ value: 'Campus Average', position: 'right', fill: '#04895f', fontSize: 11 }}
                />
                <Bar 
                  dataKey="moderate" 
                  fill="#d97706" 
                  opacity={0.8} 
                  name="Moderate Cases"
                  animationDuration={900}
                  animationEasing="ease-out"
                />
                <Bar 
                  dataKey="severe" 
                  fill="#b91c1c" 
                  opacity={0.8} 
                  name="Severe Cases"
                  animationDuration={900}
                  animationEasing="ease-out"
                />
                <Line 
                  type="monotone" 
                  dataKey={(data: any) => data.moderate + data.severe} 
                  stroke="#04895f" 
                  strokeWidth={2} 
                  name="Total Distress Trend"
                  dot={{ r: 4 }}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
