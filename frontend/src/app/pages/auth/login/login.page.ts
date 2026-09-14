import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import {
  IonContent,
  IonButton,
  IonInput,
  IonInputPasswordToggle,
  IonItem,
  IonList,
  IonRouterLink,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonMenuButton,
} from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import {
  Auth,
  signInWithEmailAndPassword,
  UserCredential,
} from '@angular/fire/auth';
import { LoadingService } from 'src/app/services/loading.service';
import { ToastService } from 'src/app/services/toast.service';
import { FirebaseError } from '@angular/fire/app';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { AppConfigService } from 'src/app/services/app-config-service';
import { LoginFormModel } from 'src/app/shared/models/form-models';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonTitle,
    IonToolbar,
    IonHeader,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonContent,
    IonInputPasswordToggle,
    FormField,
    IonRouterLink,
    RouterLink,
    ToolbarButtonsComponent,
    IonMenuButton,
  ],
})
export class LoginPage {
  private fireAuth = inject(Auth);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);
  private appConfigService = inject(AppConfigService);
  private router = inject(Router);

  eventName = this.appConfigService.eventName;

  loginModel = signal<LoginFormModel>({
    email: '',
    password: '',
  });

  loginForm = form(this.loginModel, (schemaPath) => {
    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Enter a valid email address' });
    required(schemaPath.password, { message: 'Password is required' });
  });

  isLoginFormValid() {
    return this.loginForm().valid() && this.loginForm().dirty();
  }

  async onClickLogin() {
    if (!this.isLoginFormValid()) {
      return;
    }

    const credentials = this.loginModel();
    this.loadingService.showLoading('Logging in');

    signInWithEmailAndPassword(
      this.fireAuth,
      credentials.email,
      credentials.password
    )
      .then((value: UserCredential) => {
        this.loadingService.dismissLoading();
        if (value.user.emailVerified) {
          this.toastService.showSuccess('Logged in successfully');
        } else {
          this.toastService.showToast(
            'Logged in. Please verify your email',
            'warning'
          );
        }
        this.router.navigate(['/home'], { replaceUrl: true });
      })
      .catch((err: FirebaseError) => {
        console.error(err);
        this.loadingService.dismissLoading();
        this.toastService.showError(`Error logging in: ${err.message}`);
      });
  }
}
