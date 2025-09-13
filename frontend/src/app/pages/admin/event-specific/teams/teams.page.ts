import {
  Component,
  computed,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
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
import { apiEventsService, apiTeamsService } from 'src/app/api/services';
import {
  apiAthleteOutputModel,
  apiEventsModelTeamDetail,
  apiTeamsOutputDetailModel,
} from 'src/app/api/models';
import { ToastService } from 'src/app/services/toast.service';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { appConfig } from 'src/app/config/config';

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
  private apiTeams = inject(apiTeamsService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  dataLoaded = signal<boolean>(false);
  teamsData = signal<apiTeamsOutputDetailModel[]>([]);

  eventShortName = signal<string>('');
  eventName = computed(() => appConfig[this.eventShortName()]?.eventName || '');

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
    this.eventShortName.set(
      this.activatedRoute.snapshot.paramMap.get('eventShortName') || ''
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
          console.error(error);
          this.toastService.showError(
            'Failed to load team data ' + error.statusText
          );
        },
        complete: () => {
          this.dataLoaded.set(true);
        },
      });
  }

  addTeam() {
    this.router.navigate(['create-team'], { relativeTo: this.activatedRoute });
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
      .map((a) => `${a.first_name} ${a.last_name[0]}`)
      .join(', ');
  }
}
