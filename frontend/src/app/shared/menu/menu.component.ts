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
  calendarOutline,
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
  private appConfig = inject(AppConfigService);

  eventShortName = this.appConfig.eventShortName;

  constructor() {
    addIcons({
      homeOutline,
      barChartOutline,
      calendarOutline,
      peopleOutline,
      barbellOutline,
      calculatorOutline,
    });
  }

  ngOnInit() {}

  async closeMenu() {
    await this.menuController.close('main-menu');
  }
}
