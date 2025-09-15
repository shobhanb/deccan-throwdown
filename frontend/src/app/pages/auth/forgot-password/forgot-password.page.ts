import { Component, inject, OnInit } from '@angular/core';
import { FirebaseError } from '@angular/fire/app';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonList,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonText,
} from '@ionic/angular/standalone';
import { AppConfigService } from 'src/app/services/app-config-service';
import { ToastService } from 'src/app/services/toast.service';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
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
    IonButton,
    IonInput,
    IonContent,
    ReactiveFormsModule,
    ToolbarButtonsComponent,
  ],
})
export class ForgotPasswordPage implements OnInit {
  private toastService = inject(ToastService);
  private fireAuth = inject(Auth);
  private router = inject(Router);
  private appConfigService = inject(AppConfigService);

  eventName = this.appConfigService.eventName;

  emailForm = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.email, Validators.required],
    }),
  });

  isEmailFormValid() {
    return this.emailForm.valid && this.emailForm.dirty;
  }

  async onSubmit() {
    if (this.isEmailFormValid()) {
      sendPasswordResetEmail(this.fireAuth, this.emailForm.value.email!)
        .then(() => {
          this.toastService.showSuccess(
            `Password reset link sent to ${this.emailForm.value.email}`
          );
          this.router.navigate(['/home'], { replaceUrl: true });
        })
        .catch((err: FirebaseError) => {
          console.error(err);
          this.toastService.showError(err.message);
        });
    }
  }

  onCancel() {
    this.emailForm.reset();
    this.router.navigate(['/home'], { replaceUrl: true });
  }

  constructor() {}

  ngOnInit() {}
}
