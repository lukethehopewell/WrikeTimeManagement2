import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Bell, 
  Settings2, 
  Sun, 
  Moon, 
  Check, 
  ShieldCheck, 
  HardHat,
  Download,
  Smartphone,
  LogIn,
  LogOut,
  ChevronDown,
  X
} from 'lucide-react';
import { UserAccount, ThemeMode, WrikeConfig } from '../types';
import { DEFAULT_USERS } from '../services/db';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface NavbarProps {
  currentUser: UserAccount;
  onSelectUser: (user: UserAccount) => void;
  onOpenGoogleLogin: () => void;
  onSignOut: () => void;
  pendingSyncCount: number;
  onManualSync: () => void;
  isSyncing: boolean;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onOpenWrikeConfig: () => void;
  onOpenNotifications: () => void;
  wrikeConfig: WrikeConfig;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSelectUser,
  onOpenGoogleLogin,
  onSignOut,
  pendingSyncCount,
  onManualSync,
  isSyncing,
  theme,
  onThemeChange,
  onOpenWrikeConfig,
  onOpenNotifications,
  wrikeConfig,
}) => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const handleGetTheAppClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowInstallGuide(true);
    }
  };

  const themeLabels: Record<ThemeMode, { label: string; desc: string }> = {
    'ember-light': { label: 'Ember Light', desc: 'Pearl canvas & Ember' },
    'ember-dark': { label: 'Ember Dark', desc: 'Deep slate & Ember glow' },
    'contrast-light': { label: 'Outdoor Contrast', desc: 'High sunlight legibility' },
    'contrast-dark': { label: 'OLED Night', desc: 'True black energy saver' },
  };

  const isGoogleAccount = currentUser.id.startsWith('guser-') || currentUser.email.includes('@');

  return (
    <header className="sticky top-0 z-30 border-b border-black/[0.06] dark:border-white/[0.08] bg-white/90 dark:bg-[#0B0E14]/90 backdrop-blur-md px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#F37F46] flex items-center justify-center text-white shadow-md shadow-[#F37F46]/25">
            <span className="font-extrabold text-sm tracking-tighter">W</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-[#161D2B] dark:text-white leading-tight">
                Wrike<span className="text-[#F37F46]">Sync</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F37F46]/10 text-[#F37F46] dark:bg-[#F37F46]/20">
                v4
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[130px] sm:max-w-none">
              Remote Work &amp; Timesheets
            </span>
          </div>
        </div>

        {/* Action Controls & User Identity */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Connectivity Pill */}
          <div 
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isOnline 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40' 
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
            }`}
            title={isOnline ? 'Online: Live sync enabled' : 'Offline: Local IndexedDB queue active'}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Sync Queue Pill Button */}
          <button
            onClick={onManualSync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition border ${
              pendingSyncCount > 0
                ? 'bg-[#F37F46]/10 hover:bg-[#F37F46]/20 text-[#F37F46] border-[#F37F46]/30 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            title="Click to drain IndexedDB sync queue to Wrike"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {isSyncing ? 'Syncing...' : pendingSyncCount > 0 ? `${pendingSyncCount} Pending` : 'Synced'}
            </span>
          </button>

          {/* Shift Cutoff Chime Modal Trigger */}
          <button
            onClick={onOpenNotifications}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Shift cutoff chime & daily reminder settings"
            aria-label="Shift cutoff settings"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Wrike Configuration Trigger */}
          <button
            onClick={onOpenWrikeConfig}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
              wrikeConfig.isConnected
                ? 'bg-[#F37F46]/10 text-[#F37F46] hover:bg-[#F37F46]/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
            title="Wrike v4 REST API permanent token setup"
            aria-label="Wrike Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {/* Theme Selector Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Change theme mode"
              aria-label="Theme selector"
            >
              {theme.includes('dark') ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {showThemeDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Theme Appearance
                </div>
                {(Object.keys(themeLabels) as ThemeMode[]).map((tKey) => (
                  <button
                    key={tKey}
                    onClick={() => {
                      onThemeChange(tKey);
                      setShowThemeDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                      theme === tKey
                        ? 'bg-[#F37F46]/10 text-[#F37F46] font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div>{themeLabels[tKey].label}</div>
                      <div className="text-[10px] text-slate-400">{themeLabels[tKey].desc}</div>
                    </div>
                    {theme === tKey && <Check className="w-3.5 h-3.5 text-[#F37F46]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 'Get the App' Mobile & Desktop Install Button */}
          {!isInstalled && (
            <button
              onClick={handleGetTheAppClick}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F37F46] hover:bg-[#E26E35] text-white shadow-sm transition active:scale-95 shrink-0"
              title="Install mobile progressive web app"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Get the App</span>
            </button>
          )}

          {/* User Profile / Google Account Login Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="User profile & Google Login"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-[#161D2B] dark:bg-white text-white dark:text-[#161D2B] flex items-center justify-center text-xs font-bold shrink-0">
                {currentUser.avatarUrl && currentUser.avatarUrl.startsWith('http') ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline truncate max-w-[85px]">
                {currentUser.name.split(' ')[0]}
              </span>
              {currentUser.role === 'admin' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-[#F37F46]" />
              ) : (
                <HardHat className="w-3.5 h-3.5 text-blue-500" />
              )}
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50">
                {/* Current Active Account Header */}
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {currentUser.avatarUrl && currentUser.avatarUrl.startsWith('http') ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      currentUser.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email}
                    </div>
                    <div className="mt-0.5">
                      {currentUser.role === 'admin' ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#F37F46]/10 text-[#F37F46]">
                          Administrator Lead
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                          Field Technician
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Switch to Google Login Modal */}
                <div className="py-2 space-y-1">
                  <button
                    onClick={() => {
                      onOpenGoogleLogin();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 transition flex items-center gap-2"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Google Account Sign-In / Switch</span>
                  </button>
                </div>

                {/* Fast Persona Switcher for Testing */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Demo Personas (RBAC Testing)
                  </div>
                  <div className="space-y-1">
                    {DEFAULT_USERS.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSelectUser(user);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full text-left p-1.5 rounded-xl text-[11px] flex items-center gap-2 transition ${
                          currentUser.id === user.id
                            ? 'bg-[#F37F46]/10 text-[#F37F46] font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {user.name.charAt(0)}
                        </span>
                        <span className="truncate flex-1">{user.name}</span>
                        <span className="text-[9px] opacity-75">
                          {user.role === 'admin' ? 'Admin' : 'Tech'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sign Out Option */}
                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      onSignOut();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Reset / Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile PWA Installation Guidance Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-[32px] bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-[#F37F46]/20 text-[#F37F46] flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Install WrikeSync App
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Get one-tap offline access, synthesized chimes, and full-screen mobile view without browser bars.
            </p>

            {isIOS ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2 mb-4">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  Safari on iPhone / iPad:
                </div>
                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-[#F37F46] text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  <span>Tap the <strong>Share</strong> icon in the bottom toolbar.</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-[#F37F46] text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  <span>Scroll down and select <strong>Add to Home Screen</strong>.</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2 mb-4">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  Chrome on Android / Desktop:
                </div>
                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-[#F37F46] text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  <span>Tap the <strong>Menu (⋮)</strong> in your browser's top right corner.</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-[#F37F46] text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  <span>Tap <strong>Add to Home screen</strong> or <strong>Install app</strong>.</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 rounded-full bg-[#F37F46] hover:bg-[#E26E35] text-white font-bold text-xs shadow-md shadow-[#F37F46]/30 transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
