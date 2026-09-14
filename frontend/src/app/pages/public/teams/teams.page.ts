import {
  Component,
  computed,
  inject,
  linkedSignal,
  OnInit,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  IonItem,
  IonIcon,
  IonList,
  IonLabel,
  IonNote,
  IonMenuButton,
  IonAccordionGroup,
  IonAccordion,
  IonSkeletonText,
  IonChip,
} from '@ionic/angular';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { PageHeaderComponent } from 'src/app/shared/page-header/page-header.component';
import { EmptyStateComponent } from 'src/app/shared/empty-state/empty-state.component';
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
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    PageHeaderComponent,
    EmptyStateComponent,
    IonChip,
    IonAccordion,
    IonAccordionGroup,
    IonNote,
    IonLabel,
    IonList,
    IonIcon,
    IonItem,
    IonRefresherContent,
    IonRefresher,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSkeletonText,
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
