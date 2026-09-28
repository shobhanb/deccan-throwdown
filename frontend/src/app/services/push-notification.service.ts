import {
  effect,
  inject,
  Injectable,
  isDevMode,
  signal,
} from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { SwUpdate } from '@angular/service-worker';
import { apiNotificationsService } from '../api/services';
import { environment } from '../../environments/environment';
import { AppConfigService } from './app-config-service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

const STORAGE_KEY = 'dt_fcm_subscribed';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private messaging = inject(Messaging);
  private apiNotifications = inject(apiNotificationsService);
  private appConfigService = inject(AppConfigService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private swUpdate = inject(SwUpdate);

  readonly subscribed = signal(this.readStoredSubscription());

  constructor() {
    if (!isDevMode() && environment.notificationsEnabled) {
      onMessage(this.messaging, (payload) => {
        const title = payload.notification?.title ?? 'Deccan Throwdown';
        const body = payload.notification?.body ?? '';
        this.toastService.showToast(`${title}: ${body}`, 'primary', null, 3000);
      });
    }

    effect(() => {
      if (this.subscribed() && this.authService.adminUser()) {
        void this.registerCurrentToken();
      }
    });
  }

  private readStoredSubscription(): boolean {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  private persistSubscription(value: boolean): void {
    localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
    this.subscribed.set(value);
  }

  private async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!this.swUpdate.isEnabled || !('serviceWorker' in navigator)) {
      return null;
    }
    return navigator.serviceWorker.ready;
  }

  async enable(): Promise<boolean> {
    if (isDevMode() || !environment.notificationsEnabled) {
      this.toastService.showError(
        'Push notifications require a production build over HTTPS.'
      );
      return false;
    }
    if (!environment.firebaseVapidKey) {
      this.toastService.showError(
        'Push notifications are not configured (missing VAPID key).'
      );
      return false;
    }
    if (!('Notification' in window)) {
      this.toastService.showError('This browser does not support notifications.');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return false;
    }

    const registration = await this.getServiceWorkerRegistration();
    if (!registration) {
      this.toastService.showError('Service worker is not ready yet.');
      return false;
    }

    try {
      const token = await getToken(this.messaging, {
        vapidKey: environment.firebaseVapidKey,
        serviceWorkerRegistration: registration,
      });
      if (!token) {
        this.toastService.showError('Could not enable push notifications.');
        return false;
      }
      await this.apiNotifications.registerFcmTokenNotificationsTokensPost({
        body: {
          token,
          event_short_name: this.appConfigService.eventShortName,
          subscribe_event: true,
          platform: 'web',
          user_agent: navigator.userAgent,
        },
      });
      localStorage.setItem('dt_fcm_token', token);
      this.persistSubscription(true);
      return true;
    } catch (error) {
      console.error('FCM registration failed', error);
      this.toastService.showError('Failed to enable push notifications.');
      return false;
    }
  }

  async disable(): Promise<void> {
    const token = localStorage.getItem('dt_fcm_token');
    if (token) {
      try {
        await this.apiNotifications.unregisterFcmTokenNotificationsTokensTokenDelete(
          {
            token,
          }
        );
      } catch (error) {
        console.error('FCM unregister failed', error);
      }
      localStorage.removeItem('dt_fcm_token');
    }
    this.persistSubscription(false);
  }

  async setSubscribed(enabled: boolean): Promise<void> {
    if (enabled) {
      await this.enable();
    } else {
      await this.disable();
    }
  }

  private async registerCurrentToken(): Promise<void> {
    const token = localStorage.getItem('dt_fcm_token');
    if (!token || !this.subscribed()) {
      return;
    }
    try {
      await this.apiNotifications.registerFcmTokenNotificationsTokensPost({
        body: {
          token,
          event_short_name: this.appConfigService.eventShortName,
          subscribe_event: true,
          platform: 'web',
          user_agent: navigator.userAgent,
        },
      });
    } catch (error) {
      console.error('FCM token refresh failed', error);
    }
  }
}
