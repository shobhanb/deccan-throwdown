import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonButton,
  IonList,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  ModalController,
} from '@ionic/angular/standalone';
import { apiAthleteRegistrationModel } from 'src/app/api/models';

@Component({
  selector: 'app-athlete',
  templateUrl: './athlete.component.html',
  styleUrls: ['./athlete.component.scss'],
  standalone: true,
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
    CommonModule,
    ReactiveFormsModule,
  ],
})
export class AthleteComponent implements OnInit {
  private modalController = inject(ModalController);

  @Input() sex: 'M' | 'F' = 'F';
  @Input() athleteData: apiAthleteRegistrationModel | null = null;

  athleteForm = new FormGroup({
    first_name: new FormControl('', [Validators.required]),
    last_name: new FormControl('', [Validators.required]),
    sex: new FormControl<'M' | 'F'>('F', [Validators.required]),
    email: new FormControl('', [Validators.email, Validators.required]),
    phone_number: new FormControl('', [
      Validators.pattern('^[\\+]?[0-9\\s\\-\\(\\)\\.]{7,15}$'),
    ]),
    gym_selection: new FormControl('', { validators: [Validators.required] }),
    gym: new FormControl('', { validators: [Validators.required] }),
    city: new FormControl(''),
  });

  ngOnInit() {
    // Set the sex based on the input
    this.athleteForm.patchValue({ sex: this.sex });

    // If editing an existing athlete, populate the form
    if (this.athleteData) {
      this.athleteForm.patchValue(this.athleteData);

      // Set gym selection based on existing gym value
      if (this.athleteData.gym === 'CFMF') {
        this.athleteForm.patchValue({ gym_selection: 'CFMF' });
      } else if (this.athleteData.gym) {
        this.athleteForm.patchValue({
          gym_selection: 'Other',
        });
      }
    }

    // Listen to gym selection changes
    this.athleteForm.get('gym_selection')?.valueChanges.subscribe((value) => {
      this.onGymSelectionChange(value);
    });
  }

  onGymSelectionChange(selection: string | null) {
    if (selection === 'CFMF') {
      this.athleteForm.patchValue({
        gym: 'CFMF',
      });
    } else if (selection === 'Other') {
      this.athleteForm.patchValue({ gym: '' });
    } else {
      this.athleteForm.patchValue({
        gym: '',
      });
    }
  }

  onGymChange(value: string | null) {
    if (this.athleteForm.get('gym_selection')?.value === 'Other') {
      this.athleteForm.patchValue({ gym: value || '' });
    }
  }

  get showOtherGymInput(): boolean {
    return this.athleteForm.get('gym_selection')?.value === 'Other';
  }

  get formTitle(): string {
    const gender = this.sex === 'F' ? 'Female' : 'Male';
    const action = this.athleteData ? 'Edit' : 'Add';
    return `${action} ${gender} Athlete`;
  }

  isFormValid(): boolean {
    return this.athleteForm.valid && this.athleteForm.dirty;
  }

  onSave() {
    if (this.isFormValid()) {
      const athleteData: apiAthleteRegistrationModel = {
        ...this.athleteForm.value,
        sex: this.sex, // Ensure sex matches the modal type
      } as apiAthleteRegistrationModel;

      this.modalController.dismiss(athleteData);
    }
  }

  onCancel() {
    this.modalController.dismiss();
  }
}
