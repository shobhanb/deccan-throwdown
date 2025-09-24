import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonMenuButton,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonText,
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { ActivatedRoute } from '@angular/router';
import { apiAuthService } from 'src/app/api/services';
import { apiUserRead } from 'src/app/api/models/api-user-read';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.page.html',
  styleUrls: ['./verify-email.page.scss'],
  standalone: true,
  imports: [
    IonText,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCardContent,
    IonCard,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonMenuButton,
    ToolbarButtonsComponent,
  ],
})
export class VerifyEmailPage implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private apiAuth = inject(apiAuthService);
  private toastService = inject(ToastService);

  private token: string | null =
    this.activatedRoute.snapshot.queryParamMap.get('token');

  verificationText = signal('Verifying...');

  constructor() {}

  ngOnInit() {
    if (this.token) {
      console.log('Token found:', this.token);
      this.onClickVerifyToken(this.token);
    }
  }

  onClickVerifyToken(token: string) {
    this.apiAuth
      .verifyVerifyAuthVerifyPost({ body: { token: token } })
      .subscribe({
        next: (value: apiUserRead) => {
          console.log('Verification successful:', value);
          this.toastService.showSuccess(
            'Email verified successfully! You can now log in.'
          );
          this.verificationText.set(
            'Email verified successfully! You can now log in.'
          );
        },
        error: (error) => {
          console.error('Verification failed:', error);
          this.toastService.showError(
            'Email verification failed: ' + error.error.detail
          );
          this.verificationText.set('Email verification failed');
        },
      });
  }
}
