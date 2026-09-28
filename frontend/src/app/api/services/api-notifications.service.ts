/* tslint:disable */
/* eslint-disable */

import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';
import { registerFcmTokenNotificationsTokensPost } from '../fn/notifications/register-fcm-token-notifications-tokens-post';
import { RegisterFcmTokenNotificationsTokensPost$Params } from '../fn/notifications/register-fcm-token-notifications-tokens-post';
import { sendCustomNotificationNotificationsCustomPost } from '../fn/notifications/send-custom-notification-notifications-custom-post';
import { SendCustomNotificationNotificationsCustomPost$Params } from '../fn/notifications/send-custom-notification-notifications-custom-post';
import { unregisterFcmTokenNotificationsTokensTokenDelete } from '../fn/notifications/unregister-fcm-token-notifications-tokens-token-delete';
import { UnregisterFcmTokenNotificationsTokensTokenDelete$Params } from '../fn/notifications/unregister-fcm-token-notifications-tokens-token-delete';
import { apiCustomNotificationSendResponseModel } from '../models/api-custom-notification-send-response-model';
import { apiFcmTokenRegisterResponseModel } from '../models/api-fcm-token-register-response-model';

@Injectable({ providedIn: 'root' })
export class apiNotificationsService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  registerFcmTokenNotificationsTokensPost$Response(
    params: RegisterFcmTokenNotificationsTokensPost$Params,
    context?: HttpContext
  ): Observable<StrictHttpResponse<apiFcmTokenRegisterResponseModel>> {
    return registerFcmTokenNotificationsTokensPost(
      this.http,
      this.rootUrl,
      params,
      context
    );
  }

  registerFcmTokenNotificationsTokensPost(
    params: RegisterFcmTokenNotificationsTokensPost$Params,
    context?: HttpContext
  ): Observable<apiFcmTokenRegisterResponseModel> {
    return this.registerFcmTokenNotificationsTokensPost$Response(
      params,
      context
    ).pipe(map((r: StrictHttpResponse<apiFcmTokenRegisterResponseModel>) => r.body));
  }

  unregisterFcmTokenNotificationsTokensTokenDelete$Response(
    params: UnregisterFcmTokenNotificationsTokensTokenDelete$Params,
    context?: HttpContext
  ): Observable<StrictHttpResponse<void>> {
    return unregisterFcmTokenNotificationsTokensTokenDelete(
      this.http,
      this.rootUrl,
      params,
      context
    );
  }

  unregisterFcmTokenNotificationsTokensTokenDelete(
    params: UnregisterFcmTokenNotificationsTokensTokenDelete$Params,
    context?: HttpContext
  ): Observable<void> {
    return this.unregisterFcmTokenNotificationsTokensTokenDelete$Response(
      params,
      context
    ).pipe(map((r: StrictHttpResponse<void>) => r.body));
  }

  sendCustomNotificationNotificationsCustomPost$Response(
    params: SendCustomNotificationNotificationsCustomPost$Params,
    context?: HttpContext
  ): Observable<StrictHttpResponse<apiCustomNotificationSendResponseModel>> {
    return sendCustomNotificationNotificationsCustomPost(
      this.http,
      this.rootUrl,
      params,
      context
    );
  }

  sendCustomNotificationNotificationsCustomPost(
    params: SendCustomNotificationNotificationsCustomPost$Params,
    context?: HttpContext
  ): Observable<apiCustomNotificationSendResponseModel> {
    return this.sendCustomNotificationNotificationsCustomPost$Response(
      params,
      context
    ).pipe(
      map(
        (r: StrictHttpResponse<apiCustomNotificationSendResponseModel>) =>
          r.body
      )
    );
  }
}
