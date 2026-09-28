import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import {
  Auth,
  user,
  IdTokenResult,
  sendEmailVerification,
  signOut,
  User,
} from '@angular/fire/auth';
import { apiFirebaseCustomClaims } from '../api/models';
import { FirebaseError } from '@angular/fire/app';
import { ToastService } from './toast.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private auth = inject(Auth, { optional: true });
  private userSubscription?: Subscription;

  readonly user = signal<User | null>(null);
  readonly userCustomClaims = signal<apiFirebaseCustomClaims | null>(null);

  readonly userNameInitials = computed<string | null>(() => {
    const currentUser = this.user();
    if (currentUser && currentUser.displayName) {
      return currentUser.displayName
        .split(' ')
        .map((n) => n[0])
        .join('');
    }
    return null;
  });

  readonly verifiedUser = computed<boolean>(
    () => (!!this.user() && this.user()?.emailVerified) || false
  );

  readonly adminUser = computed<boolean>(
    () => (this.verifiedUser() && this.userCustomClaims()?.admin) || false
  );

  private getCustomClaims(user: User | null, forceRefresh = false) {
    if (user) {
      user.getIdTokenResult(forceRefresh).then((value: IdTokenResult) => {
        const customClaims = value.claims;
        this.userCustomClaims.set({
          admin: customClaims['admin'] ? true : false,
        });
      });
    } else {
      this.userCustomClaims.set(null);
    }
  }

  constructor() {
    if (!this.auth) {
      return;
    }

    const user$ = user(this.auth);
    this.userSubscription = user$.subscribe((currentUser) => {
      this.user.set(currentUser);

      if (currentUser) {
        this.getCustomClaims(currentUser);
      }
    });

    this.destroyRef.onDestroy(() => {
      this.userSubscription?.unsubscribe();
    });

    effect(() => {
      if (this.user() && !this.userCustomClaims()) {
        this.getCustomClaims(this.user());
      }
    });
  }

  async logout() {
    if (!this.auth) {
      return;
    }
    await signOut(this.auth)
      .then(() => {
        this.toastService.showSuccess('Logged out');
        this.userCustomClaims.set(null);
      })
      .catch((err: FirebaseError) => {
        this.toastService.showError(`Error logging out: ${err.message}`);
      });
  }

  async sendVerificationEmail() {
    if (!this.user()) {
      return;
    }
    sendEmailVerification(this.user()!)
      .then(() => {
        this.toastService.showSuccess('Sent verification email');
      })
      .catch((err: FirebaseError) => {
        this.toastService.showError(
          `Error sending verification email: ${err.message}`
        );
      });
  }

  async forceRefreshToken() {
    if (!this.auth) {
      return;
    }
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      await currentUser.reload().then(() => {
        currentUser.getIdToken(true).then(() => {
          this.user.update((existingUser) => {
            return existingUser
              ? { ...existingUser, emailVerified: currentUser.emailVerified }
              : null;
          });
          this.getCustomClaims(currentUser, true);
        });
      });
    }
  }
}
