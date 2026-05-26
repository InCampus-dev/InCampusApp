import { describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    multiRemove: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../navigation/rootNavigation', () => ({
  resetToSignIn: vi.fn(),
}));

import {
  blockStudent,
  buildCreateBlockPayload,
  buildSubmitReportPayload,
  deleteHostedActivity,
  getPublicStudentProfile,
  leaveActivity,
  listCampusStructuredOptions,
  submitReport,
  withdrawActivityRequest,
} from './studentApi';

describe('studentApi helpers', () => {
  it('loads structured options from the student-safe campus endpoint', async () => {
    const client = createClient();
    client.get.mockResolvedValue({ data: [] });

    await listCampusStructuredOptions('campus-001', { optionType: 'activity_category' }, client);

    expect(client.get).toHaveBeenCalledWith('/campuses/campus-001/structured-options', {
      params: { optionType: 'activity_category' },
    });
  });

  it('withdraw helper calls the pending request DELETE endpoint', async () => {
    const client = createClient();

    await withdrawActivityRequest('activity-001', client);

    expect(client.delete).toHaveBeenCalledWith('/activities/activity-001/requests/me');
  });

  it('leave helper calls the confirmed participant DELETE endpoint', async () => {
    const client = createClient();

    await leaveActivity('activity-001', client);

    expect(client.delete).toHaveBeenCalledWith('/activities/activity-001/participants/me');
  });

  it('delete hosted activity helper calls the host activity DELETE endpoint', async () => {
    const client = createClient();

    await deleteHostedActivity('activity-001', client);

    expect(client.delete).toHaveBeenCalledWith('/activities/activity-001');
  });

  it('public profile helper includes activity context in the path', async () => {
    const client = createClient();
    client.get.mockResolvedValue({ data: { studentAccountId: 'student-001' } });

    await getPublicStudentProfile('activity-001', 'student-001', client);

    expect(client.get).toHaveBeenCalledWith('/activities/activity-001/profiles/student-001');
  });

  it('maps activity report route params to the backend SubmitReportRequestDto shape', () => {
    expect(
      buildSubmitReportPayload({
        campusId: 'campus-001',
        targetType: 'activity',
        targetActivityId: 'activity-001',
        targetAccountId: 'student-001',
        reasonCode: 'unsafe_behavior',
        description: ' details ',
      })
    ).toEqual({
      campusId: 'campus-001',
      targetType: 'activity',
      targetActivityId: 'activity-001',
      targetAccountId: undefined,
      reasonCode: 'unsafe_behavior',
      description: 'details',
    });
  });

  it('maps student report route params to the backend SubmitReportRequestDto shape', async () => {
    const client = createClient();
    const payload = buildSubmitReportPayload({
      campusId: 'campus-001',
      targetType: 'student',
      targetActivityId: 'activity-001',
      targetAccountId: 'student-001',
      reasonCode: 'harassment',
    });

    await submitReport(payload, client);

    expect(client.post).toHaveBeenCalledWith('/reports', {
      campusId: 'campus-001',
      targetType: 'student',
      targetActivityId: undefined,
      targetAccountId: 'student-001',
      reasonCode: 'harassment',
      description: undefined,
    });
  });

  it('sends the exact backend block payload', async () => {
    const client = createClient();

    await blockStudent('student-001', client);

    expect(buildCreateBlockPayload('student-001')).toEqual({ targetAccountId: 'student-001' });
    expect(client.post).toHaveBeenCalledWith('/blocks', { targetAccountId: 'student-001' });
  });
});

function createClient() {
  return {
    get: vi.fn(),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  };
}
