import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonRefresherContent,
  IonRefresher,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonText,
  IonList,
  IonItem,
  IonLabel,
  IonAccordion,
  IonAccordionGroup,
  IonButtons,
} from '@ionic/angular/standalone';
import { apiTeamsService, apiWodsService } from 'src/app/api/services';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastService } from 'src/app/services/toast.service';
import { appConfig } from 'src/app/config/config';
import { apiTeamsOutputDetailModel } from 'src/app/api/models';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: true,
  imports: [
    IonButtons,
    IonLabel,
    IonItem,
    IonList,
    IonText,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonRefresher,
    IonRefresherContent,
    IonBackButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    ToolbarButtonsComponent,
    RouterLink,
    IonAccordion,
    IonAccordionGroup,
  ],
})
export class CategoriesPage implements OnInit {
  private apiTeams = inject(apiTeamsService);
  private activatedRoute = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  dataLoaded = signal<boolean>(false);

  eventShortName = signal<string>('');
  wodNumber = signal<number>(0);
  eventName = computed(() => appConfig[this.eventShortName()]?.eventName || '');
  categories = computed(
    () => appConfig[this.eventShortName()]?.categories || []
  );
  teamsData = signal<apiTeamsOutputDetailModel[]>([]);

  teamsCategoriesData = computed(() => {
    const teams = this.teamsData().sort((a, b) =>
      a.team_name.localeCompare(b.team_name)
    );
    const grouped: Record<string, apiTeamsOutputDetailModel[]> = {};
    for (const team of teams) {
      if (!grouped[team.category]) {
        grouped[team.category] = [];
      }
      grouped[team.category].push(team);
    }
    // Sort categories alphabetically
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  });

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

    this.apiTeams
      .getTeamsTeamsGet({
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
