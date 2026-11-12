import React, { useState } from 'react';
import { 
  Settings2, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  Server
} from 'lucide-react';
import { WrikeConfig } from '../types';
import { verifyWrikeToken, saveWrikeConfig } from '../services/wrikeApi';

interface WrikeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WrikeConfig;
  onConfigSaved: (config: WrikeConfig) => void;
}

export const WrikeConfigModal: React.FC<WrikeConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigSaved,
}) => {
  const [token, setToken] = useState<string>(config.permanentToken || '');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ success: boolean; message: string; details?: string } | null>(null);

  if (!isOpen) return null;

  const handleVerifyAndSave = async (tokenToTest: string) => {
    setIsVerifying(true);
    setStatusMsg(null);

    const res = await verifyWrikeToken(tokenToTest);
    if (res.valid) {
      const updated: WrikeConfig = {
        permanentToken: tokenToTest,
        isConnected: true,
        accountId: res.accountId || 'IEABYZ98',
        workspaceName: res.companyName || 'NHS Trust Enterprise Digital Workspace',
        lastVerifiedAt: new Date().toISOString(),
      };
      await saveWrikeConfig(updated);
      onConfigSaved(updated);
      setStatusMsg({
        success: true,
        message: res.message || 'Connected to Wrike v4 REST API',
        details: `Account: ${res.accountId} (${res.contactName})`,
      });
    } else {
      setStatusMsg({
        success: false,
        message: res.message || 'Verification failed. Check token credentials.',
      });
    }
    setIsVerifying(false);
  };

  const handleUseDemo = () => {
    setToken('wrike_permanent_token_sandbox_demo');
    handleVerifyAndSave('wrike_permanent_token_sandbox_demo');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-[32px] bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-full bg-[#F37F46]/20 text-[#F37F46] flex items-center justify-center">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Wrike v4 REST Integration
            </h3>
            <p className="text-[11px] text-slate-400">
              Permanent Access Token &amp; Upstream Synchronization
            </p>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`mb-4 p-3 rounded-2xl text-xs border ${
              statusMsg.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-300'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              {statusMsg.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{statusMsg.message}</span>
            </div>
            {statusMsg.details && <div className="mt-1 text-[11px] opacity-90">{statusMsg.details}</div>}
          </div>
        )}

        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Permanent Access Token</span>
              </span>
              <a
                href="https://www.wrike.com/frontend/apps/index.html#/api"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-[#F37F46] hover:underline flex items-center gap-0.5"
              >
                <span>Get Token</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-[#F37F46]"
            />
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Connection Mode:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Server className="w-3 h-3 text-[#F37F46]" />
                {config.isConnected ? 'Proxy Ready (HTTPS)' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Target Workspace:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                {config.workspaceName}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUseDemo}
            className="w-full py-2 px-3 rounded-xl bg-[#F37F46]/10 hover:bg-[#F37F46]/20 text-[#F37F46] text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Enable Sandbox Simulation (One-Click)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
          >
            Close
          </button>
          <button
            type="button"
            disabled={isVerifying}
            onClick={() => handleVerifyAndSave(token)}
            className="flex-1 py-2.5 rounded-full bg-[#F37F46] hover:bg-[#E26E35] text-white font-bold text-xs shadow-md shadow-[#F37F46]/30 disabled:opacity-50"
          >
            {isVerifying ? 'Verifying...' : 'Verify & Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
