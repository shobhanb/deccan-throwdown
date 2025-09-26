import { Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonText,
  IonRouterLink,
} from '@ionic/angular/standalone';
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

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [
    IonText,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonTitle,
    IonToolbar,
    IonHeader,
    IonButton,
    IonList,
    IonItem,
    IonContent,
    IonInputPasswordToggle,
    IonInput,
    ReactiveFormsModule,
    ToolbarButtonsComponent,
    IonMenuButton,
    RouterLink,
    IonRouterLink,
  ],
})
export class SignupPage implements OnInit {
  private fireAuth = inject(Auth);
  private toastService = inject(ToastService);
  private apiAuth = inject(apiFireauthService);
  private appConfigService = inject(AppConfigService);
  private router = inject(Router);
  private loadingService = inject(LoadingService);

  eventName = this.appConfigService.eventName;

  constructor() {}

  ngOnInit() {}

  signupForm = new FormGroup({
    display_name: new FormControl('', {
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  isSignupFormValid() {
    return this.signupForm.valid && this.signupForm.dirty;
  }

  async onSubmitSignupForm() {
    if (!this.isSignupFormValid()) {
      return;
    }

    const params = this.signupForm.value as apiCreateUser;

    this.loadingService.showLoading('Signing up...');
    this.apiAuth.createUserFireauthSignupPost({ body: params }).subscribe({
      next: () => {
        this.loadingService.showLoading('Signin in...');
        const userCredential = signInWithEmailAndPassword(
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
