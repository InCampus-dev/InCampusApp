import { beforeEach, describe, expect, it, vi } from 'vitest';

const { asyncStorageMock, resetToSignInMock } = vi.hoisted(() => ({
  asyncStorageMock: {
    getItem: vi.fn(),
    multiRemove: vi.fn(),
  },
  resetToSignInMock: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: asyncStorageMock,
}));

vi.mock('../navigation/rootNavigation', () => ({
  resetToSignIn: resetToSignInMock,
}));

import api, { getApiErrorCode, getApiErrorMessage } from './api';

describe('api session expiry handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    asyncStorageMock.getItem.mockResolvedValue('expired-token');
    asyncStorageMock.multiRemove.mockResolvedValue(undefined);
    vi.stubGlobal('fetch', vi.fn());
  });

  it('clears student session and resets navigation for student 401 responses', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(401, {
        error: { code: 'AUTH_REQUIRED', message: 'Student authentication is required' },
      })
    );

    let caughtError: unknown;
    try {
      await api.get('/profiles/me');
    } catch (error) {
      caughtError = error;
    }

    expect(asyncStorageMock.multiRemove).toHaveBeenCalledWith([
      'authToken',
      'studentAccountId',
      'selectedCampusId',
    ]);
    expect(resetToSignInMock).toHaveBeenCalledTimes(1);
    expect(getApiErrorMessage(caughtError)).toBe('Session expired. Please sign in again.');
    expect(getApiErrorCode(caughtError)).toBe('AUTH_REQUIRED');
  });

  it('does not clear student session for public auth 401 responses', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(401, {
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      })
    );

    await expect(api.post('/auth/signin', { universityEmail: 'demo@tongji.edu.cn' })).rejects.toThrow(
      'Invalid email or password'
    );

    expect(asyncStorageMock.multiRemove).not.toHaveBeenCalled();
    expect(resetToSignInMock).not.toHaveBeenCalled();
  });

  it('does not clear student session for admin path 401 responses', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(401, {
        error: { code: 'AUTH_REQUIRED', message: 'Admin authentication is required' },
      })
    );

    await expect(api.get('/admin/campuses/campus-001/reports')).rejects.toThrow(
      'Admin authentication is required'
    );

    expect(asyncStorageMock.multiRemove).not.toHaveBeenCalled();
    expect(resetToSignInMock).not.toHaveBeenCalled();
  });

  it('does not clear student session for requests with admin headers', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(401, {
        error: { code: 'AUTH_REQUIRED', message: 'Admin authentication is required' },
      })
    );

    await expect(
      api.get('/campuses', { headers: { 'x-admin-id': 'demo-admin' } })
    ).rejects.toThrow('Admin authentication is required');

    expect(asyncStorageMock.multiRemove).not.toHaveBeenCalled();
    expect(resetToSignInMock).not.toHaveBeenCalled();
  });
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
