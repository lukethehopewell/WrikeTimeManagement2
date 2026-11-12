import { SyncQueueItem, WrikeConfig, WrikeTask } from '../types';
import { 
  getPendingSyncQueue, 
  markTimeLogSynced, 
  removeQueueItem, 
  updateQueueItem, 
  getSetting, 
  setSetting 
} from './db';

const WRIKE_CONFIG_KEY = 'wrike_config_v1';

export const DEFAULT_WRIKE_CONFIG: WrikeConfig = {
  permanentToken: '',
  isConnected: false,
  workspaceName: 'NHS Trust Enterprise Digital Workspace',
};

export async function getWrikeConfig(): Promise<WrikeConfig> {
  return await getSetting<WrikeConfig>(WRIKE_CONFIG_KEY, DEFAULT_WRIKE_CONFIG);
}

export async function saveWrikeConfig(config: WrikeConfig): Promise<void> {
  await setSetting(WRIKE_CONFIG_KEY, config);
}

export interface VerifyTokenResponse {
  valid: boolean;
  contactName?: string;
  accountId?: string;
  companyName?: string;
  isSandbox?: boolean;
  message?: string;
}

export async function verifyWrikeToken(token: string): Promise<VerifyTokenResponse> {
  try {
    const res = await fetch('/api/wrike/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return await res.json();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error verifying Wrike token';
    return { valid: false, message };
  }
}

export async function fetchWrikeTasks(token?: string): Promise<WrikeTask[]> {
  try {
    const res = await fetch(`/api/wrike/tasks${token ? `?token=${encodeURIComponent(token)}` : ''}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.tasks || [];
  } catch (err) {
    console.warn('Failed to fetch tasks from Wrike API proxy:', err);
    return [];
  }
}

export interface SyncResult {
  totalProcessed: number;
  successCount: number;
  failCount: number;
  errors: string[];
}

let isSyncing = false;

export async function drainSyncQueue(onProgress?: (processed: number, total: number) => void): Promise<SyncResult> {
  if (isSyncing) {
    return { totalProcessed: 0, successCount: 0, failCount: 0, errors: ['Sync already in progress'] };
  }

  isSyncing = true;
  const result: SyncResult = {
    totalProcessed: 0,
    successCount: 0,
    failCount: 0,
    errors: [],
  };

  try {
    const pendingItems = await getPendingSyncQueue();
    if (pendingItems.length === 0) {
      isSyncing = false;
      return result;
    }

    const config = await getWrikeConfig();
    const token = config.permanentToken;

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      result.totalProcessed++;
      if (onProgress) onProgress(i + 1, pendingItems.length);

      // Mark item as syncing in DB
      item.status = 'syncing';
      await updateQueueItem(item);

      try {
        const payload = item.payload;
        // Decimal hours formatted for Wrike timelog (e.g. 2.50)
        const decimalHours = Number((payload.durationMinutes / 60).toFixed(2));

        const response = await fetch('/api/wrike/timelogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            taskId: payload.taskId,
            hours: decimalHours,
            trackedDate: payload.date,
            comment: payload.comment || 'Field tech remote log',
            actionType: item.type,
            timelogId: payload.wrikeTimelogId,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Wrike API response error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const wrikeId = data.wrikeTimelogId || `wrike-synced-${Date.now()}`;

        // Commit synced state to IndexedDB timelogs
        await markTimeLogSynced(payload.id, wrikeId);
        // Remove from FIFO queue
        await removeQueueItem(item.id);
        result.successCount++;
      } catch (err: unknown) {
        result.failCount++;
        const errMsg = err instanceof Error ? err.message : String(err);
        result.errors.push(errMsg);

        // Update item with failure & retry count
        item.status = 'failed';
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = errMsg;
        await updateQueueItem(item);
      }
    }
  } finally {
    isSyncing = false;
  }

  return result;
}

/**
 * Fetch team reporting data through RBAC Express proxy
 */
export async function fetchTeamReport(role: string): Promise<{ authorized: boolean; error?: string; data?: unknown }> {
  try {
    const res = await fetch(`/api/teams/report?role=${encodeURIComponent(role)}`);
    if (res.status === 403) {
      return {
        authorized: false,
        error: 'HTTP 403 Forbidden: Administrator role required to view cross-team logs.',
      };
    }
    if (!res.ok) {
      return { authorized: false, error: `Failed to fetch team report: ${res.statusText}` };
    }
    const data = await res.json();
    return { authorized: true, data };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Network error';
    return { authorized: false, error };
  }
}
