import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonRefresher,
  IonRefresherContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonText,
  IonList,
  IonAccordionGroup,
  IonAccordion,
  IonItem,
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { apiScoresService, apiTeamsService } from 'src/app/api/services';
import { ActivatedRoute } from '@angular/router';
import { ToastService } from 'src/app/services/toast.service';
import { appConfig } from 'src/app/config/config';

@Component({
  selector: 'app-score',
  templateUrl: './score.page.html',
  styleUrls: ['./score.page.scss'],
  standalone: true,
  imports: [
    IonItem,
    IonAccordion,
    IonAccordionGroup,
    IonList,
    IonText,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonRefresherContent,
    IonRefresher,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    ToolbarButtonsComponent,
  ],
})
export class ScorePage implements OnInit {
  private apiScores = inject(apiScoresService);
  private activatedRoute = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  dataLoaded = signal<boolean>(false);

  eventShortName = signal<string>('');
  wodNumber = signal<number>(0);
  teamId = signal<string>('');
  scoreData = signal;

  eventName = computed(() => appConfig[this.eventShortName()]?.eventName || '');

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
    this.wodNumber.set(
      Number(this.activatedRoute.snapshot.paramMap.get('wodNumber') || '0')
    );
    this.teamId.set(this.activatedRoute.snapshot.paramMap.get('teamId') || '');

    this.apiScores
      .getScoresScoresGet({
        event_short_name: this.eventShortName(),
      })
      .subscribe({
        next: (data: apiTeamsOutputDetailModel[]) => {
          this.teamsData.set(data);
        },
        error: (error) => {
          this.toastService.showError(
            'Error loading teams: ' + error.statusText
          );
        },
        complete: () => {
          this.dataLoaded.set(true);
        },
      });
  }
}
