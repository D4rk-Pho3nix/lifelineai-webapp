'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Send, Calendar, User, AlertTriangle, Search, Filter } from 'lucide-react';
import TopBar from '../components/TopBar';
import { useDashboardData } from '@/src/hooks/useDashboardData';
import { AppointmentModal } from '@/components/appointment-modal';

type StatusType = 'Pending' | 'Sent' | 'Accepted' | 'Declined';
type TierType = 2 | 3;

export default function WarmReferralPage() {
  const {
    warmReferralQueue,
    referralStats,
    isLoading,
    error,
    sendReferral,
    updateReferralStatus,
    reassignCounsellor,
  } = useDashboardData();
  
  const [selectedStatus, setSelectedStatus] = useState<StatusType | 'All'>('All');
  const [selectedTier, setSelectedTier] = useState<TierType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);

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

  // Filter logic
  const filteredQueue = (warmReferralQueue || []).filter((item) => {
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    const matchesTier = selectedTier === 'All' || item.tier === selectedTier;
    const matchesSearch = 
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.stressor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.counsellor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesTier && matchesSearch;
  });

  // Status badge helper
  const getStatusBadge = (status: StatusType) => {
    const configs = {
      Pending: { bg: 'rgba(217, 119, 6, 0.1)', border: 'rgba(217, 119, 6, 0.3)', color: '#d97706', icon: Clock },
      Sent: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', color: '#3b82f6', icon: Send },
      Accepted: { bg: 'rgba(22, 163, 74, 0.1)', border: 'rgba(22, 163, 74, 0.3)', color: '#16a34a', icon: CheckCircle },
      Declined: { bg: 'rgba(185, 28, 28, 0.1)', border: 'rgba(185, 28, 28, 0.3)', color: '#b91c1c', icon: XCircle },
    };
    const config = configs[status];
    const Icon = config.icon;
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
        style={{ background: config.bg, border: `1px solid ${config.border}`, color: config.color }}
      >
        <Icon size={12} />
        {status}
      </div>
    );
  };

  // Tier badge helper
  const getTierBadge = (tier: TierType) => {
    const config = tier === 3
      ? { bg: 'rgba(185, 28, 28, 0.1)', border: 'rgba(185, 28, 28, 0.3)', color: '#b91c1c', label: 'Tier III' }
      : { bg: 'rgba(217, 119, 6, 0.1)', border: 'rgba(217, 119, 6, 0.3)', color: '#d97706', label: 'Tier II' };
    return (
      <div
        className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
        style={{ background: config.bg, border: `1px solid ${config.border}`, color: config.color }}
      >
        {config.label}
      </div>
    );
  };

  // Action button handler
  const handleSendReferral = async (referral: any) => {
    setSelectedReferral(referral);
    setAppointmentModalOpen(true);
    if (referral.referralId) {
      await sendReferral(referral.referralId);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title="Warm Referral Workflow" />
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
                background: 'rgba(217, 119, 6, 0.1)', 
                border: '1px solid rgba(217, 119, 6, 0.3)',
                color: '#d97706'
              }}
            >
              <span 
                className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" 
                style={{ background: '#d97706' }}
              />
              Students Scoring Moderate or Above — Awaiting Action
            </div>
          </div>

          {/* SECTION A: STATS CARDS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card 1 - Total Pending */}
            <motion.div
              className="rounded-2xl p-5 transition-all duration-200"
              style={{ 
                background: '#1a1d24', 
                border: '1px solid rgba(217, 119, 6, 0.4)',
                boxShadow: '0 0 16px rgba(217, 119, 6, 0.15)'
              }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(217, 119, 6, 0.2)' }}>
                  <Clock size={20} style={{ color: '#d97706' }} />
                </div>
              </div>
              <div className="text-white/60 text-xs font-medium mb-1">Total Pending</div>
              <div className="text-white text-2xl font-bold mb-1">{referralStats?.totalPending || 0}</div>
              <div className="text-white/50 text-xs">Awaiting counsellor assignment</div>
            </motion.div>

            {/* Card 2 - Sent Today */}
            <motion.div
              className="rounded-2xl p-5 transition-all duration-200"
              style={{ 
                background: '#1a1d24', 
                border: '1px solid #2d3139'
              }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                  <Send size={20} style={{ color: '#3b82f6' }} />
                </div>
              </div>
              <div className="text-white/60 text-xs font-medium mb-1">Sent Today</div>
              <div className="text-white text-2xl font-bold mb-1">{referralStats?.sentToday || 0}</div>
              <div className="text-white/50 text-xs">Referrals dispatched</div>
            </motion.div>

            {/* Card 3 - Acceptance Rate */}
            <motion.div
              className="rounded-2xl p-5 transition-all duration-200"
              style={{ 
                background: '#1a1d24', 
                border: (referralStats?.acceptanceRate || 0) >= 70 ? '1px solid rgba(22, 163, 74, 0.4)' : '1px solid #2d3139',
                boxShadow: (referralStats?.acceptanceRate || 0) >= 70 ? '0 0 16px rgba(22, 163, 74, 0.15)' : 'none'
              }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(22, 163, 74, 0.2)' }}>
                  <CheckCircle size={20} style={{ color: '#16a34a' }} />
                </div>
              </div>
              <div className="text-white/60 text-xs font-medium mb-1">Acceptance Rate</div>
              <div className="text-white text-2xl font-bold mb-1">{referralStats?.acceptanceRate || 0}%</div>
              <div className="text-white/50 text-xs">Students accepting help</div>
            </motion.div>

            {/* Card 4 - Avg Time to Accept */}
            <motion.div
              className="rounded-2xl p-5 transition-all duration-200"
              style={{ 
                background: '#1a1d24', 
                border: '1px solid #2d3139'
              }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(4, 137, 95, 0.2)' }}>
                  <Calendar size={20} style={{ color: '#04895f' }} />
                </div>
              </div>
              <div className="text-white/60 text-xs font-medium mb-1">Avg Time to Accept</div>
              <div className="text-white text-2xl font-bold mb-1">{referralStats?.avgTimeToAccept || 'N/A'}</div>
              <div className="text-white/50 text-xs">Response time</div>
            </motion.div>
          </div>

          {/* SECTION B: FILTER BAR */}
          <motion.div
            className="rounded-2xl p-4 mb-6"
            style={{ background: '#1a1d24', border: '1px solid #2d3139' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Search by ID, stressor, or counsellor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm text-white placeholder-white/40 outline-none transition-all duration-200"
                  style={{ background: '#232530', border: '1px solid #2d3139' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#04895f'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#2d3139'}
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-2">
                <Filter size={16} style={{ color: '#9ca3af' }} />
                {(['All', 'Pending', 'Sent', 'Accepted', 'Declined'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{
                      background: selectedStatus === status ? 'rgba(4, 137, 95, 0.2)' : '#232530',
                      border: selectedStatus === status ? '1px solid #04895f' : '1px solid #2d3139',
                      color: selectedStatus === status ? '#04895f' : '#9ca3af',
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Tier Filter */}
              <div className="flex items-center gap-2">
                {(['All', 2, 3] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{
                      background: selectedTier === tier ? 'rgba(4, 137, 95, 0.2)' : '#232530',
                      border: selectedTier === tier ? '1px solid #04895f' : '1px solid #2d3139',
                      color: selectedTier === tier ? '#04895f' : '#9ca3af',
                    }}
                  >
                    {tier === 'All' ? 'All Tiers' : `Tier ${tier}`}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* SECTION C: REFERRAL QUEUE TABLE */}
          <motion.div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#1a1d24', border: '1px solid #2d3139' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.2 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#232530', borderBottom: '1px solid #2d3139' }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/60">Student ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/60">Tier</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/60">Score</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/60">Primary Stressor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/60">Flagged At</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/60">Counsellor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/60">Appointment</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/60">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/60">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredQueue.map((referral, index) => (
                      <motion.tr
                        key={referral.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        style={{ borderBottom: '1px solid #2d3139' }}
                        className="hover:bg-[#232530] transition-colors duration-150"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold" style={{ background: '#232530', color: '#04895f' }}>
                              🔒
                            </div>
                            <span className="text-white text-sm font-medium">{referral.id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{getTierBadge(referral.tier)}</td>
                        <td className="px-4 py-3">
                          <span 
                            className="text-sm font-semibold"
                            style={{ color: referral.score >= 8 ? '#b91c1c' : referral.score >= 6.5 ? '#d97706' : '#16a34a' }}
                          >
                            {referral.score}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2 max-w-xs">
                            {referral.tier === 3 && <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#b91c1c' }} />}
                            <span className="text-white/80 text-xs">{referral.stressor}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-white/60 text-xs">{referral.flaggedAt}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User size={14} style={{ color: '#9ca3af' }} />
                            <span className="text-white/80 text-xs">{referral.counsellor}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-white/60 text-xs">{referral.appointmentSlot}</span>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(referral.status)}</td>
                        <td className="px-4 py-3">
                          {referral.status === 'Pending' && (
                            <button
                              onClick={() => handleSendReferral(referral)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                              style={{ background: 'rgba(4, 137, 95, 0.2)', border: '1px solid #04895f', color: '#04895f' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(4, 137, 95, 0.3)';
                                e.currentTarget.style.transform = 'scale(1.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(4, 137, 95, 0.2)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <Send size={12} />
                              Send
                            </button>
                          )}
                          {referral.status === 'Sent' && (
                            <span className="text-white/40 text-xs">Awaiting response</span>
                          )}
                          {referral.status === 'Accepted' && (
                            <span className="text-green-400 text-xs font-medium">✓ Confirmed</span>
                          )}
                          {referral.status === 'Declined' && (
                            <span className="text-red-400 text-xs font-medium">✗ Declined</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Empty state */}
            {filteredQueue.length === 0 && (
              <div className="text-center py-12">
                <div className="text-white/40 text-sm">No referrals match your filters</div>
              </div>
            )}
          </motion.div>

          {/* Results count */}
          <div className="mt-4 text-center">
            <span className="text-white/40 text-xs">
              Showing {filteredQueue.length} of {warmReferralQueue?.length || 0} referrals
            </span>
          </div>
        </motion.div>
      </main>

      {/* Appointment Modal */}
      <AppointmentModal 
        isOpen={appointmentModalOpen} 
        onClose={() => {
          setAppointmentModalOpen(false);
          setSelectedReferral(null);
        }} 
      />
    </div>
  );
}
