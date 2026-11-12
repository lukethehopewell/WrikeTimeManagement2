import { UserAccount, UserRole } from '../types';
import { getSetting, setSetting } from './db';

const GOOGLE_SESSION_KEY = 'google_auth_session_v1';
const GOOGLE_CLIENT_ID_KEY = 'google_client_id_config_v1';

// Known admin emails or domains
const KNOWN_ADMIN_EMAILS = [
  'luke1hopewell@hotmail.com',
  'sarah.vance@medtech.nhs.uk',
  'admin@medtech.nhs.uk',
];

export interface GoogleJWTPayload {
  iss?: string;
  sub?: string;
  azp?: string;
  aud?: string;
  iat?: number;
  exp?: number;
  email: string;
  email_verified?: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export function parseJwt(token: string): GoogleJWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to parse Google JWT credential:', err);
    return null;
  }
}

/**
 * Assigns role based on user preference:
 * First user or specific emails as Admin, others as Technician.
 */
export async function determineRoleForEmail(email: string): Promise<UserRole> {
  const normalized = email.toLowerCase().trim();
  if (KNOWN_ADMIN_EMAILS.some((adm) => adm.toLowerCase() === normalized)) {
    return 'admin';
  }
  // Check if any previous user has logged in
  const existingUsers = await getSetting<string[]>('registered_user_emails', []);
  if (existingUsers.length === 0) {
    // First user is granted Admin
    await setSetting('registered_user_emails', [normalized]);
    return 'admin';
  }
  if (!existingUsers.includes(normalized)) {
    await setSetting('registered_user_emails', [...existingUsers, normalized]);
  }
  return 'field_technician';
}

export function createGoogleUserAccount(
  payload: { name: string; email: string; picture?: string; sub?: string },
  role: UserRole
): UserAccount {
  return {
    id: `guser-${payload.sub || payload.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    name: payload.name || payload.email.split('@')[0],
    email: payload.email,
    avatarUrl: payload.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(payload.name || payload.email)}`,
    role,
    teamId: 'team-clinical-ops',
    teamName: 'Clinical Deployment & Field Ops',
    wrikeContactId: `WRIKE-${Math.abs(hashString(payload.email)).toString().slice(0, 6)}`,
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export async function getSavedGoogleUser(): Promise<UserAccount | null> {
  return await getSetting<UserAccount | null>(GOOGLE_SESSION_KEY, null);
}

export async function saveGoogleUser(user: UserAccount): Promise<void> {
  await setSetting(GOOGLE_SESSION_KEY, user);
}

export async function clearGoogleUser(): Promise<void> {
  await setSetting(GOOGLE_SESSION_KEY, null);
}

export async function getGoogleClientId(): Promise<string> {
  return await getSetting<string>(GOOGLE_CLIENT_ID_KEY, '');
}

export async function saveGoogleClientId(clientId: string): Promise<void> {
  await setSetting(GOOGLE_CLIENT_ID_KEY, clientId);
}
