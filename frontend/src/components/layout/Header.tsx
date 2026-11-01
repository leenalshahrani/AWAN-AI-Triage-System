import { Search, Bell, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@hooks/useAppStore';
import { useState, useEffect } from 'react';
import { clinicalService } from '@services/clinical.service';

const PAGE_TITLES: Record<string, string> = {
  '/admin':               'Dashboard',
  '/admin/users':         'User Management',
  '/admin/ai':            'AI Data Management',
  '/admin/config':        'AI Configuration',
  '/admin/audit':         'Audit Logs',
  '/admin/notifications': 'Notifications',
  '/admin/patients':      'Patients',
  '/physician':           'Triage Queue',
  '/staff':               'Alert Board',
};

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const ROLE_STYLE: Record<string, string> = {
  admin:     'bg-violet-100 text-violet-700',
  physician: 'bg-blue-100 text-blue-700',
  staff:     'bg-amber-100 text-amber-700',
};

export const Header = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = useAppStore((s) => s.user);
  const [unreadCount, setUnreadCount] = useState(0);

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'AWAN';
  const initials  = user?.fullName ? getInitials(user.fullName) : 'AU';
  const today     = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const dismissed = new Set<string>(JSON.parse(localStorage.getItem('dismissed_notifs') ?? '[]'));
    const readAll   = localStorage.getItem('notifs_read_all') === 'true';

    const fetchCount = async () => {
      try {
        const [logs, cases] = await Promise.all([
          clinicalService.getAuditLogs(),
          clinicalService.getAllCases(),
        ]);
        const criticalCases = (cases as { entry_id: number; risk_color?: string; validated: boolean }[])
          .filter((c) => c.risk_color === 'Red' && !c.validated && !dismissed.has(`case-${c.entry_id}`));
        const unreadLogs = !readAll
          ? (logs as { id: number; status: string }[])
              .filter((l) => l.status === 'Critical' && !dismissed.has(`log-${l.id}`))
          : [];
        setUnreadCount(criticalCases.length + unreadLogs.length);
      } catch { /* ignore */ }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user?.role]);

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3.5 sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between gap-6">

        {/* Page title */}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 leading-tight truncate">{pageTitle}</h2>
          <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{today}</p>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-sm hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint/50 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">

          {/* Notification bell */}
          <button
            className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors group"
            onClick={() => navigate('/admin/notifications')}
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-critical text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-critical rounded-full border-2 border-white" />
            )}
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-2" />

          {/* User */}
          <button className="flex items-center gap-2.5 pl-1 pr-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors group">
            <div className="w-8 h-8 bg-gradient-to-br from-mint to-mint/60 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 leading-none">{user?.fullName ?? 'Admin User'}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${ROLE_STYLE[user?.role ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
                {user?.role ?? ''}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

        </div>
      </div>
    </header>
  );
};
