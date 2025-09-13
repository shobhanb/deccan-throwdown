import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonMenuButton,
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { AppInstallService } from 'src/app/services/app-install.service';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { appConfig, defaultConfig } from 'src/app/config/config';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonIcon,
    IonRefresherContent,
    IonRefresher,
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    ToolbarButtonsComponent,
    IonMenuButton,
  ],
})
export class HomePage implements OnInit {
  appInstallService = inject(AppInstallService);

  eventName = appConfig[defaultConfig].eventName;

  constructor() {
    addIcons({ closeOutline });
  }

  ngOnInit() {}

  handleRefresh(event: CustomEvent) {
    (event.target as HTMLIonRefresherElement).complete();
  }
}
