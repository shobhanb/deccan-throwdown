import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import {
  IonContent,
  IonItem,
  IonList,
  IonInput,
  IonInputPasswordToggle,
  IonButton,
  IonRouterLink,
} from '@ionic/angular';
import { ToastService } from 'src/app/services/toast.service';
import {
  Auth,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from '@angular/fire/auth';
import { FirebaseError } from '@angular/fire/app';
import { Router, RouterLink } from '@angular/router';
import { apiFireauthService } from 'src/app/api/services';
import { apiCreateUser } from 'src/app/api/models';
import { AppConfigService } from 'src/app/services/app-config-service';
import { LoadingService } from 'src/app/services/loading.service';
import { SignupFormModel } from 'src/app/shared/models/form-models';
import { apiErrorDetail } from 'src/app/services/api-call.util';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonButton,
    IonList,
    IonItem,
    IonContent,
    IonInputPasswordToggle,
    IonInput,
    FormField,
    RouterLink,
    IonRouterLink,
  ],
})
export class SignupPage {
  private fireAuth = inject(Auth);
  private toastService = inject(ToastService);
  private apiAuth = inject(apiFireauthService);
  private appConfigService = inject(AppConfigService);
  private router = inject(Router);
  private loadingService = inject(LoadingService);

  eventName = this.appConfigService.eventName;

  signupModel = signal<SignupFormModel>({
    display_name: '',
    email: '',
    password: '',
  });

  signupForm = form(this.signupModel, (schemaPath) => {
    required(schemaPath.display_name, { message: 'Name is required' });
    minLength(schemaPath.display_name, 2, {
      message: 'Name must be at least 2 characters',
    });
    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Enter a valid email address' });
    required(schemaPath.password, { message: 'Password is required' });
    minLength(schemaPath.password, 6, {
      message: 'Password must be at least 6 characters',
    });
  });

  isSignupFormValid() {
    return this.signupForm().valid() && this.signupForm().dirty();
  }

  async onSubmitSignupForm() {
    if (!this.isSignupFormValid()) {
      return;
    }

    const params = this.signupModel() as apiCreateUser;

    this.loadingService.showLoading('Signing up...');
    try {
      await this.apiAuth.createUserFireauthSignupPost({ body: params });
      this.loadingService.showLoading('Signin in...');
      const value = await signInWithEmailAndPassword(
        this.fireAuth,
        params.email,
        params.password
      );
      this.loadingService.showLoading('Sending email for verification...');
      try {
        await sendEmailVerification(value.user);
        this.toastService.showSuccess('Check your email for verification link');
      } catch (err: unknown) {
        const firebaseErr = err as FirebaseError;
        console.error('Error sending verification email: ', firebaseErr);
        this.toastService.showError(
          'Error sending verification email: ' + firebaseErr.message
        );
      }
      this.router.navigate(['/home'], { replaceUrl: true });
      this.loadingService.dismissLoading();
    } catch (err: unknown) {
      console.error('Error signing up: ', err);
      this.toastService.showError(
        'Error signing up: ' + (apiErrorDetail(err) ?? 'Unknown error')
      );
      this.loadingService.dismissLoading();
      this.router.navigate(['/home'], { replaceUrl: true });
    }
  }
}
