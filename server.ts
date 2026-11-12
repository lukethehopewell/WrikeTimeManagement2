import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------- WRIKE v4 REST API PROXY -----------------

/**
 * POST /api/wrike/verify
 * Validates user's permanent Wrike token against https://www.wrike.com/api/v4/contacts?me=true
 * Falls back to high-fidelity sandbox response when in test/simulation mode.
 */
app.post('/api/wrike/verify', async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token || token.trim() === '' || token.includes('mock') || token.includes('demo')) {
    // Sandbox / Test Mode Response
    return res.json({
      valid: true,
      contactName: 'Sarah Vance (NHS Lead)',
      accountId: 'IEABYZ98-SANDBOX',
      companyName: 'NHS MedTech Systems Group',
      isSandbox: true,
      message: 'Running in Sandbox Simulation mode (zero Wrike rate limits).',
    });
  }

  try {
    const response = await fetch('https://www.wrike.com/api/v4/contacts?me=true', {
      headers: {
        Authorization: `bearer ${token.trim()}`,
      },
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(401).json({
        valid: false,
        message: `Wrike token verification failed (${response.status}): ${errBody || 'Invalid credentials'}`,
      });
    }

    const data = await response.json();
    const contact = data.data?.[0];

    return res.json({
      valid: true,
      contactName: `${contact?.firstName || ''} ${contact?.lastName || ''}`.trim() || 'Verified Wrike User',
      accountId: contact?.profiles?.[0]?.accountId || 'IEAB-ACTIVE',
      companyName: contact?.companyName || 'NHS Trust Enterprise',
      isSandbox: false,
      message: 'Successfully authenticated with Wrike v4 REST API',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection error';
    return res.status(500).json({
      valid: false,
      message: `Failed to contact Wrike API: ${message}`,
    });
  }
});

/**
 * GET /api/wrike/tasks
 * Returns live or simulated high-priority IT tasks
 */
app.get('/api/wrike/tasks', async (req: Request, res: Response) => {
  const token = req.query.token as string | undefined;

  if (token && token.trim() !== '' && !token.includes('demo') && !token.includes('mock')) {
    try {
      const response = await fetch('https://www.wrike.com/api/v4/tasks?pageSize=25&status=Active', {
        headers: {
          Authorization: `bearer ${token.trim()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const mapped = (data.data || []).map((t: { id: string; title: string; parentIds?: string[]; importance?: string; description?: string }) => ({
          id: t.id,
          title: t.title,
          folderOrProject: 'Wrike Connected Project',
          status: 'Active',
          categoryId: 'cat-epr',
          importance: t.importance || 'Normal',
          description: t.description || 'Imported from Wrike Workspace',
        }));

        if (mapped.length > 0) {
          return res.json({ tasks: mapped, source: 'wrike_live' });
        }
      }
    } catch (err) {
      console.warn('Wrike live task fetch failed, falling back to simulated high-priority tasks', err);
    }
  }

  // High-priority clinical & remote tasks fallback
  return res.json({
    tasks: [
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
    ],
    source: 'simulated_wrike',
  });
});

/**
 * POST /api/wrike/timelogs
 * Posts tracked time to https://www.wrike.com/api/v4/tasks/{taskId}/timelogs
 * formatted as x-www-form-urlencoded
 */
app.post('/api/wrike/timelogs', async (req: Request, res: Response) => {
  const { token, taskId, hours, trackedDate, comment, timelogId, actionType } = req.body;

  if (!taskId || hours === undefined) {
    return res.status(400).json({ error: 'taskId and hours are required' });
  }

  // If a live token is supplied and looks real
  if (token && token.trim() !== '' && !token.includes('demo') && !token.includes('mock')) {
    try {
      const formParams = new URLSearchParams();
      formParams.append('hours', String(hours));
      formParams.append('trackedDate', trackedDate || new Date().toISOString().split('T')[0]);
      formParams.append('comment', comment || 'Remote field technician logged time');

      const endpoint = actionType === 'UPDATE' && timelogId
        ? `https://www.wrike.com/api/v4/timelogs/${timelogId}`
        : `https://www.wrike.com/api/v4/tasks/${taskId}/timelogs`;

      const method = actionType === 'UPDATE' && timelogId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `bearer ${token.trim()}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formParams.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `Wrike timelog sync failed (${response.status}): ${errorText}`,
        });
      }

      const data = await response.json();
      const createdLog = data.data?.[0];
      return res.json({
        success: true,
        wrikeTimelogId: createdLog?.id || `wrike-live-${Date.now()}`,
        syncedHours: hours,
        mode: 'live_wrike_api',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      return res.status(502).json({ error: `Network exception syncing to Wrike: ${message}` });
    }
  }

  // Simulated Wrike success for sandbox testing
  // Artificial 120ms latency to reflect upstream REST round-trip
  await new Promise((resolve) => setTimeout(resolve, 120));

  return res.json({
    success: true,
    wrikeTimelogId: `wrike-v4-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    syncedHours: hours,
    trackedDate,
    comment,
    mode: 'sandbox_simulation',
    message: 'Timelog successfully accepted by Wrike v4 REST proxy',
  });
});

/**
 * GET /api/teams/report
 * Strict RBAC: Strictly checks req.query.role === 'admin'
 * Non-administrators receive HTTP 403 Forbidden
 */
app.get('/api/teams/report', (req: Request, res: Response) => {
  const role = req.query.role as string | undefined;

  if (role !== 'admin') {
    return res.status(403).json({
      error: 'HTTP 403 Forbidden: Administrator role required to view team timesheet records.',
      requiredRole: 'admin',
      currentRole: role || 'unauthenticated',
    });
  }

  // Team summary data for clinical ops
  return res.json({
    teamId: 'team-clinical-ops',
    teamName: 'Clinical Deployment & Field Ops',
    period: 'Current Sprint & Daily Run-rate',
    totalBurnHours: 142.5,
    budgetedHours: 180.0,
    utilizationRate: 79.2,
    billablePercentage: 84.6,
    members: [
      {
        id: 'user-tech-1',
        name: 'Alex Rivera',
        role: 'field_technician',
        todayHours: 5.0,
        weeklyHours: 36.5,
        targetHours: 37.5,
        status: 'Active On-Site',
        currentTask: 'Ward 4B Tablet Deployment',
        pendingSyncCount: 1,
      },
      {
        id: 'user-tech-2',
        name: 'Maya Chen',
        role: 'field_technician',
        todayHours: 5.0,
        weeklyHours: 38.0,
        targetHours: 37.5,
        status: 'Active On-Site',
        currentTask: 'HL7 / FHIR Integration Bridge v4.2',
        pendingSyncCount: 0,
      },
      {
        id: 'user-tech-3',
        name: 'David Okafor',
        role: 'field_technician',
        todayHours: 4.5,
        weeklyHours: 32.0,
        targetHours: 37.5,
        status: 'Break / Rest',
        currentTask: 'Emergency Switch Replacement',
        pendingSyncCount: 0,
      },
      {
        id: 'user-admin-1',
        name: 'Sarah Vance',
        role: 'admin',
        todayHours: 6.5,
        weeklyHours: 36.0,
        targetHours: 37.5,
        status: 'In Office',
        currentTask: 'Governance & Resource Allocation',
        pendingSyncCount: 0,
      },
    ],
  });
});

// ----------------- VITE DEV MIDDLEWARE / STATIC ASSETS -----------------

async function setupServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} in ${isProd ? 'production' : 'development'} mode`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
