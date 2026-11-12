import { 
  Customer, 
  TaskCategory, 
  TimeLogEntry, 
  SyncQueueItem, 
  WrikeTask, 
  UserAccount, 
  AuditRecord 
} from '../types';

const DB_NAME = 'WrikeSyncDB_v3';
const DB_VERSION = 1;

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user-tech-1',
    name: 'Alex Rivera',
    email: 'alex.rivera@medtech.nhs.uk',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    role: 'field_technician',
    teamId: 'team-clinical-ops',
    teamName: 'Clinical Deployment & Field Ops',
    wrikeContactId: 'KUAB8101',
  },
  {
    id: 'user-tech-2',
    name: 'Maya Chen',
    email: 'maya.chen@medtech.nhs.uk',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
    role: 'field_technician',
    teamId: 'team-clinical-ops',
    teamName: 'Clinical Deployment & Field Ops',
    wrikeContactId: 'KUAB8102',
  },
  {
    id: 'user-tech-3',
    name: 'David Okafor',
    email: 'david.okafor@medtech.nhs.uk',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    role: 'field_technician',
    teamId: 'team-clinical-ops',
    teamName: 'Clinical Deployment & Field Ops',
    wrikeContactId: 'KUAB8103',
  },
  {
    id: 'user-admin-1',
    name: 'Sarah Vance',
    email: 'sarah.vance@medtech.nhs.uk',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    role: 'admin',
    teamId: 'team-clinical-ops',
    teamName: 'Clinical Deployment & Field Ops',
    wrikeContactId: 'KUAB9001',
  },
];

