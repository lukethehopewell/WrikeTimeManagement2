export type UserRole = 'field_technician' | 'admin';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  teamId: string;
  teamName: string;
  wrikeContactId: string;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Archived';
  isDefault?: boolean;
}

export interface SubCategory {
  id: string;
  name: string;
  code: string;
  defaultRate?: number;
}

export interface TaskCategory {
  id: string;
  name: string;
  code: string;
  isBillable: boolean;
  color: string;
  subcategories: SubCategory[];
}

export interface WrikeTask {
  id: string;
  title: string;
  folderOrProject: string;
  status: 'Active' | 'Completed';
  categoryId: string;
  subcategoryId?: string;
  description?: string;
  estimatedHours?: number;
  importance?: 'High' | 'Normal' | 'Low';
}

export interface AuditRecord {
  editedAt: string;
  editedBy: string;
  previousDuration: number;
  newDuration: number;
  previousComment: string;
  newComment: string;
  reason: string;
}

export interface TimeLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  teamId: string;
  taskId: string;
  taskTitle: string;
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
  customerId?: string;
  customerName?: string;
  customerCode?: string;
  date: string;               // YYYY-MM-DD
  startTime: string;          // ISO String
  endTime: string;            // ISO String
  durationMinutes: number;
  comment: string;
  isSyncedToWrike: boolean;
  wrikeTimelogId?: string;
  syncedAt?: string;
  auditHistory?: AuditRecord[];
}

export interface SyncQueueItem {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: TimeLogEntry;
  retryCount: number;
  queuedAt: string;
  lastError?: string;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
}

export type ThemeMode = 'ember-light' | 'ember-dark' | 'contrast-light' | 'contrast-dark';

export interface ShiftCutoffSettings {
  enabled: boolean;
  cutoffHour: number; // e.g. 17 for 17:00
  dailyTargetHours: number; // e.g. 7.5
  audioChimeEnabled: boolean;
  pushNotificationsEnabled: boolean;
}

export interface WrikeConfig {
  permanentToken: string;
  accountId?: string;
  isConnected: boolean;
  workspaceName?: string;
  lastVerifiedAt?: string;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (res: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

