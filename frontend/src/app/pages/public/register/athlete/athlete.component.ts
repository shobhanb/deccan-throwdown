import {
  Component,
  inject,
  Input,
  OnInit,
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
  validate,
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
export class AthleteComponent implements OnInit {
  private modalController = inject(ModalController);

  @Input() sex: 'M' | 'F' = 'F';
  @Input() athleteData: apiAthleteRegistrationModel | null = null;

  athleteModel = signal<AthleteFormModel>({
    first_name: '',
    last_name: '',
    sex: 'F',
    email: '',
    phone_number: '',
    date_of_birth: '',
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

  ngOnInit() {
    this.applyAthleteData();
  }

  private applyAthleteData() {
    const data = this.athleteData;
    this.athleteModel.set({
      first_name: data?.first_name ?? '',
      last_name: data?.last_name ?? '',
      sex: this.sex,
      email: data?.email ?? '',
      phone_number: data?.phone_number ?? '',
      date_of_birth: data?.date_of_birth ?? '',
      gym_selection:
        data?.gym === 'CFMF' ? 'CFMF' : data?.gym ? 'Other' : '',
      gym: data?.gym ?? '',
    });
  }

  get showOtherGymInput(): boolean {
    return this.athleteModel().gym_selection === 'Other';
  }

  onGymSelectionChange(event: CustomEvent) {
    const selection = event.detail.value as string;
    this.athleteModel.update((model) => ({
      ...model,
      gym: selection === 'CFMF' ? 'CFMF' : '',
    }));
  }

  get formTitle(): string {
    const gender = this.sex === 'F' ? 'Female' : 'Male';
    const action = this.athleteData ? 'Edit' : 'Add';
    return `${action} ${gender} Athlete`;
  }

  isFormValid(): boolean {
    return this.athleteForm().valid() && this.athleteForm().dirty();
  }

  onSave() {
    if (!this.isFormValid()) {
      return;
    }

    const model = this.athleteModel();
    const gym =
      model.gym_selection === 'CFMF' ? 'CFMF' : model.gym.trim();

    const athleteData: apiAthleteRegistrationModel = {
      first_name: model.first_name,
      last_name: model.last_name,
      email: model.email,
      phone_number: model.phone_number,
      date_of_birth: model.date_of_birth,
      gym,
      sex: this.sex,
    };

    this.modalController.dismiss(athleteData);
  }

  onCancel() {
    this.modalController.dismiss();
  }
}
