import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
  MenuController,
  IonButton,
  IonRouterLink,
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
  ],
})
export class MenuComponent implements OnInit {
  private menuController = inject(MenuController);
  private appConfigService = inject(AppConfigService);
  private authService = inject(AuthService);
  private router = inject(Router);

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

  async closeMenu() {
    await this.menuController.close('main-menu');
  }

  async navigateTo(route: string[]) {
    await this.menuController.close('main-menu');
    this.router.navigate(route);
  }
}
