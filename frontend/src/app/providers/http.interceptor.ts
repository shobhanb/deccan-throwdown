import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { catchError, from, switchMap } from 'rxjs';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);

  const tokenPromise = auth.currentUser
    ? auth.currentUser.getIdToken().catch(() => null)
    : Promise.resolve(null);

  return from(tokenPromise).pipe(
    switchMap((token) => {
      const request = token
        ? req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          })
        : req;
      return next(request);
    }),
    catchError((error) => {
      console.error('HTTP interceptor error', error);
      return next(req);
    })
  );
};
