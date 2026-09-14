import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonMenuButton,
  IonChip,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/angular';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { AppInstallService } from 'src/app/services/app-install.service';
import { addIcons } from 'ionicons';
import {
  barbellOutline,
  cameraOutline,
  closeOutline,
  createOutline,
  downloadOutline,
  logoInstagram,
  peopleOutline,
  trophyOutline,
} from 'ionicons/icons';
import { AppConfigService } from 'src/app/services/app-config-service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonLabel,
    IonItem,
    IonList,
    IonChip,
    IonIcon,
    IonRefresherContent,
    IonRefresher,
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    ToolbarButtonsComponent,
    IonMenuButton,
    RouterLink,
  ],
})
export class HomePage {
  private appConfigService = inject(AppConfigService);
  appInstallService = inject(AppInstallService);

  eventName = this.appConfigService.eventName;
  tagline = this.appConfigService.tagline;
  eventDates = this.appConfigService.eventDates;
  registrationStatus = this.appConfigService.registrationStatus;
  registrationOpen = this.appConfigService.registrationStatus === 'open';
  leaderboardEnabled = this.appConfigService.leaderboardEnabled;

  constructor() {
    addIcons({
      closeOutline,
      downloadOutline,
      barbellOutline,
      peopleOutline,
      trophyOutline,
      cameraOutline,
      logoInstagram,
      createOutline,
    });
  }

  handleRefresh(event: CustomEvent) {
    (event.target as HTMLIonRefresherElement).complete();
  }
}
