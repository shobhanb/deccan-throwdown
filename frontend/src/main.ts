import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideApiConfiguration } from './app/api/api-configuration';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { httpInterceptor } from './app/providers/http.interceptor';
import { AppConfigService } from './app/services/app-config-service';
import { isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';

const appConfigService = new AppConfigService();

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      mode: 'ios',
      swipeBackEnabled: true,
    }),
    provideRouter(routes, withComponentInputBinding()),
    provideApiConfiguration(appConfigService.apiBaseUrl),
    provideHttpClient(withXhr(), withInterceptors([httpInterceptor])),
    provideServiceWorker('firebase-messaging-sw.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideMessaging(() => getMessaging()),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'deccan-throwdown',
        appId: '1:1049028653381:web:6c84ace588b23b4ecace2c',
        storageBucket: 'deccan-throwdown.firebasestorage.app',
        apiKey: 'AIzaSyAL9eMHBkuqs-1LgBwOc3835epOjAAG4D4',
        authDomain: 'deccan-throwdown.firebaseapp.com',
        messagingSenderId: '1049028653381',
        measurementId: 'G-LGS3X9TW9T',
      })
    ),
    provideAuth(() => getAuth()),
  ],
});