const INITIAL_CATEGORIES: TaskCategory[] = [
  {
    id: 'cat-epr',
    name: 'EPR Programmes',
    code: 'EPR',
    isBillable: true,
    color: '#F37F46',
    subcategories: [
      { id: 'sub-epr-1', name: 'Clinical System Rollout', code: 'EPR-ROLLOUT', defaultRate: 95 },
      { id: 'sub-epr-2', name: 'HL7 / FHIR Integration', code: 'EPR-FHIR', defaultRate: 110 },
      { id: 'sub-epr-3', name: 'Ward Configuration & Device Setup', code: 'EPR-WARD', defaultRate: 85 },
      { id: 'sub-epr-4', name: 'UAT & Go-Live Floorwalking', code: 'EPR-FLOOR', defaultRate: 90 },
    ],
  },
  {
    id: 'cat-proj',
    name: 'Project Activities',
    code: 'PROJ',
    isBillable: true,
    color: '#007AFF',
    subcategories: [
      { id: 'sub-proj-1', name: 'Sprint Delivery & Development', code: 'PROJ-DEV', defaultRate: 100 },
      { id: 'sub-proj-2', name: 'Infrastructure & Cloud DevOps', code: 'PROJ-DEVOPS', defaultRate: 115 },
      { id: 'sub-proj-3', name: 'Data Migration & Scrubbing', code: 'PROJ-MIG', defaultRate: 105 },
      { id: 'sub-proj-4', name: 'Solution Architecture', code: 'PROJ-ARCH', defaultRate: 130 },
    ],
  },
  {
    id: 'cat-meet',
    name: 'Meetings',
    code: 'MEET',
    isBillable: false,
    color: '#5856D6',
    subcategories: [
      { id: 'sub-meet-1', name: 'Internal Meetings', code: 'MEET-INT' },
      { id: 'sub-meet-2', name: 'Customer Meetings', code: 'MEET-CUST' },
      { id: 'sub-meet-3', name: 'SteerCo & Project Governance', code: 'MEET-GOV' },
    ],
  },
  {
    id: 'cat-train',
    name: 'Training',
    code: 'TRAIN',
    isBillable: false,
    color: '#34C759',
    subcategories: [
      { id: 'sub-train-1', name: 'Vendor Certification', code: 'TRAIN-CERT' },
      { id: 'sub-train-2', name: 'End User Staff Training', code: 'TRAIN-STAFF' },
      { id: 'sub-train-3', name: 'Technical Upskilling', code: 'TRAIN-TECH' },
    ],
  },
  {
    id: 'cat-int',
    name: 'Internal Work',
    code: 'INT',
    isBillable: false,
    color: '#8E8E93',
    subcategories: [
      { id: 'sub-int-1', name: 'Internal Administration', code: 'INT-ADMIN' },
      { id: 'sub-int-2', name: 'Team Mentoring', code: 'INT-MENTOR' },
      { id: 'sub-int-3', name: 'Process Documentation', code: 'INT-DOC' },
    ],
  },
  {
    id: 'cat-supp',
    name: 'Support Tickets',
    code: 'SUPP',
    isBillable: true,
    color: '#FF3B30',
    subcategories: [
      { id: 'sub-supp-1', name: 'P1 Critical Outage', code: 'SUPP-P1', defaultRate: 140 },
      { id: 'sub-supp-2', name: 'Clinical Device Triage', code: 'SUPP-TRIAGE', defaultRate: 90 },
      { id: 'sub-supp-3', name: 'Tier 2 Desktop & PACS Support', code: 'SUPP-PACS', defaultRate: 85 },
    ],
  },
  {
    id: 'cat-leave',
    name: 'Annual Leave',
    code: 'LEAVE',
    isBillable: false,
    color: '#AF52DE',
    subcategories: [
      { id: 'sub-leave-1', name: 'Annual Leave', code: 'LEAVE-ANNUAL' },
      { id: 'sub-leave-2', name: 'Statutory Bank Holiday', code: 'LEAVE-HOLIDAY' },
      { id: 'sub-leave-3', name: 'Sick Leave', code: 'LEAVE-SICK' },
    ],
  },
  {
    id: 'cat-lunch',
    name: 'Lunch Break',
    code: 'LUNCH',
    isBillable: false,
    color: '#FF9500',
    subcategories: [
      { id: 'sub-lunch-1', name: 'Mandatory Lunch Break', code: 'LUNCH-STD' },
      { id: 'sub-lunch-2', name: 'Rest Break', code: 'LUNCH-REST' },
    ],
  },
  {
    id: 'cat-travel',
    name: 'Travel Time',
    code: 'TRAVEL',
    isBillable: true,
    color: '#00C7BE',
    subcategories: [
      { id: 'sub-travel-1', name: 'Site-to-Site Transit', code: 'TRAVEL-SITE', defaultRate: 60 },
      { id: 'sub-travel-2', name: 'Hospital Deployment Travel', code: 'TRAVEL-HOSP', defaultRate: 60 },
      { id: 'sub-travel-3', name: 'Emergency Callout Travel', code: 'TRAVEL-CALLOUT', defaultRate: 75 },
    ],
  },
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust-int', name: 'Internal', code: 'CUST-INT', status: 'Active', isDefault: true },
  { id: 'cust-stjude', name: 'St. Jude Regional Hospital', code: 'SJR-HOSP', status: 'Active' },
  { id: 'cust-royalfree', name: 'Royal Free London NHS Trust', code: 'RFL-NHS', status: 'Active' },
  { id: 'cust-manchester', name: 'Manchester University NHS Trust', code: 'MFT-NHS', status: 'Active' },
  { id: 'cust-cambridge', name: 'Cambridge University Hospitals', code: 'CUH-NHS', status: 'Active' },
];

