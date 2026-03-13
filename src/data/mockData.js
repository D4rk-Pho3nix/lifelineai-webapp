/**
 * ╔══════════════════════════════════════════════════════╗
 * ║           ⚠️  MOCK DATA — TEMPORARY FILE            ║
 * ║                                                      ║
 * ║  This file exists ONLY for development purposes.     ║
 * ║  It must be DELETED before production deployment.    ║
 * ║                                                      ║
 * ║  DELETION CHECKLIST (complete in order):             ║
 * ║  ─────────────────────────────────────────────────   ║
 * ║  □ Step 1: Connect Supabase in supabaseClient.js     ║
 * ║  □ Step 2: Set USE_MOCK_DATA = false in              ║
 * ║            src/data/dataConfig.js                    ║
 * ║  □ Step 3: Open every admin page — confirm           ║
 * ║            data loads correctly from Supabase        ║
 * ║  □ Step 4: Confirm "Mock Data Active" chip           ║
 * ║            is gone from TopBar                       ║
 * ║  □ Step 5: DELETE this file (mockData.js)            ║
 * ║  □ Step 6: DELETE src/data/dataConfig.js             ║
 * ║  □ Step 7: Remove useDashboardData mock branch       ║
 * ║            (the if USE_MOCK_DATA block)              ║
 * ║  □ Step 8: Run build — confirm zero import errors    ║
 * ║                                                      ║
 * ║  If any page breaks after Step 2 → DO NOT delete.   ║
 * ║  Fix the Supabase query for that page first.         ║
 * ╚══════════════════════════════════════════════════════╝
 */

export const kpiData = {
  totalUsers: 1247,
  totalUsersChange: '+12.4%',
  activeSessions: 38,
  tier3Alerts: 3,
  escalationsResolved: 11,
  avgMoodScore: 6.4,
  avgMoodChange: '+0.8'
};

export const tierDistributionData = [
  { name: 'Tier I — Stable',    value: 68, color: '#16a34a' },
  { name: 'Tier II — Moderate', value: 22, color: '#d97706' },
  { name: 'Tier III — Critical', value: 10, color: '#b91c1c' },
];

export const weeklySessionData = [
  { day: 'Mon', tier1: 120, tier2: 45, tier3: 8 },
  { day: 'Tue', tier1: 98,  tier2: 38, tier3: 5 },
  { day: 'Wed', tier1: 145, tier2: 52, tier3: 12 },
  { day: 'Thu', tier1: 167, tier2: 61, tier3: 14 },
  { day: 'Fri', tier1: 134, tier2: 48, tier3: 9 },
  { day: 'Sat', tier1: 89,  tier2: 31, tier3: 6 },
  { day: 'Sun', tier1: 78,  tier2: 44, tier3: 18 },
];

export const moodTrendData = {
  '30d': [
    { date: 'Feb 10', score: 5.2 },
    { date: 'Feb 15', score: 5.6 },
    { date: 'Feb 20', score: 6.0 },
    { date: 'Feb 25', score: 5.8 },
    { date: 'Mar 1',  score: 6.3 },
    { date: 'Mar 5',  score: 6.4 },
    { date: 'Mar 10', score: 6.7 },
  ],
  '60d': [
    { date: 'Jan 10', score: 4.8 },
    { date: 'Jan 20', score: 5.1 },
    { date: 'Feb 1',  score: 5.3 },
    { date: 'Feb 10', score: 5.2 },
    { date: 'Feb 20', score: 6.0 },
    { date: 'Mar 1',  score: 6.3 },
    { date: 'Mar 10', score: 6.7 },
  ],
  '90d': [
    { date: 'Dec 10', score: 4.5 },
    { date: 'Dec 25', score: 4.9 },
    { date: 'Jan 10', score: 4.8 },
    { date: 'Jan 25', score: 5.2 },
    { date: 'Feb 10', score: 5.2 },
    { date: 'Feb 25', score: 5.8 },
    { date: 'Mar 10', score: 6.7 },
  ],
};

