'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const numTarget = typeof target === 'number' ? target : parseFloat(target) || 0;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(ease * numTarget));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return count;
}

export default function KPICard({
  label, value, icon, trend, isLive, isTier3Alert, valueColor, numericValue
}) {
  const displayNum = numericValue !== undefined ? numericValue : (typeof value === 'number' ? value : 0);
  const counted = useCountUp(displayNum, 1000);

  // Build display string
  let displayValue;
  if (typeof value === 'number') {
    displayValue = counted;
  } else {
    // e.g. "6.4/10" — replace the numeric part
    displayValue = String(value).replace(String(displayNum), String(counted));
  }

  const isPositive = trend && trend.startsWith('+');
  const isNegative = trend && trend.startsWith('-');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative rounded-2xl p-5 transition-all duration-200 cursor-default"
      style={{
        background: '#1a1d24',
        border: isTier3Alert ? '1px solid #b91c1c' : '1px solid #2d3139',
        boxShadow: isTier3Alert
          ? '0 0 16px rgba(185,28,28,0.15), 0 4px 24px rgba(0,0,0,0.4)'
          : '0 4px 24px rgba(0,0,0,0.4)',
      }}
      whileHover={{
        borderColor: isTier3Alert ? '#b91c1c' : '#04895f',
        boxShadow: isTier3Alert
          ? '0 0 20px rgba(185,28,28,0.2), 0 4px 24px rgba(0,0,0,0.4)'
          : '0 0 0 1px rgba(4,137,95,0.3), 0 4px 24px rgba(0,0,0,0.4)',
        transition: { duration: 0.2 },
      }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isLive && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />}
          <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>{label}</span>
        </div>
        <div
          className={isTier3Alert ? 'animate-tier3-pulse rounded-full p-1' : ''}
          style={{ color: isTier3Alert ? '#b91c1c' : '#04895f' }}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <div className="text-3xl font-bold mb-3" style={{ color: valueColor ?? '#ffffff' }}>
        {displayValue}
      </div>

      {/* Trend chip */}
      {trend && (
        <div
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
          style={{
            background: isPositive ? 'rgba(22,163,74,0.15)' : isNegative ? 'rgba(185,28,28,0.15)' : 'rgba(156,163,175,0.15)',
            color: isPositive ? '#16a34a' : isNegative ? '#b91c1c' : '#9ca3af',
          }}
        >
          <span>{isPositive ? '↑' : isNegative ? '↓' : ''}</span>
          <span>{trend}</span>
        </div>
      )}
    </motion.div>
  );
}