const INITIAL_TASKS: WrikeTask[] = [
  {
    id: 'wrike-task-101',
    title: 'Ward 4B Tablet Deployment & PACS Configuration',
    folderOrProject: 'Clinical Systems Rollout 2026',
    status: 'Active',
    categoryId: 'cat-epr',
    subcategoryId: 'sub-epr-3',
    description: 'On-site installation and testing of bedside tablets for radiology PACS viewers.',
    estimatedHours: 24,
    importance: 'High',
  },
  {
    id: 'wrike-task-102',
    title: 'HL7 / FHIR Integration Bridge v4.2',
    folderOrProject: 'Pathology Diagnostics Data Feeds',
    status: 'Active',
    categoryId: 'cat-epr',
    subcategoryId: 'sub-epr-2',
    description: 'Syncing real-time patient blood chemistry data with trust EPR data warehouse.',
    estimatedHours: 40,
    importance: 'High',
  },
  {
    id: 'wrike-task-103',
    title: 'Emergency Generator Room Network Switch Replacement',
    folderOrProject: 'Infrastructure Reliability Sprint 12',
    status: 'Active',
    categoryId: 'cat-supp',
    subcategoryId: 'sub-supp-1',
    description: 'Replacement of damaged Cisco Catalyst switch in substation basement.',
    estimatedHours: 8,
    importance: 'High',
  },
  {
    id: 'wrike-task-104',
    title: 'Bi-Weekly Regional Clinical Lead Review',
    folderOrProject: 'Trust Governance & Quality Assurance',
    status: 'Active',
    categoryId: 'cat-meet',
    subcategoryId: 'sub-meet-2',
    description: 'Review SLA metrics, device uptime reports, and user feedback.',
    estimatedHours: 2,
    importance: 'Normal',
  },
  {
    id: 'wrike-task-105',
    title: 'Transit to Cambridge Addenbrooke Site',
    folderOrProject: 'Field Logistics & Travel',
    status: 'Active',
    categoryId: 'cat-travel',
    subcategoryId: 'sub-travel-2',
    description: 'M11 motorway transit with hardware spares and diagnostic kit.',
    estimatedHours: 3,
    importance: 'Normal',
  },
  {
    id: 'wrike-task-106',
    title: 'AWS GovCloud Migration Security Hardening',
    folderOrProject: 'Cloud Infrastructure Upgrade',
    status: 'Active',
    categoryId: 'cat-proj',
    subcategoryId: 'sub-proj-2',
    description: 'Terraform scripts, IAM policy refinement, and HIPAA/NHS DSP audit checks.',
    estimatedHours: 35,
    importance: 'Normal',
  },
];

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. timelogs
      if (!db.objectStoreNames.contains('timelogs')) {
        const store = db.createObjectStore('timelogs', { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('teamId', 'teamId', { unique: false });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('isSynced', 'isSyncedToWrike', { unique: false });
        store.createIndex('customerId', 'customerId', { unique: false });
      }

      // 2. sync_queue
      if (!db.objectStoreNames.contains('sync_queue')) {
        const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('queuedAt', 'queuedAt', { unique: false });
      }

      // 3. categories
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }

      // 4. tasks
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      }

      // 5. customers
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id' });
      }

      // 6. settings
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = async (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      await seedInitialDataIfEmpty(db);
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

async function seedInitialDataIfEmpty(db: IDBDatabase): Promise<void> {
  // Check categories
  const catCount = await countStore(db, 'categories');
  if (catCount === 0) {
    const tx = db.transaction(['categories', 'customers', 'tasks'], 'readwrite');
    const catStore = tx.objectStore('categories');
    INITIAL_CATEGORIES.forEach((cat) => catStore.put(cat));

    const custStore = tx.objectStore('customers');
    INITIAL_CUSTOMERS.forEach((cust) => custStore.put(cust));

    const taskStore = tx.objectStore('tasks');
    INITIAL_TASKS.forEach((task) => taskStore.put(task));

    await new Promise<void>((res) => {
      tx.oncomplete = () => res();
    });
  }

  // Seed sample historical timelogs if empty for rich initial analytics
  const logCount = await countStore(db, 'timelogs');
  if (logCount === 0) {
    await seedSampleTimelogs(db);
  }
}

function countStore(db: IDBDatabase, storeName: string): Promise<number> {
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(0);
  });
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

