import { HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const authService = injector.get(AuthService);
  const token = authService.token();

  if (token) {
    const authRequest = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(authRequest);
  }

  return next(req);
};
