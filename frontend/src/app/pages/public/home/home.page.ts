import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import {
  IonContent,
  IonButton,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/angular';
import { PageToolbarComponent } from 'src/app/shared/page-toolbar/page-toolbar.component';
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
import { eventIsoDateRange, SEO_VENUE } from 'src/app/config/seo.config';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    PageToolbarComponent,
    IonLabel,
    IonItem,
    IonList,
    IonIcon,
    IonRefresherContent,
    IonRefresher,
    IonButton,
    IonContent,
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

  private readonly siteUrl = environment.siteUrl.replace(/\/$/, '');

  readonly eventPageUrl = `${this.siteUrl}/home`;
  readonly eventImageUrl = `${this.siteUrl}/icons/logo_512.jpg`;
  readonly organizerUrl = this.siteUrl;
  readonly offerUrl = `${this.siteUrl}/register`;
  readonly offerPrice = String(
    this.appConfigService.registrationPricing?.standard ?? 0
  );
  readonly offerAvailability =
    this.registrationStatus === 'open'
      ? 'https://schema.org/InStock'
      : this.registrationStatus === 'coming-soon'
        ? 'https://schema.org/PreOrder'
        : 'https://schema.org/SoldOut';
  readonly venueName = SEO_VENUE.name;
  readonly venueLocality = SEO_VENUE.addressLocality;
  readonly venueRegion = SEO_VENUE.addressRegion;
  readonly venueCountry = SEO_VENUE.addressCountry;
  readonly eventStartDate = eventIsoDateRange(
    this.appConfigService.eventShortName,
    this.eventDates
  ).startDate;
  readonly eventEndDate = eventIsoDateRange(
    this.appConfigService.eventShortName,
    this.eventDates
  ).endDate;

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
