import { describe, expect, it } from 'vitest';
import { getActivityDetailsActionModel } from './activityDetailsActions';
import type { ActivityDetailsViewModel } from './studentApi';

describe('getActivityDetailsActionModel', () => {
  it('does not show Join for pending_request', () => {
    const action = getActivityDetailsActionModel(
      createActivity({ personalActivityStatus: 'pending_request' }),
      false
    );

    expect(action).toMatchObject({ kind: 'pending_request', label: 'Withdraw request' });
  });

  it('does not show Join for confirmed_participant', () => {
    const action = getActivityDetailsActionModel(
      createActivity({ personalActivityStatus: 'confirmed_participant' }),
      false
    );

    expect(action).toMatchObject({ kind: 'confirmed_participant', label: 'Leave activity' });
  });

  it('shows host controls for the host', () => {
    const action = getActivityDetailsActionModel(
      createActivity({ personalActivityStatus: 'host', canManageRequests: true }),
      false
    );

    expect(action).toMatchObject({ kind: 'manage_requests', label: 'Manage Requests' });
  });

  it('shows the normal join/request action for joinable users', () => {
    expect(getActivityDetailsActionModel(createActivity({ participationMode: 'open' }), false)).toMatchObject({
      kind: 'join',
      label: 'Join',
    });
    expect(
      getActivityDetailsActionModel(createActivity({ participationMode: 'approval_based' }), false)
    ).toMatchObject({
      kind: 'request_to_join',
      label: 'Request to Join',
    });
  });
});

function createActivity(overrides: Partial<ActivityDetailsViewModel> = {}): ActivityDetailsViewModel {
  return {
    activityId: 'activity-001',
    title: 'Study',
    scheduledDateTime: '2026-05-20T10:00:00.000Z',
    meetingPointLabel: 'Library',
    categoryLabel: 'Study',
    currentParticipantCount: 1,
    maxParticipants: 4,
    hostAccountId: 'host-001',
    status: 'open',
    genderPreference: 'all',
    participationMode: 'open',
    currentRequestCount: 0,
    ...overrides,
  };
}
