import React from 'react';
import { 
  Timer, 
  CalendarDays, 
  Users, 
  BarChart3, 
  Tags,
  Lock
} from 'lucide-react';
import { UserRole } from '../types';

export type NavTabId = 'timer' | 'timesheet' | 'team' | 'analytics' | 'taxonomy';

interface FloatingTabBarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  userRole: UserRole;
  pendingSyncCount: number;
}

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  activeTab,
  onTabChange,
  userRole,
  pendingSyncCount,
}) => {
  const isAdmin = userRole === 'admin';

  const tabs: { id: NavTabId; label: string; icon: React.FC<{ className?: string }>; adminOnly?: boolean }[] = [
    { id: 'timer', label: 'Stopwatch', icon: Timer },
    { id: 'timesheet', label: 'Timesheet', icon: CalendarDays },
    { id: 'team', label: 'Team', icon: Users, adminOnly: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, adminOnly: true },
    { id: 'taxonomy', label: 'Taxonomy', icon: Tags, adminOnly: true },
  ];

  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-[96vw] sm:max-w-md w-full px-2 pointer-events-none">
      <div className="pointer-events-auto mx-auto flex items-center justify-between p-1.5 rounded-full bg-white/90 dark:bg-[#161D2B]/90 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl shadow-black/15">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isRestricted = tab.adminOnly && !isAdmin;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-[#F37F46] text-white shadow-md shadow-[#F37F46]/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isActive ? 'scale-105 stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {tab.id === 'timesheet' && pendingSyncCount > 0 && !isActive && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#F37F46] ring-2 ring-white dark:ring-[#161D2B]" />
                )}
                {isRestricted && (
                  <span className="absolute -top-1.5 -right-2 text-[9px] text-amber-500">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-tight mt-0.5 whitespace-nowrap truncate max-w-[62px] ${
                isActive ? 'text-white' : ''
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
