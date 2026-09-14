import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenu,
  IonButton,
  IonRouterLink,
  IonMenuToggle,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  barbellOutline,
  barChartOutline,
  calculatorOutline,
  cameraOutline,
  checkmarkCircleOutline,
  createOutline,
  fingerPrintOutline,
  homeOutline,
  peopleOutline,
} from 'ionicons/icons';
import { AppConfigService } from 'src/app/services/app-config-service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonButton,
    IonLabel,
    IonIcon,
    IonItem,
    IonList,
    IonContent,
    IonTitle,
    IonToolbar,
    IonHeader,
    IonMenu,
    RouterLink,
    IonRouterLink,
    RouterLinkActive,
    IonMenuToggle,
  ],
})
export class MenuComponent {
  private appConfigService = inject(AppConfigService);
  private authService = inject(AuthService);

  adminUser = this.authService.adminUser;

  eventName = this.appConfigService.eventName;
  archiveEvents = this.appConfigService.archiveEvents;
  registrationOpen =
    this.appConfigService.registrationStatus === 'open';
  leaderboardEnabled = this.appConfigService.leaderboardEnabled;

  constructor() {
    addIcons({
      homeOutline,
      barChartOutline,
      peopleOutline,
      barbellOutline,
      calculatorOutline,
      checkmarkCircleOutline,
      fingerPrintOutline,
      cameraOutline,
      createOutline,
    });
  }
}
