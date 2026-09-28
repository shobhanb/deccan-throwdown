import {
  Component,
  computed,
  DestroyRef,
  inject,
  linkedSignal,
  OnInit,
  signal,
  ChangeDetectionStrategy,
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
  IonToggle,
} from '@ionic/angular';
import { PushNotificationService } from 'src/app/services/push-notification.service';
import { PageHeaderComponent } from 'src/app/shared/page-header/page-header.component';
import { PageToolbarComponent } from 'src/app/shared/page-toolbar/page-toolbar.component';
import { EmptyStateComponent } from 'src/app/shared/empty-state/empty-state.component';
import { addIcons } from 'ionicons';
import { trophyOutline } from 'ionicons/icons';
import {
  apiScoreOutputModel,
  apiTeamsOutputDetailModel,
} from 'src/app/api/models';
import { ToastService } from 'src/app/services/toast.service';
import { apiErrorDetail, apiErrorStatusText } from 'src/app/services/api-call.util';
import {
  appConfig,
  defaultConfig,
  isArchivedEvent,
} from 'src/app/config/config';
import { ActivatedRoute } from '@angular/router';
import { EventTeamsDataService } from 'src/app/services/event-teams-data.service';

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
    IonToggle,
  ],
})
export class LeaderboardPage implements OnInit {
  private eventTeamsData = inject(EventTeamsDataService);
  private toastService = inject(ToastService);
  private pushNotificationService = inject(PushNotificationService);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  selectInterface =  'popover';
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

  handleRefresh(event: CustomEvent) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
    if (isArchivedEvent(this.eventShortName())) {
      window.location.reload();
      (event.target as HTMLIonRefresherElement).complete();
      return;
    }
    this.loadLeaderboard({ forceNetwork: true });
    (event.target as HTMLIonRefresherElement).complete();
  }

  private loadLeaderboard(options?: { forceNetwork?: boolean }) {
    const eventShortNameParam =
      this.activatedRoute.snapshot.paramMap.get('eventShortName');
    this.eventShortName.set(eventShortNameParam ?? defaultConfig);
    const eventShortName = this.eventShortName();
    this.selectedCategory.set(this.categories()?.[0] ?? null);
    this.selectedWod.set(0);

    if (!options?.forceNetwork && isArchivedEvent(eventShortName)) {
      this.dataLoaded.set(true);
    } else {
      this.dataLoaded.set(false);
    }

    this.eventTeamsData.load(
      'leaderboard',
      eventShortName,
      {
        onData: (data) => this.teamsData.set(data),
        onError: (error: unknown) => {
          console.error(error);
          this.teamsData.set([]);
          this.toastService.showError(
            'Error loading leaderboard. ' +
              (apiErrorDetail(error) ||
                apiErrorStatusText(error, 'Check backend is running.'))
          );
        },
        onSettled: () => this.dataLoaded.set(true),
      },
      options
    );
  }

  onClickChangeCategory(event: CustomEvent) {
    this.selectedCategory.set(event.detail.value);
  }

  onClickChangeWod(event: CustomEvent) {
    this.selectedWod.set(event.detail.value);
  }

  pushSubscribed = this.pushNotificationService.subscribed;

  async onPushToggle(event: CustomEvent) {
    const enabled = event.detail.checked;
    await this.pushNotificationService.setSubscribed(enabled);
    if (!enabled) {
      (event.target as HTMLIonToggleElement).checked = false;
    } else if (!this.pushNotificationService.subscribed()) {
      (event.target as HTMLIonToggleElement).checked = false;
    }
  }
}