// 7×24 heatmap — rows: Mon-Sun, cols: 0-23 (hours)
// Peak activity at Sat/Sun (rows 5-6), hours 22-2 (10PM–2AM)
export const peakHoursData = (() => {
  const data = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let d = 0; d < 7; d++) {
    const row = [];
    for (let h = 0; h < 24; h++) {
      let base = Math.floor(Math.random() * 10);
      // Weekend (Sat=5, Sun=6) late night peaks
      if (d >= 5 && (h >= 22 || h <= 2)) base += Math.floor(Math.random() * 35) + 15;
      // Weekday evening bump
      else if (d < 5 && (h >= 20 || h <= 1)) base += Math.floor(Math.random() * 20) + 5;
      row.push(Math.min(base, 50));
    }
    data.push({ day: days[d], hours: row });
  }
  return data;
})();

export const crisisLiveFeedData = [
  {
    id: 'USR-4821', timestamp: '2026-03-12 11:32 AM',
    trigger: 'Expression of hopelessness about the future', tier: 3,
    action: 'Voice call initiated', status: 'Active'
  },
  {
    id: 'USR-3197', timestamp: '2026-03-12 10:58 AM',
    trigger: 'Prolonged silence with distress markers', tier: 3,
    action: 'Hotline routed', status: 'Resolved'
  },
  {
    id: 'USR-7734', timestamp: '2026-03-12 10:14 AM',
    trigger: 'Coping failure detected', tier: 2,
    action: 'Professional support suggested', status: 'Pending'
  },
  {
    id: 'USR-2291', timestamp: '2026-03-12 09:47 AM',
    trigger: 'Repeated self-isolation mentions', tier: 2,
    action: 'Counselor referral queued', status: 'Pending'
  },
  {
    id: 'USR-5513', timestamp: '2026-03-12 09:21 AM',
    trigger: 'Acute emotional distress signals', tier: 3,
    action: 'Emergency protocol triggered', status: 'Resolved'
  },
  {
    id: 'USR-8841', timestamp: '2026-03-12 08:59 AM',
    trigger: 'Significant mood deterioration detected', tier: 2,
    action: 'Check-in message sent', status: 'Resolved'
  },
  {
    id: 'USR-1102', timestamp: '2026-03-12 08:33 AM',
    trigger: 'Withdrawal from support network mentioned', tier: 1,
    action: 'Wellness prompt sent', status: 'Resolved'
  },
  {
    id: 'USR-6674', timestamp: '2026-03-12 07:45 AM',
    trigger: 'Elevated anxiety and panic language', tier: 2,
    action: 'Breathing exercise suggested', status: 'Pending'
  },
  {
    id: 'USR-3389', timestamp: '2026-03-12 07:12 AM',
    trigger: 'Sleep disruption and distress correlation', tier: 1,
    action: 'Sleep hygiene resources sent', status: 'Resolved'
  },
  {
    id: 'USR-9021', timestamp: '2026-03-12 06:50 AM',
    trigger: 'Emotional numbness expressed', tier: 2,
    action: 'Counselor notified', status: 'Active'
  },
];

export const aiPerformanceData = {
  precision: 91.4,
  recall: 88.7,
  f1Score: 90.0,
  sarcasmHitRate: 76.2,
  confusionMatrix: {
    tp: 312, fp: 28, tn: 1089, fn: 41
  },
  accuracyTrend: [
    { week: 'W1', accuracy: 87.2 },
    { week: 'W2', accuracy: 88.9 },
    { week: 'W3', accuracy: 89.4 },
    { week: 'W4', accuracy: 90.0 },
  ]
};

export const feedbackData = {
  satisfactionTrend: [
    { week: 'Feb W1', score: 74 },
    { week: 'Feb W2', score: 77 },
    { week: 'Feb W3', score: 79 },
    { week: 'Feb W4', score: 81 },
    { week: 'Mar W1', score: 83 },
    { week: 'Mar W2', score: 84 },
  ],
  radarData: [
    { metric: 'Empathy',        score: 87 },
    { metric: 'Helpfulness',    score: 82 },
    { metric: 'Safety Felt',    score: 79 },
    { metric: 'Response Speed', score: 91 },
    { metric: 'Overall',        score: 84 },
  ],
  verbatim: [
    { id: 'USR-1823', tier: 1, ts: '2026-03-10', text: 'It actually listened to me without judgment. Really helped.' },
    { id: 'USR-4401', tier: 2, ts: '2026-03-09', text: 'I felt supported during a really hard night. Thank you.' },
    { id: 'USR-7723', tier: 3, ts: '2026-03-09', text: 'The quick response when I was struggling made a difference.' },
    { id: 'USR-2293', tier: 1, ts: '2026-03-08', text: 'Simple, calm, and helpful. Better than I expected.' },
    { id: 'USR-5511', tier: 2, ts: '2026-03-07', text: 'Felt less alone. It understood what I was going through.' },
  ],
};

