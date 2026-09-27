/* tslint:disable */
/* eslint-disable */

export interface apiFcmTokenRegisterModel {
  token: string;
  event_short_name: string;
  subscribe_event?: boolean;
  platform?: string | null;
  user_agent?: string | null;
}
