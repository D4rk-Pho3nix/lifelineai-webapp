'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, AlertTriangle,
  MessageSquare,
  LogOut, Menu, X, ShieldCheck, HeartHandshake, GraduationCap
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin',            label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/admin/crisis',     label: 'Crisis Alerts',   icon: AlertTriangle,  alertKey: 'tier3' },
  { href: '/admin/referrals',  label: 'Warm Referrals',  icon: HeartHandshake },
  { href: '/admin/semester-report', label: 'Semester Report', icon: GraduationCap },
  { href: '/admin/feedback',   label: 'User Feedback',   icon: MessageSquare },
];

const TIER3_COUNT = 3; // from mock data

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div
      className="flex flex-col h-full"
      style={{ background: '#1a1d24', borderRight: '1px solid #2d3139' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid #2d3139' }}>
        <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#04895f20' }}>
          <ShieldCheck size={20} style={{ color: '#04895f' }} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="font-bold text-white text-[15px] leading-none">Lifeline AI</div>
              <div className="text-[11px] mt-0.5" style={{ color: '#9ca3af' }}>Admin Portal</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, alertKey }) => {
          const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link href={href} key={href} onClick={() => setMobileOpen(false)}>
              <motion.div
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 cursor-pointer group transition-all duration-200"
                style={{
                  background: isActive ? '#232530' : 'transparent',
                  borderLeft: isActive ? '3px solid #04895f' : '3px solid transparent',
                  paddingLeft: isActive ? '10px' : '12px',
                }}
                whileHover={{ backgroundColor: '#232530', transition: { duration: 0.15 } }}
              >
                <div className="relative flex-shrink-0">
                  <Icon
                    size={18}
                    style={{ color: isActive ? '#04895f' : '#9ca3af', transition: 'color 0.2s' }}
                  />
                  {alertKey === 'tier3' && TIER3_COUNT > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white animate-pulse"
                      style={{ background: '#b91c1c', fontSize: '9px' }}
                    >
                      {TIER3_COUNT}
                    </span>
                  )}
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-[13px] font-medium whitespace-nowrap"
                      style={{ color: isActive ? '#ffffff' : '#9ca3af' }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Admin avatar + sign out */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid #2d3139' }}>
        <div className="flex items-center gap-3 px-2 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: '#04895f' }}
          >
            A
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="text-white text-[13px] font-semibold">Admin</div>
                <div className="text-[11px]" style={{ color: '#9ca3af' }}>Super Admin</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-200"
          style={{ color: '#9ca3af', background: 'transparent' }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.background = '#232530';
            el.style.color = '#b91c1c';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.background = 'transparent';
            el.style.color = '#9ca3af';
          }}
        >
          <LogOut size={16} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        className="hidden md:flex flex-col h-full flex-shrink-0 overflow-hidden"
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-2 bottom-24 z-50 hidden"
        />
        {sidebarContent}
      </motion.aside>

      {/* Mobile overlay button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: '#1a1d24', border: '1px solid #2d3139' }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={18} color="#ffffff" /> : <Menu size={18} color="#ffffff" />}
      </button>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="md:hidden fixed left-0 top-0 h-full z-50 w-64 flex flex-col"
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
