import {
  Component,
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
  IonFooter,
  IonList,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonMenuButton,
  ModalController,
  IonRouterLink,
} from '@ionic/angular';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { PageHeaderComponent } from 'src/app/shared/page-header/page-header.component';
import { AthleteComponent } from './athlete/athlete.component';
import { SuccessComponent } from './success/success.component';
import { AppConfigService } from 'src/app/services/app-config-service';
import { ToastService } from 'src/app/services/toast.service';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  addOutline,
  cashOutline,
  manOutline,
  womanOutline,
} from 'ionicons/icons';
import { apiTeamsService } from 'src/app/api/services';
import {
  apiAthleteRegistrationModel,
  apiTeamRegistrationResponseModel,
} from 'src/app/api/models';
import { TeamFormModel } from 'src/app/shared/models/form-models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EmptyStateComponent } from 'src/app/shared/empty-state/empty-state.component';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    DecimalPipe,
    PageHeaderComponent,
    EmptyStateComponent,
    IonFooter,
    IonIcon,
    IonButton,
    IonSelectOption,
    IonSelect,
    IonInput,
    IonItem,
    IonList,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonMenuButton,
    FormField,
    ToolbarButtonsComponent,
    RouterLink,
    IonRouterLink,
  ],
})
export class RegisterPage {
  private modalController = inject(ModalController);
  private appConfigService = inject(AppConfigService);
  private apiTeams = inject(apiTeamsService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  categories = this.appConfigService.categories;
  eventName = this.appConfigService.eventName;
  registrationPricing = this.appConfigService.registrationPricing;
  registrationOpen = this.appConfigService.registrationStatus === 'open';

  athletes = signal<apiAthleteRegistrationModel[]>([]);

  teamModel = signal<TeamFormModel>({
    team_name: '',
    category: '',
  });

  teamForm = form(this.teamModel, (schemaPath) => {
    required(schemaPath.team_name, { message: 'Team name is required' });
    minLength(schemaPath.team_name, 2, {
      message: 'Team name must be at least 2 characters',
    });
    required(schemaPath.category, { message: 'Category is required' });
  });

  constructor() {
    addIcons({ addOutline, manOutline, womanOutline, cashOutline });
  }

  get femaleAthletes(): apiAthleteRegistrationModel[] {
    return this.athletes().filter((athlete) => athlete.sex === 'F');
  }

  get maleAthletes(): apiAthleteRegistrationModel[] {
    return this.athletes().filter((athlete) => athlete.sex === 'M');
  }

  get athleteSlots(): {
    type: 'F' | 'M';
    index: number;
    athlete?: apiAthleteRegistrationModel;
  }[] {
    const slots = [];

    for (let i = 0; i < 2; i++) {
      slots.push({
        type: 'F' as const,
        index: i,
        athlete: this.femaleAthletes[i],
      });
    }

    for (let i = 0; i < 2; i++) {
      slots.push({
        type: 'M' as const,
        index: i,
        athlete: this.maleAthletes[i],
      });
    }

    return slots;
  }

  async openAthleteModal(sex: 'M' | 'F', athleteIndex?: number) {
    const existingAthlete =
      sex === 'F'
        ? this.femaleAthletes[athleteIndex || 0]
        : this.maleAthletes[athleteIndex || 0];

    const modal = await this.modalController.create({
      component: AthleteComponent,
      componentProps: {
        sex: sex,
        athleteData: existingAthlete || null,
      },
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.updateAthlete(result.data, sex, athleteIndex);
      }
    });

    return await modal.present();
  }

  private updateAthlete(
    athleteData: apiAthleteRegistrationModel,
    sex: 'M' | 'F',
    athleteIndex?: number
  ) {
    const currentAthletes = [...this.athletes()];
    const sameGenderAthletes = currentAthletes.filter((a) => a.sex === sex);
    const otherGenderAthletes = currentAthletes.filter((a) => a.sex !== sex);

    if (athleteIndex !== undefined && sameGenderAthletes[athleteIndex]) {
      sameGenderAthletes[athleteIndex] = athleteData;
    } else {
      sameGenderAthletes.push(athleteData);
    }

    this.athletes.set([...otherGenderAthletes, ...sameGenderAthletes]);
  }

  isFormValid(): boolean {
    return (
      this.teamForm().valid() &&
      this.athletes().length === 4 &&
      this.femaleAthletes.length === 2 &&
      this.maleAthletes.length === 2
    );
  }

  onSubmit() {
    if (!this.isFormValid()) {
      return;
    }

    const teamData = this.teamModel();
    const registrationData = {
      team_name: teamData.team_name.trim(),
      category: teamData.category,
      event_short_name: this.appConfigService.eventShortName,
      athletes: this.athletes().map((athlete) => ({
        first_name: athlete.first_name.trim(),
        last_name: athlete.last_name.trim(),
        sex: athlete.sex,
        email: athlete.email?.trim() || null,
        phone_number: athlete.phone_number?.trim() || null,
        gym: athlete.gym?.trim() || null,
        city: athlete.city?.trim() || null,
      })),
    };

    this.apiTeams
      .registerTeamTeamsRegisterPost({ body: registrationData })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (response: apiTeamRegistrationResponseModel) => {
          this.toastService.showSuccess('Team registered successfully!');

          const modal = await this.modalController.create({
            component: SuccessComponent,
            componentProps: {
              responseData: response,
            },
          });

          await modal.present();
        },
        error: (error) => {
          console.error('Error registering team:', error);
          this.toastService.showError(
            'Failed to register team: ' + (error.statusText || 'Unknown error')
          );
        },
      });
  }
}
