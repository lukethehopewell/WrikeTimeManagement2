import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Send, 
  CheckCircle2, 
  HardHat, 
  ArrowRight,
  TrendingUp,
  Building,
  RefreshCw
} from 'lucide-react';
import { UserAccount } from '../types';
import { fetchTeamReport } from '../services/wrikeApi';
import { DEFAULT_USERS } from '../services/db';

interface TeamDashboardViewProps {
  currentUser: UserAccount;
  onSwitchUser: (user: UserAccount) => void;
  onSyncAll: () => Promise<void>;
  isSyncing: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  todayHours: number;
  weeklyHours: number;
  targetHours: number;
  status: string;
  currentTask: string;
  pendingSyncCount: number;
}

interface TeamReportData {
  teamId: string;
  teamName: string;
  period: string;
  totalBurnHours: number;
  budgetedHours: number;
  utilizationRate: number;
  billablePercentage: number;
  members: TeamMember[];
}

export const TeamDashboardView: React.FC<TeamDashboardViewProps> = ({
  currentUser,
  onSwitchUser,
  onSyncAll,
  isSyncing,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [report, setReport] = useState<TeamReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rbacError, setRbacError] = useState<string | null>(null);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setRbacError(null);
      const res = await fetchTeamReport(currentUser.role);
      if (!res.authorized) {
        setRbacError(res.error || 'Access Denied: Strict RBAC enforces Administrator role only.');
        setReport(null);
      } else {
        setReport(res.data as TeamReportData);
      }
      setIsLoading(false);
    }
    loadData();
  }, [currentUser.role]);

  // If user is not admin, show RBAC Gate
  if (!isAdmin) {
    const adminUser = DEFAULT_USERS.find((u) => u.role === 'admin') || DEFAULT_USERS[3];

    return (
      <div className="pb-24">
        <div className="rounded-[32px] bg-white dark:bg-[#161D2B] border border-amber-200/80 dark:border-amber-900/40 p-8 shadow-sm text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Administrator Access Restricted
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
            Role-Based Access Control (RBAC) policy prohibits field technicians from accessing cross-team timesheet records and resource budgets. The server strictly enforces HTTP 403 on this endpoint.
          </p>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-left mb-6 text-xs text-amber-900 dark:text-amber-300">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Current Persona: {currentUser.name} ({currentUser.role})</span>
            </div>
            <div>Status: Non-privileged user. Switch persona below to verify admin permissions.</div>
          </div>

          <button
            onClick={() => onSwitchUser(adminUser)}
            className="w-full py-3.5 px-6 rounded-full bg-[#F37F46] hover:bg-[#E26E35] text-white font-extrabold text-sm shadow-lg shadow-[#F37F46]/30 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <span>Switch to {adminUser.name} (Admin Lead)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const handleBatchSync = async () => {
    await onSyncAll();
    setBatchSuccessMsg('Batch synchronization to Wrike REST v4 completed for all team members!');
    setTimeout(() => setBatchSuccessMsg(null), 5000);
  };

  const burnPercent = report
    ? Math.min(100, Math.round((report.totalBurnHours / report.budgetedHours) * 100))
    : 0;

  return (
    <div className="space-y-5 pb-24">
      {/* Top Admin Summary Card */}
      <div className="rounded-[32px] bg-white dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#F37F46]">
              <ShieldCheck className="w-4 h-4" />
              <span>Authorized Team Administrator</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {report?.teamName || 'Clinical Deployment & Field Ops'}
            </h2>
          </div>

          <button
            onClick={handleBatchSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F37F46] hover:bg-[#E26E35] text-white text-xs font-bold shadow-md shadow-[#F37F46]/25 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSyncing ? 'Syncing...' : 'Batch Sync Team to Wrike'}</span>
          </button>
        </div>

        {batchSuccessMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{batchSuccessMsg}</span>
          </div>
        )}

        {/* Burn Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
              Burned Hours
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
              {report?.totalBurnHours.toFixed(1) || '142.5'}
              <span className="text-xs text-slate-400 font-normal"> / {report?.budgetedHours || '180'}h</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
              Utilization Rate
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {report?.utilizationRate || '79.2'}%
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
              Billable Share
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#F37F46] mt-1 tabular-nums">
              {report?.billablePercentage || '84.6'}%
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
              Active Technicians
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
              {report?.members.length || 4}
            </div>
          </div>
        </div>

        {/* Burn Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
            <span>Sprint Budget Consumption</span>
            <span>{burnPercent}% used</span>
          </div>
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-[#F37F46] rounded-full transition-all duration-500"
              style={{ width: `${burnPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Active Field Technician Roster */}
      <div className="rounded-[32px] bg-white dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HardHat className="w-4 h-4 text-[#F37F46]" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Field Technician Live Roster
            </h3>
          </div>
          <span className="text-xs text-slate-400">Real-time status</span>
        </div>

        <div className="space-y-3">
          {report?.members.map((member) => (
            <div
              key={member.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#161D2B] dark:bg-white text-white dark:text-[#161D2B] flex items-center justify-center font-black text-sm shrink-0">
                  {member.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                      {member.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      member.status.includes('Active')
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-xs sm:max-w-md">
                    {member.currentTask}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right shrink-0">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Today</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                    {member.todayHours.toFixed(1)}h
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">This Week</div>
                  <div className="text-sm font-black text-[#F37F46] tabular-nums">
                    {member.weeklyHours.toFixed(1)} / {member.targetHours}h
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
