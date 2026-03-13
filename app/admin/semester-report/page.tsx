'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from '../components/TopBar';
import { FileDown, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useDashboardData } from '@/src/hooks/useDashboardData';

export default function SemesterReportPage() {
  const {
    semesterDepartmentData,
    semesterWeeklyTrend,
    semesterTopStressors,
    isLoading,
  } = useDashboardData();

  const [showDropdown, setShowDropdown] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load html2pdf library from CDN
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generatePDFReport = () => {
    if (!semesterDepartmentData || semesterDepartmentData.length === 0) {
      alert('No data available to generate report');
      return;
    }

    setIsPdfGenerating(true);
    setShowDropdown(false);

    // Brief delay to show loading state
    setTimeout(() => {
      // Calculate statistics
      const totalStudents = semesterDepartmentData.reduce((sum, d) => sum + d.enrolled, 0);
      const totalTier1 = semesterDepartmentData.reduce((sum, d) => sum + d.tier1, 0);
      const totalTier2 = semesterDepartmentData.reduce((sum, d) => sum + d.tier2, 0);
      const totalTier3 = semesterDepartmentData.reduce((sum, d) => sum + d.tier3, 0);
      const avgDistress = (semesterDepartmentData.reduce((sum, d) => sum + d.avgScore, 0) / semesterDepartmentData.length).toFixed(1);
      const tier2Plus3 = totalTier2 + totalTier3;
      const tier2Plus3Percent = ((tier2Plus3 / totalStudents) * 100).toFixed(1);

      // Generate recommendations
      const recommendations: string[] = [];
      const tier2Plus3Rate = parseFloat(tier2Plus3Percent);
      if (tier2Plus3Rate > 30) {
        recommendations.push('<strong>High-risk population detected (>30% Tier 2+3):</strong> Consider campus-wide mental health awareness campaign and increased counsellor availability.');
      }
      const avgDistressNum = parseFloat(avgDistress);
      if (avgDistressNum > 6) {
        recommendations.push('<strong>Elevated distress levels (avg >6/10):</strong> Implement structured wellness breaks and peer support initiatives.');
      }
      const highRiskDepts = semesterDepartmentData.filter(d => (d.tier3 / d.enrolled) > 0.08);
      if (highRiskDepts.length > 0) {
        recommendations.push(`<strong>Departments with elevated Tier III prevalence (>8%):</strong> ${highRiskDepts.map(d => d.dept).join(', ')}. Schedule targeted outreach.`);
      }
      if (semesterTopStressors && semesterTopStressors.length > 0) {
        const topStressor = semesterTopStressors[0];
        const topPercentage = (topStressor as any).percentage || (topStressor as any).percent || 0;
        if (topStressor.stressor === 'Academic Pressure' && topPercentage > 40) {
          recommendations.push('<strong>Academic pressure is the primary stressor:</strong> Review exam schedules and introduce structured study support programmes.');
        } else if (topStressor.stressor === 'Burnout' && topPercentage > 30) {
          recommendations.push('<strong>Burnout levels are elevated:</strong> Recommend structured wellness breaks and workload management workshops.');
        }
      }
      if (recommendations.length === 0) {
        recommendations.push('Campus mental health metrics are within acceptable ranges. Continue monitoring weekly trends.');
      }

      // Create HTML content for PDF
      const pdfContent = `
        <div style="padding: 40px; font-family: Arial, sans-serif; color: #1a1d24;">
          <div style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 10px;">
            <h1 style="color: #04895f; margin: 0 0 10px 0; font-size: 28px;">LIFELINE AI</h1>
            <h2 style="color: #666; margin: 0 0 10px 0; font-size: 18px; font-weight: normal;">Semester Health Report</h2>
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">Generated: ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            <div style="margin-top: 15px; padding: 10px; background-color: #dcfce7; border-radius: 5px;">
              <p style="color: #16a34a; margin: 0; font-size: 11px;">🔒 All data is fully anonymised. No personally identifiable information is included in this report.</p>
            </div>
          </div>

          <h2 style="color: #04895f; border-bottom: 3px solid #04895f; padding-bottom: 8px; margin-top: 30px; font-size: 18px;">1. Executive Summary</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0; background-color: #f9fafb;">
            <tr style="background-color: #04895f; color: white;">
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-size: 13px;">Metric</th>
              <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-size: 13px;">Value</th>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; font-size: 12px;">Total Students Screened</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 12px;">${totalStudents}</td>
            </tr>
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; font-size: 12px;">Campus Average Distress Score</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 12px;">${avgDistress} / 10</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; font-size: 12px;">Students Needing Support (Tier 2+3)</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 12px;">${tier2Plus3} (${tier2Plus3Percent}%)</td>
            </tr>
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; font-size: 12px;">Tier I (Stable)</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 12px; color: #16a34a;">${totalTier1}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; font-size: 12px;">Tier II (Moderate Distress)</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 12px; color: #d97706;">${totalTier2}</td>
            </tr>
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; font-size: 12px;">Tier III (Severe Distress)</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 12px; color: #b91c1c;">${totalTier3}</td>
            </tr>
          </table>

          <h2 style="color: #04895f; border-bottom: 3px solid #04895f; padding-bottom: 8px; margin-top: 35px; font-size: 18px;">2. Department-Level Breakdown (Anonymised)</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11px;">
            <thead>
              <tr style="background-color: #04895f; color: white;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Dept Code</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Enrolled</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Tier I</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Tier II</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Tier III</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Avg Score</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Trend</th>
              </tr>
            </thead>
            <tbody>
              ${semesterDepartmentData.map((dept, index) => `
                <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${dept.dept}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${dept.enrolled}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: #16a34a;">${dept.tier1} (${((dept.tier1 / dept.enrolled) * 100).toFixed(1)}%)</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: #d97706;">${dept.tier2} (${((dept.tier2 / dept.enrolled) * 100).toFixed(1)}%)</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: #b91c1c;">${dept.tier3} (${((dept.tier3 / dept.enrolled) * 100).toFixed(1)}%)</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${dept.avgScore.toFixed(1)}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: ${dept.trend > 0 ? '#ef4444' : '#16a34a'};">${dept.trend > 0 ? '↑' : '↓'} ${Math.abs(dept.trend).toFixed(1)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${semesterWeeklyTrend && semesterWeeklyTrend.length > 0 ? `
            <h2 style="color: #04895f; border-bottom: 3px solid #04895f; padding-bottom: 8px; margin-top: 35px; font-size: 18px;">3. Semester Weekly Trend</h2>
            <ul style="line-height: 1.8; font-size: 12px; color: #333;">
              ${semesterWeeklyTrend.map(w => `<li><strong>${w.week}:</strong> ${w.avgMood.toFixed(1)} / 10</li>`).join('')}
            </ul>
            <p style="font-size: 12px; color: #04895f; font-weight: bold; margin-top: 10px;">
              Trend Direction: ${(() => {
                const firstWeek = semesterWeeklyTrend[0]?.avgMood || 0;
                const lastWeek = semesterWeeklyTrend[semesterWeeklyTrend.length - 1]?.avgMood || 0;
                return lastWeek > firstWeek ? 'Improving ↑' : lastWeek < firstWeek ? 'Declining ↓' : 'Stable →';
              })()}
            </p>
          ` : ''}

          ${semesterTopStressors && semesterTopStressors.length > 0 ? `
            <h2 style="color: #04895f; border-bottom: 3px solid #04895f; padding-bottom: 8px; margin-top: 35px; font-size: 18px;">4. Top Stressors</h2>
            <ol style="line-height: 1.8; font-size: 12px; color: #333;">
              ${semesterTopStressors.slice(0, 5).map(s => {
                const count = (s as any).count || 0;
                const percentage = (s as any).percentage || (s as any).percent || 0;
                return `<li><strong>${s.stressor}:</strong> ${count} students (${percentage}%)</li>`;
              }).join('')}
            </ol>
          ` : ''}

          <h2 style="color: #04895f; border-bottom: 3px solid #04895f; padding-bottom: 8px; margin-top: 35px; font-size: 18px;">5. Recommended Institutional Actions</h2>
          <div style="background-color: #dcfce7; border-left: 4px solid #04895f; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <ul style="line-height: 1.8; font-size: 12px; color: #1a1d24; margin: 0; padding-left: 20px;">
              ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 10px; margin: 0;">Lifeline AI — Admin Report | Confidential & Anonymised</p>
          </div>
        </div>
      `;

      // Create a temporary div to hold the content
      const element = document.createElement('div');
      element.innerHTML = pdfContent;
      document.body.appendChild(element);

      // Generate PDF
      const opt = {
        margin: 10,
        filename: `Lifeline_Semester_Report_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // @ts-ignore - html2pdf is loaded via CDN
      if (typeof html2pdf !== 'undefined') {
        // @ts-ignore
        html2pdf().set(opt).from(element).save().then(() => {
          document.body.removeChild(element);
          setIsPdfGenerating(false);
        }).catch((error: Error) => {
          console.error('PDF generation error:', error);
          document.body.removeChild(element);
          setIsPdfGenerating(false);
          alert('Failed to generate PDF. Please try again.');
        });
      } else {
        document.body.removeChild(element);
        setIsPdfGenerating(false);
        alert('PDF library is still loading. Please try again in a moment.');
      }
    }, 500);
  };

  const handleDownload = (format: 'csv' | 'pdf') => {
    if (format === 'pdf') {
      generatePDFReport();
      return;
    }

    // CSV generation
    const reportData = {
      title: 'Semester Health Report',
      date: new Date().toLocaleDateString(),
      departments: semesterDepartmentData || [],
    };

    const headers = ['Department', 'Enrolled', 'Tier I', 'Tier II', 'Tier III', 'Avg Score', 'Trend'];
    const rows = reportData.departments.map(d =>
      [d.dept, d.enrolled, d.tier1, d.tier2, d.tier3, d.avgScore, d.trend].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `semester-report-${reportData.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setShowDropdown(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <TopBar title="Semester Health Report" />
      <main className="flex-1 overflow-y-auto pt-16 px-6 py-6" style={{ background: '#0f1117' }}>
        <motion.div 
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {/* Header with subtitle chip and Generate Report button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
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
                Anonymised Department-Level Trends — For Welfare Officers
              </div>
            </div>

            {/* Generate Report Button with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={isPdfGenerating}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: '#04895f' }}
                onMouseEnter={(e) => !isPdfGenerating && (e.currentTarget.style.background = '#036b4a')}
                onMouseLeave={(e) => !isPdfGenerating && (e.currentTarget.style.background = '#04895f')}
              >
                {isPdfGenerating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileDown size={16} />
                    Generate Report
                    <ChevronDown
                      size={16}
                      style={{
                        transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </>
                )}
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden z-50"
                    style={{ 
                      background: '#1a1d24', 
                      border: '1px solid #2d3139',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                    }}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <button
                      onClick={() => handleDownload('csv')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white transition-all duration-150"
                      style={{ background: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#232530'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <FileSpreadsheet size={16} style={{ color: '#04895f' }} />
                      <div className="text-left">
                        <div className="font-medium">Export as CSV</div>
                        <div className="text-xs" style={{ color: '#9ca3af' }}>Spreadsheet format</div>
                      </div>
                    </button>

                    <div style={{ height: '1px', background: '#2d3139' }} />

                    <button
                      onClick={() => handleDownload('pdf')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white transition-all duration-150"
                      style={{ background: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#232530'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <FileText size={16} style={{ color: '#04895f' }} />
                      <div className="text-left">
                        <div className="font-medium">Export as PDF</div>
                        <div className="text-xs" style={{ color: '#9ca3af' }}>Document format</div>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Data Display Section */}
          {isLoading ? (
            <div 
              className="rounded-2xl p-8 text-center"
              style={{ background: '#1a1d24', border: '1px solid #2d3139' }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="w-5 h-5 border-2 border-lifeline-accent/30 border-t-lifeline-accent rounded-full animate-spin" />
                <p style={{ color: '#9ca3af' }}>Loading semester data...</p>
              </div>
            </div>
          ) : !semesterDepartmentData || semesterDepartmentData.length === 0 ? (
            <div 
              className="rounded-2xl p-8 text-center"
              style={{ background: '#1a1d24', border: '1px solid #2d3139' }}
            >
              <h2 className="text-white text-xl font-bold mb-2">No Data Available</h2>
              <p style={{ color: '#9ca3af' }}>
                No semester data available to display. Please check back later.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Department Breakdown Table */}
              <div 
                className="rounded-2xl p-6"
                style={{ background: '#1a1d24', border: '1px solid #2d3139' }}
              >
                <h2 className="text-white text-lg font-semibold mb-4">Department-Level Breakdown</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #2d3139' }}>
                        <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#04895f' }}>Department</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold" style={{ color: '#04895f' }}>Enrolled</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold" style={{ color: '#04895f' }}>Tier I</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold" style={{ color: '#04895f' }}>Tier II</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold" style={{ color: '#04895f' }}>Tier III</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold" style={{ color: '#04895f' }}>Avg Score</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold" style={{ color: '#04895f' }}>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semesterDepartmentData.map((dept, index) => (
                        <motion.tr
                          key={dept.dept}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.2 }}
                          style={{ borderBottom: '1px solid #2d3139' }}
                        >
                          <td className="py-3 px-4 text-sm font-medium text-white">{dept.dept}</td>
                          <td className="py-3 px-4 text-sm text-center text-white">{dept.enrolled}</td>
                          <td className="py-3 px-4 text-sm text-center" style={{ color: '#16a34a' }}>
                            {dept.tier1} ({((dept.tier1 / dept.enrolled) * 100).toFixed(1)}%)
                          </td>
                          <td className="py-3 px-4 text-sm text-center" style={{ color: '#d97706' }}>
                            {dept.tier2} ({((dept.tier2 / dept.enrolled) * 100).toFixed(1)}%)
                          </td>
                          <td className="py-3 px-4 text-sm text-center" style={{ color: '#b91c1c' }}>
                            {dept.tier3} ({((dept.tier3 / dept.enrolled) * 100).toFixed(1)}%)
                          </td>
                          <td className="py-3 px-4 text-sm text-center text-white">{dept.avgScore.toFixed(1)}</td>
                          <td className="py-3 px-4 text-sm text-center" style={{ color: dept.trend > 0 ? '#ef4444' : '#16a34a' }}>
                            {dept.trend > 0 ? '↑' : '↓'} {Math.abs(dept.trend).toFixed(1)}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className="rounded-xl p-5"
                  style={{ background: '#1a1d24', border: '1px solid #2d3139' }}
                >
                  <div className="text-sm" style={{ color: '#9ca3af' }}>Total Students</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {semesterDepartmentData.reduce((sum, d) => sum + d.enrolled, 0)}
                  </div>
                </div>
                <div 
                  className="rounded-xl p-5"
                  style={{ background: '#1a1d24', border: '1px solid #2d3139' }}
                >
                  <div className="text-sm" style={{ color: '#9ca3af' }}>Avg Distress Score</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {(semesterDepartmentData.reduce((sum, d) => sum + d.avgScore, 0) / semesterDepartmentData.length).toFixed(1)} / 10
                  </div>
                </div>
                <div 
                  className="rounded-xl p-5"
                  style={{ background: '#1a1d24', border: '1px solid #2d3139' }}
                >
                  <div className="text-sm" style={{ color: '#9ca3af' }}>High Risk (Tier 2+3)</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {(() => {
                      const total = semesterDepartmentData.reduce((sum, d) => sum + d.enrolled, 0);
                      const tier2Plus3 = semesterDepartmentData.reduce((sum, d) => sum + d.tier2 + d.tier3, 0);
                      return `${((tier2Plus3 / total) * 100).toFixed(1)}%`;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
