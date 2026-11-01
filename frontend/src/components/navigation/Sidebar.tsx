import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Brain, Settings, FileText,
  Bell, Activity, Stethoscope, LogOut, AlertTriangle, ChevronRight, UserRound,
} from 'lucide-react';
import { useAppStore } from '@hooks/useAppStore';

const ROLE_BADGE: Record<string, string> = {
  admin:     'bg-violet-500/20 text-violet-300',
  physician: 'bg-blue-500/20 text-blue-300',
  staff:     'bg-amber-500/20 text-amber-300',
};

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export const Sidebar = () => {
  const user   = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const navigate = useNavigate();

  const adminNavItems = [
    { path: '/admin',               label: 'Dashboard',        icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { path: '/admin/users',         label: 'User Management',  icon: <Users className="w-[18px] h-[18px]" /> },
    { path: '/admin/patients',      label: 'Patients',         icon: <UserRound className="w-[18px] h-[18px]" /> },
    { path: '/admin/ai',            label: 'AI Data',          icon: <Brain className="w-[18px] h-[18px]" /> },
    { path: '/admin/config',        label: 'AI Configuration', icon: <Settings className="w-[18px] h-[18px]" /> },
    { path: '/admin/audit',         label: 'Audit Logs',       icon: <FileText className="w-[18px] h-[18px]" /> },
    { path: '/admin/notifications', label: 'Notifications',    icon: <Bell className="w-[18px] h-[18px]" /> },
  ];

  const physicianNavItems = [
    { path: '/physician', label: 'Triage Queue', icon: <Activity className="w-[18px] h-[18px]" /> },
  ];

  const staffNavItems = [
    { path: '/staff', label: 'Alert Board', icon: <AlertTriangle className="w-[18px] h-[18px]" /> },
  ];

  const navItems =
    user?.role === 'admin'    ? adminNavItems :
    user?.role === 'staff'    ? staffNavItems :
    physicianNavItems;

  return (
    <aside className="w-64 min-h-screen flex flex-col shadow-sidebar relative" style={{ background: 'linear-gradient(180deg, #0F172A 0%, #0B1120 100%)' }}>

      {/* Brand */}
      <div className="px-6 pt-6 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-mint/15 rounded-xl flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-mint" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">AWAN</h1>
            <p className="text-[10px] text-gray-500 -mt-0.5 tracking-widest uppercase">Emergency Triage</p>
          </div>
        </div>
      </div>

      {/* User card */}
      {user && (
        <div className="mx-4 mt-4 mb-2 px-3 py-3 bg-white/[0.05] rounded-xl border border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-mint/30 to-mint/10 flex items-center justify-center text-mint font-bold text-sm flex-shrink-0">
              {getInitials(user.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.fullName}</p>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${ROLE_BADGE[user.role] ?? 'bg-gray-500/20 text-gray-300'}`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin' || item.path === '/physician'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm relative ${
                isActive
                  ? 'bg-mint/15 text-white'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-white/[0.05]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-mint rounded-r-full" />
                )}
                <span className={`transition-colors ${isActive ? 'text-mint' : 'text-gray-500 group-hover:text-gray-300'}`}>
                  {item.icon}
                </span>
                <span className="font-medium flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-mint/60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 pt-3 border-t border-white/[0.06] space-y-0.5">
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
          <span className="text-xs text-gray-500">System Online</span>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-gray-100 hover:bg-white/[0.05] transition-all duration-150"
        >
          <LogOut className="w-[18px] h-[18px] text-gray-500" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>

    </aside>
  );
};