async function seedSampleTimelogs(db: IDBDatabase): Promise<void> {
  const tx = db.transaction('timelogs', 'readwrite');
  const store = tx.objectStore('timelogs');
  const now = new Date();

  // Generate logs for today, yesterday, and past 7 days across the team
  const sampleLogs: TimeLogEntry[] = [
    // Today - Alex Rivera
    {
      id: 'log-seed-1',
      userId: 'user-tech-1',
      userName: 'Alex Rivera',
      userRole: 'field_technician',
      teamId: 'team-clinical-ops',
      taskId: 'wrike-task-101',
      taskTitle: 'Ward 4B Tablet Deployment & PACS Configuration',
      categoryId: 'cat-epr',
      categoryName: 'EPR Programmes',
      subcategoryId: 'sub-epr-3',
      subcategoryName: 'Ward Configuration & Device Setup',
      customerId: 'cust-stjude',
      customerName: 'St. Jude Regional Hospital',
      customerCode: 'SJR-HOSP',
      date: formatDate(now),
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30).toISOString(),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0).toISOString(),
      durationMinutes: 210,
      comment: 'Configured 14 Dell Clinical Touch tablets with SSO barcode scanners.',
      isSyncedToWrike: true,
      wrikeTimelogId: 'wrike-log-901',
      syncedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 5).toISOString(),
    },
    {
      id: 'log-seed-2',
      userId: 'user-tech-1',
      userName: 'Alex Rivera',
      userRole: 'field_technician',
      teamId: 'team-clinical-ops',
      taskId: 'wrike-task-105',
      taskTitle: 'Transit to Cambridge Addenbrooke Site',
      categoryId: 'cat-travel',
      categoryName: 'Travel Time',
      subcategoryId: 'sub-travel-2',
      subcategoryName: 'Hospital Deployment Travel',
      customerId: 'cust-cambridge',
      customerName: 'Cambridge University Hospitals',
      customerCode: 'CUH-NHS',
      date: formatDate(now),
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0).toISOString(),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30).toISOString(),
      durationMinutes: 90,
      comment: 'Highways clear, transported 6 spare backup switches.',
      isSyncedToWrike: false, // Pending sync
    },
    // Maya Chen (today)
    {
      id: 'log-seed-3',
      userId: 'user-tech-2',
      userName: 'Maya Chen',
      userRole: 'field_technician',
      teamId: 'team-clinical-ops',
      taskId: 'wrike-task-102',
      taskTitle: 'HL7 / FHIR Integration Bridge v4.2',
      categoryId: 'cat-epr',
      categoryName: 'EPR Programmes',
      subcategoryId: 'sub-epr-2',
      subcategoryName: 'HL7 / FHIR Integration',
      customerId: 'cust-royalfree',
      customerName: 'Royal Free London NHS Trust',
      customerCode: 'RFL-NHS',
      date: formatDate(now),
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString(),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0).toISOString(),
      durationMinutes: 300,
      comment: 'Fixed HL7 Observation message field mapping for lab blood gases.',
      isSyncedToWrike: true,
      wrikeTimelogId: 'wrike-log-903',
      syncedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 2).toISOString(),
    },
    // David Okafor (today)
    {
      id: 'log-seed-4',
      userId: 'user-tech-3',
      userName: 'David Okafor',
      userRole: 'field_technician',
      teamId: 'team-clinical-ops',
      taskId: 'wrike-task-103',
      taskTitle: 'Emergency Generator Room Network Switch Replacement',
      categoryId: 'cat-supp',
      categoryName: 'Support Tickets',
      subcategoryId: 'sub-supp-1',
      subcategoryName: 'P1 Critical Outage',
      customerId: 'cust-manchester',
      customerName: 'Manchester University NHS Trust',
      customerCode: 'MFT-NHS',
      date: formatDate(now),
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0).toISOString(),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 30).toISOString(),
      durationMinutes: 270,
      comment: 'Re-routed fiber patch cords; power redundancy restored.',
      isSyncedToWrike: true,
      wrikeTimelogId: 'wrike-log-904',
      auditHistory: [
        {
          editedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 45).toISOString(),
          editedBy: 'Sarah Vance',
          previousDuration: 240,
          newDuration: 270,
          previousComment: 'Replaced switch',
          newComment: 'Re-routed fiber patch cords; power redundancy restored.',
          reason: 'Adjusted for additional cable dressing verification time',
        },
      ],
    },
  ];

  // Also add some logs for previous days in past week
  for (let i = 1; i <= 6; i++) {
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - i);
    const dateStr = formatDate(pastDate);

    sampleLogs.push({
      id: `log-seed-hist-${i}-a`,
      userId: 'user-tech-1',
      userName: 'Alex Rivera',
      userRole: 'field_technician',
      teamId: 'team-clinical-ops',
      taskId: 'wrike-task-101',
      taskTitle: 'Ward 4B Tablet Deployment & PACS Configuration',
      categoryId: 'cat-epr',
      categoryName: 'EPR Programmes',
      subcategoryId: 'sub-epr-1',
      subcategoryName: 'Clinical System Rollout',
      customerId: 'cust-stjude',
      customerName: 'St. Jude Regional Hospital',
      customerCode: 'SJR-HOSP',
      date: dateStr,
      startTime: `${dateStr}T09:00:00.000Z`,
      endTime: `${dateStr}T15:00:00.000Z`,
      durationMinutes: 360,
      comment: `Day ${i} Floorwalking and clinician onboarding assistance.`,
      isSyncedToWrike: true,
      wrikeTimelogId: `wrike-hist-${i}a`,
    });

    sampleLogs.push({
      id: `log-seed-hist-${i}-b`,
      userId: 'user-tech-2',
      userName: 'Maya Chen',
      userRole: 'field_technician',
      teamId: 'team-clinical-ops',
      taskId: 'wrike-task-106',
      taskTitle: 'AWS GovCloud Migration Security Hardening',
      categoryId: 'cat-proj',
      categoryName: 'Project Activities',
      subcategoryId: 'sub-proj-2',
      subcategoryName: 'Infrastructure & Cloud DevOps',
      customerId: 'cust-royalfree',
      customerName: 'Royal Free London NHS Trust',
      customerCode: 'RFL-NHS',
      date: dateStr,
      startTime: `${dateStr}T09:30:00.000Z`,
      endTime: `${dateStr}T16:30:00.000Z`,
      durationMinutes: 420,
      comment: 'Terraform modules for VPC peering and HIPAA security group audits.',
      isSyncedToWrike: true,
      wrikeTimelogId: `wrike-hist-${i}b`,
    });
  }

  sampleLogs.forEach((log) => store.put(log));

  // Add the pending one to sync_queue
  const queueTx = db.transaction('sync_queue', 'readwrite');
  const queueStore = queueTx.objectStore('sync_queue');
  queueStore.put({
    id: 'queue-seed-1',
    type: 'CREATE',
    payload: sampleLogs[1],
    retryCount: 0,
    queuedAt: new Date().toISOString(),
    status: 'pending',
  });
}

