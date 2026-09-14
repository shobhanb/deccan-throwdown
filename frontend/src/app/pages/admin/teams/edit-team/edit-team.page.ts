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
  minLength,
  required,
} from '@angular/forms/signals';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonButtons,
  IonBackButton,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonSkeletonText,
  IonIcon,
  IonRouterLink,
} from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { apiTeamsService } from 'src/app/api/services';
import {
  apiAthleteOutputModel,
  apiTeamsCreateModel,
  apiTeamsOutputDetailModel,
  apiTeamsOutputModel,
  apiTeamsUpdateModel,
} from 'src/app/api/models';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { ToastService } from 'src/app/services/toast.service';
import { AlertService } from 'src/app/services/alert.service';
import { addIcons } from 'ionicons';
import { manOutline, womanOutline } from 'ionicons/icons';
import { AppConfigService } from 'src/app/services/app-config-service';
import { AdminTeamFormModel } from 'src/app/shared/models/form-models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-edit-team',
  templateUrl: './edit-team.page.html',
  styleUrls: ['./edit-team.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonIcon,
    IonList,
    IonRefresherContent,
    IonRefresher,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
    IonButtons,
    IonBackButton,
    IonSkeletonText,
    FormField,
    ToolbarButtonsComponent,
    RouterLink,
    IonRouterLink,
  ],
})
export class EditTeamPage {
  private apiTeams = inject(apiTeamsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private alertService = inject(AlertService);
  private appConfigService = inject(AppConfigService);
  private destroyRef = inject(DestroyRef);

  isEditing = signal<boolean>(false);
  dataLoaded = signal<boolean>(false);
  editTeam = signal<apiTeamsOutputDetailModel | null>(null);
  athletes = computed(
    () =>
      this.editTeam()?.athletes.sort(
        (a: apiAthleteOutputModel, b: apiAthleteOutputModel) => {
          if (a.sex !== b.sex) {
            return a.sex.localeCompare(b.sex);
          }
          const firstNameCompare = a.first_name.localeCompare(b.first_name);
          if (firstNameCompare !== 0) {
            return firstNameCompare;
          }
          return a.last_name.localeCompare(b.last_name);
        }
      ) || []
  );

  eventShortName = this.appConfigService.eventShortName;
  eventName = this.appConfigService.eventName;
  categories = this.appConfigService.categories;
  athletesPerTeam = this.appConfigService.athletesPerTeam;

  get athleteIndexes(): number[] {
    return Array.from({ length: this.athletesPerTeam }, (_, i) => i);
  }

  teamModel = signal<AdminTeamFormModel>({
    team_name: '',
    category: '',
    paid: false,
    verified: false,
  });

  teamForm = form(this.teamModel, (schemaPath) => {
    required(schemaPath.team_name, { message: 'Team name is required' });
    minLength(schemaPath.team_name, 2, {
      message: 'Team name must be at least 2 characters',
    });
    required(schemaPath.category, { message: 'Category is required' });
  });

  constructor() {
    addIcons({ manOutline, womanOutline });
  }

  ionViewWillEnter() {
    this.getData();
  }

  handleRefresh(event: CustomEvent) {
    this.getData();
    (event.target as HTMLIonRefresherElement).complete();
  }

  private getData() {
    const teamId = this.route.snapshot.paramMap.get('teamId');
    if (teamId) {
      this.isEditing.set(true);
      this.dataLoaded.set(false);
      this.apiTeams
        .getTeamInfoTeamsTeamIdGet({ team_id: teamId })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (team) => {
            this.editTeam.set(team);
            this.teamModel.set({
              team_name: team.team_name,
              category: team.category,
              paid: team.paid,
              verified: team.verified,
            });
          },
          error: (error) => {
            console.error('Error loading team:', error);
          },
          complete: () => {
            this.dataLoaded.set(true);
          },
        });
    } else {
      this.isEditing.set(false);
      this.dataLoaded.set(true);
    }
  }

  teamFormValid() {
    return this.teamForm().valid() && this.teamForm().dirty();
  }

  async onSubmit() {
    if (!this.teamFormValid()) {
      return;
    }

    if (this.isEditing()) {
      await this.updateTeam();
    } else {
      await this.createTeam();
    }
  }

  private createTeam() {
    const formValue = this.teamModel();
    const createModel: apiTeamsCreateModel = {
      team_name: formValue.team_name.trim(),
      category: formValue.category,
      paid: formValue.paid,
      verified: formValue.verified,
      event_short_name: this.eventShortName,
    };

    this.apiTeams
      .createTeamTeamsPost({ body: createModel })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: apiTeamsOutputModel) => {
          this.toastService.showSuccess('Team created successfully');
          this.router.navigate(['/admin', 'teams', data.id], {
            replaceUrl: true,
          });
        },
        error: (error) => {
          console.error('Error creating team:', error);
          this.toastService.showError(
            'Failed to create team: ' + error.statusText
          );
        },
      });
  }

  private updateTeam() {
    const formValue = this.teamModel();
    const updateModel: apiTeamsUpdateModel = {
      team_name: formValue.team_name.trim(),
      category: formValue.category,
      paid: formValue.paid,
      verified: formValue.verified,
      event_short_name: this.eventShortName,
    };

    this.apiTeams
      .updateTeamTeamsTeamIdPatch({
        team_id: this.editTeam()!.id,
        body: updateModel,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/admin', 'teams'], {
            replaceUrl: true,
          });
          this.toastService.showSuccess('Team updated successfully');
        },
        error: (error) => {
          console.error('Error updating team:', error);
          this.toastService.showError(
            'Failed to update team: ' + error.statusText
          );
        },
      });
  }

  async onDelete() {
    if (this.isEditing() && this.editTeam()) {
      const confirmation = await this.alertService.showAlert(
        `Delete team "${this.editTeam()!.team_name}"?`
      );
      if (confirmation.role === 'confirm') {
        this.apiTeams
          .deleteTeamTeamsTeamIdDelete({ team_id: this.editTeam()!.id })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.router.navigate(['/admin', 'teams'], {
                replaceUrl: true,
              });
              this.toastService.showSuccess('Team deleted successfully');
            },
            error: (error) => {
              console.error('Error deleting team:', error);
              this.toastService.showError(
                'Failed to delete team: ' + error.error.detail
              );
            },
          });
      }
    }
  }
}
