import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';

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
} from '@ionic/angular';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { AdminPageHeaderComponent } from 'src/app/shared/admin-page-header/admin-page-header.component';
import { EmptyStateComponent } from 'src/app/shared/empty-state/empty-state.component';
import { addIcons } from 'ionicons';
import { trophyOutline } from 'ionicons/icons';
import {
  apiScoreOutputModel,
  apiTeamsOutputDetailModel,
} from 'src/app/api/models';
import { apiTeamsService } from 'src/app/api/services';
import { ToastService } from 'src/app/services/toast.service';
import { apiErrorDetail, apiErrorStatusText } from 'src/app/services/api-call.util';
import { AppConfigService } from 'src/app/services/app-config-service';
import {
  parseTtmmScoreDetail,
  ttmmScoreboardComponents,
  TtmmScoreboardComponentView,
  TtmmScoreDetail,
} from 'src/app/shared/score-detail/ttmm';
import {
  resolveStationScheme,
  stationSummaryLines,
} from 'src/app/shared/score-detail/stations';

@Component({
  selector: 'app-admin-leaderboard',
  templateUrl: './leaderboard.page.html',
  styleUrls: [
    '../../public/leaderboard/leaderboard.page.scss',
    './leaderboard.page.scss',
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    ToolbarButtonsComponent,
    AdminPageHeaderComponent,
    EmptyStateComponent,
    IonLabel,
    IonItem,
    IonList,
    IonSelect,
    IonSelectOption,
    IonRefresherContent,
    IonRefresher,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonMenuButton,
    IonSkeletonText,
  ],
})
export class AdminLeaderboardPage implements OnInit {
  private apiTeams = inject(apiTeamsService);
  private toastService = inject(ToastService);
  private appConfigService = inject(AppConfigService);

  selectInterface = 'popover';

  dataLoaded = signal<boolean>(false);

  eventShortName = this.appConfigService.eventShortName;
  eventName = this.appConfigService.eventName;
  wods = this.appConfigService.wods;
  categories = this.appConfigService.categories;

  selectedCategory = signal<string | null>(null);
  selectedWod = signal<number>(0);
  selectedWodName = computed(
    () =>
      this.wods.find((w) => w.wodNumber === this.selectedWod())?.wodName ||
      'Overall'
  );
  selectedWodConfig = computed(() =>
    this.wods.find((w) => w.wodNumber === this.selectedWod())
  );
  isTtmmWod = computed(
    () => this.selectedWodConfig()?.scoreDetailType === 'ttmm'
  );
  isStationsWod = computed(
    () => this.selectedWodConfig()?.scoreDetailType === 'stations'
  );

  teamsData = signal<apiTeamsOutputDetailModel[]>([]);

  filteredSortedTeamsData = computed(() => {
    const selectedWod = this.selectedWod();

    return this.teamsData()
      .filter((team) => team.category === this.selectedCategory())
      .map((team) => {
        let rank: number | null = null;

        if (selectedWod === 0) {
          rank = team.overall_rank ?? null;
        } else {
          const score = team.scores.find(
            (score) => score.wod_number === selectedWod
          );
          rank = score?.wod_rank ?? null;
        }

        return {
          ...team,
          rank,
          scores: [...team.scores],
        };
      })
      .sort((a, b) => {
        const aRank = a.rank ?? 999999;
        const bRank = b.rank ?? 999999;
        if (aRank !== bRank) return aRank - bRank;
        return a.team_name.localeCompare(b.team_name);
      });
  });

  podiumTeams = computed(() => {
    const isOverall = this.selectedWod() === 0;

    return this.filteredSortedTeamsData().filter((t) => {
      if (!t.rank || t.rank > 3) return false;
      if (!isOverall) return true;

      const totalPoints = t.scores
        .filter((score) => score.wod_points != null)
        .reduce((sum, score) => sum + (score.wod_points || 0), 0);
      return totalPoints > 0;
    });
  });

  convertSecondsToMinunites(seconds: number | null | undefined): string {
    if (seconds == null || isNaN(seconds)) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getOverallScore(team: apiTeamsOutputDetailModel): string[] {
    return [...team.scores]
      .sort((a, b) => a.wod_number - b.wod_number)
      .map(
        (score) =>
          `WOD ${score.wod_number} Rank: ${score.wod_rank ?? 'N/A'} (${
            score.wod_points
          })${score.verified ? '' : ' · unverified'}`
      );
  }

  getTotalScore(team: apiTeamsOutputDetailModel): string {
    const totalPoints = team.scores
      .filter((score) => score.wod_points != null)
      .reduce((sum, score) => sum + (score.wod_points || 0), 0);
    return `Total Points: ${totalPoints}`;
  }

  getWodScore(team: apiTeamsOutputDetailModel): apiScoreOutputModel | null {
    return (
      team.scores.find((score) => score.wod_number === this.selectedWod()) ||
      null
    );
  }

  getTtmmDetail(team: apiTeamsOutputDetailModel): TtmmScoreDetail | null {
    return parseTtmmScoreDetail(this.getWodScore(team)?.score_detail);
  }

  getTtmmComponents(
    team: apiTeamsOutputDetailModel
  ): TtmmScoreboardComponentView[] {
    const nameById: Record<string, string> = {};
    for (const athlete of team.athletes ?? []) {
      nameById[athlete.id] = `${athlete.first_name} ${athlete.last_name}`;
    }
    return ttmmScoreboardComponents(
      this.getTtmmDetail(team),
      team.category,
      nameById
    );
  }

  getTtmmComponentTotal(team: apiTeamsOutputDetailModel): number | null {
    return this.getTtmmDetail(team)?.results?.total_component_points ?? null;
  }

  getStationSummary(team: apiTeamsOutputDetailModel): string[] {
    const score = this.getWodScore(team);
    const scheme = resolveStationScheme(
      this.selectedWodConfig(),
      team.category
    );
    return stationSummaryLines(score?.reps, scheme);
  }

  isRowUnverified(team: apiTeamsOutputDetailModel): boolean {
    if (!team.verified) return true;
    if (this.selectedWod() === 0) {
      return team.scores.some((score) => !score.verified);
    }
    const score = this.getWodScore(team);
    return score != null && !score.verified;
  }

  constructor() {
    addIcons({ trophyOutline });
  }

  ngOnInit() {
    this.selectedCategory.set(this.categories?.[0] ?? null);
    this.loadLeaderboard();
  }

  handleRefresh(event: CustomEvent) {
    this.loadLeaderboard();
    (event.target as HTMLIonRefresherElement).complete();
  }

  private async loadLeaderboard() {
    this.dataLoaded.set(false);
    try {
      const data =
        await this.apiTeams.getProvisionalLeaderboardTeamsProvisionalLeaderboardGet(
          { event_short_name: this.eventShortName }
        );
      this.teamsData.set(data);
    } catch (error: unknown) {
      console.error(error);
      this.teamsData.set([]);
      this.toastService.showError(
        'Error loading provisional leaderboard. ' +
          (apiErrorDetail(error) ||
            apiErrorStatusText(error, 'Check backend is running.'))
      );
    } finally {
      this.dataLoaded.set(true);
    }
  }

  onClickChangeCategory(event: CustomEvent) {
    this.selectedCategory.set(event.detail.value);
  }

  onClickChangeWod(event: CustomEvent) {
    this.selectedWod.set(event.detail.value);
  }
}
