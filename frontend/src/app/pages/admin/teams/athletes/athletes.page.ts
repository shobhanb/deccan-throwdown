import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  FormControl,
  FormGroup,
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
  IonList,
  IonItem,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonCheckbox,
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { apiAthletesService, apiTeamsService } from 'src/app/api/services';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from 'src/app/services/toast.service';
import {
  apiAthleteCreateModel,
  apiAthleteOutputModel,
  apiTeamsOutputDetailModel,
} from 'src/app/api/models';
import { HelperFunctionsService } from 'src/app/services/helper-functions.service';
import { AlertService } from 'src/app/services/alert.service';
import { AppConfigService } from 'src/app/services/app-config-service';

@Component({
  selector: 'app-athletes',
  templateUrl: './athletes.page.html',
  styleUrls: ['./athletes.page.scss'],
  standalone: true,
  imports: [
    IonCheckbox,
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
    CommonModule,
    ReactiveFormsModule,
    ToolbarButtonsComponent,
    IonInput,
    IonSelect,
    IonSelectOption,
  ],
})
export class AthletesPage implements OnInit {
  private apiAthlete = inject(apiAthletesService);
  private apiTeams = inject(apiTeamsService);
  private activatedRoute = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private location = inject(Location);
  private alertService = inject(AlertService);
  private appConfigService = inject(AppConfigService);

  eventShortName = this.appConfigService.eventShortName;

  dataLoaded = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editAthlete = signal<apiAthleteOutputModel | null>(null);
  teamId = signal<string>('');

  athleteForm = new FormGroup({
    first_name: new FormControl('', [Validators.required]),
    last_name: new FormControl('', [Validators.required]),
    sex: new FormControl('', [Validators.required, Validators.pattern('M|F')]),
    email: new FormControl('', [Validators.email]),
    waiver: new FormControl(false, [Validators.required]),
    gym: new FormControl(''),
    city: new FormControl(''),
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
    const teamId = this.activatedRoute.snapshot.paramMap.get('teamId');
    const athleteId = this.activatedRoute.snapshot.paramMap.get('athleteId');

    if (teamId) {
      // Create Athlete
      this.isEditing.set(false);
      this.dataLoaded.set(true);
      this.teamId.set(teamId);
    } else if (athleteId) {
      // Edit Athlete
      this.isEditing.set(true);
      this.dataLoaded.set(false);
      this.apiAthlete
        .getAthleteAthletesAthleteIdGet({ athlete_id: athleteId })
        .subscribe({
          next: (data: apiAthleteOutputModel) => {
            this.editAthlete.set(data);
            this.athleteForm.patchValue({
              first_name: data.first_name,
              last_name: data.last_name,
              email: data.email,
              sex: data.sex,
              waiver: data.waiver,
              gym: data.gym,
              city: data.city,
            });
          },
          error: (error) => {
            console.error('Error fetching athlete data:', error);
            this.toastService.showError(
              'Failed to load athlete data: ' + error.statusText
            );
          },
          complete: () => {
            this.dataLoaded.set(true);
          },
        });
    }
  }

  athleteFormValid() {
    return this.athleteForm.valid && this.athleteForm.dirty;
  }

  onSubmit() {
    if (this.athleteFormValid()) {
      // Prepare form data with trimmed names
      const formValue = this.athleteForm.value;
      const trimmedData = {
        ...formValue,
        first_name: formValue.first_name?.trim(),
        last_name: formValue.last_name?.trim(),
      };

      if (this.isEditing()) {
        // Update Athlete
        this.apiAthlete
          .updateAthleteAthletesAthleteIdPatch({
            athlete_id: this.editAthlete()?.id!,
            body: {
              ...formValue,
              sex:
                formValue.sex === 'M' || formValue.sex === 'F'
                  ? formValue.sex
                  : undefined,
              team_id: this.editAthlete()!.team_id,
            },
          })
          .subscribe({
            next: (data) => {
              this.toastService.showSuccess('Athlete updated successfully');
              this.router.navigate(
                ['/admin', 'teams', this.editAthlete()!.team_id],
                { replaceUrl: true }
              );
            },
            error: (error) => {
              console.error('Error updating athlete:', error);
              this.toastService.showError(
                'Failed to update athlete: ' + error.statusText
              );
            },
          });
      } else {
        // Create Athlete
        this.apiAthlete
          .createAthleteAthletesPost({
            body: {
              ...(this.athleteForm.value as apiAthleteCreateModel),
              team_id: this.teamId(),
            },
          })
          .subscribe({
            next: (data) => {
              this.toastService.showSuccess('Athlete created successfully');
              this.router.navigate(['/admin', 'teams', this.teamId()], {
                replaceUrl: true,
              });
            },
            error: (error) => {
              console.error('Error creating athlete:', error);
              this.toastService.showError(
                'Failed to create athlete: ' + error.statusText
              );
            },
          });
      }
    }
  }

  onCancel() {
    this.location.back();
  }

  async onDelete() {
    if (!this.isEditing() || !this.editAthlete()) {
      return;
    }

    const confirmation = await this.alertService.showAlert(
      `Delete athlete ${this.editAthlete()!.first_name} ${
        this.editAthlete()!.last_name
      }?`
    );

    if (confirmation.role === 'confirm') {
      this.apiAthlete
        .deleteAthleteAthletesAthleteIdDelete({
          athlete_id: this.editAthlete()!.id,
        })
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Athlete deleted successfully');
            this.router.navigate(
              ['/admin', 'teams', this.editAthlete()!.team_id],
              { replaceUrl: true }
            );
          },
          error: (error) => {
            console.error('Error deleting athlete:', error);
            this.toastService.showError(
              'Failed to delete athlete: ' + error.statusText
            );
          },
        });
    }
  }
}
