import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
  withComponentInputBinding,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { ApiModule } from './app/api/api.module';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { httpInterceptor } from './app/providers/http.interceptor';
import { AppConfigService } from './app/services/app-config-service';

const appConfigService = new AppConfigService();

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      mode: 'ios',
      swipeBackEnabled: false,
    }),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withComponentInputBinding()
    ),
    ...(ApiModule.forRoot({ rootUrl: appConfigService.apiBaseUrl }).providers ??
      []),
    provideHttpClient(withInterceptors([httpInterceptor])),
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
