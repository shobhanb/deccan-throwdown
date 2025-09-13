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
import { appConfig } from 'src/app/config/config';
import { apiEventsService, apiWodsService } from 'src/app/api/services';
import { apiEventsModelWodDetail, apiWodOutputModel } from 'src/app/api/models';
import { ToastService } from 'src/app/services/toast.service';

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
  private apiWods = inject(apiWodsService);
  private activatedRoute = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  eventShortName = signal<string>('');
  eventName = computed(() => appConfig[this.eventShortName()]?.eventName || '');

  dataLoaded = signal<boolean>(false);
  wodData = signal<apiWodOutputModel[]>([]);

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
    this.apiWods
      .getWodsWodsGet({
        event_short_name: this.eventShortName(),
      })
      .subscribe({
        next: (data: apiWodOutputModel[]) => {
          this.wodData.set(data);
        },
        error: (error) => {
          console.error(error);
          this.toastService.showError(
            'Failed to load WODs data ' + error.statusText
          );
        },
        complete: () => {
          this.dataLoaded.set(true);
        },
      });
  }
}
