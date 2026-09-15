import { Component, computed, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  IonItem,
  IonFab,
  IonFabButton,
  IonIcon,
  IonList,
  IonLabel,
  IonMenuButton,
  IonSkeletonText,
  IonRouterLink,
} from '@ionic/angular';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { AdminPageHeaderComponent } from 'src/app/shared/admin-page-header/admin-page-header.component';
import { apiTeamsService } from 'src/app/api/services';
import {
  apiTeamsOutputDetailModel,
} from 'src/app/api/models';
import { ToastService } from 'src/app/services/toast.service';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppConfigService } from 'src/app/services/app-config-service';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.page.html',
  styleUrls: ['./teams.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    AdminPageHeaderComponent,
    IonLabel,
    IonList,
    IonIcon,
    IonFabButton,
    IonFab,
    IonItem,
    IonRefresherContent,
    IonRefresher,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSkeletonText,
    ToolbarButtonsComponent,
    RouterLink,
    IonMenuButton,
    IonRouterLink
],
})
export class TeamsPage implements OnInit {
  private apiTeams = inject(apiTeamsService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private appConfigService = inject(AppConfigService);

  dataLoaded = signal<boolean>(false);
  teamsData = signal<apiTeamsOutputDetailModel[]>([]);

  eventShortName = this.appConfigService.eventShortName;
  eventName = this.appConfigService.eventName;

  teamsCategoriesData = computed(() => {
    const teams = this.teamsData().sort((a, b) =>
      a.team_name.localeCompare(b.team_name)
    );
    const grouped: Record<string, apiTeamsOutputDetailModel[]> = {};
    for (const team of teams) {
      if (!grouped[team.category]) {
        grouped[team.category] = [];
      }
      // Sort athletes by gender and first name before adding to grouped data
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
    this.apiTeams
      .getTeamsTeamsGet({
        event_short_name: this.eventShortName,
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

  addTeam() {
    this.router.navigate(['create-team'], { relativeTo: this.activatedRoute });
  }
}
