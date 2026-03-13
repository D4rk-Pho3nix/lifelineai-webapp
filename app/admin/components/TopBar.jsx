'use client';

import { USE_MOCK_DATA } from '@/src/data/dataConfig';

export default function TopBar({ title }) {
  return (
    <header
      className="fixed top-0 left-64 right-0 z-40 h-16 flex items-center justify-between px-6"
      style={{
        background: '#1a1d24',
        borderBottom: '1px solid #2d3139',
      }}
    >
      {/* LEFT — Page Title */}
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
      </div>

      {/* RIGHT — Controls */}
      <div className="flex items-center gap-3">
        {/* Mock Data Indicator - Only visible when USE_MOCK_DATA === true */}
        {USE_MOCK_DATA && (
          <div 
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium"
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
            Mock Data Active
          </div>
        )}
      </div>
    </header>
  );
}
