import { useState, useEffect, useCallback } from 'react';
import { USE_MOCK_DATA } from '../data/dataConfig';
import * as mock from '../data/mockData';
import { supabase } from '../supabaseClient';

export function useDashboardData() {

  // ─── State (always declared — React rules) ───────────────────
  const [liveData, setLiveData] = useState({
    counsellorMetrics:      null,
    stressorTrendData:      null,
    severityFunnelData:     null,
    weekOverWeekData:       null,
    warmReferralQueue:      null,
    referralStats:          null,
    semesterDepartmentData: null,
    semesterWeeklyTrend:    null,
    semesterTopStressors:   null,
    adminRoles:             null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState(null);

  // ─── Main fetch function ──────────────────────────────────────
  const fetchLiveData = useCallback(async () => {
    if (USE_MOCK_DATA) return; // skip entirely in mock mode

    setIsLoading(true);
    setError(null);

    try {
      // ── Date helpers ─────────────────────────────────────────
      const todayDate        = new Date(); todayDate.setHours(0,0,0,0);
      const todayStr         = todayDate.toISOString().split('T')[0];

      const d7  = new Date(todayDate); d7.setDate(d7.getDate() - 7);
      const d14 = new Date(todayDate); d14.setDate(d14.getDate() - 14);
      const d42 = new Date(todayDate); d42.setDate(d42.getDate() - 42);

      const sevenDaysAgoStr  = d7.toISOString().split('T')[0];
      const fourteenDaysAgoStr = d14.toISOString().split('T')[0];
      const sixWeeksAgoStr   = d42.toISOString().split('T')[0];

      // ═══════════════════════════════════════════════════════
      // MODULE 1 — COUNSELLOR HUB
      // ═══════════════════════════════════════════════════════

      // 1a. User tier counts + referral queue size
      const [
        { count: totalUsers  },
        { count: tier2Count  },
        { count: tier3Count  },
        { count: queueCount  },
        { data:  thisWeekMood },
        { data:  lastWeekMood },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('current_tier', 2),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('current_tier', 3),
        supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('mood_scores').select('score').gte('score_date', sevenDaysAgoStr).lte('score_date', todayStr),
        supabase.from('mood_scores').select('score').gte('score_date', fourteenDaysAgoStr).lt('score_date', sevenDaysAgoStr),
      ]);

      // 1b. Compute averages and WoW change
      const avg = arr => arr?.length ? arr.reduce((s, r) => s + r.score, 0) / arr.length : 0;
      const avgThis = avg(thisWeekMood);
      const avgLast = avg(lastWeekMood);
      // Positive = distress worsened, Negative = improved
      const wowChange = avgLast > 0
        ? parseFloat(((avgLast - avgThis) / avgLast * 100).toFixed(1))
        : 0;

      const moderateSevereCount   = (tier2Count || 0) + (tier3Count || 0);
      const moderateSeverePercent = totalUsers > 0 ? parseFloat(((moderateSevereCount / totalUsers) * 100).toFixed(1)) : 0;
      const severeOnlyPercent     = totalUsers > 0 ? parseFloat((((tier3Count || 0) / totalUsers) * 100).toFixed(1)) : 0;

      const counsellorMetrics = {
        totalScreened:          totalUsers          || 0,
        moderateCount:          tier2Count          || 0,
        severeCount:            tier3Count          || 0,
        moderateSevereCount,
        moderateSeverePercent,
        severeOnlyPercent,
        weekOverWeekChange:     wowChange,
        avgDistressScore:       parseFloat(avgThis.toFixed(1)),
        counsellorQueueCount:   queueCount          || 0,
      };

      // 1c. Severity funnel (donut chart)
      const severityFunnelData = [
        { name: 'Tier I — Stable',    value: (totalUsers || 0) - moderateSevereCount, color: '#22c55e' },
        { name: 'Tier II — Moderate', value: tier2Count || 0,                         color: '#f59e0b' },
        { name: 'Tier III — Severe',  value: tier3Count || 0,                         color: '#ef4444' },
      ];

      // 1d. Stressor trend — 6 weeks × 5 categories (line chart)
      const { data: stressorRaw } = await supabase
        .from('stressor_logs')
        .select('stressor_category, week_start_date')
        .gte('week_start_date', sixWeeksAgoStr)
        .order('week_start_date', { ascending: true });

      const stressorMap = {};
      (stressorRaw || []).forEach(({ stressor_category, week_start_date }) => {
        if (!stressorMap[week_start_date])
          stressorMap[week_start_date] = { week: `W/C ${week_start_date}`, academic: 0, burnout: 0, isolation: 0, relationships: 0, financial: 0 };
        const k = stressor_category === 'Academic Pressure' ? 'academic'
                : stressor_category === 'Burnout'           ? 'burnout'
                : stressor_category === 'Isolation'         ? 'isolation'
                : stressor_category === 'Relationships'     ? 'relationships'
                : 'financial';
        stressorMap[week_start_date][k]++;
      });

      const stressorTrendData = Object.values(stressorMap).map(row => {
        const total = row.academic + row.burnout + row.isolation + row.relationships + row.financial || 1;
        return {
          week:          row.week,
          academic:      parseFloat(((row.academic      / total) * 100).toFixed(1)),
          burnout:       parseFloat(((row.burnout        / total) * 100).toFixed(1)),
          isolation:     parseFloat(((row.isolation      / total) * 100).toFixed(1)),
          relationships: parseFloat(((row.relationships  / total) * 100).toFixed(1)),
          financial:     parseFloat(((row.financial      / total) * 100).toFixed(1)),
        };
      });

      // 1e. Week-over-week moderate + severe case count (composed chart)
      const { data: sessionRaw } = await supabase
        .from('sessions')
        .select('started_at, tier_assigned')
        .gte('started_at', d42.toISOString())
        .order('started_at', { ascending: true });

      const wowMap = {};
      (sessionRaw || []).forEach(({ started_at, tier_assigned }) => {
        const d  = new Date(started_at);
        const mon = new Date(d);
        mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        const label = `W/C ${mon.toISOString().split('T')[0]}`;
        if (!wowMap[label]) wowMap[label] = { week: label, moderate: 0, severe: 0 };
        if (tier_assigned === 2) wowMap[label].moderate++;
        if (tier_assigned === 3) wowMap[label].severe++;
      });
      const weekOverWeekData = Object.values(wowMap);

      // ═══════════════════════════════════════════════════════
      // MODULE 2 — WARM REFERRAL WORKFLOW
      // ═══════════════════════════════════════════════════════

      // 2a. Full referral queue with anonymized user ID
      const { data: referralRaw } = await supabase
        .from('referrals')
        .select(`
          id,
          risk_tier,
          distress_score,
          primary_stressor,
          flagged_at,
          status,
          suggested_slot,
          assigned_counsellor,
          user_type,
          users ( anon_id )
        `)
        .order('flagged_at', { ascending: false });

      const warmReferralQueue = (referralRaw || []).map(r => ({
        id:              r.users?.anon_id || 'USR-????',
        referralId:      r.id,
        tier:            r.risk_tier,
        score:           r.distress_score,
        stressor:        r.primary_stressor,
        flaggedAt:       r.flagged_at,
        status:          r.status,
        appointmentSlot: r.suggested_slot,
        counsellor:      r.assigned_counsellor,
        userType:        r.user_type,
      }));

      // 2b. Referral aggregate stats
      const [
        { count: totalPending },
        { count: sentToday    },
        { data:  allProcessed },
        { data:  acceptedTimes},
      ] = await Promise.all([
        supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('status', 'Sent').gte('sent_at', todayStr),
        supabase.from('referrals').select('status').in('status', ['Sent','Accepted','Declined']),
        supabase.from('referrals').select('sent_at, accepted_at').eq('status', 'Accepted').not('sent_at', 'is', null).not('accepted_at', 'is', null),
      ]);

      const acceptanceRate = allProcessed?.length
        ? parseFloat(((allProcessed.filter(r => r.status === 'Accepted').length / allProcessed.length) * 100).toFixed(1))
        : 0;

      const avgTimeToAccept = acceptedTimes?.length
        ? parseFloat((
            acceptedTimes.reduce((sum, r) => sum + (new Date(r.accepted_at) - new Date(r.sent_at)) / 3600000, 0)
            / acceptedTimes.length
          ).toFixed(1))
        : 0;

      const referralStats = {
        totalPending:    totalPending || 0,
        sentToday:       sentToday    || 0,
        acceptanceRate,
        avgTimeToAccept: `${avgTimeToAccept}h`,
      };

      // ═══════════════════════════════════════════════════════
      // MODULE 3 — SEMESTER HEALTH REPORT
      // ═══════════════════════════════════════════════════════

      // 3a. Department breakdown table
      const { data: deptRaw } = await supabase
        .from('departments')
        .select('dept_code, total_enrolled, tier1_count, tier2_count, tier3_count, avg_distress_score, week_over_week_trend')
        .order('dept_code');

      const semesterDepartmentData = (deptRaw || []).map(d => ({
        dept:     d.dept_code,
        enrolled: d.total_enrolled,
        tier1:    d.tier1_count,
        tier2:    d.tier2_count,
        tier3:    d.tier3_count,
        avgScore: d.avg_distress_score,
        trend:    d.week_over_week_trend,
      }));

      // 3b. Semester 12-week mood trend (area chart)
      const { data: trendRaw } = await supabase
        .from('semester_trend')
        .select('week_number, avg_mood_score')
        .eq('semester', 'Jan-May 2026')
        .order('week_number', { ascending: true });

      const semesterWeeklyTrend = (trendRaw || []).map(t => ({
        week:    `Week ${t.week_number}`,
        avgMood: t.avg_mood_score,
      }));

      // 3c. Semester stressor prevalence (all-time percentages)
      const { data: allStressors } = await supabase
        .from('stressor_logs')
        .select('stressor_category');

      const stressorCount = {};
      (allStressors || []).forEach(({ stressor_category }) => {
        stressorCount[stressor_category] = (stressorCount[stressor_category] || 0) + 1;
      });
      const totalEntries = Object.values(stressorCount).reduce((a, b) => a + b, 0) || 1;

      const semesterTopStressors = Object.entries(stressorCount)
        .map(([stressor, count]) => ({
          stressor,
          percentage: parseFloat(((count / totalEntries) * 100).toFixed(1)),
          count,
        }))
        .sort((a, b) => b.count - a.count);

      // ═══════════════════════════════════════════════════════
      // ADMIN ROLES
      // ═══════════════════════════════════════════════════════
      const { data: adminRaw } = await supabase
        .from('admin_users')
        .select('id, name, email, role, last_login')
        .order('created_at');

      const adminRoles = (adminRaw || []).map(a => ({
        id:        a.id,
        name:      a.name,
        email:     a.email,
        role:      a.role,
        lastLogin: a.last_login,
      }));

      // ── Set all live data at once ─────────────────────────
      setLiveData({
        counsellorMetrics,
        stressorTrendData,
        severityFunnelData,
        weekOverWeekData,
        warmReferralQueue,
        referralStats,
        semesterDepartmentData,
        semesterWeeklyTrend,
        semesterTopStressors,
        adminRoles,
      });

    } catch (err) {
      console.error('[useDashboardData]', err);
      setError(err.message || 'Failed to load live data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLiveData(); }, [fetchLiveData]);

  // ─── Write Operations (Warm Referral Workflow) ────────────────
  const sendReferral = async (referralId) => {
    const { error } = await supabase
      .from('referrals')
      .update({ status: 'Sent' })
      .eq('id', referralId);
    if (!error) fetchLiveData();
    return { error };
  };

  const updateReferralStatus = async (referralId, newStatus) => {
    const { error } = await supabase
      .from('referrals')
      .update({ status: newStatus })
      .eq('id', referralId);
    if (!error) fetchLiveData();
    return { error };
  };

  const reassignCounsellor = async (referralId, counsellorName) => {
    const { error } = await supabase
      .from('referrals')
      .update({ assigned_counsellor: counsellorName })
      .eq('id', referralId);
    if (!error) fetchLiveData();
    return { error };
  };

  // ═══════════════════════════════════════════════════════════════
  // MOCK MODE RETURN
  // ═══════════════════════════════════════════════════════════════
  if (USE_MOCK_DATA) {
    return {
      kpiData:                mock.kpiData,
      tierDistributionData:   mock.tierDistributionData,
      weeklySessionData:      mock.weeklySessionData,
      moodTrendData:          mock.moodTrendData,
      peakHoursData:          mock.peakHoursData,
      crisisLiveFeedData:     mock.crisisLiveFeedData,
      counsellorMetrics:      mock.counsellorMetrics,
      stressorTrendData:      mock.stressorTrendData,
      severityFunnelData:     mock.severityFunnelData,
      weekOverWeekData:       mock.weekOverWeekData,
      warmReferralQueue:      mock.warmReferralQueue,
      referralStats:          mock.referralStats,
      semesterDepartmentData: mock.semesterDepartmentData,
      semesterWeeklyTrend:    mock.semesterWeeklyTrend,
      semesterTopStressors:   mock.semesterTopStressors,
      feedbackData:           mock.feedbackData,
      adminRoles:             mock.adminRoles,
      isLoading:              false,
      error:                  null,
      sendReferral,
      updateReferralStatus,
      reassignCounsellor,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // LIVE MODE RETURN
  // These stay mock forever (crisis/feedback pages are mock-only)
  // Everything else comes from Supabase
  // ═══════════════════════════════════════════════════════════════
  return {
    // ── Always mock (pages not connected to live data) ──────
    kpiData:                mock.kpiData,
    tierDistributionData:   mock.tierDistributionData,
    weeklySessionData:      mock.weeklySessionData,
    moodTrendData:          mock.moodTrendData,
    peakHoursData:          mock.peakHoursData,
    crisisLiveFeedData:     mock.crisisLiveFeedData,
    feedbackData:           mock.feedbackData,

    // ── Live from Supabase ───────────────────────────────────
    ...liveData,

    // ── State ────────────────────────────────────────────────
    isLoading,
    error,

    // ── Write operations ─────────────────────────────────────
    sendReferral,
    updateReferralStatus,
    reassignCounsellor,
  };
}
