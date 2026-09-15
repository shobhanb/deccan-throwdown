import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  form,
  FormField,
  max,
  min,
} from '@angular/forms/signals';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonButton,
  IonInput,
  IonSkeletonText,
  IonRouterLink,
} from '@ionic/angular';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { AdminPageHeaderComponent } from 'src/app/shared/admin-page-header/admin-page-header.component';
import { apiScoresService, apiTeamsService } from 'src/app/api/services';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from 'src/app/services/toast.service';
import {
  apiScoreOutputModel,
  apiTeamsOutputDetailModel,
} from 'src/app/api/models';
import { AlertService } from 'src/app/services/alert.service';
import { AppConfigService } from 'src/app/services/app-config-service';
import { ScoreFormModel } from 'src/app/shared/models/form-models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-score',
  templateUrl: './score.page.html',
  styleUrls: ['./score.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    AdminPageHeaderComponent,
    IonInput,
    IonButton,
    IonItem,
    IonList,
    IonRefresherContent,
    IonRefresher,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSkeletonText,
    FormField,
    ToolbarButtonsComponent,
    RouterLink,
    IonRouterLink,
  ],
})
export class ScorePage {
  private apiScores = inject(apiScoresService);
  private apiTeams = inject(apiTeamsService);
  private activatedRoute = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private appConfigService = inject(AppConfigService);
  private destroyRef = inject(DestroyRef);

  dataLoaded = signal<boolean>(false);
  scoreData = signal<apiScoreOutputModel | null>(null);
  isEditing = computed(() => !!this.scoreData());
  isVerified = computed(() => this.scoreData()?.verified || false);

  eventShortName = this.appConfigService.eventShortName;
  eventName = this.appConfigService.eventName;

  wodNumber = signal<number>(0);
  wod = computed(() => this.appConfigService.getWodByNumber(this.wodNumber()));

  teamId = signal<string>('');
  teamData = signal<apiTeamsOutputDetailModel | null>(null);

  scoreModel = signal<ScoreFormModel>({
    reps: null,
    time_minutes: null,
    time_seconds: null,
    tiebreak_minutes: null,
    tiebreak_seconds: null,
    score_detail: '',
  });

  scoreForm = form(this.scoreModel, (schemaPath) => {
    min(schemaPath.reps, 0, { message: 'Reps must be 0 or greater' });
    min(schemaPath.time_minutes, 0, { message: 'Minutes must be 0 or greater' });
    min(schemaPath.time_seconds, 0, { message: 'Seconds must be 0 or greater' });
    max(schemaPath.time_seconds, 59, { message: 'Seconds must be 59 or less' });
    min(schemaPath.tiebreak_minutes, 0, {
      message: 'Tiebreak minutes must be 0 or greater',
    });
    min(schemaPath.tiebreak_seconds, 0, {
      message: 'Tiebreak seconds must be 0 or greater',
    });
    max(schemaPath.tiebreak_seconds, 59, {
      message: 'Tiebreak seconds must be 59 or less',
    });
  });

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
      Number(this.activatedRoute.snapshot.paramMap.get('wodNumber')) || 0
    );
    this.teamId.set(this.activatedRoute.snapshot.paramMap.get('teamId') || '');

    this.apiTeams
      .getTeamInfoTeamsTeamIdGet({ team_id: this.teamId() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: apiTeamsOutputDetailModel) => this.teamData.set(data),
        error: () => {
          this.teamData.set(null);
          this.toastService.showError('Failed to load team data');
        },
      });

    this.apiScores
      .getScoresScoresGet({
        team_id: this.teamId(),
        wod_number: this.wodNumber(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: apiScoreOutputModel) => {
          this.scoreData.set(data);
          this.dataLoaded.set(true);
          this.scoreModel.set({
            reps: data.reps || null,
            time_minutes: data.time_s ? Math.floor(data.time_s / 60) : null,
            time_seconds: data.time_s ? data.time_s % 60 : null,
            tiebreak_minutes: data.tiebreak_s
              ? Math.floor(data.tiebreak_s / 60)
              : null,
            tiebreak_seconds: data.tiebreak_s ? data.tiebreak_s % 60 : null,
            score_detail: data.score_detail || '',
          });
        },
        error: () => {
          this.scoreData.set(null);
          this.dataLoaded.set(true);
        },
      });
  }

  submitScore() {
    if (!this.scoreFormValid()) {
      return;
    }

    const formValue = this.scoreModel();
    const timeInSeconds =
      (formValue.time_minutes || 0) * 60 + (formValue.time_seconds || 0);
    const tiebreakInSeconds =
      (formValue.tiebreak_minutes || 0) * 60 +
      (formValue.tiebreak_seconds || 0);

    const scoreSubmission = {
      reps: formValue.reps || undefined,
      time_s: timeInSeconds > 0 ? timeInSeconds : undefined,
      tiebreak_s: tiebreakInSeconds > 0 ? tiebreakInSeconds : undefined,
      score_detail: formValue.score_detail || undefined,
    };

    if (this.isEditing()) {
      this.apiScores
        .updateScoreScoresScoreIdPatch({
          score_id: this.scoreData()!.id,
          body: scoreSubmission,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Score updated successfully');
            this.router.navigate(['../'], {
              relativeTo: this.activatedRoute,
            });
          },
          error: (error) => {
            console.error('Error updating score:', error);
            this.toastService.showError(
              'Failed to update score: ' + error.statusText
            );
          },
        });
    } else {
      this.apiScores
        .createScoreScoresPost({
          body: {
            ...scoreSubmission,
            team_id: this.teamId(),
            wod_number: this.wodNumber(),
          },
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => {
            this.toastService.showSuccess('Score created successfully');
            this.router.navigate(['../'], {
              relativeTo: this.activatedRoute,
            });
            this.scoreData.set(data);
          },
          error: (error) => {
            console.error('Error creating score:', error);
            this.toastService.showError(
              'Failed to create score: ' + error.statusText
            );
          },
        });
    }
  }

  scoreFormValid() {
    return this.scoreForm().valid() && this.scoreForm().dirty();
  }

  async onDelete() {
    if (!this.isEditing() || !this.scoreData()) {
      return;
    }

    const confirmation = await this.alertService.showAlert('Delete score ?');
    if (confirmation.role === 'confirm') {
      this.apiScores
        .deleteScoreScoresScoreIdDelete({
          score_id: this.scoreData()!.id,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Score deleted successfully');
            this.router.navigate(['../'], {
              relativeTo: this.activatedRoute,
            });
          },
          error: (error) => {
            console.error('Error deleting score:', error);
            this.toastService.showError(
              'Failed to delete score: ' + error.statusText
            );
          },
        });
    }
  }

  getAthleteNames(team: apiTeamsOutputDetailModel | null): string {
    if (!team) return '';

    return team.athletes
      .map((a) => `${a.first_name} ${a.last_name[0]}`)
      .join(', ');
  }
}
