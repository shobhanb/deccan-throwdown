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
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { Router, RouterLink } from '@angular/router';
import { AppConfigService } from 'src/app/services/app-config-service';
import { LoadingService } from 'src/app/services/loading.service';
import { apiAuthService } from 'src/app/api/services';
import { apiUserCreate, apiUserRead } from 'src/app/api/models';

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
  private toastService = inject(ToastService);
  private apiAuth = inject(apiAuthService);
  private appConfigService = inject(AppConfigService);
  private router = inject(Router);
  private loadingService = inject(LoadingService);

  eventName = this.appConfigService.eventName;

  constructor() {}

  ngOnInit() {}

  signupForm = new FormGroup({
    name: new FormControl('', {
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

    const params = this.signupForm.value as apiUserCreate;

    this.loadingService.showLoading('Signing up...');
    this.apiAuth.registerRegisterAuthRegisterPost({ body: params }).subscribe({
      next: (value: apiUserRead) => {
        this.toastService.showSuccess('Check your email for verification link');
        this.router.navigate(['/home'], { replaceUrl: true });
        this.loadingService.dismissLoading();
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
