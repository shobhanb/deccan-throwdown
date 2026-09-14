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
  IonHeader,
  IonTitle,
  IonToolbar,
  IonMenuButton,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonItem,
  IonRefresherContent,
  IonRefresher,
  IonList,
  IonSkeletonText,
  Platform,
} from '@ionic/angular';
import { PageHeaderComponent } from 'src/app/shared/page-header/page-header.component';
import { PageToolbarComponent } from 'src/app/shared/page-toolbar/page-toolbar.component';
import { EmptyStateComponent } from 'src/app/shared/empty-state/empty-state.component';
import { addIcons } from 'ionicons';
import { trophyOutline } from 'ionicons/icons';
import {
  apiScoreOutputModel,
  apiTeamsOutputDetailModel,
} from 'src/app/api/models';
import { apiTeamsService } from 'src/app/api/services';
import { ToastService } from 'src/app/services/toast.service';
import { appConfig, defaultConfig } from 'src/app/config/config';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.page.html',
  styleUrls: ['./leaderboard.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    PageToolbarComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    IonLabel,
    IonItem,
    IonList,
    IonSelect,
    IonSelectOption,
    IonRefresherContent,
    IonRefresher,
    IonContent,
    IonSkeletonText,
  ],
})
export class LeaderboardPage implements OnInit {
  private apiTeams = inject(apiTeamsService);
  private toastService = inject(ToastService);
  private activatedRoute = inject(ActivatedRoute);
  private platform = inject(Platform);
  private destroyRef = inject(DestroyRef);

  /** Popovers misalign inside the centered ion-app shell on wide desktops. */
  selectInterface = this.platform.width() > 768 ? 'alert' : 'popover';
  wodSelectOptions = { side: 'bottom', alignment: 'start' };
  categorySelectOptions = { side: 'bottom', alignment: 'end' };

  dataLoaded = signal<boolean>(false);

  eventShortName = linkedSignal(() => defaultConfig);
  eventName = linkedSignal(() => appConfig[this.eventShortName()]?.eventName);
  wods = linkedSignal(() => appConfig[this.eventShortName()]?.wods);
  categories = linkedSignal(() => appConfig[this.eventShortName()]?.categories);

  selectedCategory = signal<string | null>(null);
  selectedWod = signal<number>(0);
  selectedWodName = computed(
    () =>
      this.wods().find((w) => w.wodNumber === this.selectedWod())?.wodName ||
      'Overall'
  );

  teamsData = signal<apiTeamsOutputDetailModel[]>([]);

  filteredSortedTeamsData = computed(() => {
    const selectedWod = this.selectedWod();

    return this.teamsData()
      .filter((team) => team.category === this.selectedCategory())
      .map((team) => {
        let rank: number | null = null;

        if (selectedWod === 0) {
          // Use overall_rank for Overall view
          rank = team.overall_rank ?? null;
        } else {
          // Use wod_rank for specific WOD view - only consider verified scores
          const score = team.scores.find(
            (score) => score.wod_number === selectedWod && score.verified
          );
          rank = score?.wod_rank ?? null;
        }

        return {
          ...team,
          rank: rank,
          // Filter scores to only include verified ones
          scores: team.scores.filter((score) => score.verified),
        };
      })
      .sort((a, b) => {
        const aRank = a.rank ?? 999999;
        const bRank = b.rank ?? 999999;
        return aRank - bRank;
      });
  });

  podiumTeams = computed(() =>
    this.filteredSortedTeamsData()
      .filter((t) => t.rank && t.rank <= 3)
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  );

  convertSecondsToMinunites(seconds: number | null | undefined): string {
    if (seconds == null || isNaN(seconds)) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getOverallScore(team: apiTeamsOutputDetailModel): string[] {
    // Get all verified WOD ranks
    const verifiedScores = team.scores.filter((score) => score.verified);

    return verifiedScores
      .sort((a, b) => a.wod_number - b.wod_number) // Sort by WOD number
      .map(
        (score) =>
          `WOD ${score.wod_number} Rank: ${score.wod_rank ?? 'N/A'} (${
            score.wod_points
          })`
      );
  }

  getTotalScore(team: apiTeamsOutputDetailModel): string {
    const totalPoints = team.scores
      .filter((score) => score.verified && score.wod_points != null)
      .reduce((sum, score) => sum + (score.wod_points || 0), 0);
    return `Total Points: ${totalPoints}`;
  }

  getWodScore(team: apiTeamsOutputDetailModel): apiScoreOutputModel | null {
    return (
      team.scores.find((score) => score.wod_number === this.selectedWod()) ||
      null
    );
  }

  constructor() {
    addIcons({ trophyOutline });
  }

  ngOnInit() {
    this.activatedRoute.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadLeaderboard());
  }

  ionViewWillEnter() {
    this.loadLeaderboard();
  }

  handleRefresh(event: CustomEvent) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
    this.loadLeaderboard();
    (event.target as HTMLIonRefresherElement).complete();
  }

  private loadLeaderboard() {
    const eventShortNameParam =
      this.activatedRoute.snapshot.paramMap.get('eventShortName');
    this.eventShortName.set(eventShortNameParam ?? defaultConfig);
    this.selectedCategory.set(this.categories()?.[0] ?? null);
    this.selectedWod.set(0);
    this.dataLoaded.set(false);

    this.apiTeams
      .getTeamsTeamsGet({
        event_short_name: this.eventShortName(),
      })
      .pipe(finalize(() => this.dataLoaded.set(true)))
      .subscribe({
        next: (data: apiTeamsOutputDetailModel[]) => {
          this.teamsData.set(data);
        },
        error: (error) => {
          console.error(error);
          this.teamsData.set([]);
          this.toastService.showError(
            'Error loading leaderboard. ' +
              (error.error?.detail || error.statusText || 'Check backend is running.')
          );
        },
      });
  }

  onClickChangeCategory(event: CustomEvent) {
    this.selectedCategory.set(event.detail.value);
  }

  onClickChangeWod(event: CustomEvent) {
    this.selectedWod.set(event.detail.value);
  }
}
