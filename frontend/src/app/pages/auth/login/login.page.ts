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
import { RouterLink } from '@angular/router';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { AppConfigService } from 'src/app/services/app-config-service';
import { AuthService } from 'src/app/services/auth.service';

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
  private appConfigService = inject(AppConfigService);
  private authService = inject(AuthService);

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

    this.authService.login(
      this.loginForm.value.email!,
      this.loginForm.value.password!
    );
  }
}
