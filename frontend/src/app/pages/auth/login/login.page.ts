import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonText,
  IonMenuButton,
} from '@ionic/angular/standalone';
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

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonContent,
    IonInputPasswordToggle,
    CommonModule,
    ReactiveFormsModule,
    IonRouterLink,
    RouterLink,
    ToolbarButtonsComponent,
    IonMenuButton,
  ],
})
export class LoginPage implements OnInit {
  private fireAuth = inject(Auth);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);
  private appConfigService = inject(AppConfigService);
  private router = inject(Router);

  eventName = this.appConfigService.eventName;

  constructor() {}

  ngOnInit() {}

  loginForm = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.email, Validators.required],
    }),
    password: new FormControl('', { validators: [Validators.required] }),
  });

  isLoginFormValid() {
    return this.loginForm.valid && this.loginForm.dirty;
  }

  async onClickLogin() {
    if (!this.isLoginFormValid()) {
      return;
    }

    this.loadingService.showLoading('Logging in');

    signInWithEmailAndPassword(
      this.fireAuth,
      this.loginForm.value.email!,
      this.loginForm.value.password!
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
