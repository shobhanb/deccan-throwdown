import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
  IonIcon,
  IonLabel,
  IonNote,
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { appConfig, defaultConfig } from 'src/app/config/config';
import { ToastService } from 'src/app/services/toast.service';
import { apiTeamsService } from 'src/app/api/services';
import { apiTeamsOutputDetailModel } from 'src/app/api/models';

@Component({
  selector: 'app-scores',
  templateUrl: './scores.page.html',
  styleUrls: ['./scores.page.scss'],
  standalone: true,
  imports: [
    IonNote,
    IonLabel,
    IonIcon,
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
    CommonModule,
    FormsModule,
    IonMenuButton,
    ToolbarButtonsComponent,
    RouterLink,
  ],
})
export class ScoresPage implements OnInit {
  private activatedRoute = inject(ActivatedRoute);

  dataLoaded = signal<boolean>(false);
  verificationMode = signal<boolean>(false);

  eventShortName = signal<string>('');
  eventName = computed(() => appConfig[this.eventShortName()]?.eventName || '');
  wods = computed(() => appConfig[this.eventShortName()]?.wods || []);

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
    this.dataLoaded.set(false);
    this.eventShortName.set(
      this.activatedRoute.snapshot.paramMap.get('eventShortName') || ''
    );
    this.verificationMode.set(
      this.activatedRoute.snapshot.data['verificationMode'] || false
    );
  }
}
