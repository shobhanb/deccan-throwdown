import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideIonicAngular } from '@ionic/angular';
import { Auth } from '@angular/fire/auth';
import { SwUpdate } from '@angular/service-worker';
import { of } from 'rxjs';
import { AuthService } from '../app/services/auth.service';
import { signal } from '@angular/core';

export function provideCommonTestProviders(): Array<
  Provider | EnvironmentProviders
> {
  return [
    provideIonicAngular(),
    provideRouter([]),
    provideHttpClient(),
    provideHttpClientTesting(),
    {
      provide: Auth,
      useValue: {
        onIdTokenChanged: () => () => undefined,
        currentUser: null,
      },
    },
    {
      provide: AuthService,
      useValue: {
        user: signal(null),
        userNameInitials: signal(null),
        verifiedUser: signal(false),
        adminUser: signal(false),
        logout: () => Promise.resolve(),
      },
    },
    {
      provide: SwUpdate,
      useValue: {
        isEnabled: false,
        versionUpdates: of(),
      },
    },
    {
      provide: ActivatedRoute,
      useValue: {
        snapshot: {
          paramMap: {
            get: () => null,
          },
        },
      },
    },
  ];
}
