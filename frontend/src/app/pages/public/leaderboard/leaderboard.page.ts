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
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { addIcons } from 'ionicons';
import { trophyOutline } from 'ionicons/icons';
import {
  apiAthleteOutputModel,
  apiScoreOutputModel,
  apiTeamsOutputDetailModel,
} from 'src/app/api/models';
import { apiTeamsService } from 'src/app/api/services';
import { ToastService } from 'src/app/services/toast.service';
import { AppConfigService } from 'src/app/services/app-config-service';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.page.html',
  styleUrls: ['./leaderboard.page.scss'],
  standalone: true,
  imports: [
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
    CommonModule,
    FormsModule,
    IonMenuButton,
    ToolbarButtonsComponent,
  ],
})
export class LeaderboardPage implements OnInit {
  private apiTeams = inject(apiTeamsService);
  private toastService = inject(ToastService);
  private appConfigService = inject(AppConfigService);

  dataLoaded = signal<boolean>(false);

  eventShortName = this.appConfigService.eventShortName;
  eventName = this.appConfigService.eventName;
  wods = this.appConfigService.wods;
  categories = this.appConfigService.categories;

  selectedCategory = linkedSignal<string | null>(
    () => this.categories?.[0] || null
  );
  selectedWod = signal<number>(0);

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

    this.apiTeams
      .getTeamsTeamsGet({
        event_short_name: this.eventShortName,
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