export const pilotData = {
  enrolled: 143,
  target: 200,
  referralRate: [
    { week: 'W1', rate: 12 },
    { week: 'W2', rate: 18 },
    { week: 'W3', rate: 14 },
    { week: 'W4', rate: 22 },
    { week: 'W5', rate: 19 },
    { week: 'W6', rate: 27 },
  ],
  handoffLog: [
    { id: 'USR-2211', date: '2026-03-10', counselor: 'Counselor-A', outcome: 'In Progress' },
    { id: 'USR-3394', date: '2026-03-09', counselor: 'Counselor-B', outcome: 'Resolved' },
    { id: 'USR-4471', date: '2026-03-08', counselor: 'Counselor-A', outcome: 'Resolved' },
    { id: 'USR-5512', date: '2026-03-08', counselor: 'Counselor-C', outcome: 'In Progress' },
    { id: 'USR-6613', date: '2026-03-07', counselor: 'Counselor-B', outcome: 'Resolved' },
  ],
  culturalScripts: [
    { id: 'CS-001', label: 'Tamil Nadu — Telugu', satisfaction: 88 },
    { id: 'CS-002', label: 'Maharashtra — Marathi', satisfaction: 82 },
    { id: 'CS-003', label: 'Delhi — Hindi', satisfaction: 91 },
    { id: 'CS-004', label: 'Karnataka — Kannada', satisfaction: 79 },
    { id: 'CS-005', label: 'West Bengal — Bengali', satisfaction: 85 },
  ],
};

// apiCostData removed — Settings module deleted

// userManagementData removed — User Management module deleted

export const adminRoles = [
  { name: 'Arjun Mehta',   email: 'arjun@lifeline.ai',   role: 'Super Admin',      lastLogin: '2026-03-12 10:01 AM' },
  { name: 'Priya Sharma',  email: 'priya@lifeline.ai',   role: 'Counselor-View',   lastLogin: '2026-03-12 08:45 AM' },
  { name: 'Ravi Iyer',     email: 'ravi@lifeline.ai',    role: 'Read-Only Analyst', lastLogin: '2026-03-11 04:10 PM' },
];


// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ MOCK DATA BLOCK — COUNSELLOR HUB, WARM REFERRALS, SEMESTER REPORT
// DELETE THIS ENTIRE BLOCK when Supabase is connected.
// Replace with Supabase query hooks in the respective page components.
// ═══════════════════════════════════════════════════════════════════════════

export const counsellorMetrics = {
  totalScreened: 1247,
  moderateSevereCount: 386,
  moderateSeverePercent: 30.9,
  severeOnlyCount: 74,
  severeOnlyPercent: 5.9,
  weekOverWeekChange: +3.2,        // percentage point change vs last week
  avgDistressScore: 6.1,           // out of 10 (10 = most distressed)
  counsellorQueueCount: 18,        // students awaiting counsellor assignment
};

export const stressorTrendData = [
  // Each week shows the top stressor categories and their % prevalence
  { week: 'Week 1', academic: 42, burnout: 28, isolation: 19, relationships: 11, financial: 8  },
  { week: 'Week 2', academic: 45, burnout: 31, isolation: 17, relationships: 13, financial: 9  },
  { week: 'Week 3', academic: 41, burnout: 35, isolation: 20, relationships: 12, financial: 7  },
  { week: 'Week 4', academic: 48, burnout: 33, isolation: 22, relationships: 14, financial: 10 },
  { week: 'Week 5', academic: 52, burnout: 36, isolation: 18, relationships: 15, financial: 11 },
  { week: 'Week 6', academic: 49, burnout: 38, isolation: 24, relationships: 13, financial: 9  },
];

export const severityFunnelData = [
  { label: 'Total Users Screened',  value: 1247, color: '#04895f' },
  { label: 'Tier I — Low Distress', value: 861,  color: '#16a34a' },
  { label: 'Tier II — Moderate',    value: 312,  color: '#d97706' },
  { label: 'Tier III — Severe',     value: 74,   color: '#b91c1c' },
];

