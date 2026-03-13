'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, Clock, Activity, ChevronRight } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useRouter } from 'next/navigation';
import TopBar from '../components/TopBar';
import { useDashboardData } from '@/src/hooks/useDashboardData';

export default function CounsellorDashboard() {
  const router = useRouter();
  const {
    counsellorMetrics,
    stressorTrendData,
    severityFunnelData,
    weekOverWeekData,
    isLoading,
    error
  } = useDashboardData();

  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
    academic: true,
    burnout: true,
    isolation: true,
    relationships: true,
    financial: true,
  });

  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: '#0f1117' }}>
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: '#0f1117' }}>
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  // Calculate color for prevalence rate
  const getPrevalenceColor = (percent: number) => {
    if (percent > 40) return '#b91c1c';
    if (percent > 30) return '#d97706';
    return '#04895f';
  };

  const prevalenceColor = getPrevalenceColor(counsellorMetrics?.moderateSeverePercent || 0);

  // Calculate color for distress score
  const getDistressColor = (score: number) => {
    if (score > 7) return '#b91c1c';
    if (score >= 5) return '#d97706';
    return '#16a34a';
  };

  const distressColor = getDistressColor(counsellorMetrics?.avgDistressScore || 0);

  // Calculate color for queue count
  const getQueueColor = (count: number) => {
    if (count > 20) return '#b91c1c';
    if (count > 10) return '#d97706';
    return '#04895f';
  };

  const queueColor = getQueueColor(counsellorMetrics?.counsellorQueueCount || 0);

  // Custom tooltip for stressor trend chart
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

  // Custom tooltip for severity donut
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

  // Custom tooltip for week-over-week chart
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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title="Counsellor Hub" />
      <main className="flex-1 overflow-y-auto pt-16 px-6 py-6" style={{ background: '#0f1117' }}>
        <motion.div
          className="max-w-7xl mx-auto"
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

          {/* SECTION A: KPI CARDS ROW */}
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
                  <AlertCircle size={20} style={{ color: '#b91c1c' }} />
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
                View Queue <ChevronRight size={14} />
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

          {/* SECTION B: TWO PANELS (60/40 split) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
            {/* LEFT - Trending Stressors Multi-Line Chart */}
            <motion.div
              className="lg:col-span-3 rounded-2xl p-6"
              style={{ background: '#1a1d24', border: '1px solid #2d3139' }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <h3 className="text-white font-bold text-lg mb-4">Trending Stressors — Week Over Week</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stressorTrendData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3139" />
                  <XAxis dataKey="week" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomStressorTooltip />} />
                  {visibleLines.academic && (
                    <Line 
                      type="monotone" 
                      dataKey="academic" 
                      stroke="#b91c1c" 
                      strokeWidth={2} 
                      dot={{ r: 4 }} 
                      activeDot={{ r: 6 }}
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
                      dot={{ r: 4 }} 
                      activeDot={{ r: 6 }}
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
                      dot={{ r: 4 }} 
                      activeDot={{ r: 6 }}
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
                      dot={{ r: 4 }} 
                      activeDot={{ r: 6 }}
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
                      dot={{ r: 4 }} 
                      activeDot={{ r: 6 }}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
              
              {/* Custom Legend with toggle */}
              <div className="flex flex-wrap gap-3 mt-4">
                {[
                  { key: 'academic', label: 'Academic Pressure', color: '#b91c1c' },
                  { key: 'burnout', label: 'Burnout', color: '#d97706' },
                  { key: 'isolation', label: 'Isolation', color: '#7c3aed' },
                  { key: 'relationships', label: 'Relationships', color: '#0284c7' },
                  { key: 'financial', label: 'Financial', color: '#ea580c' },
                ].map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => toggleLine(key)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
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

            {/* RIGHT - Severity Breakdown Donut */}
            <motion.div
              className="lg:col-span-2 rounded-2xl p-6"
              style={{ background: '#1a1d24', border: '1px solid #2d3139' }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <h3 className="text-white font-bold text-lg mb-4">Current Severity Distribution</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={(severityFunnelData || []).slice(1)} // Skip the total
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
          </div>

          {/* SECTION C: FULL WIDTH — Week-over-Week Change Chart */}
          <motion.div
            className="rounded-2xl p-6"
            style={{ background: '#1a1d24', border: '1px solid #2d3139' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
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

          {/* Week Detail Drawer */}
          {selectedWeek && (
            <motion.div
              className="fixed right-0 top-16 bottom-0 w-96 p-6 overflow-y-auto z-40"
              style={{ background: '#1a1d24', borderLeft: '1px solid #2d3139' }}
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">{selectedWeek} Summary</h3>
                <button
                  onClick={() => setSelectedWeek(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl p-4" style={{ background: '#232530', border: '1px solid #2d3139' }}>
                  <div className="text-white/60 text-xs mb-1">Highest Stressor</div>
                  <div className="text-white font-semibold">Academic Pressure</div>
                  <div className="text-white/50 text-xs mt-1">48% prevalence</div>
                </div>
                <div className="rounded-xl p-4" style={{ background: '#232530', border: '1px solid #2d3139' }}>
                  <div className="text-white/60 text-xs mb-1">Change from Prior Week</div>
                  <div className="text-red-400 font-semibold">+12.5%</div>
                  <div className="text-white/50 text-xs mt-1">Increase in moderate cases</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Overlay for drawer */}
          {selectedWeek && (
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWeek(null)}
            />
          )}
        </motion.div>
      </main>
    </div>
  );
}
