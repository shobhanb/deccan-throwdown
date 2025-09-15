import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  checkmarkCircleOutline,
  homeOutline,
  peopleOutline,
} from 'ionicons/icons';
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
  eventName = this.appConfigService.eventName;

  constructor() {
    addIcons({
      homeOutline,
      barChartOutline,
      peopleOutline,
      barbellOutline,
      calculatorOutline,
      checkmarkCircleOutline,
    });
  }

  ngOnInit() {}

  async closeMenu() {
    await this.menuController.close('main-menu');
  }
}
