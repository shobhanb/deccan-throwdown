import { computed, inject, Injectable, signal } from '@angular/core';
import { ToastService } from './toast.service';
import { Router } from '@angular/router';
import { apiAuthService } from '../api/services';
import { apiBearerResponse, apiUserCreate, apiUserRead } from '../api/models';
import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private toastService = inject(ToastService);
  private apiAuth = inject(apiAuthService);
  private router = inject(Router);
  private loadingService = inject(LoadingService);

  private readonly TOKEN_KEY = 'dt-auth-token';

  readonly user = signal<apiUserRead | null>(null);
  readonly token = signal<string | null>(null);

  readonly userNameInitials = computed<string | null>(() => {
    const currentUser = this.user();
    if (currentUser && currentUser.name) {
      return currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('');
    }
    return null;
  });

  readonly verifiedUser = computed<boolean>(
    () => (!!this.user() && this.user()?.is_verified) || false
  );

  readonly adminUser = computed<boolean>(
    () =>
      (this.user() && this.user()?.is_verified && this.user()?.is_superuser) ||
      false
  );

  constructor() {
    // Load token from localStorage on service initialization
    this.loadTokenFromStorage();

    if (this.token() && !this.user()) {
      this.getMyInfo();
    }
  }

  private loadTokenFromStorage(): void {
    try {
      const storedToken = localStorage.getItem(this.TOKEN_KEY);
      if (storedToken) {
        this.token.set(storedToken);
      }
    } catch (error) {
      console.error('Error loading token from localStorage:', error);
      // Clear any corrupted token
      this.clearTokenFromStorage();
    }
  }

  private saveTokenToStorage(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token to localStorage:', error);
    }
  }

  private clearTokenFromStorage(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing token from localStorage:', error);
    }
  }

  async register(params: apiUserCreate) {
    this.apiAuth.registerRegisterAuthRegisterPost({ body: params }).subscribe({
      next: (value: apiUserRead) => {
        this.user.set(value);
        this.toastService.showSuccess('Check your email for verification link');
        this.router.navigate(['/home'], { replaceUrl: true });
        this.loadingService.dismissLoading();
      },
      error: (err: any) => {
        this.user.set(null);
        console.error('Error signing up: ', err);
        this.toastService.showError('Error signing up: ' + err.error.detail);
        this.loadingService.dismissLoading();
        this.router.navigate(['/home'], { replaceUrl: true });
      },
    });
  }

  async login(username: string, password: string) {
    await this.apiAuth
      .authDbLoginAuthLoginPost({ body: { username, password } })
      .subscribe({
        next: (value: apiBearerResponse) => {
          this.token.set(value.access_token);
          this.saveTokenToStorage(value.access_token!); // Save to localStorage
          this.toastService.showSuccess('Logged in successfully');
          this.getMyInfo();
          this.router.navigate(['/home'], { replaceUrl: true });
        },
        error: (err: any) => {
          this.token.set(null);
          this.user.set(null);
          this.clearTokenFromStorage(); // Clear from localStorage on error
          console.error('Error logging in: ', err);
          this.toastService.showError('Error logging in: ' + err.error.detail);
          this.router.navigate(['/home'], { replaceUrl: true });
        },
      });
  }

  async logout() {
    this.apiAuth.authDbLogoutAuthLogoutPost().subscribe({
      next: () => {
        this.toastService.showSuccess('Logged out');
        this.router.navigate(['/home']);
        this.user.set(null);
        this.token.set(null);
        this.clearTokenFromStorage(); // Clear from localStorage on logout
      },
      error: (err) => {
        this.toastService.showError(`Error logging out: ${err.detail}`);
        // Clear local state even if server logout fails
        this.user.set(null);
        this.token.set(null);
        this.clearTokenFromStorage();
      },
    });
  }

  async sendVerificationEmail() {
    this.apiAuth
      .verifyRequestTokenAuthRequestVerifyTokenPost({
        body: { email: this.user()!.email },
      })
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Sent verification email');
        },
        error: (err) => {
          this.toastService.showError(
            `Error sending verification email: ${err}`
          );
        },
      });
  }

  async verifyEmail(token: string) {
    this.apiAuth.verifyVerifyAuthVerifyPost({ body: { token } }).subscribe({
      next: () => {
        this.toastService.showSuccess('Email verified successfully');
        this.getMyInfo();
        this.router.navigate(['/home'], { replaceUrl: true });
      },
      error: (err) => {
        this.toastService.showError(`Error verifying email: ${err}`);
      },
    });
  }

  async sendForgotPasswordEmail(email: string) {
    this.apiAuth
      .resetForgotPasswordAuthForgotPasswordPost({ body: { email } })
      .subscribe({
        next: () => {
          this.toastService.showSuccess('Sent password reset email');
        },
        error: (err) => {
          this.toastService.showError(
            `Error sending password reset email: ${err}`
          );
        },
      });
  }

  async resetPassword(token: string, password: string) {
    this.apiAuth
      .resetResetPasswordAuthResetPasswordPost({ body: { token, password } })
      .subscribe({
        next: () => {
          this.toastService.showSuccess(
            'Password Reset Successful. Please Login again'
          );
        },
        error: (err) => {
          this.toastService.showError(
            `Error resetting password: ${err.error.detail}`
          );
        },
      });
  }

  async getMyInfo() {
    this.apiAuth.usersCurrentUserAuthMeGet().subscribe({
      next: (value: apiUserRead) => {
        this.user.set(value);
      },
      error: (err: any) => {
        this.user.set(null);
        this.token.set(null);
        this.clearTokenFromStorage(); // Clear invalid token from localStorage
        console.error('Error fetching current user: ', err);
        this.toastService.showError('Error fetching current user: ' + err);
        this.router.navigate(['/home'], { replaceUrl: true });
      },
    });
  }
}