// ----------------- CRUD Operations -----------------

export async function getTimeLogs(filters?: {
  userId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
}): Promise<TimeLogEntry[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('timelogs', 'readonly');
    const store = tx.objectStore('timelogs');
    const req = store.getAll();

    req.onsuccess = () => {
      let results: TimeLogEntry[] = req.result || [];

      if (filters?.userId) {
        results = results.filter((r) => r.userId === filters.userId);
      }
      if (filters?.date) {
        results = results.filter((r) => r.date === filters.date);
      }
      if (filters?.startDate) {
        results = results.filter((r) => r.date >= filters.startDate!);
      }
      if (filters?.endDate) {
        results = results.filter((r) => r.date <= filters.endDate!);
      }
      if (filters?.customerId && filters.customerId !== 'all') {
        results = results.filter((r) => r.customerId === filters.customerId);
      }

      // Sort newest start time first
      results.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      resolve(results);
    };

    req.onerror = () => reject(req.error);
  });
}

export async function getTimeLogById(id: string): Promise<TimeLogEntry | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('timelogs', 'readonly');
    const store = tx.objectStore('timelogs');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveTimeLog(entry: TimeLogEntry): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['timelogs', 'sync_queue'], 'readwrite');
    const logStore = tx.objectStore('timelogs');
    const queueStore = tx.objectStore('sync_queue');

    logStore.put(entry);

    // If not synced, queue for sync
    if (!entry.isSyncedToWrike) {
      const queueItem: SyncQueueItem = {
        id: `q-${entry.id}-${Date.now()}`,
        type: 'CREATE',
        payload: entry,
        retryCount: 0,
        queuedAt: new Date().toISOString(),
        status: 'pending',
      };
      queueStore.put(queueItem);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateTimeLogWithAudit(
  id: string,
  newDurationMinutes: number,
  newComment: string,
  reason: string,
  editedBy: string
): Promise<TimeLogEntry> {
  const db = await getDB();
  const current = await getTimeLogById(id);
  if (!current) {
    throw new Error(`TimeLog with ID ${id} not found.`);
  }

  const auditRecord: AuditRecord = {
    editedAt: new Date().toISOString(),
    editedBy,
    previousDuration: current.durationMinutes,
    newDuration: newDurationMinutes,
    previousComment: current.comment,
    newComment,
    reason,
  };

  const updated: TimeLogEntry = {
    ...current,
    durationMinutes: newDurationMinutes,
    comment: newComment,
    isSyncedToWrike: false, // Must be re-synced to Wrike
    auditHistory: [...(current.auditHistory || []), auditRecord],
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['timelogs', 'sync_queue'], 'readwrite');
    const logStore = tx.objectStore('timelogs');
    const queueStore = tx.objectStore('sync_queue');

    logStore.put(updated);

    const queueItem: SyncQueueItem = {
      id: `q-upd-${id}-${Date.now()}`,
      type: 'UPDATE',
      payload: updated,
      retryCount: 0,
      queuedAt: new Date().toISOString(),
      status: 'pending',
    };
    queueStore.put(queueItem);

    tx.oncomplete = () => resolve(updated);
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteTimeLog(id: string): Promise<void> {
  const db = await getDB();
  const current = await getTimeLogById(id);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['timelogs', 'sync_queue'], 'readwrite');
    const logStore = tx.objectStore('timelogs');
    const queueStore = tx.objectStore('sync_queue');

    logStore.delete(id);

    if (current && current.wrikeTimelogId) {
      const queueItem: SyncQueueItem = {
        id: `q-del-${id}-${Date.now()}`,
        type: 'DELETE',
        payload: current,
        retryCount: 0,
        queuedAt: new Date().toISOString(),
        status: 'pending',
      };
      queueStore.put(queueItem);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ----------------- Sync Queue Operations -----------------

export async function getPendingSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    const req = store.getAll();
    req.onsuccess = () => {
      const items: SyncQueueItem[] = req.result || [];
      // FIFO: sort by queuedAt ascending
      items.sort((a, b) => new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime());
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function updateQueueItem(item: SyncQueueItem): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    tx.objectStore('sync_queue').put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeQueueItem(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    tx.objectStore('sync_queue').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function markTimeLogSynced(id: string, wrikeTimelogId: string): Promise<void> {
  const db = await getDB();
  const entry = await getTimeLogById(id);
  if (!entry) return;

  entry.isSyncedToWrike = true;
  entry.wrikeTimelogId = wrikeTimelogId;
  entry.syncedAt = new Date().toISOString();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('timelogs', 'readwrite');
    tx.objectStore('timelogs').put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ----------------- Categories & Subcategories -----------------

export async function getCategories(): Promise<TaskCategory[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('categories', 'readonly');
    const req = tx.objectStore('categories').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCategory(category: TaskCategory): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('categories', 'readwrite');
    tx.objectStore('categories').put(category);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('categories', 'readwrite');
    tx.objectStore('categories').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ----------------- Customers -----------------

export async function getCustomers(): Promise<Customer[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('customers', 'readonly');
    const req = tx.objectStore('customers').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCustomer(customer: Customer): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('customers', 'readwrite');
    tx.objectStore('customers').put(customer);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('customers', 'readwrite');
    tx.objectStore('customers').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ----------------- Tasks -----------------

export async function getTasks(): Promise<WrikeTask[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readonly');
    const req = tx.objectStore('tasks').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveTask(task: WrikeTask): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    tx.objectStore('tasks').put(task);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ----------------- Key-Value Settings -----------------

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction('settings', 'readonly');
    const req = tx.objectStore('settings').get(key);
    req.onsuccess = () => {
      if (req.result && req.result.value !== undefined) {
        resolve(req.result.value as T);
      } else {
        resolve(defaultValue);
      }
    };
    req.onerror = () => resolve(defaultValue);
  });
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    tx.objectStore('settings').put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
