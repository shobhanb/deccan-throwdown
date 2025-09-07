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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  private auth = inject(Auth);
  private user$ = user(this.auth);
  private userSubscription: Subscription;

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
    this.userSubscription = this.user$.subscribe((user) => {
      this.user.set(user);

      if (user) {
        this.getCustomClaims(user);
      }
    });

    this.destroyRef.onDestroy(() => {
      this.userSubscription.unsubscribe();
    });

    effect(() => {
      if (this.user() && !this.userCustomClaims()) {
        this.getCustomClaims(this.user());
      }
    });
  }

  async logout() {
    await signOut(this.auth)
      .then(() => {
        this.toastService.showToast('Logged out', 'primary', '/', 1000);
        this.userCustomClaims.set(null);
      })
      .catch((err: FirebaseError) => {
        this.toastService.showToast(
          `Error logging out: ${err.message}`,
          'danger',
          null,
          1000
        );
      });
  }

  async sendVerificationEmail() {
    sendEmailVerification(this.user()!)
      .then(() => {
        this.toastService.showToast(
          'Sent verification email',
          'success',
          null,
          1000
        );
      })
      .catch((err: FirebaseError) => {
        this.toastService.showToast(
          `Error sending verification email: ${err.message}`,
          'danger',
          null,
          1000
        );
      });
  }

  async forceRefreshToken() {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      await currentUser.reload().then(() => {
        currentUser.getIdToken(true).then(() => {
          this.user.update((user) => {
            return user
              ? { ...user, emailVerified: currentUser.emailVerified }
              : null;
          });
          this.getCustomClaims(currentUser, true);
        });
      });
    }
  }
}
