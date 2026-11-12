import { ShiftCutoffSettings } from '../types';
import { getSetting, setSetting, getTimeLogs } from './db';

const SETTINGS_KEY = 'shift_cutoff_settings';

export const DEFAULT_SHIFT_SETTINGS: ShiftCutoffSettings = {
  enabled: true,
  cutoffHour: 17, // 17:00 (5:00 PM)
  dailyTargetHours: 7.5,
  audioChimeEnabled: true,
  pushNotificationsEnabled: true,
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Synthesizes the exact dual-tone chime:
 * Tone 1: 587.33 Hz (D5) for 0.18s
 * Tone 2: 880.00 Hz (A5) for 0.28s
 * Exponential gain decay, no external audio file dependencies.
 */
export function playShiftChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Tone 2: 880.00 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.16);
    gain2.gain.setValueAtTime(0.3, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.16 + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.16 + 0.28);
  } catch (err) {
    console.warn('Web Audio chime playback not available:', err);
  }
}

/**
 * Request system notification permissions
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export async function dispatchNativeNotification(title: string, body: string): Promise<void> {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
      });
    } catch {
      // Fallback for some service worker contexts
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification(title, { body, icon: '/icon.svg' });
      }
    }
  }
}

export async function getShiftSettings(): Promise<ShiftCutoffSettings> {
  return await getSetting<ShiftCutoffSettings>(SETTINGS_KEY, DEFAULT_SHIFT_SETTINGS);
}

export async function saveShiftSettings(settings: ShiftCutoffSettings): Promise<void> {
  await setSetting(SETTINGS_KEY, settings);
}

// Track last triggered date string to avoid spamming the user on the same day
let lastNotifiedDate = '';

/**
 * Evaluates whether shift cutoff alert should fire
 */
export async function checkShiftCutoffReminder(userId: string): Promise<boolean> {
  const settings = await getShiftSettings();
  if (!settings.enabled) return false;

  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = now.toISOString().split('T')[0];

  // Only trigger once per day when current hour has reached or passed cutoffHour
  if (currentHour >= settings.cutoffHour && lastNotifiedDate !== todayStr) {
    const todayLogs = await getTimeLogs({ userId, date: todayStr });
    const totalMinutes = todayLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
    const totalHours = totalMinutes / 60;

    if (totalHours < settings.dailyTargetHours) {
      lastNotifiedDate = todayStr;

      const trackedHours = Math.floor(totalMinutes / 60);
      const trackedMins = totalMinutes % 60;
      const hoursText = `${trackedHours}h ${trackedMins}m`;
      const targetText = `${settings.dailyTargetHours}h`;

      if (settings.audioChimeEnabled) {
        playShiftChime();
      }

      if (settings.pushNotificationsEnabled) {
        dispatchNativeNotification(
          'Shift Cutoff Reminder',
          `Time to log your daily activity: You have tracked ${hoursText} of your ${targetText} target today.`
        );
      }

      return true;
    }
  }

  return false;
}
