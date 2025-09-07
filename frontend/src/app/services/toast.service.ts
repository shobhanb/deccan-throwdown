import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { timer } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  router = inject(Router);

  readonly isOpen = signal<boolean>(false);
  readonly color = signal<'primary' | 'success' | 'warning' | 'danger'>(
    'success'
  );
  readonly message = signal<string | null>(null);

  showToast(
    message: string,
    color: 'primary' | 'success' | 'warning' | 'danger' = 'success',
    redirectUrl: string | null = null,
    duration: number = 1000
  ) {
    this.message.set(message);
    this.color.set(color);
    this.isOpen.set(true);

    if (redirectUrl) {
      this.router.navigateByUrl(redirectUrl);
    }
    timer(duration).subscribe(() => {
      this.isOpen.set(false);
    });
  }

  show404() {
    return this.showToast('Invalid URL', 'danger', '/', 2000);
  }

  showError(message: string) {
    return this.showToast(message, 'danger', null, 3000);
  }

  showSuccess(message: string) {
    return this.showToast(message, 'success', null, 1000);
  }

  constructor() {}
}
