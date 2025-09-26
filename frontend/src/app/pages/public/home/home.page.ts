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
  IonMenuButton,
  IonCardContent,
  IonText,
  IonRouterLink,
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { AppInstallService } from 'src/app/services/app-install.service';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { AppConfigService } from 'src/app/services/app-config-service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonText,
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
    RouterLink,
    IonRouterLink,
  ],
})
export class HomePage implements OnInit {
  private appConfigService = inject(AppConfigService);
  appInstallService = inject(AppInstallService);

  eventShortName = this.appConfigService.eventShortName;
  eventName = this.appConfigService.eventName;

  constructor() {
    addIcons({ closeOutline });
  }

  ngOnInit() {}

  ionViewWillEnter() {}

  handleRefresh(event: CustomEvent) {
    (event.target as HTMLIonRefresherElement).complete();
  }
}
