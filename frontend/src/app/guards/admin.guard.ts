import { inject, Injector } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const injector = inject(Injector);
  const authService = injector.get(AuthService);
  const router = inject(Router);

  if (authService.adminUser?.()) {
    return true;
  }
  return router.createUrlTree(['/home']);
};
