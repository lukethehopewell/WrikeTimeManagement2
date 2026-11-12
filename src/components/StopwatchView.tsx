import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Check, 
  Building2, 
  Briefcase, 
  Tag, 
  FileText, 
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';
import { 
  Customer, 
  TaskCategory, 
  WrikeTask, 
  TimeLogEntry, 
  UserAccount 
} from '../types';

interface StopwatchViewProps {
  currentUser: UserAccount;
  customers: Customer[];
  categories: TaskCategory[];
  tasks: WrikeTask[];
  onCommitLog: (entry: TimeLogEntry) => Promise<void>;
  dailyTotalMinutes: number;
  dailyTargetHours: number;
}

export const StopwatchView: React.FC<StopwatchViewProps> = ({
  currentUser,
  customers,
  categories,
  tasks,
  onCommitLog,
  dailyTotalMinutes,
  dailyTargetHours,
}) => {
  // Timer state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Form selections - DROPDOWN BASED
  const defaultCust = customers.find((c) => c.isDefault) || customers[0];
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(defaultCust?.id || '');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Sync category when task is changed
  useEffect(() => {
    const task = tasks.find((t) => t.id === selectedTaskId);
    if (task) {
      if (task.categoryId) setSelectedCategoryId(task.categoryId);
      if (task.subcategoryId) setSelectedSubcategoryId(task.subcategoryId);
    }
  }, [selectedTaskId, tasks]);

  // Sync subcategory options when category changes
  const activeCategory = categories.find((c) => c.id === selectedCategoryId);
  const availableSubcategories = activeCategory?.subcategories || [];

  useEffect(() => {
    if (availableSubcategories.length > 0) {
      if (!availableSubcategories.find((s) => s.id === selectedSubcategoryId)) {
        setSelectedSubcategoryId(availableSubcategories[0].id);
      }
    } else {
      setSelectedSubcategoryId('');
    }
  }, [selectedCategoryId, availableSubcategories, selectedSubcategoryId]);

  // Timer interval ticker
  useEffect(() => {
    let interval: number | undefined;
    if (isRunning) {
      interval = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const handleStart = () => {
    if (!startTime) {
      setStartTime(new Date());
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setStartTime(null);
  };

  const handleStopAndCommit = async () => {
    if (elapsedSeconds < 10) {
      alert('Timelog must be at least 10 seconds to save.');
      return;
    }

    setIsSubmitting(true);
    setIsRunning(false);

    try {
      const now = new Date();
      const start = startTime || new Date(now.getTime() - elapsedSeconds * 1000);
      const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

      const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
      const selectedTask = tasks.find((t) => t.id === selectedTaskId);
      const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
      const selectedSubcategory = selectedCategory?.subcategories.find((s) => s.id === selectedSubcategoryId);

      const entry: TimeLogEntry = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        teamId: currentUser.teamId,
        taskId: selectedTaskId,
        taskTitle: selectedTask?.title || 'General Field Task',
        categoryId: selectedCategoryId,
        categoryName: selectedCategory?.name || 'General',
        subcategoryId: selectedSubcategoryId || undefined,
        subcategoryName: selectedSubcategory?.name || undefined,
        customerId: selectedCustomerId,
        customerName: selectedCustomer?.name || 'Internal',
        customerCode: selectedCustomer?.code || 'CUST-INT',
        date: start.toISOString().split('T')[0],
        startTime: start.toISOString(),
        endTime: now.toISOString(),
        durationMinutes,
        comment: notes.trim() || 'Tracked via live mobile stopwatch',
        isSyncedToWrike: false,
      };

      await onCommitLog(entry);

      // Reset
      setElapsedSeconds(0);
      setStartTime(null);
      setNotes('');
      setFeedbackMsg(`Successfully committed ${durationMinutes}m to IndexedDB & queued for Wrike sync!`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save timelog';
      alert(`Error saving log: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Responsive Grid: Stacks on mobile, 2-column split on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Stopwatch Controller Card (Column 1-7 on desktop) */}
        <div className="md:col-span-7 rounded-[32px] bg-white dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm text-center flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-4">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-[#F37F46] animate-ping' : 'bg-slate-400'}`} />
              <span>{isRunning ? 'Timer Running' : elapsedSeconds > 0 ? 'Timer Paused' : 'Ready to Track'}</span>
            </div>

            {/* High Precision Timer Numerals */}
            <div className="text-6xl sm:text-7xl font-black tabular-nums font-mono tracking-tight text-slate-900 dark:text-white my-3">
              {formatTimer(elapsedSeconds)}
            </div>

            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 mb-8">
              {Math.round(elapsedSeconds / 60)} minutes elapsed · {((elapsedSeconds / 3600)).toFixed(2)} decimal hours
            </div>
          </div>

          {/* Primary Controls */}
          <div>
            <div className="flex items-center justify-center gap-3 max-w-xs mx-auto">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="flex-1 flex items-center justify-center gap-2 h-14 min-h-[48px] rounded-full bg-[#F37F46] hover:bg-[#E26E35] text-white font-extrabold text-base shadow-lg shadow-[#F37F46]/30 active:scale-95 transition"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{elapsedSeconds > 0 ? 'Resume' : 'Start Timer'}</span>
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex-1 flex items-center justify-center gap-2 h-14 min-h-[48px] rounded-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-base shadow-lg shadow-amber-500/30 active:scale-95 transition"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause</span>
                </button>
              )}

              {elapsedSeconds > 0 && (
                <>
                  <button
                    onClick={handleStopAndCommit}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 h-14 min-h-[48px] rounded-full bg-[#161D2B] dark:bg-white text-white dark:text-[#161D2B] font-extrabold text-base shadow-lg active:scale-95 transition"
                    title="Commit timelog entry"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Save</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="w-14 h-14 min-w-[48px] min-h-[48px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center active:scale-95 transition"
                    title="Reset timer"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {feedbackMsg && (
              <div className="mt-4 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/40 inline-flex items-center gap-1.5 animate-fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>{feedbackMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Job Configuration Dropdowns Form (Column 8-12 on desktop) */}
        <div className="md:col-span-5 rounded-[28px] bg-white dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              Job Configuration
            </span>
            <span className="text-xs text-[#F37F46] font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Wrike Sync
            </span>
          </div>

          {/* Customer Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#F37F46]" />
              <span>Customer / Trust</span>
            </label>
            <div className="relative">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full min-h-[44px] appearance-none px-4 py-2.5 pr-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F37F46] cursor-pointer"
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

          {/* Task Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#F37F46]" />
              <span>Wrike Task</span>
            </label>
            <div className="relative">
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full min-h-[44px] appearance-none px-4 py-2.5 pr-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F37F46] cursor-pointer"
              >
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.folderOrProject})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#F37F46]" />
              <span>Category</span>
            </label>
            <div className="relative">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full min-h-[44px] appearance-none px-4 py-2.5 pr-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F37F46] cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.isBillable ? '· (Billable)' : '· (Overhead)'}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Subcategory Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#F37F46]" />
              <span>Subcategory Activity</span>
            </label>
            <div className="relative">
              <select
                value={selectedSubcategoryId}
                onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                disabled={availableSubcategories.length === 0}
                className="w-full min-h-[44px] appearance-none px-4 py-2.5 pr-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F37F46] cursor-pointer disabled:opacity-50"
              >
                {availableSubcategories.length === 0 ? (
                  <option value="">No subcategories available</option>
                ) : (
                  availableSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} {sub.defaultRate ? `(£${sub.defaultRate}/hr)` : ''}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Notes input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Activity Notes</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bedside PACS viewer configured on Ward 4B..."
              className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F37F46]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
