import {
  Component,
  computed,
  inject,
  linkedSignal,
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
  IonItem,
  IonIcon,
  IonList,
  IonLabel,
  IonCardSubtitle,
  IonNote,
  IonMenuButton,
  IonAccordionGroup,
  IonAccordion,
  IonSkeletonText,
  IonCardContent,
  IonText,
  IonButton,
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { apiTeamsService } from 'src/app/api/services';
import { apiTeamsOutputDetailModel } from 'src/app/api/models';
import { ToastService } from 'src/app/services/toast.service';
import { addIcons } from 'ionicons';
import {
  addOutline,
  manOutline,
  womanOutline,
  personOutline,
} from 'ionicons/icons';
import { appConfig, defaultConfig } from 'src/app/config/config';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.page.html',
  styleUrls: ['./teams.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonText,
    IonCardContent,
    IonAccordion,
    IonAccordionGroup,
    IonNote,
    IonCardSubtitle,
    IonLabel,
    IonList,
    IonIcon,
    IonItem,
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
    ToolbarButtonsComponent,
    IonMenuButton,
  ],
})
export class TeamsPage implements OnInit {
  private apiTeams = inject(apiTeamsService);
  private toastService = inject(ToastService);
  private activatedRoute = inject(ActivatedRoute);

  dataLoaded = signal<boolean>(false);
  teamsData = signal<apiTeamsOutputDetailModel[]>([]);

  eventShortName = linkedSignal(() => defaultConfig);
  eventName = computed(() => appConfig[this.eventShortName()]?.eventName);

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
    addIcons({ personOutline, addOutline, manOutline, womanOutline });
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
    const eventShortNameParam =
      this.activatedRoute.snapshot.paramMap.get('eventShortName');
    if (eventShortNameParam) {
      this.eventShortName.set(eventShortNameParam);
    }
    this.apiTeams
      .getTeamsTeamsGet({
        event_short_name: this.eventShortName(),
      })
      .subscribe({
        next: (data: apiTeamsOutputDetailModel[]) => {
          const sortedAthletes = data.map((team) => ({
            ...team,
            athletes: team.athletes.sort((a, b) => {
              if (a.sex != b.sex) {
                return a.sex.localeCompare(b.sex);
              }
              return a.first_name.localeCompare(b.first_name);
            }),
          }));
          this.teamsData.set(sortedAthletes);
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
}
