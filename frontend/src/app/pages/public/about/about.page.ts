import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { PageHeaderComponent } from 'src/app/shared/page-header/page-header.component';
import { PageToolbarComponent } from 'src/app/shared/page-toolbar/page-toolbar.component';
import { AppConfigService } from 'src/app/services/app-config-service';
import { SEO_VENUE } from 'src/app/config/seo.config';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    PageToolbarComponent,
    PageHeaderComponent,
    IonContent,
    RouterLink,
  ],
})
export class AboutPage {
  private appConfigService = inject(AppConfigService);

  eventName = this.appConfigService.eventName;
  eventDates = this.appConfigService.eventDates;
  registrationStatus = this.appConfigService.registrationStatus;
  registrationOpen = this.appConfigService.registrationStatus === 'open';
  readonly venue = SEO_VENUE;
}
