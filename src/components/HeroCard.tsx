import React from 'react';
import { Clock, Play, Plus, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

interface HeroCardProps {
  totalMinutesToday: number;
  dailyTargetHours: number;
  billableMinutesToday: number;
  activeTaskTitle?: string;
  isTimerRunning: boolean;
  onQuickStart: () => void;
  onOpenManualModal: () => void;
  onStopwatchTab: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  totalMinutesToday,
  dailyTargetHours,
  billableMinutesToday,
  activeTaskTitle,
  isTimerRunning,
  onQuickStart,
  onOpenManualModal,
  onStopwatchTab,
}) => {
  const totalHours = totalMinutesToday / 60;
  const targetMinutes = dailyTargetHours * 60;
  const progressPercent = Math.min(100, Math.round((totalMinutesToday / targetMinutes) * 100));

  const hoursPart = Math.floor(totalMinutesToday / 60);
  const minsPart = totalMinutesToday % 60;
  const formattedTime = `${String(hoursPart).padStart(2, '0')}:${String(minsPart).padStart(2, '0')}`;

  const billableHours = (billableMinutesToday / 60).toFixed(1);
  const billablePercent = totalMinutesToday > 0 ? Math.round((billableMinutesToday / totalMinutesToday) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#F37F46] via-[#E96A2D] to-[#CF5217] text-white p-6 sm:p-7 shadow-xl shadow-[#F37F46]/20">
      {/* Bleeding decorative watermark clock icon */}
      <div 
        className="pointer-events-none absolute -right-6 -bottom-10 opacity-15 select-none text-white"
        aria-hidden="true"
      >
        <Clock className="w-56 h-56 stroke-[1.2]" />
      </div>

      <div className="relative z-10">
        {/* Header Kicker & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-extrabold text-white/80">
              Today's Shift Hours
            </span>
            <span className="text-white/40">·</span>
            <span className="text-xs font-semibold text-white/90">
              Target {dailyTargetHours}h
            </span>
          </div>

          {isTimerRunning ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>LIVE TRACKING</span>
            </div>
          ) : (
            <div className="text-xs text-white/80 font-medium">
              {progressPercent >= 100 ? (
                <span className="flex items-center gap-1 text-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Shift Complete
                </span>
              ) : (
                <span>{(dailyTargetHours - totalHours).toFixed(1)}h remaining</span>
              )}
            </div>
          )}
        </div>

        {/* 64px Bold Numerals Metric */}
        <div className="flex items-baseline gap-3 my-2">
          <div className="text-5xl sm:text-6xl font-black tracking-tight tabular-nums font-mono drop-shadow-sm">
            {formattedTime}
          </div>
          <span className="text-lg font-bold text-white/80">hrs</span>
        </div>

        {/* Target Progress Bar */}
        <div className="mt-3 max-w-md">
          <div className="flex items-center justify-between text-xs font-semibold text-white/90 mb-1.5">
            <span>Progress: {progressPercent}% of {dailyTargetHours}h</span>
            <span>{billablePercent}% Billable ({billableHours}h)</span>
          </div>
          <div className="h-2.5 w-full bg-black/20 rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Active Task or Quick Action pill controls */}
        <div className="mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wider font-bold text-white/70">
              {isTimerRunning ? 'Currently Active Job' : 'Quick Actions'}
            </div>
            <div className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
              {activeTaskTitle || 'No timer currently active'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isTimerRunning ? (
              <button
                onClick={onQuickStart}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#CF5217] hover:bg-white/90 font-bold text-xs shadow-md active:scale-95 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Stopwatch</span>
              </button>
            ) : (
              <button
                onClick={onStopwatchTab}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/25 text-white hover:bg-black/35 font-bold text-xs backdrop-blur-md active:scale-95 transition"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>View Timer</span>
              </button>
            )}

            <button
              onClick={onOpenManualModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md active:scale-95 transition"
              title="Manually log time entry"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Manual</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
