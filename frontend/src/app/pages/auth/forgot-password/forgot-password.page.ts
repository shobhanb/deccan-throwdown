import { Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  IonRouterLink,
  IonMenuButton,
} from '@ionic/angular/standalone';
import { AppConfigService } from 'src/app/services/app-config-service';
import { AuthService } from 'src/app/services/auth.service';
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
    RouterLink,
    IonRouterLink,
    IonMenuButton,
  ],
})
export class ForgotPasswordPage implements OnInit {
  private appConfigService = inject(AppConfigService);
  private authService = inject(AuthService);

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
      this.authService.sendForgotPasswordEmail(this.emailForm.value.email!);
    }
  }

  constructor() {}

  ngOnInit() {}
}
