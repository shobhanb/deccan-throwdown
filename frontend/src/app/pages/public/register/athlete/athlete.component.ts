import {
  Component,
  effect,
  inject,
  input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  applyWhen,
  email,
  form,
  FormField,
  hidden,
  pattern,
  required,
} from '@angular/forms/signals';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonList,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  ModalController,
} from '@ionic/angular';
import { apiAthleteRegistrationModel } from 'src/app/api/models';
import { AthleteFormModel } from 'src/app/shared/models/form-models';

@Component({
  selector: 'app-athlete',
  templateUrl: './athlete.component.html',
  styleUrls: ['./athlete.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonSelectOption,
    IonSelect,
    IonInput,
    IonItem,
    IonList,
    IonButton,
    IonButtons,
    IonToolbar,
    IonTitle,
    IonHeader,
    IonContent,
    FormField,
  ],
})
export class AthleteComponent {
  private modalController = inject(ModalController);

  sex = input<'M' | 'F'>('F');
  athleteData = input<apiAthleteRegistrationModel | null>(null);

  athleteModel = signal<AthleteFormModel>({
    first_name: '',
    last_name: '',
    sex: 'F',
    email: '',
    phone_number: '',
    gym_selection: '',
    gym: '',
  });

  athleteForm = form(this.athleteModel, (schemaPath) => {
    required(schemaPath.first_name, { message: 'First name is required' });
    required(schemaPath.last_name, { message: 'Last name is required' });
    required(schemaPath.email, { message: 'Email is required' });
    email(schemaPath.email, { message: 'Enter a valid email address' });
    required(schemaPath.phone_number, { message: 'Phone number is required' });
    pattern(schemaPath.phone_number, /^[\+]?[0-9\s\-\(\)\.]{7,15}$/, {
      message: 'Enter a valid phone number',
    });
    required(schemaPath.gym_selection, { message: 'Gym selection is required' });
    applyWhen(
      schemaPath,
      ({ value }) => value().gym_selection === 'Other',
      (path) => {
        required(path.gym, { message: 'Gym name is required' });
      }
    );
    hidden(schemaPath.gym, {
      when: ({ valueOf }) => valueOf(schemaPath.gym_selection) !== 'Other',
    });
  });

  constructor() {
    effect(() => {
      const selection = this.athleteModel().gym_selection;
      if (selection === 'CFMF') {
        this.athleteModel.update((model) => ({ ...model, gym: 'CFMF' }));
      } else if (selection === 'Other') {
        this.athleteModel.update((model) => ({ ...model, gym: '' }));
      }
    });

    effect(() => {
      const sex = this.sex();
      const data = this.athleteData();
      this.athleteModel.set({
        first_name: data?.first_name ?? '',
        last_name: data?.last_name ?? '',
        sex,
        email: data?.email ?? '',
        phone_number: data?.phone_number ?? '',
        gym_selection:
          data?.gym === 'CFMF'
            ? 'CFMF'
            : data?.gym
              ? 'Other'
              : '',
        gym: data?.gym ?? '',
      });
    });
  }

  get showOtherGymInput(): boolean {
    return this.athleteModel().gym_selection === 'Other';
  }

  get formTitle(): string {
    const gender = this.sex() === 'F' ? 'Female' : 'Male';
    const action = this.athleteData() ? 'Edit' : 'Add';
    return `${action} ${gender} Athlete`;
  }

  isFormValid(): boolean {
    return this.athleteForm().valid() && this.athleteForm().dirty();
  }

  onSave() {
    if (!this.isFormValid()) {
      return;
    }

    const athleteData: apiAthleteRegistrationModel = {
      ...this.athleteModel(),
      sex: this.sex(),
    };

    this.modalController.dismiss(athleteData);
  }

  onCancel() {
    this.modalController.dismiss();
  }
}
