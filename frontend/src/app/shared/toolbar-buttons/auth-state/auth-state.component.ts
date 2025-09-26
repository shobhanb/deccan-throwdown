import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import {
  IonButtons,
  IonLabel,
  IonContent,
  IonButton,
  IonList,
  IonItem,
  IonModal,
  IonHeader,
  IonToolbar,
  IonListHeader,
  IonNote,
  IonTitle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-auth-state',
  templateUrl: './auth-state.component.html',
  styleUrls: ['./auth-state.component.scss'],
  imports: [
    IonTitle,
    IonNote,
    IonListHeader,
    IonToolbar,
    IonHeader,
    IonModal,
    IonList,
    IonButton,
    IonButtons,
    IonLabel,
    IonItem,
    IonContent,
  ],
})
export class AuthStateComponent implements OnInit {
  authService = inject(AuthService);

  @ViewChild(IonModal) modal!: IonModal;

  constructor() {
    addIcons({ personCircleOutline });
  }

  ngOnInit() {}

  isModalOpen = signal(false);

  openModal() {
    this.authService.forceRefreshToken();
    this.isModalOpen.set(true);
  }

  async onClickResendVerificationEmail() {
    await this.authService.sendVerificationEmail();
  }

  async onClickRefresh() {
    await this.authService.forceRefreshToken();
  }

  async onClickSignOut() {
    this.isModalOpen.set(false);
    await this.authService.logout();
  }

  onClickCancel() {
    this.isModalOpen.set(false);
  }
}
