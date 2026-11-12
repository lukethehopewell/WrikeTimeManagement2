import React, { useState, useEffect, useRef } from 'react';
import { 
  LogIn, 
  ShieldCheck, 
  HardHat, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Key, 
  X,
  UserCheck
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { 
  parseJwt, 
  determineRoleForEmail, 
  createGoogleUserAccount, 
  getGoogleClientId, 
  saveGoogleClientId 
} from '../services/googleAuth';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  currentUser: UserAccount;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
}) => {
  const [clientId, setClientId] = useState<string>('');
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [customRole, setCustomRole] = useState<UserRole>('field_technician');
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      getGoogleClientId().then((id) => setClientId(id || ''));
    }
  }, [isOpen]);

  // Initialize GIS if client ID is set and Google script is loaded
  useEffect(() => {
    if (!isOpen) return;

    const activeClientId = clientId || (window as unknown as { GOOGLE_CLIENT_ID?: string }).GOOGLE_CLIENT_ID;

    if (activeClientId && window.google?.accounts?.id && googleBtnContainerRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: activeClientId,
          callback: async (response: { credential: string }) => {
            const payload = parseJwt(response.credential);
            if (payload) {
              const role = await determineRoleForEmail(payload.email);
              const user = createGoogleUserAccount(payload, role);
              onLoginSuccess(user);
              onClose();
            }
          },
        });

        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'signin_with',
          shape: 'pill',
        });
      } catch (err) {
        console.warn('GIS button render skipped:', err);
      }
    }
  }, [isOpen, clientId, onLoginSuccess, onClose]);

  if (!isOpen) return null;

  const handleQuickLogin = async (name: string, email: string, avatarUrl?: string) => {
    const role = await determineRoleForEmail(email);
    const user = createGoogleUserAccount({ name, email, picture: avatarUrl }, role);
    onLoginSuccess(user);
    onClose();
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    const user = createGoogleUserAccount(
      {
        name: customName.trim() || customEmail.split('@')[0],
        email: customEmail.trim(),
      },
      customRole
    );
    onLoginSuccess(user);
    onClose();
  };

  const handleSaveClientId = async () => {
    await saveGoogleClientId(clientId.trim());
    setShowConfig(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-[32px] bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Google Account Login
              </h3>
              <p className="text-[11px] text-slate-400">
                Sign in with Google Identity Services
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live GIS Button container if Client ID is configured */}
        {clientId && (
          <div className="mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center">
            <div ref={googleBtnContainerRef} className="my-1" />
            <div className="text-[10px] text-slate-400 mt-1">Live Google Identity Services OAuth</div>
          </div>
        )}

        {/* Instant 1-Click Verification / Demo Logins */}
        <div className="space-y-2 mb-4">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
            Instant Google Sign-In Profiles
          </div>

          {/* User's email profile: Luke Hopewell (Admin) */}
          <button
            onClick={() =>
              handleQuickLogin(
                'Luke Hopewell',
                'luke1hopewell@hotmail.com',
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
              )
            }
            className="w-full text-left p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/50 transition flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                LH
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  Luke Hopewell
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  luke1hopewell@hotmail.com
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white flex items-center gap-1 shrink-0">
              <ShieldCheck className="w-3 h-3" />
              <span>Admin Lead</span>
            </span>
          </button>

          {/* Alex Rivera (Field Tech) */}
          <button
            onClick={() =>
              handleQuickLogin(
                'Alex Rivera',
                'alex.rivera@medtech.nhs.uk',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80'
              )
            }
            className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                AR
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  Alex Rivera
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  alex.rivera@medtech.nhs.uk
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0">
              <HardHat className="w-3 h-3 text-blue-500" />
              <span>Field Tech</span>
            </span>
          </button>
        </div>

        {/* Custom Google Account Login Form */}
        <form onSubmit={handleCustomSubmit} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
            Or Sign In With Custom Email
          </div>
          <div>
            <input
              type="email"
              required
              placeholder="e.g. yourname@gmail.com"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#F37F46]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Full Name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
            />
            <select
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value as UserRole)}
              className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="field_technician">Field Technician</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-full bg-[#F37F46] hover:bg-[#E26E35] text-white font-bold text-xs shadow-md shadow-[#F37F46]/25 transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In to Timesheet</span>
          </button>
        </form>

        {/* Optional Google Client ID Config Toggle */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 mx-auto"
          >
            <Key className="w-3 h-3" />
            <span>{showConfig ? 'Hide Client ID Settings' : 'Configure Google OAuth Client ID'}</span>
          </button>

          {showConfig && (
            <div className="mt-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2 text-xs animate-fade-in">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Google Cloud Web Client ID
              </label>
              <input
                type="text"
                placeholder="xxxx.apps.googleusercontent.com"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-slate-700 text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleSaveClientId}
                className="w-full py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold"
              >
                Save Client ID
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
