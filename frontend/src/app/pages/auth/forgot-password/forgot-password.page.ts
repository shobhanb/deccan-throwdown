import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FirebaseError } from '@angular/fire/app';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { email, form, FormField, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonList,
  IonRouterLink,
} from '@ionic/angular';
import { AppConfigService } from 'src/app/services/app-config-service';
import { ToastService } from 'src/app/services/toast.service';
import { ForgotPasswordFormModel } from 'src/app/shared/models/form-models';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonList,
    IonItem,
    IonButton,
    IonInput,
    IonContent,
    FormField,
    RouterLink,
    IonRouterLink,
  ],
})
export class ForgotPasswordPage {
  private toastService = inject(ToastService);
  private fireAuth = inject(Auth);
  private router = inject(Router);
  private appConfigService = inject(AppConfigService);

  eventName = this.appConfigService.eventName;

  emailModel = signal<ForgotPasswordFormModel>({
    email: '',
  });

  emailForm = form(this.emailModel, (schemaPath) => {
    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Enter a valid email address' });
  });

  isEmailFormValid() {
    return this.emailForm().valid() && this.emailForm().dirty();
  }

  async onSubmit() {
    if (!this.isEmailFormValid()) {
      return;
    }

    const { email: emailAddress } = this.emailModel();
    sendPasswordResetEmail(this.fireAuth, emailAddress)
      .then(() => {
        this.toastService.showSuccess(
          `Password reset link sent to ${emailAddress}`
        );
        this.router.navigate(['/home'], { replaceUrl: true });
      })
      .catch((err: FirebaseError) => {
        console.error(err);
        this.toastService.showError(err.message);
      });
  }
}
