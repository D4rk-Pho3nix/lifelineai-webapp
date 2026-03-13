'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TierBadge, StatusBadge } from './Badges';
import { X, Download, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

const PAGE_SIZE = 10;

export default function CrisisLiveFeed({ data }) {
  const [page, setPage] = useState(0);
  const [selectedRow, setSelectedRow] = useState(null);

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const pageData = data.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const handleExport = () => {
    const headers = ['User ID', 'Timestamp', 'Trigger', 'Tier', 'Action', 'Status'];
    const rows = data.map(r => [r.id, r.timestamp, r.trigger, `Tier ${r.tier}`, r.action, r.status]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'crisis_feed.csv'; a.click();
  };

  return (
    <div className="rounded-2xl" style={{ background: '#1a1d24', border: '1px solid #2d3139', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #2d3139' }}>
        <div className="flex items-center gap-3">
          <h3 className="text-white font-semibold text-[15px]">Crisis Escalation Feed</h3>
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: '#9ca3af' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#9ca3af' }}>
            <Lock size={11} />
            Data Anonymized
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all duration-150"
            style={{ background: '#232530', border: '1px solid #2d3139', color: '#9ca3af' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#04895f'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; }}
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #2d3139' }}>
              {['User ID', 'Timestamp', 'Trigger Detected', 'Tier', 'Action Taken', 'Status'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="cursor-pointer transition-colors duration-150"
                style={{ borderBottom: '1px solid #2d3139' }}
                onMouseEnter={e => e.currentTarget.style.background = '#232530'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => setSelectedRow(row)}
              >
                <td className="px-5 py-3 font-mono text-[12px]" style={{ color: '#9ca3af' }}>{row.id}</td>
                <td className="px-5 py-3 text-[12px]" style={{ color: '#9ca3af' }}>{row.timestamp}</td>
                <td className="px-5 py-3 text-[12px] text-white max-w-[240px] truncate" title={row.trigger}>
                  {row.trigger.length > 40 ? row.trigger.slice(0, 40) + '…' : row.trigger}
                </td>
                <td className="px-5 py-3"><TierBadge tier={row.tier} /></td>
                <td className="px-5 py-3 text-[12px] text-white">{row.action}</td>
                <td className="px-5 py-3"><StatusBadge status={row.status} /></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid #2d3139' }}>
        <span className="text-[12px]" style={{ color: '#9ca3af' }}>
          Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.length)} of {data.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1.5 rounded-lg transition-colors duration-150 disabled:opacity-30"
            style={{ background: '#232530' }}
          >
            <ChevronLeft size={14} color="#9ca3af" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className="w-7 h-7 rounded-lg text-[12px] font-medium transition-all duration-150"
              style={{
                background: page === i ? '#04895f' : '#232530',
                color: page === i ? '#ffffff' : '#9ca3af',
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-1.5 rounded-lg transition-colors duration-150 disabled:opacity-30"
            style={{ background: '#232530' }}
          >
            <ChevronRight size={14} color="#9ca3af" />
          </button>
        </div>
      </div>

      {/* Slide-in Drawer */}
      <AnimatePresence>
        {selectedRow && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRow(null)}
            />
            <motion.div
              className="fixed right-0 top-0 h-full z-50 w-96 flex flex-col"
              style={{ background: '#1a1d24', borderLeft: '1px solid #2d3139' }}
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #2d3139' }}>
                <div>
                  <div className="font-mono text-white font-semibold">{selectedRow.id}</div>
                  <div className="text-[11px]" style={{ color: '#9ca3af' }}>Session Detail — Anonymized</div>
                </div>
                <button
                  onClick={() => setSelectedRow(null)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: '#232530' }}
                >
                  <X size={14} color="#9ca3af" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {[
                  { label: 'Timestamp',        value: selectedRow.timestamp },
                  { label: 'Trigger Detected', value: selectedRow.trigger },
                  { label: 'Action Taken',      value: selectedRow.action },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>{label}</div>
                    <div className="text-white text-[14px]">{value}</div>
                  </div>
                ))}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>Risk Tier</div>
                  <TierBadge tier={selectedRow.tier} />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>Status</div>
                  <StatusBadge status={selectedRow.status} />
                </div>
                <div className="rounded-xl p-4 mt-2" style={{ background: 'rgba(5,46,22,0.2)', border: '1px solid rgba(22,163,74,0.3)' }}>
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: '#16a34a' }}>
                    <Lock size={12} />
                    All session data is anonymized. Real-world identifiers are never stored or displayed.
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
