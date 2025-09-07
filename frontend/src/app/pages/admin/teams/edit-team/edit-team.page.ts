import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
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
  IonNote,
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { apiAthletesService, apiTeamsService } from 'src/app/api/services';
import {
  apiTeamsCreateModel,
  apiTeamsOutputDetailModel,
  apiTeamsOutputModel,
  apiTeamsUpdateModel,
} from 'src/app/api/models';
import { environment } from 'src/environments/environment';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { ToastService } from 'src/app/services/toast.service';
import { categoryConfig } from 'src/app/config/config';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'app-edit-team',
  templateUrl: './edit-team.page.html',
  styleUrls: ['./edit-team.page.scss'],
  standalone: true,
  imports: [
    IonNote,
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
    CommonModule,
    ReactiveFormsModule,
    ToolbarButtonsComponent,
    RouterLink,
  ],
})
export class EditTeamPage implements OnInit {
  private apiTeams = inject(apiTeamsService);
  private apiAthletes = inject(apiAthletesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private location = inject(Location);
  private alertService = inject(AlertService);

  isEditing = signal<boolean>(false);
  dataLoaded = signal<boolean>(false);
  editTeam = signal<apiTeamsOutputDetailModel | null>(null);
  athletes = computed(() => this.editTeam()?.athletes || []);

  categories = categoryConfig[environment.eventShortName]['categories'] || [];
  athletesPerTeam =
    categoryConfig[environment.eventShortName]['athletesPerTeam'] || 1;

  get athleteIndexes(): number[] {
    return Array.from({ length: this.athletesPerTeam }, (_, i) => i);
  }

  teamForm = new FormGroup({
    team_name: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
    ]),
    category: new FormControl('', [Validators.required]),
    paid: new FormControl(false),
    verified: new FormControl(false),
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

  private async getData() {
    const teamId = this.route.snapshot.paramMap.get('teamId');
    if (teamId) {
      this.isEditing.set(true);
      this.dataLoaded.set(false);
      this.apiTeams.getTeamInfoTeamsTeamIdGet({ team_id: teamId }).subscribe({
        next: (team) => {
          this.editTeam.set(team);
          this.teamForm.patchValue({
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
    return this.teamForm.valid && this.teamForm.dirty;
  }

  async onSubmit() {
    if (this.teamFormValid()) {
      if (this.isEditing()) {
        await this.updateTeam();
      } else {
        await this.createTeam();
      }
    }
  }

  private async createTeam() {
    const formValue = this.teamForm.value;
    const createModel: apiTeamsCreateModel = {
      team_name: formValue.team_name!,
      category: formValue.category!,
      paid: formValue.paid!,
      verified: formValue.verified!,
      event_short_name: environment.eventShortName,
    };

    this.apiTeams.createTeamTeamsPost({ body: createModel }).subscribe({
      next: (data: apiTeamsOutputModel) => {
        this.toastService.showSuccess('Team created successfully');
        this.router.navigate(['admin', 'teams', data.id], {
          replaceUrl: true,
        });
      },
      error: (error) => {
        console.error('Error creating team:', error);
        this.toastService.showError('Failed to create team' + error.message);
      },
    });
  }

  private async updateTeam() {
    const formValue = this.teamForm.value;
    const updateModel: apiTeamsUpdateModel = {
      team_name: formValue.team_name,
      category: formValue.category,
      paid: formValue.paid,
      verified: formValue.verified,
      event_short_name: environment.eventShortName,
    };

    this.apiTeams
      .updateTeamTeamsTeamIdPatch({
        team_id: this.editTeam()!.id,
        body: updateModel,
      })
      .subscribe({
        next: () => {
          this.router.navigate(['admin', 'teams'], { replaceUrl: true });
          this.toastService.showSuccess('Team updated successfully');
        },
        error: (error) => {
          console.error('Error updating team:', error);
          this.toastService.showError(
            'Failed to update team: ' + error.message
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
          .subscribe({
            next: () => {
              this.router.navigate(['admin', 'teams'], { replaceUrl: true });
              this.toastService.showSuccess('Team deleted successfully');
            },
            error: (error) => {
              console.error('Error deleting team:', error);
              this.toastService.showError(
                'Failed to delete team: ' + error.message
              );
            },
          });
      }
    }
  }

  onCancel() {
    this.location.back();
  }
}
