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
  ModalController,
} from '@ionic/angular/standalone';

interface AthleteData {
  first_name: string;
  last_name: string;
  email: string;
  gym: string;
  city: string;
  sex: 'M' | 'F';
}

@Component({
  selector: 'app-athlete',
  templateUrl: './athlete.component.html',
  styleUrls: ['./athlete.component.scss'],
  standalone: true,
  imports: [
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
  @Input() athleteData: AthleteData | null = null;

  athleteForm = new FormGroup({
    first_name: new FormControl('', [Validators.required]),
    last_name: new FormControl('', [Validators.required]),
    sex: new FormControl<'M' | 'F'>('F', [Validators.required]),
    email: new FormControl('', [Validators.email, Validators.required]),
    gym: new FormControl(''),
    city: new FormControl(''),
  });

  ngOnInit() {
    // Set the sex based on the input
    this.athleteForm.patchValue({ sex: this.sex });

    // If editing an existing athlete, populate the form
    if (this.athleteData) {
      this.athleteForm.patchValue(this.athleteData);
    }
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
      const athleteData: AthleteData = {
        ...this.athleteForm.value,
        sex: this.sex, // Ensure sex matches the modal type
      } as AthleteData;

      this.modalController.dismiss(athleteData);
    }
  }

  onCancel() {
    this.modalController.dismiss();
  }
}
