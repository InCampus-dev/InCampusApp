import AsyncStorage from '@react-native-async-storage/async-storage';

const ADMIN_CONTEXT_KEY = 'demoAdminContext';

export const DEMO_ADMIN_CAMPUS_ID = '1d8a58b3-4df0-40fe-9ad0-5bd563c13d6f';
export const DEMO_ADMIN_CAMPUS_NAME = 'Tongji University / Jiading Campus';

export interface AuthenticatedAdminContext {
  adminId: string;
  email: string;
  role: string;
  selectedCampusId: string;
  authorizedCampusIds: string[];
}

export const demoAdminContext: AuthenticatedAdminContext = {
  adminId: 'demo-admin',
  email: 'demo.admin@tongji.edu.cn',
  role: 'campus_admin',
  selectedCampusId: DEMO_ADMIN_CAMPUS_ID,
  authorizedCampusIds: [DEMO_ADMIN_CAMPUS_ID],
};

export async function saveDemoAdminContext(): Promise<AuthenticatedAdminContext> {
  await AsyncStorage.setItem(ADMIN_CONTEXT_KEY, JSON.stringify(demoAdminContext));
  return demoAdminContext;
}

export async function loadAdminContext(): Promise<AuthenticatedAdminContext | null> {
  const rawContext = await AsyncStorage.getItem(ADMIN_CONTEXT_KEY);
  if (!rawContext) {
    return null;
  }

  try {
    const parsedContext = JSON.parse(rawContext);
    return isAdminContext(parsedContext) ? parsedContext : null;
  } catch {
    return null;
  }
}

export async function clearAdminContext(): Promise<void> {
  await AsyncStorage.removeItem(ADMIN_CONTEXT_KEY);
}

export async function requireAdminContext(): Promise<AuthenticatedAdminContext> {
  const context = await loadAdminContext();
  if (!context) {
    throw new Error('Admin demo context is missing. Return to sign in and continue as demo admin.');
  }
  return context;
}

export function getAdminHeaders(context: AuthenticatedAdminContext): Record<string, string> {
  return {
    'x-admin-id': context.adminId,
    'x-admin-email': context.email,
    'x-admin-role': context.role,
    'x-admin-selected-campus-id': context.selectedCampusId,
    'x-admin-authorized-campus-ids': context.authorizedCampusIds.join(','),
  };
}

function isAdminContext(value: unknown): value is AuthenticatedAdminContext {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AuthenticatedAdminContext>;
  return (
    typeof candidate.adminId === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.role === 'string' &&
    typeof candidate.selectedCampusId === 'string' &&
    Array.isArray(candidate.authorizedCampusIds) &&
    candidate.authorizedCampusIds.every((campusId) => typeof campusId === 'string')
  );
}
