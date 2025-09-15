import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barbellOutline,
  barChartOutline,
  calculatorOutline,
  calendarOutline,
  checkmarkCircleOutline,
  homeOutline,
  peopleOutline,
} from 'ionicons/icons';
import { appConfig, defaultConfig } from 'src/app/config/config';
import { AppConfigService } from 'src/app/services/app-config-service';

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
  ],
})
export class MenuComponent implements OnInit {
  private menuController = inject(MenuController);
  private appConfigService = inject(AppConfigService);

  eventShortName = this.appConfigService.eventShortName;
  eventName = computed(() => appConfig[this.eventShortName()]?.eventName || '');

  constructor() {
    addIcons({
      homeOutline,
      barChartOutline,
      calendarOutline,
      peopleOutline,
      barbellOutline,
      calculatorOutline,
      checkmarkCircleOutline,
    });
  }

  ngOnInit() {}

  ionViewWillEnter() {}

  async closeMenu() {
    await this.menuController.close('main-menu');
  }
}
