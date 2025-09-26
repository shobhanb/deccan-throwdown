import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonList,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonLabel,
  IonIcon,
  IonMenuButton,
  ModalController,
  IonCardContent,
  IonText,
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { AthleteComponent } from './athlete/athlete.component';
import { SuccessComponent } from './success/success.component';
import { AppConfigService } from 'src/app/services/app-config-service';
import { ToastService } from 'src/app/services/toast.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { addOutline, manOutline, womanOutline } from 'ionicons/icons';
import { apiTeamsService } from 'src/app/api/services';

interface AthleteData {
  first_name: string;
  last_name: string;
  email: string;
  gym: string;
  city: string;
  sex: 'M' | 'F';
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonText,
    IonCardContent,
    IonIcon,
    IonLabel,
    IonButton,
    IonSelectOption,
    IonSelect,
    IonInput,
    IonItem,
    IonList,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonMenuButton,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ToolbarButtonsComponent,
  ],
})
export class RegisterPage implements OnInit {
  private modalController = inject(ModalController);
  private appConfigService = inject(AppConfigService);
  private apiTeams = inject(apiTeamsService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  categories = this.appConfigService.categories;
  eventName = this.appConfigService.eventName;

  athletes = signal<AthleteData[]>([]);

  teamForm = new FormGroup({
    team_name: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
    ]),
    category: new FormControl('', [Validators.required]),
  });

  constructor() {
    addIcons({ addOutline, manOutline, womanOutline });
  }

  ngOnInit() {}

  get femaleAthletes(): AthleteData[] {
    return this.athletes().filter((athlete) => athlete.sex === 'F');
  }

  get maleAthletes(): AthleteData[] {
    return this.athletes().filter((athlete) => athlete.sex === 'M');
  }

  get athleteSlots(): {
    type: 'F' | 'M';
    index: number;
    athlete?: AthleteData;
  }[] {
    const slots = [];

    // Create 2 female slots
    for (let i = 0; i < 2; i++) {
      slots.push({
        type: 'F' as const,
        index: i,
        athlete: this.femaleAthletes[i],
      });
    }

    // Create 2 male slots
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
    athleteData: AthleteData,
    sex: 'M' | 'F',
    athleteIndex?: number
  ) {
    const currentAthletes = [...this.athletes()];
    const sameGenderAthletes = currentAthletes.filter((a) => a.sex === sex);
    const otherGenderAthletes = currentAthletes.filter((a) => a.sex !== sex);

    if (athleteIndex !== undefined && sameGenderAthletes[athleteIndex]) {
      // Update existing athlete
      sameGenderAthletes[athleteIndex] = athleteData;
    } else {
      // Add new athlete
      sameGenderAthletes.push(athleteData);
    }

    this.athletes.set([...otherGenderAthletes, ...sameGenderAthletes]);
  }

  isFormValid(): boolean {
    return (
      this.teamForm.valid &&
      this.athletes().length === 4 &&
      this.femaleAthletes.length === 2 &&
      this.maleAthletes.length === 2
    );
  }

  onSubmit() {
    if (this.isFormValid()) {
      const registrationData = {
        team_name: this.teamForm.value.team_name!.trim(),
        category: this.teamForm.value.category!,
        event_short_name: this.appConfigService.eventShortName,
        athletes: this.athletes().map((athlete) => ({
          first_name: athlete.first_name.trim(),
          last_name: athlete.last_name.trim(),
          sex: athlete.sex,
          email: athlete.email?.trim() || null,
          gym: athlete.gym?.trim() || null,
          city: athlete.city?.trim() || null,
        })),
      };

      console.log('Registration Data:', registrationData);

      this.apiTeams
        .registerTeamTeamsRegisterPost({ body: registrationData })
        .subscribe({
          next: async (response) => {
            console.log('Team registered successfully:', response);
            this.toastService.showSuccess('Team registered successfully!');

            // Show success modal
            const modal = await this.modalController.create({
              component: SuccessComponent,
            });

            await modal.present();
          },
          error: (error) => {
            console.error('Error registering team:', error);
            this.toastService.showError(
              'Failed to register team: ' +
                (error.statusText || 'Unknown error')
            );
          },
        });
    }
  }
}
