import type { ActivityDetailsViewModel } from './studentApi';

export type ActivityDetailsActionKind =
  | 'manage_requests'
  | 'host_status'
  | 'pending_request'
  | 'confirmed_participant'
  | 'full'
  | 'closed'
  | 'request_to_join'
  | 'join';

export interface ActivityDetailsActionModel {
  kind: ActivityDetailsActionKind;
  label: string;
  tone: 'green' | 'blue' | 'muted' | 'danger';
  disabled: boolean;
}

export function getActivityDetailsActionModel(
  activity: ActivityDetailsViewModel,
  isFull: boolean
): ActivityDetailsActionModel {
  if (activity.personalActivityStatus === 'host' || activity.canManageRequests) {
    if (activity.canManageRequests) {
      return {
        kind: 'manage_requests',
        label: 'Manage Requests',
        tone: 'green',
        disabled: false
      };
    }

    return {
      kind: 'host_status',
      label: 'You are hosting',
      tone: 'muted',
      disabled: true
    };
  }

  if (activity.personalActivityStatus === 'pending_request') {
    return {
      kind: 'pending_request',
      label: 'Withdraw request',
      tone: 'blue',
      disabled: false
    };
  }

  if (activity.personalActivityStatus === 'confirmed_participant') {
    return {
      kind: 'confirmed_participant',
      label: 'Leave activity',
      tone: 'danger',
      disabled: false
    };
  }

  if (isFull) {
    return {
      kind: 'full',
      label: 'Activity Full',
      tone: 'muted',
      disabled: true
    };
  }

  if (activity.status !== 'open') {
    return {
      kind: 'closed',
      label: formatStatus(activity.status),
      tone: 'muted',
      disabled: true
    };
  }

  if (activity.participationMode === 'approval_based') {
    return {
      kind: 'request_to_join',
      label: 'Request to Join',
      tone: 'blue',
      disabled: false
    };
  }

  return {
    kind: 'join',
    label: 'Join',
    tone: 'green',
    disabled: false
  };
}

function formatStatus(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
