import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonRefresher,
  IonRefresherContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonText,
  IonList,
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonLabel,
  IonButton,
  IonInput,
  IonTextarea,
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { apiScoresService, apiTeamsService } from 'src/app/api/services';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from 'src/app/services/toast.service';
import { appConfig, WodConfig } from 'src/app/config/config';
import {
  apiScoreOutputModel,
  apiTeamsOutputDetailModel,
  apiTeamsOutputModel,
} from 'src/app/api/models';
import { AlertService } from 'src/app/services/alert.service';
import { AppConfigService } from 'src/app/services/app-config-service';

@Component({
  selector: 'app-score',
  templateUrl: './score.page.html',
  styleUrls: ['./score.page.scss'],
  standalone: true,
  imports: [
    IonTextarea,
    IonInput,
    IonButton,
    IonLabel,
    IonItem,
    IonList,
    IonText,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonRefresherContent,
    IonRefresher,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    ToolbarButtonsComponent,
    ReactiveFormsModule,
  ],
})
export class ScorePage implements OnInit {
  private apiScores = inject(apiScoresService);
  private apiTeams = inject(apiTeamsService);
  private activatedRoute = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private location = inject(Location);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private appConfigService = inject(AppConfigService);

  dataLoaded = signal<boolean>(false);
  scoreData = signal<apiScoreOutputModel | null>(null);
  isEditing = computed(() => !!this.scoreData());

  eventShortName = this.appConfigService.eventShortName;
  eventName = this.appConfigService.eventName;

  wodNumber = signal<number>(0);
  wod = computed(() => this.appConfigService.getWodByNumber(this.wodNumber()));

  teamId = signal<string>('');
  teamData = signal<apiTeamsOutputDetailModel | null>(null);

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
      Number(this.activatedRoute.snapshot.paramMap.get('wodNumber')) || 0
    );
    this.teamId.set(this.activatedRoute.snapshot.paramMap.get('teamId') || '');

    this.apiTeams
      .getTeamInfoTeamsTeamIdGet({ team_id: this.teamId() })
      .subscribe({
        next: (data: apiTeamsOutputDetailModel) => this.teamData.set(data),
        error: (error) => {
          this.teamData.set(null);
          this.toastService.showError('Failed to load team data');
        },
      });

    this.apiScores
      .getScoresScoresGet({
        team_id: this.teamId(),
        wod_number: this.wodNumber(),
      })
      .subscribe({
        next: (data: apiScoreOutputModel) => {
          this.scoreData.set(data);
          this.dataLoaded.set(true);
          this.scoreForm.patchValue({
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
        error: (error) => {
          this.scoreData.set(null);
          this.dataLoaded.set(true);
        },
      });
  }

  scoreForm = new FormGroup({
    reps: new FormControl<number | null>(null, [Validators.min(0)]),
    time_minutes: new FormControl<number | null>(null, [Validators.min(0)]),
    time_seconds: new FormControl<number | null>(null, [
      Validators.min(0),
      Validators.max(59),
    ]),
    tiebreak_minutes: new FormControl<number | null>(null, [Validators.min(0)]),
    tiebreak_seconds: new FormControl<number | null>(null, [
      Validators.min(0),
      Validators.max(59),
    ]),
    score_detail: new FormControl<string>(''),
  });

  submitScore() {
    if (this.scoreFormValid()) {
      const formValue = this.scoreForm.value;

      // Convert minutes and seconds to total seconds
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
          .subscribe({
            next: (data) => {
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
        // Creating score
        console.log('Creating score:', this.scoreForm.value);
        this.apiScores
          .createScoreScoresPost({
            body: {
              ...scoreSubmission,
              team_id: this.teamId(),
              wod_number: this.wodNumber(),
            },
          })
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
  }

  scoreFormValid() {
    return this.scoreForm.valid && this.scoreForm.dirty;
  }

  onCancel() {
    this.location.back();
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
}
