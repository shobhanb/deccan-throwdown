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
  IonMenuButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonItem,
  IonRefresherContent,
  IonRefresher,
  IonList,
  IonSkeletonText,
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
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

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.page.html',
  styleUrls: ['./leaderboard.page.scss'],
  standalone: true,
  imports: [
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
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
    IonSkeletonText,
    CommonModule,
    FormsModule,
    IonMenuButton,
    ToolbarButtonsComponent,
  ],
})
export class LeaderboardPage implements OnInit {
  private apiTeams = inject(apiTeamsService);
  private toastService = inject(ToastService);
  private activatedRoute = inject(ActivatedRoute);

  dataLoaded = signal<boolean>(false);

  eventShortName = linkedSignal(() => defaultConfig);
  eventName = linkedSignal(() => appConfig[this.eventShortName()]?.eventName);
  wods = linkedSignal(() => appConfig[this.eventShortName()]?.wods);
  categories = linkedSignal(() => appConfig[this.eventShortName()]?.categories);

  selectedCategory = linkedSignal<string | null>(
    () => this.categories()?.[0] || null
  );
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
        (score) => `WOD ${score.wod_number} Rank: ${score.wod_rank ?? 'N/A'}`
      );
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

  onClickChangeCategory(event: CustomEvent) {
    this.selectedCategory.set(event.detail.value);
  }

  onClickChangeWod(event: CustomEvent) {
    this.selectedWod.set(event.detail.value);
  }
}
