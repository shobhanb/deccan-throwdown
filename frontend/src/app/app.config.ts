import {
  ApplicationConfig,
  isDevMode,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular';
import { routes } from './app.routes';
import { ApiConfiguration } from './api/api-configuration';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
  withXhr,
} from '@angular/common/http';
import { httpInterceptor } from './providers/http.interceptor';
import { AppConfigService } from './services/app-config-service';
import { provideServiceWorker } from '@angular/service-worker';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { provideClientHydration } from '@angular/platform-browser';

const firebaseConfig = {
  projectId: 'deccan-throwdown',
  appId: '1:1049028653381:web:6c84ace588b23b4ecace2c',
  storageBucket: 'deccan-throwdown.firebasestorage.app',
  apiKey: 'AIzaSyAL9eMHBkuqs-1LgBwOc3835epOjAAG4D4',
  authDomain: 'deccan-throwdown.firebaseapp.com',
  messagingSenderId: '1049028653381',
  measurementId: 'G-LGS3X9TW9T',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      mode: 'ios',
      swipeBackEnabled: false,
    }),
    provideRouter(routes, withComponentInputBinding()),
    AppConfigService,
    {
      provide: ApiConfiguration,
      useFactory: (appConfigService: AppConfigService) => {
        const configuration = new ApiConfiguration();
        configuration.rootUrl = appConfigService.apiBaseUrl;
        return configuration;
      },
      deps: [AppConfigService],
    },
  ],
};

export const browserAppConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
    provideHttpClient(withXhr(), withInterceptors([httpInterceptor])),
    provideServiceWorker('firebase-messaging-sw.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideMessaging(() => getMessaging()),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
  ],
};

export const serverAppConfig: ApplicationConfig = {
  providers: [provideHttpClient(withFetch())],
};