export const weekOverWeekData = [
  { week: 'W1', moderate: 22, severe: 4  },
  { week: 'W2', moderate: 24, severe: 5  },
  { week: 'W3', moderate: 23, severe: 5  },
  { week: 'W4', moderate: 26, severe: 6  },
  { week: 'W5', moderate: 28, severe: 7  },
  { week: 'W6', moderate: 31, severe: 7  },
];

export const warmReferralQueue = [
  {
    id: 'USR-2841', tier: 2, score: 6.8,
    stressor: 'Academic pressure + burnout',
    flaggedAt: '2026-03-12 10:34 AM',
    status: 'Pending',
    appointmentSlot: '2026-03-14 10:00 AM',
    counsellor: 'Counsellor-A',
    userType: 'Student',
  },
  {
    id: 'USR-3394', tier: 3, score: 8.2,
    stressor: 'Isolation + suicidal ideation markers',
    flaggedAt: '2026-03-12 09:11 AM',
    status: 'Sent',
    appointmentSlot: '2026-03-13 02:00 PM',
    counsellor: 'Counsellor-B',
    userType: 'Student',
  },
  {
    id: 'USR-1107', tier: 2, score: 6.2,
    stressor: 'Relationship breakdown',
    flaggedAt: '2026-03-12 08:55 AM',
    status: 'Accepted',
    appointmentSlot: '2026-03-15 11:00 AM',
    counsellor: 'Counsellor-A',
    userType: 'Professional',
  },
  {
    id: 'USR-4512', tier: 3, score: 7.9,
    stressor: 'Severe anxiety + panic attacks',
    flaggedAt: '2026-03-12 08:22 AM',
    status: 'Pending',
    appointmentSlot: '2026-03-14 02:00 PM',
    counsellor: 'Counsellor-C',
    userType: 'Student',
  },
  {
    id: 'USR-5623', tier: 2, score: 6.5,
    stressor: 'Work-life balance issues',
    flaggedAt: '2026-03-12 07:45 AM',
    status: 'Sent',
    appointmentSlot: '2026-03-15 09:00 AM',
    counsellor: 'Counsellor-B',
    userType: 'Professional',
  },
  {
    id: 'USR-6734', tier: 2, score: 6.3,
    stressor: 'Family pressure + academic stress',
    flaggedAt: '2026-03-12 07:12 AM',
    status: 'Declined',
    appointmentSlot: '2026-03-14 11:00 AM',
    counsellor: 'Counsellor-A',
    userType: 'Student',
  },
  {
    id: 'USR-7845', tier: 3, score: 8.5,
    stressor: 'Depression + withdrawal symptoms',
    flaggedAt: '2026-03-12 06:38 AM',
    status: 'Accepted',
    appointmentSlot: '2026-03-13 10:00 AM',
    counsellor: 'Counsellor-C',
    userType: 'Student',
  },
  {
    id: 'USR-8956', tier: 2, score: 6.7,
    stressor: 'Career uncertainty + burnout',
    flaggedAt: '2026-03-11 11:22 PM',
    status: 'Pending',
    appointmentSlot: '2026-03-14 03:00 PM',
    counsellor: 'Counsellor-B',
    userType: 'Professional',
  },
  {
    id: 'USR-9067', tier: 2, score: 6.4,
    stressor: 'Social isolation + loneliness',
    flaggedAt: '2026-03-11 10:55 PM',
    status: 'Sent',
    appointmentSlot: '2026-03-15 10:00 AM',
    counsellor: 'Counsellor-A',
    userType: 'Student',
  },
  {
    id: 'USR-1178', tier: 3, score: 8.1,
    stressor: 'Self-harm ideation detected',
    flaggedAt: '2026-03-11 10:18 PM',
    status: 'Accepted',
    appointmentSlot: '2026-03-13 11:00 AM',
    counsellor: 'Counsellor-C',
    userType: 'Student',
  },
  {
    id: 'USR-2289', tier: 2, score: 6.6,
    stressor: 'Exam stress + sleep deprivation',
    flaggedAt: '2026-03-11 09:44 PM',
    status: 'Pending',
    appointmentSlot: '2026-03-14 09:00 AM',
    counsellor: 'Counsellor-B',
    userType: 'Student',
  },
  {
    id: 'USR-3390', tier: 2, score: 6.1,
    stressor: 'Financial stress + family issues',
    flaggedAt: '2026-03-11 09:12 PM',
    status: 'Declined',
    appointmentSlot: '2026-03-15 02:00 PM',
    counsellor: 'Counsellor-A',
    userType: 'Professional',
  },
  {
    id: 'USR-4401', tier: 3, score: 7.8,
    stressor: 'Chronic stress + burnout symptoms',
    flaggedAt: '2026-03-11 08:37 PM',
    status: 'Sent',
    appointmentSlot: '2026-03-13 03:00 PM',
    counsellor: 'Counsellor-C',
    userType: 'Student',
  },
  {
    id: 'USR-5512', tier: 2, score: 6.9,
    stressor: 'Relationship conflict + emotional distress',
    flaggedAt: '2026-03-11 08:05 PM',
    status: 'Accepted',
    appointmentSlot: '2026-03-14 10:00 AM',
    counsellor: 'Counsellor-B',
    userType: 'Professional',
  },
  {
    id: 'USR-6623', tier: 2, score: 6.2,
    stressor: 'Academic failure fear + anxiety',
    flaggedAt: '2026-03-11 07:28 PM',
    status: 'Pending',
    appointmentSlot: '2026-03-15 11:00 AM',
    counsellor: 'Counsellor-A',
    userType: 'Student',
  },
];

