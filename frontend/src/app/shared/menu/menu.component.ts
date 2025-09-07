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
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  imports: [
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
  constructor() {}

  ngOnInit() {}

  async closeMenu() {
    await this.menuController.close('main-menu');
  }
}
