import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import {
  IonContent,
  IonItem,
  IonList,
  IonInput,
  IonInputPasswordToggle,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonMenuButton,
  IonRouterLink,
} from '@ionic/angular';
import { ToastService } from 'src/app/services/toast.service';
import {
  Auth,
  sendEmailVerification,
  signInWithEmailAndPassword,
  UserCredential,
} from '@angular/fire/auth';
import { FirebaseError } from '@angular/fire/app';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { Router, RouterLink } from '@angular/router';
import { apiFireauthService } from 'src/app/api/services';
import { apiCreateUser } from 'src/app/api/models';
import { AppConfigService } from 'src/app/services/app-config-service';
import { LoadingService } from 'src/app/services/loading.service';
import { SignupFormModel } from 'src/app/shared/models/form-models';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonTitle,
    IonToolbar,
    IonHeader,
    IonButton,
    IonList,
    IonItem,
    IonContent,
    IonInputPasswordToggle,
    IonInput,
    FormField,
    ToolbarButtonsComponent,
    IonMenuButton,
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
    this.apiAuth.createUserFireauthSignupPost({ body: params }).subscribe({
        next: () => {
          this.loadingService.showLoading('Signin in...');
          signInWithEmailAndPassword(
            this.fireAuth,
            params.email,
            params.password
          )
            .then((value: UserCredential) => {
              this.loadingService.showLoading(
                'Sending email for verification...'
              );
              sendEmailVerification(value.user)
                .then(() => {
                  this.toastService.showSuccess(
                    'Check your email for verification link'
                  );
                  this.router.navigate(['/home'], { replaceUrl: true });
                  this.loadingService.dismissLoading();
                })
                .catch((err: FirebaseError) => {
                  console.error('Error sending verification email: ', err);
                  this.toastService.showError(
                    'Error sending verification email: ' + err.message
                  );
                  this.loadingService.dismissLoading();
                  this.router.navigate(['/home'], { replaceUrl: true });
                });
            })
            .catch((err: FirebaseError) => {
              console.error('Error logging in: ', err);
              this.toastService.showError('Error logging in: ' + err.message);
              this.loadingService.dismissLoading();
              this.router.navigate(['/home'], { replaceUrl: true });
            });
        },
        error: (err: any) => {
          console.error('Error signing up: ', err);
          this.toastService.showError('Error signing up: ' + err.error.detail);
          this.loadingService.dismissLoading();
          this.router.navigate(['/home'], { replaceUrl: true });
        },
      });
  }
}
