'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { AnimatePresence, motion } from 'framer-motion';

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/crisis': 'Crisis Alerts',
  '/admin/referrals': 'Warm Referrals',
  '/admin/semester-report': 'Semester Report',
  '/admin/feedback': 'User Feedback',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'Admin';

  return (
    <div className="admin-layout flex h-screen overflow-hidden" style={{ background: '#0f1117', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto mt-16 px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
