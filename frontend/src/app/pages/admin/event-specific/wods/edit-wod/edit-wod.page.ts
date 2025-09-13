import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButtons,
  IonRefresher,
  IonRefresherContent,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonList,
  IonItem,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonSkeletonText,
  IonNote,
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { apiWodsService } from 'src/app/api/services';
import {
  apiWodOutputModel,
  apiWodCreateModel,
  apiWodUpdateModel,
} from 'src/app/api/models';
import { ToastService } from 'src/app/services/toast.service';
import { appConfig } from 'src/app/config/config';

@Component({
  selector: 'app-edit-wod',
  templateUrl: './edit-wod.page.html',
  styleUrls: ['./edit-wod.page.scss'],
  standalone: true,
  imports: [
    IonNote,
    IonSkeletonText,
    IonButton,
    IonSelectOption,
    IonSelect,
    IonTextarea,
    IonInput,
    IonItem,
    IonList,
    IonCardContent,
    IonCardHeader,
    IonCard,
    IonRefresherContent,
    IonRefresher,
    IonButtons,
    IonBackButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ToolbarButtonsComponent,
  ],
})
export class EditWodPage implements OnInit {
  private apiWods = inject(apiWodsService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  eventShortName = signal<string>('');
  eventName = computed(() => appConfig[this.eventShortName()].eventName || '');

  wod = signal<apiWodOutputModel | null>(null);
  isEditing = signal<boolean>(false);
  dataLoaded = signal<boolean>(false);

  wodForm = new FormGroup({
    wod_name: new FormControl<string>('', [Validators.required]),
    wod_number: new FormControl<number>(1, [
      Validators.required,
      Validators.min(1),
    ]),
    wod_score_type: new FormControl<string>('', [Validators.required]),
    wod_description: new FormControl<string>(''),
  });

  scoreTypes = [
    'Time',
    'Reps',
    'Weight',
    'Distance',
    'Points',
    'Rounds + Reps',
  ];

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
    this.eventShortName.set(
      this.route.snapshot.paramMap.get('eventShortName') || ''
    );
    const wodId = this.route.snapshot.paramMap.get('wodId');
    if (wodId) {
      this.isEditing.set(true);
      this.apiWods
        .getWodWodsWodIdGet({
          wod_id: wodId,
        })
        .subscribe({
          next: (value: apiWodOutputModel) => {
            this.wod.set(value);
            this.wodForm.patchValue({
              wod_name: value.wod_name,
              wod_number: value.wod_number,
              wod_score_type: value.wod_score_type,
              wod_description: value.wod_description,
            });
          },
          error: (error: any) => {
            console.error('Error getting WOD', error);
            this.wod.set(null);
            this.toastService.showError(
              'Failed to load WOD data: ' + error.statusText
            );
          },
          complete: () => this.dataLoaded.set(true),
        });
    } else {
      // Creating new WOD
      this.isEditing.set(false);
      this.dataLoaded.set(true);
    }
  }

  isFormValid(): boolean {
    return this.wodForm.valid && this.wodForm.dirty;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.wodForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return 'This field is required';
      }
      if (field.errors?.['min']) {
        return 'Value must be greater than 0';
      }
    }
    return null;
  }

  onSubmit() {
    if (!this.isFormValid()) {
      this.toastService.showError('Please fill in all required fields');
      return;
    }

    const formValue = this.wodForm.value;

    const formData: apiWodCreateModel = {
      wod_name: formValue.wod_name!,
      wod_number: formValue.wod_number!,
      wod_score_type: formValue.wod_score_type!,
      wod_description: formValue.wod_description,
      event_short_name: this.eventShortName(),
    };

    if (this.isEditing()) {
      // Update existing WOD
      const updateData: apiWodUpdateModel = formData;
      this.apiWods
        .updateWodWodsWodIdPatch({
          wod_id: this.wod()!.id,
          body: updateData,
        })
        .subscribe({
          next: () => {
            this.router.navigate(['admin', 'wods'], { replaceUrl: true });
            this.toastService.showSuccess('WOD updated successfully');
          },
          error: (error: any) => {
            console.error('Error updating WOD:', error);
            this.toastService.showError(
              'Failed to update WOD: ' + error.statusText
            );
          },
        });
    } else {
      // Create new WOD
      this.apiWods
        .createWodWodsPost({
          body: formData,
        })
        .subscribe({
          next: () => {
            this.router.navigate(['admin', 'wods'], { replaceUrl: true });
            this.toastService.showSuccess('WOD created successfully');
          },
          error: (error: any) => {
            console.error('Error creating WOD:', error);
            this.toastService.showError(
              'Failed to create WOD: ' + error.statusText
            );
          },
        });
    }
  }

  onCancel() {
    this.location.back();
  }

  onDelete() {
    const wodId = this.route.snapshot.paramMap.get('wodId');
    if (wodId) {
      this.apiWods.deleteWodWodsWodIdDelete({ wod_id: wodId }).subscribe({
        next: () => {
          this.router.navigate(['admin', 'wods'], { replaceUrl: true });
          this.toastService.showSuccess('WOD deleted successfully');
        },
        error: (error: any) => {
          console.error('Error deleting WOD:', error);
          this.toastService.showError(
            'Failed to delete WOD: ' + error.statusText
          );
        },
      });
    }
  }
}
