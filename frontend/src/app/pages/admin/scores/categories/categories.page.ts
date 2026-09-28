import { Component, computed, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonRefresherContent,
  IonRefresher,
  IonList,
  IonItem,
  IonLabel,
  IonAccordion,
  IonAccordionGroup,
  IonButtons,
  IonCheckbox,
  IonSkeletonText,
  IonRouterLink,
} from '@ionic/angular';
import { apiScoresService, apiTeamsService } from 'src/app/api/services';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { AdminPageHeaderComponent } from 'src/app/shared/admin-page-header/admin-page-header.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastService } from 'src/app/services/toast.service';
import {
  apiScoreOutputModel,
  apiTeamsOutputDetailModel,
} from 'src/app/api/models';
import { AppConfigService } from 'src/app/services/app-config-service';
import { apiErrorStatusText } from 'src/app/services/api-call.util';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonCheckbox,
    IonButtons,
    IonLabel,
    IonItem,
    IonList,
    AdminPageHeaderComponent,
    IonRefresher,
    IonRefresherContent,
    IonBackButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSkeletonText,
    ToolbarButtonsComponent,
    RouterLink,
    IonAccordion,
    IonAccordionGroup,
    IonRouterLink
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
    void this.loadData();
  }

  private async loadData() {
    this.dataLoaded.set(false);
    this.wodNumber.set(
      Number(this.activatedRoute.snapshot.paramMap.get('wodNumber') || '0')
    );

    this.verificationMode.set(
      this.activatedRoute.snapshot.data['verificationMode'] || false
    );

    try {
      const data = await this.apiTeams.getTeamsTeamsGet({
        event_short_name: this.eventShortName,
      });
      this.teamsData.set(data);
    } catch (error: unknown) {
      this.toastService.showError(
        'Error loading teams: ' + apiErrorStatusText(error)
      );
    } finally {
      this.dataLoaded.set(true);
    }
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
      .then(() => {
        this.toastService.showSuccess(
          'Score verification updated for team ' + team?.team_name
        );
      })
      .catch((error: unknown) => {
        this.toastService.showError(
          'Error updating score verification: ' + apiErrorStatusText(error)
        );
        // Revert the change in UI
        if (team && score) {
          score.verified = !isChecked;
        }
      });
  }

  getScore(teamId: string): apiScoreOutputModel | null {
    const team = this.teamsData().find((team) => team.id === teamId);
    if (!team) {
      return null;
    }
    const score = team.scores.find(
      (score) => score.wod_number === this.wodNumber()
    );
    return score || null;
  }

  convertSecondsToMinunites(seconds: number): string {
    if (seconds == null || isNaN(seconds)) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
