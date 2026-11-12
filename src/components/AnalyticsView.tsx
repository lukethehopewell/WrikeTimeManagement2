import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  Download, 
  Calendar, 
  Filter, 
  Building2, 
  ShieldAlert,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { 
  TimeLogEntry, 
  TaskCategory, 
  Customer, 
  UserAccount 
} from '../types';
import { DEFAULT_USERS } from '../services/db';

interface AnalyticsViewProps {
  currentUser: UserAccount;
  timeLogs: TimeLogEntry[];
  categories: TaskCategory[];
  customers: Customer[];
  onSwitchUser: (user: UserAccount) => void;
}

type DatePreset = '7days' | '4weeks' | 'thisMonth' | 'lastMonth' | 'qtd' | 'custom';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  currentUser,
  timeLogs,
  categories,
  customers,
  onSwitchUser,
}) => {
  const isAdmin = currentUser.role === 'admin';

  // Preset & Date range states
  const [preset, setPreset] = useState<DatePreset>('7days');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [drilldownSubcategories, setDrilldownSubcategories] = useState<boolean>(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  // Custom range date inputs
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [customStart, setCustomStart] = useState<string>(
    new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customEnd, setCustomEnd] = useState<string>(todayStr);

  // RBAC Protection
  if (!isAdmin) {
    const adminUser = DEFAULT_USERS.find((u) => u.role === 'admin') || DEFAULT_USERS[3];
    return (
      <div className="pb-24">
        <div className="rounded-[32px] bg-white dark:bg-[#161D2B] border border-amber-200/80 dark:border-amber-900/40 p-8 shadow-sm text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Analytics &amp; Financial Reporting Restricted
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
            Client billing, hospital trust burn metrics, and CSV audit downloads are restricted to Administrator accounts.
          </p>
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

  // Calculate actual Date Range from preset
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const end = now.toISOString().split('T')[0];

    if (preset === '7days') {
      const s = new Date(now);
      s.setDate(now.getDate() - 6);
      return { startDate: s.toISOString().split('T')[0], endDate: end };
    }
    if (preset === '4weeks') {
      const s = new Date(now);
      s.setDate(now.getDate() - 27);
      return { startDate: s.toISOString().split('T')[0], endDate: end };
    }
    if (preset === 'thisMonth') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: s.toISOString().split('T')[0], endDate: end };
    }
    if (preset === 'lastMonth') {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: s.toISOString().split('T')[0], endDate: e.toISOString().split('T')[0] };
    }
    if (preset === 'qtd') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const s = new Date(now.getFullYear(), qMonth, 1);
      return { startDate: s.toISOString().split('T')[0], endDate: end };
    }
    return { startDate: customStart, endDate: customEnd };
  }, [preset, customStart, customEnd]);

  // Filter logs by date range & customer
  const filteredLogs = useMemo(() => {
    return timeLogs.filter((log) => {
      if (log.date < startDate || log.date > endDate) return false;
      if (selectedCustomerId !== 'all' && log.customerId !== selectedCustomerId) return false;
      return true;
    });
  }, [timeLogs, startDate, endDate, selectedCustomerId]);

  // Aggregate Metrics
  const totalMinutes = filteredLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
  const totalHours = totalMinutes / 60;

  const billableMinutes = filteredLogs.reduce((acc, l) => {
    const cat = categories.find((c) => c.id === l.categoryId);
    return cat?.isBillable ? acc + l.durationMinutes : acc;
  }, 0);
  const billableHours = billableMinutes / 60;
  const overheadHours = Math.max(0, totalHours - billableHours);
  const billablePercent = totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0;

  // Calculate day difference to determine daily vs weekly bars
  const dayDifference = useMemo(() => {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    return Math.max(1, Math.round((e - s) / (24 * 60 * 60 * 1000))) + 1;
  }, [startDate, endDate]);

  const isDaily = dayDifference <= 14;

  // Aggregate Bar Data (Daily or Weekly)
  const barData = useMemo(() => {
    if (isDaily) {
      // Group by single date YYYY-MM-DD
      const dateMap: Record<string, { label: string; billable: number; overhead: number }> = {};
      const s = new Date(startDate);
      const e = new Date(endDate);

      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const dStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-GB', { weekday: 'narrow', day: 'numeric' });
        dateMap[dStr] = { label: dayLabel, billable: 0, overhead: 0 };
      }

      filteredLogs.forEach((log) => {
        if (dateMap[log.date]) {
          const cat = categories.find((c) => c.id === log.categoryId);
          const hrs = log.durationMinutes / 60;
          if (cat?.isBillable) {
            dateMap[log.date].billable += hrs;
          } else {
            dateMap[log.date].overhead += hrs;
          }
        }
      });

      return Object.entries(dateMap).map(([key, val]) => ({
        key,
        label: val.label,
        billable: val.billable,
        overhead: val.overhead,
        total: val.billable + val.overhead,
      }));
    } else {
      // Group into 7-day weekly buckets
      const buckets: { key: string; label: string; billable: number; overhead: number; total: number }[] = [];
      const s = new Date(startDate);
      const e = new Date(endDate);
      let curr = new Date(s);

      let weekIdx = 1;
      while (curr <= e) {
        const bucketStart = new Date(curr);
        const bucketEnd = new Date(curr);
        bucketEnd.setDate(bucketEnd.getDate() + 6);
        if (bucketEnd > e) bucketEnd.setTime(e.getTime());

        const bStartStr = bucketStart.toISOString().split('T')[0];
        const bEndStr = bucketEnd.toISOString().split('T')[0];

        const label = `W${weekIdx} (${bucketStart.getDate()}/${bucketStart.getMonth() + 1})`;

        const bucketLogs = filteredLogs.filter((l) => l.date >= bStartStr && l.date <= bEndStr);
        let billable = 0;
        let overhead = 0;
        bucketLogs.forEach((l) => {
          const cat = categories.find((c) => c.id === l.categoryId);
          const hrs = l.durationMinutes / 60;
          if (cat?.isBillable) billable += hrs;
          else overhead += hrs;
        });

        buckets.push({
          key: bStartStr,
          label,
          billable,
          overhead,
          total: billable + overhead,
        });

        curr.setDate(curr.getDate() + 7);
        weekIdx++;
      }
      return buckets;
    }
  }, [filteredLogs, startDate, endDate, isDaily, categories]);

  // Aggregate Category / Subcategory Data for Donut Chart
  const donutData = useMemo(() => {
    if (!drilldownSubcategories) {
      // Group by Category
      const catMap: Record<string, { name: string; color: string; hours: number }> = {};
      filteredLogs.forEach((log) => {
        const cat = categories.find((c) => c.id === log.categoryId);
        const name = cat?.name || log.categoryName || 'Other';
        const color = cat?.color || '#F37F46';
        const hrs = log.durationMinutes / 60;
        if (!catMap[name]) catMap[name] = { name, color, hours: 0 };
        catMap[name].hours += hrs;
      });

      return Object.values(catMap).sort((a, b) => b.hours - a.hours);
    } else {
      // Group by Subcategory
      const subMap: Record<string, { name: string; color: string; hours: number }> = {};
      filteredLogs.forEach((log) => {
        const cat = categories.find((c) => c.id === log.categoryId);
        const name = log.subcategoryName || 'Standard / General';
        const color = cat?.color || '#007AFF';
        const hrs = log.durationMinutes / 60;
        if (!subMap[name]) subMap[name] = { name, color, hours: 0 };
        subMap[name].hours += hrs;
      });
      return Object.values(subMap).sort((a, b) => b.hours - a.hours);
    }
  }, [filteredLogs, categories, drilldownSubcategories]);

  // Compute SVG Donut paths
  const donutSegments = useMemo(() => {
    const total = donutData.reduce((acc, d) => acc + d.hours, 0);
    if (total === 0) return [];

    let accumulatedAngle = 0;
    return donutData.map((d) => {
      const sliceAngle = (d.hours / total) * 360;
      const startAngle = accumulatedAngle;
      accumulatedAngle += sliceAngle;
      const percentage = Math.round((d.hours / total) * 100);

      // SVG arc calculations (center 100, 100; outer radius 80, inner radius 50)
      const rOuter = 80;
      const rInner = 52;
      const cx = 100;
      const cy = 100;

      const radStart = (startAngle - 90) * (Math.PI / 180);
      const radEnd = (startAngle + sliceAngle - 90) * (Math.PI / 180);

      const x1 = cx + rOuter * Math.cos(radStart);
      const y1 = cy + rOuter * Math.sin(radStart);
      const x2 = cx + rOuter * Math.cos(radEnd);
      const y2 = cy + rOuter * Math.sin(radEnd);

      const x3 = cx + rInner * Math.cos(radEnd);
      const y3 = cy + rInner * Math.sin(radEnd);
      const x4 = cx + rInner * Math.cos(radStart);
      const y4 = cy + rInner * Math.sin(radStart);

      const largeArc = sliceAngle > 180 ? 1 : 0;

      const pathData = `
        M ${x1} ${y1}
        A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4}
        Z
      `;

      return {
        ...d,
        percentage,
        pathData,
      };
    });
  }, [donutData]);

  // CSV Export Generator
  const handleExportCSV = () => {
    const headers = [
      'Log ID',
      'Date',
      'User Name',
      'Role',
      'Customer Code',
      'Customer Name',
      'Category',
      'Subcategory',
      'Task Title',
      'Decimal Hours',
      'Minutes',
      'Billable Status',
      'Wrike Synced',
      'Comment',
      'Audit Modifications Count',
    ];

    const rows = filteredLogs.map((log) => {
      const cat = categories.find((c) => c.id === log.categoryId);
      const isBillable = cat?.isBillable ? 'Billable' : 'Overhead';
      const cleanComment = (log.comment || '').replace(/"/g, '""');
      return [
        log.id,
        log.date,
        `"${log.userName}"`,
        log.userRole,
        log.customerCode || 'CUST-INT',
        `"${log.customerName || 'Internal'}"`,
        `"${log.categoryName}"`,
        `"${log.subcategoryName || ''}"`,
        `"${log.taskTitle.replace(/"/g, '""')}"`,
        (log.durationMinutes / 60).toFixed(2),
        log.durationMinutes,
        isBillable,
        log.isSyncedToWrike ? 'Synced' : 'Pending',
        `"${cleanComment}"`,
        log.auditHistory?.length || 0,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `timesheet-report-${startDate}-to-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccessMsg(`Exported ${filteredLogs.length} logs to CSV`);
    setTimeout(() => setDownloadSuccessMsg(null), 4000);
  };

  const maxBarValue = Math.max(1, ...barData.map((b) => b.total));

  return (
    <div className="space-y-5 pb-24">
      {/* Top Filter & Export Bar */}
      <div className="rounded-[32px] bg-white dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#F37F46]" />
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Timesheet Analytics &amp; Reporting
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {downloadSuccessMsg && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40 animate-fade-in">
                {downloadSuccessMsg}
              </span>
            )}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 shadow-sm transition active:scale-95"
              title="Download filtered time logs as a formatted CSV file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Data</span>
            </button>
          </div>
        </div>

        {/* Date Presets Pill Selector */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: '7days', label: 'Past 7 Days' },
              { id: '4weeks', label: 'Past 4 Weeks' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'lastMonth', label: 'Last Month' },
              { id: 'qtd', label: 'Quarter to Date' },
              { id: 'custom', label: 'Custom Range' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id as DatePreset)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  preset === p.id
                    ? 'bg-[#F37F46] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs (when 'custom' preset is active) */}
          {preset === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 pt-2 animate-fade-in">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-[#F37F46]" />
                <span>From:</span>
              </div>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
              />
              <span className="text-xs text-slate-400">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
              />
            </div>
          )}

          {/* Customer Filter */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Customer:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCustomerId('all')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                  selectedCustomerId === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                All Customers ({customers.length})
              </button>
              {customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                    selectedCustomerId === c.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {c.code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-[24px] bg-white dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
          <div className="text-[11px] uppercase font-bold text-slate-400">Total Hours</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums font-mono">
            {totalHours.toFixed(1)}h
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{filteredLogs.length} timelog events</div>
        </div>

        <div className="rounded-[24px] bg-white dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
          <div className="text-[11px] uppercase font-bold text-slate-400">Billable Work</div>
          <div className="text-2xl font-black text-[#F37F46] mt-1 tabular-nums font-mono">
            {billableHours.toFixed(1)}h
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{billablePercent}% billable efficiency</div>
        </div>

        <div className="rounded-[24px] bg-white dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
          <div className="text-[11px] uppercase font-bold text-slate-400">Overhead / Internal</div>
          <div className="text-2xl font-black text-slate-600 dark:text-slate-300 mt-1 tabular-nums font-mono">
            {overheadHours.toFixed(1)}h
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Admin, meetings &amp; rest</div>
        </div>

        <div className="rounded-[24px] bg-white dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
          <div className="text-[11px] uppercase font-bold text-slate-400">Interval Span</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1 truncate">
            {isDaily ? `${dayDifference} Days` : `${Math.ceil(dayDifference / 7)} Weeks`}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{startDate} to {endDate}</div>
        </div>
      </div>

      {/* Stacked Bar Chart: Hours Burn */}
      <div className="rounded-[32px] bg-white dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {isDaily ? 'Daily Hours Burn (Stacked)' : 'Weekly Aggregation Burn'}
            </h3>
            <p className="text-xs text-slate-400">
              Interactive stacked bars: Ember (#F37F46) is Billable, Slate (#8E8E93) is Overhead
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F37F46]" />
              <span>Billable</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Overhead</span>
            </span>
          </div>
        </div>

        {/* SVG Stacked Bar Chart */}
        <div className="relative h-56 w-full pt-4">
          <div className="h-44 flex items-end justify-between gap-1 sm:gap-2">
            {barData.map((bar, idx) => {
              const totalHeightPercent = Math.min(100, (bar.total / (maxBarValue * 1.15)) * 100);
              const billableHeightPercent = bar.total > 0 ? (bar.billable / bar.total) * 100 : 0;
              const overheadHeightPercent = 100 - billableHeightPercent;
              const isHovered = hoveredBarIndex === idx;

              return (
                <div
                  key={bar.key}
                  className="relative flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-12 z-20 px-2.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold shadow-xl whitespace-nowrap pointer-events-none animate-fade-in">
                      <div>{bar.key}: {bar.total.toFixed(1)}h Total</div>
                      <div className="text-[9px] text-[#F37F46] font-normal">
                        {bar.billable.toFixed(1)}h billable · {bar.overhead.toFixed(1)}h overhead
                      </div>
                    </div>
                  )}

                  {/* Stacked Bar Pillar */}
                  <div
                    className="w-full max-w-[32px] rounded-t-xl overflow-hidden flex flex-col justify-end transition-all duration-300"
                    style={{ height: `${Math.max(6, totalHeightPercent)}%` }}
                  >
                    {/* Overhead Segment */}
                    {bar.overhead > 0 && (
                      <div
                        className="w-full bg-slate-400 dark:bg-slate-600 transition-colors"
                        style={{ height: `${overheadHeightPercent}%` }}
                      />
                    )}
                    {/* Billable Segment */}
                    {bar.billable > 0 && (
                      <div
                        className="w-full bg-[#F37F46] hover:bg-[#E26E35] transition-colors"
                        style={{ height: `${billableHeightPercent}%` }}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2 truncate max-w-full text-center">
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Donut Chart: Category & Subcategory Breakdown */}
      <div className="rounded-[32px] bg-white dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Category Distribution
            </h3>
            <p className="text-xs text-slate-400">
              Hours breakdown across clinical and operational streams
            </p>
          </div>

          <button
            onClick={() => setDrilldownSubcategories(!drilldownSubcategories)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
              drilldownSubcategories
                ? 'bg-[#F37F46] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {drilldownSubcategories ? 'Viewing Subcategories' : 'Drilldown Subcategories'}
          </button>
        </div>

        {donutData.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No timelogs recorded for this selected range.
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* SVG Donut */}
            <div className="relative w-48 h-48 shrink-0">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                {donutSegments.map((segment, idx) => (
                  <path
                    key={idx}
                    d={segment.pathData}
                    fill={segment.color}
                    className="hover:opacity-85 transition-opacity cursor-pointer"
                  />
                ))}
              </svg>

              {/* Center Donut Hole Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums font-mono">
                  {totalHours.toFixed(1)}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Hours
                </span>
              </div>
            </div>

            {/* Legend & Breakdown List */}
            <div className="flex-1 max-w-md space-y-2 w-full">
              {donutSegments.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 tabular-nums">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      {item.hours.toFixed(1)}h
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white w-10 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
