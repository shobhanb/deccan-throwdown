import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonRefresherContent,
  IonRefresher,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonText,
  IonList,
  IonItem,
  IonLabel,
  IonAccordion,
  IonAccordionGroup,
  IonButtons,
  IonCheckbox,
  IonSkeletonText,
  IonRouterLink,
} from '@ionic/angular/standalone';
import { apiScoresService, apiTeamsService } from 'src/app/api/services';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastService } from 'src/app/services/toast.service';
import {
  apiAthleteOutputModel,
  apiScoreOutputModel,
  apiTeamsOutputDetailModel,
} from 'src/app/api/models';
import { AppConfigService } from 'src/app/services/app-config-service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: true,
  imports: [
    IonCheckbox,
    IonButtons,
    IonLabel,
    IonItem,
    IonList,
    IonText,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonRefresher,
    IonRefresherContent,
    IonBackButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSkeletonText,
    CommonModule,
    FormsModule,
    ToolbarButtonsComponent,
    RouterLink,
    IonAccordion,
    IonAccordionGroup,
    IonRouterLink,
  ],
})
export class CategoriesPage implements OnInit {
  private apiTeams = inject(apiTeamsService);
  private apiScores = inject(apiScoresService);
  private activatedRoute = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private appConfigService = inject(AppConfigService);

  dataLoaded = signal<boolean>(false);
  verificationMode = signal<boolean>(false);

  eventShortName = this.appConfigService.eventShortName;
  eventName = this.appConfigService.eventName;
  categories = this.appConfigService.categories;

  wodNumber = signal<number>(0);
  wod = computed(() => this.appConfigService.getWodByNumber(this.wodNumber()));

  teamsData = signal<apiTeamsOutputDetailModel[]>([]);

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

  constructor() {}

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
    this.wodNumber.set(
      Number(this.activatedRoute.snapshot.paramMap.get('wodNumber') || '0')
    );

    this.verificationMode.set(
      this.activatedRoute.snapshot.data['verificationMode'] || false
    );

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

  onVerificationCheckboxChange(event: CustomEvent, teamId: string) {
    const isChecked = event.detail.checked;
    const team = this.teamsData().find((team) => team.id === teamId);
    const score = team?.scores.find(
      (score) => score.wod_number === this.wodNumber()
    );
    if (team && score) {
      score.verified = isChecked;
    }

    this.apiScores
      .updateScoreVerificationScoresVerifyScoreIdPatch({
        score_id: score?.id || '',
        verified: isChecked,
      })
      .subscribe({
        next: (data) => {
          this.toastService.showSuccess(
            'Score verification updated for team ' + team?.team_name
          );
        },
        error: (error) => {
          this.toastService.showError(
            'Error updating score verification: ' + error.statusText
          );
          // Revert the change in UI
          if (team && score) {
            score.verified = !isChecked;
          }
        },
      });
  }

  getScore(teamId: string): apiScoreOutputModel {
    const team = this.teamsData().find((team) => team.id === teamId);
    if (!team) {
      return {} as apiScoreOutputModel;
    }
    const score = team.scores.find(
      (score) => score.wod_number === this.wodNumber()
    );
    return score || ({} as apiScoreOutputModel);
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

  convertSecondsToMinunites(seconds: number): string {
    if (seconds == null || isNaN(seconds)) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
