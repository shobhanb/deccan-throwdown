import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  IonItem,
  IonFab,
  IonFabButton,
  IonIcon,
  IonList,
  IonLabel,
  IonCardSubtitle,
  IonNote,
  IonMenuButton,
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { apiEventsService } from 'src/app/api/services';
import { environment } from 'src/environments/environment';
import {
  apiAthleteOutputModel,
  apiEventsModelTeamDetail,
  apiTeamsOutputDetailModel,
} from 'src/app/api/models';
import { ToastService } from 'src/app/services/toast.service';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.page.html',
  styleUrls: ['./teams.page.scss'],
  standalone: true,
  imports: [
    IonNote,
    IonCardSubtitle,
    IonLabel,
    IonList,
    IonIcon,
    IonFabButton,
    IonFab,
    IonItem,
    IonText,
    IonCardContent,
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
    ToolbarButtonsComponent,
    RouterLink,
    IonMenuButton,
  ],
})
export class TeamsPage implements OnInit {
  private apiEvents = inject(apiEventsService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  dataLoaded = signal<boolean>(false);
  eventData = signal<apiEventsModelTeamDetail | null>(null);
  teamsData = computed<apiTeamsOutputDetailModel[]>(
    () => this.eventData()?.teams || []
  );

  // Group teams by category for template iteration
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

  teamCategoriesData = computed(() =>
    this.teamsData()
      .map((t) => t.category)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort()
  );

  constructor() {
    addIcons({ addOutline });
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
    this.dataLoaded.set(false);
    this.apiEvents
      .getEventAllTeamDataEventsTeamDataEventShortNameGet({
        event_short_name: environment.eventShortName,
      })
      .subscribe({
        next: (data: apiEventsModelTeamDetail) => {
          this.eventData.set(data);
        },
        error: (error) => {
          console.error(error);
          this.toastService.showError('Failed to load team data');
        },
        complete: () => {
          this.dataLoaded.set(true);
        },
      });
  }

  addTeam() {
    this.router.navigate(['admin', 'teams', 'create-team']);
  }

  getAthleteNames(athletes: apiAthleteOutputModel[]): string {
    return athletes
      .sort((a: apiAthleteOutputModel, b: apiAthleteOutputModel) => {
        // Sort by sex descending (F before M), then first_name ascending
        if (a.sex !== b.sex) {
          return a.sex.localeCompare(b.sex); // F before M
        }
        return a.first_name.localeCompare(b.first_name);
      })
      .map((a) => `${a.first_name}`)
      .join(', ');
  }
}
