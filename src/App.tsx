/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserAccount, 
  ThemeMode, 
  TimeLogEntry, 
  TaskCategory, 
  Customer, 
  WrikeTask, 
  WrikeConfig 
} from './types';
import { 
  DEFAULT_USERS, 
  getDB, 
  getTimeLogs, 
  getCategories, 
  getCustomers, 
  getTasks, 
  saveTimeLog, 
  updateTimeLogWithAudit, 
  deleteTimeLog, 
  getPendingSyncQueue,
  saveCategory,
  deleteCategory,
  saveCustomer,
  deleteCustomer
} from './services/db';
import { 
  getWrikeConfig, 
  drainSyncQueue 
} from './services/wrikeApi';
import { 
  checkShiftCutoffReminder, 
  getShiftSettings 
} from './services/notificationService';
import { 
  getSavedGoogleUser, 
  saveGoogleUser, 
  clearGoogleUser 
} from './services/googleAuth';
import { Navbar } from './components/Navbar';
import { FloatingTabBar, NavTabId } from './components/FloatingTabBar';
import { HeroCard } from './components/HeroCard';
import { StopwatchView } from './components/StopwatchView';
import { TimesheetView } from './components/TimesheetView';
import { TeamDashboardView } from './components/TeamDashboardView';
import { AnalyticsView } from './components/AnalyticsView';
import { CategoryManagerView } from './components/CategoryManagerView';
import { WrikeConfigModal } from './components/WrikeConfigModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { GoogleLoginModal } from './components/GoogleLoginModal';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();

  // Root State
  const [currentUser, setCurrentUser] = useState<UserAccount>(DEFAULT_USERS[0]);
  const [theme, setTheme] = useState<ThemeMode>('ember-dark');
  const [activeTab, setActiveTab] = useState<NavTabId>('timer');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Domain Data State
  const [timeLogs, setTimeLogs] = useState<TimeLogEntry[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tasks, setTasks] = useState<WrikeTask[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [dailyTargetHours, setDailyTargetHours] = useState<number>(7.5);

  // Modals
  const [wrikeConfig, setWrikeConfig] = useState<WrikeConfig>({
    permanentToken: '',
    isConnected: false,
    workspaceName: 'NHS Trust Enterprise Digital Workspace',
  });
  const [isWrikeModalOpen, setIsWrikeModalOpen] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false);

  // Sync Theme Classes with document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'contrast-mode');

    if (theme === 'ember-dark' || theme === 'contrast-dark') {
      root.classList.add('dark');
    }
    if (theme === 'contrast-light' || theme === 'contrast-dark') {
      root.classList.add('contrast-mode');
    }
  }, [theme]);

  // Load Initial Data and Saved Google User Session
  const refreshAllData = useCallback(async () => {
    try {
      await getDB();
      const [
        allLogs, 
        allCats, 
        allCusts, 
        allTasks, 
        pendingQueue, 
        shiftSettings, 
        wConfig, 
        savedUser
      ] = await Promise.all([
        getTimeLogs(),
        getCategories(),
        getCustomers(),
        getTasks(),
        getPendingSyncQueue(),
        getShiftSettings(),
        getWrikeConfig(),
        getSavedGoogleUser(),
      ]);

      setTimeLogs(allLogs);
      setCategories(allCats);
      setCustomers(allCusts);
      setTasks(allTasks);
      setPendingSyncCount(pendingQueue.length);
      setDailyTargetHours(shiftSettings.dailyTargetHours || 7.5);
      setWrikeConfig(wConfig);

      if (savedUser) {
        setCurrentUser(savedUser);
      }
    } catch (err) {
      console.error('Failed to load IndexedDB data:', err);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Handle Google Login Success
  const handleGoogleLoginSuccess = async (user: UserAccount) => {
    setCurrentUser(user);
    await saveGoogleUser(user);
    await refreshAllData();
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    await clearGoogleUser();
    setCurrentUser(DEFAULT_USERS[0]);
    await refreshAllData();
  };

  // Background Sync Trigger
  const handleTriggerSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await drainSyncQueue();
      await refreshAllData();
    } catch (err) {
      console.warn('Sync queue drain warning:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshAllData]);

  // Auto-sync on network reconnect
  useEffect(() => {
    const onOnline = () => {
      handleTriggerSync();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [handleTriggerSync]);

  // Periodic Shift Cutoff Evaluation (every 60s)
  useEffect(() => {
    const checkReminder = () => {
      checkShiftCutoffReminder(currentUser.id).catch(() => {});
    };
    checkReminder();
    const interval = window.setInterval(checkReminder, 60000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  // Timelog Handlers
  const handleCommitLog = async (entry: TimeLogEntry) => {
    await saveTimeLog(entry);
    await refreshAllData();
    if (navigator.onLine) {
      handleTriggerSync();
    }
  };

  const handleUpdateLogWithAudit = async (
    id: string,
    newDurationMinutes: number,
    newComment: string,
    reason: string
  ) => {
    await updateTimeLogWithAudit(
      id,
      newDurationMinutes,
      newComment,
      reason,
      currentUser.name
    );
    await refreshAllData();
    if (navigator.onLine) {
      handleTriggerSync();
    }
  };

  const handleDeleteLog = async (id: string) => {
    await deleteTimeLog(id);
    await refreshAllData();
    if (navigator.onLine) {
      handleTriggerSync();
    }
  };

  // Categories Handlers
  const handleSaveCategory = async (cat: TaskCategory) => {
    await saveCategory(cat);
    await refreshAllData();
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    await refreshAllData();
  };

  // Customers Handlers
  const handleSaveCustomer = async (cust: Customer) => {
    await saveCustomer(cust);
    await refreshAllData();
  };

  const handleDeleteCustomer = async (id: string) => {
    await deleteCustomer(id);
    await refreshAllData();
  };

  // Calculate Today's Tracked Minutes & Billable Minutes for Hero Card
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = timeLogs.filter((l) => l.date === todayStr && l.userId === currentUser.id);
  const totalMinutesToday = todayLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
  const billableMinutesToday = todayLogs.reduce((acc, l) => {
    const cat = categories.find((c) => c.id === l.categoryId);
    return cat?.isBillable ? acc + l.durationMinutes : acc;
  }, 0);

  const activeTaskTitle = todayLogs.length > 0 ? todayLogs[0].taskTitle : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#0B0E14] text-[#161D2B] dark:text-slate-100 transition-colors">
      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-bold px-4 py-2 text-center flex items-center justify-center gap-2 shadow-sm">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            Offline Mode: All timelogs and audit records are preserved locally in IndexedDB (WrikeSyncDB_v3) and will auto-reconcile on reconnect.
          </span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        onSelectUser={setCurrentUser}
        onOpenGoogleLogin={() => setIsGoogleModalOpen(true)}
        onSignOut={handleSignOut}
        pendingSyncCount={pendingSyncCount}
        onManualSync={handleTriggerSync}
        isSyncing={isSyncing}
        theme={theme}
        onThemeChange={setTheme}
        onOpenWrikeConfig={() => setIsWrikeModalOpen(true)}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        wrikeConfig={wrikeConfig}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 pt-4 pb-24 space-y-5">
        {/* Top Hero Metric Card */}
        <HeroCard
          totalMinutesToday={totalMinutesToday}
          dailyTargetHours={dailyTargetHours}
          billableMinutesToday={billableMinutesToday}
          activeTaskTitle={activeTaskTitle}
          isTimerRunning={activeTab === 'timer'}
          onQuickStart={() => setActiveTab('timer')}
          onOpenManualModal={() => setActiveTab('timesheet')}
          onStopwatchTab={() => setActiveTab('timer')}
        />

        {/* View Switcher based on Active Tab */}
        {activeTab === 'timer' && (
          <StopwatchView
            currentUser={currentUser}
            customers={customers}
            categories={categories}
            tasks={tasks}
            onCommitLog={handleCommitLog}
            dailyTotalMinutes={totalMinutesToday}
            dailyTargetHours={dailyTargetHours}
          />
        )}

        {activeTab === 'timesheet' && (
          <TimesheetView
            currentUser={currentUser}
            timeLogs={timeLogs}
            categories={categories}
            customers={customers}
            tasks={tasks}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSaveManualLog={handleCommitLog}
            onUpdateLogWithAudit={handleUpdateLogWithAudit}
            onDeleteLog={handleDeleteLog}
            onSyncAll={handleTriggerSync}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'team' && (
          <TeamDashboardView
            currentUser={currentUser}
            onSwitchUser={setCurrentUser}
            onSyncAll={handleTriggerSync}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            currentUser={currentUser}
            timeLogs={timeLogs}
            categories={categories}
            customers={customers}
            onSwitchUser={setCurrentUser}
          />
        )}

        {activeTab === 'taxonomy' && (
          <CategoryManagerView
            currentUser={currentUser}
            categories={categories}
            customers={customers}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onSwitchUser={setCurrentUser}
          />
        )}
      </main>

      {/* Bottom Floating Glass Tab Bar */}
      <FloatingTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={currentUser.role}
        pendingSyncCount={pendingSyncCount}
      />

      {/* Google Account Login Modal */}
      <GoogleLoginModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onLoginSuccess={handleGoogleLoginSuccess}
        currentUser={currentUser}
      />

      {/* Wrike v4 Configuration Modal */}
      <WrikeConfigModal
        isOpen={isWrikeModalOpen}
        onClose={() => setIsWrikeModalOpen(false)}
        config={wrikeConfig}
        onConfigSaved={(updated) => setWrikeConfig(updated)}
      />

      {/* Shift Cutoff Chime & Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onSettingsSaved={() => {
          getShiftSettings().then((s) => setDailyTargetHours(s.dailyTargetHours || 7.5));
        }}
      />
    </div>
  );
}
