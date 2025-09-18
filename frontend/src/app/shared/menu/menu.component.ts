import { Component, inject, OnInit } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barbellOutline,
  barChartOutline,
  calculatorOutline,
  checkmarkCircleOutline,
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
export class MenuComponent implements OnInit {
  private appConfigService = inject(AppConfigService);
  private authService = inject(AuthService);

  adminUser = this.authService.adminUser;

  eventShortName = this.appConfigService.eventShortName;
  eventName = this.appConfigService.eventName;

  constructor() {
    addIcons({
      homeOutline,
      barChartOutline,
      peopleOutline,
      barbellOutline,
      calculatorOutline,
      checkmarkCircleOutline,
      fingerPrintOutline,
    });
  }

  ngOnInit() {}
}