export const referralStats = {
  totalPending: 18,
  sentToday: 7,
  acceptanceRate: 68,       // percentage
  avgTimeToAccept: '4.2h',  // hours
  mostActiveSlot: '10AM–12PM',
};

export const semesterDepartmentData = [
  // Anonymized department-level data. No real dept names — use codes.
  { dept: 'DEPT-CSE',  enrolled: 240, tier1: 158, tier2: 68,  tier3: 14, avgScore: 5.8, trend: +2.1 },
  { dept: 'DEPT-ECE',  enrolled: 210, tier1: 147, tier2: 51,  tier3: 12, avgScore: 5.6, trend: +1.4 },
  { dept: 'DEPT-MECH', enrolled: 185, tier1: 119, tier2: 52,  tier3: 14, avgScore: 6.2, trend: -0.8 },
  { dept: 'DEPT-CIVIL',enrolled: 160, tier1: 112, tier2: 38,  tier3: 10, avgScore: 5.9, trend: +0.5 },
  { dept: 'DEPT-MBA',  enrolled: 130, tier1: 81,  tier2: 35,  tier3: 14, avgScore: 6.8, trend: +3.2 },
  { dept: 'DEPT-LAW',  enrolled: 120, tier1: 85,  tier2: 28,  tier3: 7,  avgScore: 5.4, trend: +0.2 },
];

export const semesterWeeklyTrend = [
  // Campus-wide week-over-week mood average for the current semester
  { week: 'Sem W1',  avgMood: 7.1 },
  { week: 'Sem W2',  avgMood: 6.9 },
  { week: 'Sem W3',  avgMood: 6.7 },
  { week: 'Sem W4',  avgMood: 6.4 },  // ← exam season begins
  { week: 'Sem W5',  avgMood: 5.9 },
  { week: 'Sem W6',  avgMood: 5.7 },
  { week: 'Sem W7',  avgMood: 6.0 },
  { week: 'Sem W8',  avgMood: 6.3 },
  { week: 'Sem W9',  avgMood: 6.1 },
  { week: 'Sem W10', avgMood: 6.4 },
  { week: 'Sem W11', avgMood: 6.6 },
  { week: 'Sem W12', avgMood: 6.8 },
];

export const semesterTopStressors = [
  { stressor: 'Academic Pressure',   percent: 52 },
  { stressor: 'Burnout',             percent: 38 },
  { stressor: 'Social Isolation',    percent: 24 },
  { stressor: 'Financial Stress',    percent: 17 },
  { stressor: 'Relationship Issues', percent: 13 },
  { stressor: 'Family Pressure',     percent: 11 },
];

// ═══════════════════════════════════════════════════════════════════════════
// NOTE: aiPerformanceData and pilotData removed per v2 requirements
// These pages (AI Performance, Pilot Program) have been deleted from the portal
// ═══════════════════════════════════════════════════════════════════════════
