import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonMenuButton,
  IonRefresher,
  IonRefresherContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonText,
  IonList,
  IonItem,
  IonLabel,
  IonSkeletonText,
  IonRouterLink,
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppConfigService } from 'src/app/services/app-config-service';

@Component({
  selector: 'app-scores',
  templateUrl: './scores.page.html',
  styleUrls: ['./scores.page.scss'],
  standalone: true,
  imports: [
    IonLabel,
    IonItem,
    IonList,
    IonText,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonRefresherContent,
    IonRefresher,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSkeletonText,
    CommonModule,
    FormsModule,
    IonMenuButton,
    ToolbarButtonsComponent,
    RouterLink,
    IonRouterLink,
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
