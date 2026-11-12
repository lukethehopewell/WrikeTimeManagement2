import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import { ShiftCutoffSettings } from '../types';
import { 
  getShiftSettings, 
  saveShiftSettings, 
  playShiftChime, 
  requestNotificationPermission, 
  dispatchNativeNotification 
} from '../services/notificationService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const [settings, setSettings] = useState<ShiftCutoffSettings | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [testChimePlaying, setTestChimePlaying] = useState<boolean>(false);
  const [savedMsg, setSavedMsg] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      getShiftSettings().then(setSettings);
      if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
      }
    }
  }, [isOpen]);

  if (!isOpen || !settings) return null;

  const handleTestChime = () => {
    setTestChimePlaying(true);
    playShiftChime();
    setTimeout(() => setTestChimePlaying(false), 800);
  };

  const handleRequestPush = async () => {
    const granted = await requestNotificationPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
    if (granted) {
      dispatchNativeNotification(
        'Notification Test',
        'Shift cutoff alerts will be dispatched here daily when your 7.5h target is incomplete.'
      );
    }
  };

  const handleSave = async () => {
    await saveShiftSettings(settings);
    setSavedMsg(true);
    if (onSettingsSaved) onSettingsSaved();
    setTimeout(() => {
      setSavedMsg(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-[32px] bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-full bg-[#F37F46]/20 text-[#F37F46] flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Shift Cutoff &amp; Chime Scheduler
            </h3>
            <p className="text-[11px] text-slate-400">
              Web Audio Synthesis &amp; Daily Activity Reminders
            </p>
          </div>
        </div>

        {savedMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Shift settings updated!</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Enable Cutoff Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Daily Shift Cutoff Reminder
              </div>
              <div className="text-[11px] text-slate-400">
                Rings when logged hours are below target
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="w-5 h-5 rounded text-[#F37F46] focus:ring-[#F37F46] cursor-pointer"
            />
          </div>

          {/* Cutoff Hour & Target Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cutoff Time
              </label>
              <select
                value={settings.cutoffHour}
                onChange={(e) => setSettings({ ...settings, cutoffHour: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
              >
                {[15, 16, 17, 18, 19, 20].map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}:00 ({hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Shift Target (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="12"
                value={settings.dailyTargetHours}
                onChange={(e) => setSettings({ ...settings, dailyTargetHours: parseFloat(e.target.value) || 7.5 })}
                className="w-full px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Audio Chime preview */}
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#F37F46]" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Synthesized Dual-Tone Chime
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.audioChimeEnabled}
                onChange={(e) => setSettings({ ...settings, audioChimeEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-[#F37F46] focus:ring-[#F37F46]"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Web Audio Oscillator: 587.33 Hz (D5, 0.18s) + 880.00 Hz (A5, 0.28s). Offline resilient.
            </p>
            <button
              type="button"
              onClick={handleTestChime}
              className={`w-full py-2 px-3 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                testChimePlaying
                  ? 'bg-[#F37F46] text-white scale-98'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{testChimePlaying ? 'Chiming...' : 'Preview Dual-Tone Chime'}</span>
            </button>
          </div>

          {/* Web Push Notification */}
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Web Push Notifications
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                permissionStatus === 'granted'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
              }`}>
                {permissionStatus}
              </span>
            </div>

            {permissionStatus !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPush}
                className="w-full py-2 px-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition"
              >
                Enable Push Notifications
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-full bg-[#F37F46] hover:bg-[#E26E35] text-white font-bold text-xs shadow-md shadow-[#F37F46]/30"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
