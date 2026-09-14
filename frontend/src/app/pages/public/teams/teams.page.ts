import {
  Component,
  computed,
  DestroyRef,
  inject,
  linkedSignal,
  OnInit,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonItem,
  IonIcon,
  IonList,
  IonLabel,
  IonAccordionGroup,
  IonAccordion,
  IonSkeletonText,
} from '@ionic/angular';
import { PageHeaderComponent } from 'src/app/shared/page-header/page-header.component';
import { PageToolbarComponent } from 'src/app/shared/page-toolbar/page-toolbar.component';
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
import { finalize } from 'rxjs';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.page.html',
  styleUrls: ['./teams.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    PageToolbarComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    IonAccordion,
    IonAccordionGroup,
    IonLabel,
    IonList,
    IonIcon,
    IonItem,
    IonRefresherContent,
    IonRefresher,
    IonContent,
    IonSkeletonText,
  ],
})
export class TeamsPage implements OnInit {
  private apiTeams = inject(apiTeamsService);
  private toastService = inject(ToastService);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

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

  ngOnInit() {
    this.activatedRoute.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadTeams());
  }

  ionViewWillEnter() {
    this.loadTeams();
  }

  getCategoryClass(category: string): string {
    const lower = category.toLowerCase();
    if (lower.includes('beginner')) return 'dt-category-beginner';
    if (lower.includes('intermediate')) return 'dt-category-intermediate';
    return 'dt-category-open';
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  }

  handleRefresh(event: CustomEvent) {
    this.loadTeams();
    (event.target as HTMLIonRefresherElement).complete();
  }

  private loadTeams() {
    const eventShortNameParam =
      this.activatedRoute.snapshot.paramMap.get('eventShortName');
    this.eventShortName.set(eventShortNameParam ?? defaultConfig);
    this.dataLoaded.set(false);

    this.apiTeams
      .getTeamsTeamsGet({
        event_short_name: this.eventShortName(),
      })
      .pipe(finalize(() => this.dataLoaded.set(true)))
      .subscribe({
        next: (data: apiTeamsOutputDetailModel[]) => {
          const sortedAthletes = data.map((team) => ({
            ...team,
            athletes: [...team.athletes].sort((a, b) => {
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
          this.teamsData.set([]);
          this.toastService.showError(
            'Failed to load team data. ' +
              (error.error?.detail || error.statusText || 'Check backend is running.')
          );
        },
      });
  }
}
