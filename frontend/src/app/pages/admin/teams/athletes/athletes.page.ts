import {
  Component,
  DestroyRef,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  email,
  form,
  FormField,
  pattern,
  required,
  validate,
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
  IonSelect,
  IonSelectOption,
  IonInput,
  IonCheckbox,
  IonRouterLink,
  IonSkeletonText,
} from '@ionic/angular';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { apiAthletesService } from 'src/app/api/services';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from 'src/app/services/toast.service';
import {
  apiAthleteCreateModel,
  apiAthleteOutputModel,
} from 'src/app/api/models';
import { AlertService } from 'src/app/services/alert.service';
import { AppConfigService } from 'src/app/services/app-config-service';
import { AdminAthleteFormModel } from 'src/app/shared/models/form-models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-athletes',
  templateUrl: './athletes.page.html',
  styleUrls: ['./athletes.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
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
    IonSkeletonText,
    FormField,
    ToolbarButtonsComponent,
    IonInput,
    IonSelect,
    IonSelectOption,
    RouterLink,
    IonRouterLink,
  ],
})
export class AthletesPage {
  private apiAthlete = inject(apiAthletesService);
  private activatedRoute = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private appConfigService = inject(AppConfigService);
  private destroyRef = inject(DestroyRef);

  eventShortName = this.appConfigService.eventShortName;

  dataLoaded = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editAthlete = signal<apiAthleteOutputModel | null>(null);
  teamId = signal<string>('');

  athleteModel = signal<AdminAthleteFormModel>({
    first_name: '',
    last_name: '',
    sex: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    waiver: false,
    gym: '',
    city: '',
  });

  athleteForm = form(this.athleteModel, (schemaPath) => {
    required(schemaPath.first_name, { message: 'First name is required' });
    required(schemaPath.last_name, { message: 'Last name is required' });
    required(schemaPath.sex, { message: 'Sex is required' });
    pattern(schemaPath.sex, /^M|F$/, { message: 'Sex must be M or F' });
    email(schemaPath.email, { message: 'Enter a valid email address' });
    pattern(schemaPath.phone_number, /^[\+]?[0-9\s\-\(\)\.]{7,15}$/, {
      message: 'Enter a valid phone number',
    });
    required(schemaPath.date_of_birth, {
      message: 'Date of birth is required',
    });
    validate(schemaPath.date_of_birth, ({ value }) => {
      const dateOfBirth = value();
      if (!dateOfBirth) {
        return undefined;
      }

      const parsed = new Date(`${dateOfBirth}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) {
        return { kind: 'invalidDate', message: 'Enter a valid date of birth' };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsed > today) {
        return {
          kind: 'futureDate',
          message: 'Date of birth cannot be in the future',
        };
      }

      return undefined;
    });
    validate(schemaPath.waiver, ({ value }) =>
      value()
        ? undefined
        : { kind: 'required', message: 'Waiver must be accepted' }
    );
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
    const teamId = this.activatedRoute.snapshot.paramMap.get('teamId');
    const athleteId = this.activatedRoute.snapshot.paramMap.get('athleteId');

    if (teamId) {
      this.isEditing.set(false);
      this.dataLoaded.set(true);
      this.teamId.set(teamId);
    } else if (athleteId) {
      this.isEditing.set(true);
      this.dataLoaded.set(false);
      this.apiAthlete
        .getAthleteAthletesAthleteIdGet({ athlete_id: athleteId })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: apiAthleteOutputModel) => {
            this.editAthlete.set(data);
            this.athleteModel.set({
              first_name: data.first_name,
              last_name: data.last_name,
              email: data.email ?? '',
              phone_number: data.phone_number ?? '',
              date_of_birth: data.date_of_birth ?? '',
              sex: data.sex,
              waiver: data.waiver ?? false,
              gym: data.gym ?? '',
              city: data.city ?? '',
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
    return this.athleteForm().valid() && this.athleteForm().dirty();
  }

  onSubmit() {
    if (!this.athleteFormValid()) {
      return;
    }

    const formValue = this.athleteModel();
    const trimmedData = {
      ...formValue,
      first_name: formValue.first_name.trim(),
      last_name: formValue.last_name.trim(),
    };

    if (this.isEditing()) {
      this.apiAthlete
        .updateAthleteAthletesAthleteIdPatch({
          athlete_id: this.editAthlete()?.id!,
          body: {
            ...trimmedData,
            sex:
              trimmedData.sex === 'M' || trimmedData.sex === 'F'
                ? trimmedData.sex
                : undefined,
            team_id: this.editAthlete()!.team_id,
          },
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
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
      this.apiAthlete
        .createAthleteAthletesPost({
          body: {
            ...(trimmedData as apiAthleteCreateModel),
            email: trimmedData.email?.trim() || null,
            phone_number: trimmedData.phone_number?.trim() || null,
            team_id: this.teamId(),
          },
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
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
        .pipe(takeUntilDestroyed(this.destroyRef))
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
