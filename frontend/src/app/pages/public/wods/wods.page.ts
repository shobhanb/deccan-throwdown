import { Component, inject, linkedSignal, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonMenuButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonLabel,
  IonItem,
  IonRefresherContent,
  IonRefresher,
  IonList,
  IonSkeletonText,
  IonCardContent,
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { addIcons } from 'ionicons';
import { trophyOutline } from 'ionicons/icons';
import { appConfig, defaultConfig } from 'src/app/config/config';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-wods',
  templateUrl: './wods.page.html',
  styleUrls: ['./wods.page.scss'],
  standalone: true,
  imports: [
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonLabel,
    IonItem,
    IonList,
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
  ],
})
export class WodsPage implements OnInit {
  private activatedRoute = inject(ActivatedRoute);

  dataLoaded = signal<boolean>(false);

  eventShortName = linkedSignal(() => defaultConfig);
  eventName = linkedSignal(() => appConfig[this.eventShortName()]?.eventName);
  wods = linkedSignal(() => appConfig[this.eventShortName()]?.wods);

  constructor() {
    addIcons({ trophyOutline });
  }

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

    const eventShortNameParam =
      this.activatedRoute.snapshot.paramMap.get('eventShortName');
    if (eventShortNameParam) {
      this.eventShortName.set(eventShortNameParam);
    }
  }
}
