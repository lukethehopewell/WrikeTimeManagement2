import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Pencil, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  History, 
  Plus, 
  Send,
  Building2,
  Tag,
  FileText,
  UserCheck
} from 'lucide-react';
import { 
  TimeLogEntry, 
  TaskCategory, 
  Customer, 
  WrikeTask, 
  UserAccount, 
  AuditRecord 
} from '../types';

interface TimesheetViewProps {
  currentUser: UserAccount;
  timeLogs: TimeLogEntry[];
  categories: TaskCategory[];
  customers: Customer[];
  tasks: WrikeTask[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onSaveManualLog: (entry: TimeLogEntry) => Promise<void>;
  onUpdateLogWithAudit: (
    id: string, 
    newDurationMinutes: number, 
    newComment: string, 
    reason: string
  ) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
  onSyncAll: () => Promise<void>;
  isSyncing: boolean;
}

export const TimesheetView: React.FC<TimesheetViewProps> = ({
  currentUser,
  timeLogs,
  categories,
  customers,
  tasks,
  selectedDate,
  onSelectDate,
  onSaveManualLog,
  onUpdateLogWithAudit,
  onDeleteLog,
  onSyncAll,
  isSyncing,
}) => {
  // Modal states
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [editingLog, setEditingLog] = useState<TimeLogEntry | null>(null);
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

  // Edit form state
  const [editDurationHours, setEditDurationHours] = useState<string>('1.0');
  const [editComment, setEditComment] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  // Manual log form state
  const defaultCust = customers.find((c) => c.isDefault) || customers[0];
  const [manCustomerId, setManCustomerId] = useState<string>(defaultCust?.id || '');
  const [manTaskId, setManTaskId] = useState<string>(tasks[0]?.id || '');
  const [manCategoryId, setManCategoryId] = useState<string>(categories[0]?.id || '');
  const [manSubcategoryId, setManSubcategoryId] = useState<string>('');
  const [manDurationHours, setManDurationHours] = useState<string>('2.0');
  const [manComment, setManComment] = useState<string>('');

  const manActiveCat = categories.find((c) => c.id === manCategoryId);
  const manSubcategories = manActiveCat?.subcategories || [];

  // Generate 14-day carousel array around today
  const generateDatesCarousel = () => {
    const list: { dateStr: string; dayAbbr: string; dayNum: number; isToday: boolean }[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    for (let i = -7; i <= 6; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const dayAbbr = d.toLocaleDateString('en-GB', { weekday: 'short' });
      const dayNum = d.getDate();

      list.push({
        dateStr: dStr,
        dayAbbr,
        dayNum,
        isToday: dStr === todayStr,
      });
    }
    return list;
  };

  const carouselDates = generateDatesCarousel();

  // Filter logs for selectedDate and currentUser (or all if admin wants)
  const dayLogs = timeLogs.filter((log) => log.date === selectedDate);
  const totalMinutes = dayLogs.reduce((acc, log) => acc + log.durationMinutes, 0);

  // Compute billable minutes
  const billableMinutes = dayLogs.reduce((acc, log) => {
    const cat = categories.find((c) => c.id === log.categoryId);
    return cat?.isBillable ? acc + log.durationMinutes : acc;
  }, 0);

  const pendingSyncLogs = dayLogs.filter((l) => !l.isSyncedToWrike);

  const openEditModal = (log: TimeLogEntry) => {
    setEditingLog(log);
    setEditDurationHours((log.durationMinutes / 60).toFixed(1));
    setEditComment(log.comment);
    setEditReason('');
    setEditError(null);
  };

  const handleCommitEdit = async () => {
    if (!editingLog) return;
    const durNum = parseFloat(editDurationHours);
    if (isNaN(durNum) || durNum <= 0) {
      setEditError('Please enter a valid positive duration in hours.');
      return;
    }
    if (!editReason.trim()) {
      setEditError('Mandatory Audit Policy: You must provide a valid reason for this modification.');
      return;
    }

    const newDurationMinutes = Math.round(durNum * 60);

    try {
      await onUpdateLogWithAudit(
        editingLog.id,
        newDurationMinutes,
        editComment.trim(),
        editReason.trim()
      );
      setEditingLog(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Edit failed';
      setEditError(msg);
    }
  };

  const handleCommitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const durNum = parseFloat(manDurationHours);
    if (isNaN(durNum) || durNum <= 0) {
      alert('Please enter a valid positive duration.');
      return;
    }

    const durationMinutes = Math.round(durNum * 60);
    const selectedTask = tasks.find((t) => t.id === manTaskId);
    const selectedCat = categories.find((c) => c.id === manCategoryId);
    const selectedSub = selectedCat?.subcategories.find((s) => s.id === manSubcategoryId);
    const selectedCust = customers.find((c) => c.id === manCustomerId);

    const now = new Date();
    const startTime = `${selectedDate}T09:00:00.000Z`;
    const endTime = `${selectedDate}T11:00:00.000Z`;

    const entry: TimeLogEntry = {
      id: `manual-log-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      teamId: currentUser.teamId,
      taskId: manTaskId,
      taskTitle: selectedTask?.title || 'Field Activity',
      categoryId: manCategoryId,
      categoryName: selectedCat?.name || 'General',
      subcategoryId: manSubcategoryId || undefined,
      subcategoryName: selectedSub?.name || undefined,
      customerId: manCustomerId,
      customerName: selectedCust?.name || 'Internal',
      customerCode: selectedCust?.code || 'CUST-INT',
      date: selectedDate,
      startTime,
      endTime,
      durationMinutes,
      comment: manComment.trim() || 'Manual field timelog',
      isSyncedToWrike: false,
    };

    await onSaveManualLog(entry);
    setShowManualModal(false);
    setManComment('');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Horizontal Date Carousel */}
      <div className="rounded-[28px] bg-white dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800 p-3 shadow-sm">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <CalendarIcon className="w-3.5 h-3.5 text-[#F37F46]" />
            <span>Select Date</span>
          </div>
          <button
            onClick={() => onSelectDate(new Date().toISOString().split('T')[0])}
            className="text-[11px] font-bold text-[#F37F46] hover:underline"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {carouselDates.map((item) => {
            const isSelected = item.dateStr === selectedDate;
            return (
              <button
                key={item.dateStr}
                onClick={() => onSelectDate(item.dateStr)}
                className={`flex flex-col items-center justify-center min-w-[50px] py-2 px-1.5 rounded-2xl transition shrink-0 ${
                  isSelected
                    ? 'bg-[#F37F46] text-white shadow-md shadow-[#F37F46]/30 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-tight">
                  {item.dayAbbr}
                </span>
                <span className="text-base font-extrabold mt-0.5">
                  {item.dayNum}
                </span>
                {item.isToday && (
                  <span className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-[#F37F46]'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Summary Pill Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-[24px] bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs uppercase font-extrabold text-slate-400">
            Day Total ({selectedDate})
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {(totalMinutes / 60).toFixed(1)} hrs{' '}
            <span className="text-xs font-semibold text-slate-500 font-sans">
              ({billableMinutes > 0 ? (billableMinutes / 60).toFixed(1) : 0}h billable)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingSyncLogs.length > 0 && (
            <button
              onClick={onSyncAll}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F37F46] hover:bg-[#E26E35] text-white text-xs font-bold shadow-md shadow-[#F37F46]/25 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'Syncing...' : `Sync Day (${pendingSyncLogs.length})`}</span>
            </button>
          )}

          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Time Log Entries List */}
      <div className="space-y-2.5">
        {dayLogs.length === 0 ? (
          <div className="rounded-[28px] bg-white dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800 p-8 text-center">
            <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No timelogs recorded for this date
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Start the live stopwatch or tap "Add Entry" to record tasks completed on site.
            </p>
          </div>
        ) : (
          dayLogs.map((log) => {
            const hasAudit = log.auditHistory && log.auditHistory.length > 0;
            const isAuditExpanded = expandedAuditId === log.id;
            const cat = categories.find((c) => c.id === log.categoryId);
            const hoursDecimal = (log.durationMinutes / 60).toFixed(2);

            return (
              <div
                key={log.id}
                className="rounded-[24px] bg-white dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm hover:border-[#F37F46]/40 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Header tags: Customer & Category */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-[#F37F46] flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {log.customerName || log.customerCode || 'Internal'}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat?.color || '#F37F46' }}
                        />
                        {log.categoryName}
                      </span>
                      {hasAudit && (
                        <button
                          onClick={() => setExpandedAuditId(isAuditExpanded ? null : log.id)}
                          className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1 hover:bg-amber-500/20"
                        >
                          <History className="w-2.5 h-2.5" />
                          <span>Edited ({log.auditHistory?.length})</span>
                          <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isAuditExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>

                    {/* Task Title */}
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {log.taskTitle}
                    </h4>

                    {/* Comment */}
                    {log.comment && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                        {log.comment}
                      </p>
                    )}

                    {/* Footer: User & Sync Status */}
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                      <span>Logged by {log.userName}</span>
                      <span>·</span>
                      {log.isSyncedToWrike ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Wrike Synced
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                          <AlertCircle className="w-3 h-3" /> Pending Sync
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: Duration + Edit/Delete actions */}
                  <div className="flex flex-col items-end shrink-0">
                    <div className="text-base font-black text-slate-900 dark:text-white tabular-nums font-mono">
                      {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m
                    </div>
                    <div className="text-[10px] font-medium text-slate-400 tabular-nums">
                      {hoursDecimal} hrs
                    </div>

                    <div className="flex items-center gap-1 mt-2.5">
                      <button
                        onClick={() => openEditModal(log)}
                        className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#F37F46] flex items-center justify-center transition"
                        title="Edit entry with mandatory audit log"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this timelog entry?')) {
                            onDeleteLog(log.id);
                          }
                        }}
                        className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-500 flex items-center justify-center transition"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Audit History Inspection Drawer */}
                {hasAudit && isAuditExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 -mx-4 -mb-4 p-4 rounded-b-[24px]">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
                      <History className="w-3.5 h-3.5 text-amber-500" />
                      <span>Immutable Compliance Audit Trail</span>
                    </div>
                    <div className="space-y-2">
                      {log.auditHistory?.map((audit, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-white dark:bg-[#161D2B] border border-amber-200/60 dark:border-amber-900/40 text-xs"
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {audit.editedBy}
                            </span>
                            <span>{new Date(audit.editedAt).toLocaleString('en-GB')}</span>
                          </div>
                          <div className="text-amber-800 dark:text-amber-300 font-medium text-[11px] mb-1">
                            Reason: "{audit.reason}"
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <span>
                              Duration: {(audit.previousDuration / 60).toFixed(1)}h → {(audit.newDuration / 60).toFixed(1)}h
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Mandatory Audit Edit Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-[32px] bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Edit Timelog Entry
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Compliant Post-Factum Audit Mutation
                  </p>
                </div>
              </div>
            </div>

            {editError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-xs text-red-600 dark:text-red-300">
                {editError}
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Duration (Decimal Hours)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={editDurationHours}
                  onChange={(e) => setEditDurationHours(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#F37F46]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Activity Comment
                </label>
                <textarea
                  rows={2}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#F37F46]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                  <span>Mandatory Edit Reason (Audit Log) *</span>
                </label>
                <input
                  type="text"
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. Adjusted after verifying travel receipts with clinician"
                  className="w-full px-4 py-2.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-5">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="flex-1 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitEdit}
                className="flex-1 py-2.5 rounded-full bg-[#F37F46] hover:bg-[#E26E35] text-white font-bold text-xs shadow-md shadow-[#F37F46]/30"
              >
                Commit Audit &amp; Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Drawer/Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-[32px] bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#F37F46]/20 text-[#F37F46] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Manual Timelog Entry
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Record retroactive site work for {selectedDate}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCommitManual} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer
                </label>
                <div className="relative">
                  <select
                    value={manCustomerId}
                    onChange={(e) => setManCustomerId(e.target.value)}
                    className="w-full min-h-[44px] appearance-none px-4 py-2.5 pr-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F37F46] cursor-pointer"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Wrike Task
                </label>
                <div className="relative">
                  <select
                    value={manTaskId}
                    onChange={(e) => setManTaskId(e.target.value)}
                    className="w-full min-h-[44px] appearance-none px-4 py-2.5 pr-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F37F46] cursor-pointer"
                  >
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={manCategoryId}
                    onChange={(e) => {
                      setManCategoryId(e.target.value);
                      const cat = categories.find((c) => c.id === e.target.value);
                      if (cat && cat.subcategories.length > 0) {
                        setManSubcategoryId(cat.subcategories[0].id);
                      } else {
                        setManSubcategoryId('');
                      }
                    }}
                    className="w-full min-h-[44px] appearance-none px-4 py-2.5 pr-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F37F46] cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.isBillable ? '(Billable)' : '(Overhead)'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {manSubcategories.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subcategory Activity
                  </label>
                  <div className="relative">
                    <select
                      value={manSubcategoryId}
                      onChange={(e) => setManSubcategoryId(e.target.value)}
                      className="w-full min-h-[44px] appearance-none px-4 py-2.5 pr-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F37F46] cursor-pointer"
                    >
                      {manSubcategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} {sub.defaultRate ? `(£${sub.defaultRate}/hr)` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Duration (Hours)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={manDurationHours}
                  onChange={(e) => setManDurationHours(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Task description..."
                  value={manComment}
                  onChange={(e) => setManComment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#F37F46] hover:bg-[#E26E35] text-white font-bold text-xs shadow-md shadow-[#F37F46]/30"
                >
                  Save to Timesheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
