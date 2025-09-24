import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonMenuButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonText,
  IonList,
  IonItem,
  IonButton,
  IonRouterLink,
  IonInput,
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { apiAuthService } from 'src/app/api/services';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonItem,
    IonList,
    IonText,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonMenuButton,
    ToolbarButtonsComponent,
    ReactiveFormsModule,
    RouterLink,
    IonRouterLink,
    IonInput,
  ],
})
export class ResetPasswordPage implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private apiAuth = inject(apiAuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  private token: string | null =
    this.activatedRoute.snapshot.queryParamMap.get('token');

  passwordForm = new FormGroup({
    password: new FormControl('', {
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  isPasswordFormValid() {
    return this.passwordForm.valid && this.passwordForm.dirty && this.token;
  }

  async onSubmit() {
    if (!this.isPasswordFormValid()) {
      return;
    }

    this.apiAuth
      .resetResetPasswordAuthResetPasswordPost({
        body: {
          password: this.passwordForm.value.password!,
          token: this.token!,
        },
      })
      .subscribe({
        next: () => {
          console.log('Password reset successful');
          this.passwordForm.reset();
          this.toastService.showSuccess(
            'Password reset successful! You can now log in with your new password.'
          );
          this.router.navigate(['/auth', 'login'], { replaceUrl: true });
        },
        error: (error) => {
          console.error('Password reset failed', error);
          this.toastService.showError(
            'Password reset failed: ' + error.error.detail
          );
          this.router.navigate(['/home'], { replaceUrl: true });
        },
      });
  }

  constructor() {}

  ngOnInit() {
    if (!this.token) {
      this.toastService.showError(
        'Invalid or missing token for password reset'
      );
    }
  }
}
