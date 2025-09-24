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
import { ApiModule } from './app/api/api.module';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { httpInterceptor } from './app/providers/http.interceptor';
import { AppConfigService } from './app/services/app-config-service';
import { isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

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
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
});
