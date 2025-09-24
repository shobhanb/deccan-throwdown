import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((c) => c.LoginPage),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./signup/signup.page').then((c) => c.SignupPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password.page').then(
        (c) => c.ForgotPasswordPage
      ),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./verify-email/verify-email.page').then((m) => m.VerifyEmailPage),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./reset-password/reset-password.page').then(
        (m) => m.ResetPasswordPage
      ),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
