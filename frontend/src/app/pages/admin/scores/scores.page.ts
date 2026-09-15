import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonMenuButton,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonLabel,
  IonSkeletonText,
  IonRouterLink,
} from '@ionic/angular';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { AdminPageHeaderComponent } from 'src/app/shared/admin-page-header/admin-page-header.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppConfigService } from 'src/app/services/app-config-service';

@Component({
  selector: 'app-scores',
  templateUrl: './scores.page.html',
  styleUrls: ['./scores.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonLabel,
    IonItem,
    IonList,
    AdminPageHeaderComponent,
    IonRefresherContent,
    IonRefresher,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSkeletonText,
    IonMenuButton,
    ToolbarButtonsComponent,
    RouterLink,
    IonRouterLink
],
})
export class ScoresPage implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private appConfigService = inject(AppConfigService);

  dataLoaded = signal<boolean>(false);
  verificationMode = signal<boolean>(false);

  eventShortName = this.appConfigService.eventShortName;
  eventName = this.appConfigService.eventName;
  wods = this.appConfigService.wods;

  constructor() {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.getData();
  }

  handleRefresh(event: CustomEvent) {
    this.getData();
    (event.target as HTMLIonRefresherElement).complete();
  }

  getData() {
    this.dataLoaded.set(true);
    this.verificationMode.set(
      this.activatedRoute.snapshot.data['verificationMode'] || false
    );
  }
}
