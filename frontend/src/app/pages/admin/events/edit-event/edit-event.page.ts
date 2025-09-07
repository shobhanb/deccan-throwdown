import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonCard,
  IonRefresher,
  IonRefresherContent,
  IonBackButton,
  IonCardHeader,
  IonCardContent,
  IonList,
  IonItem,
  IonInput,
  IonSkeletonText,
  IonNote,
  IonIcon,
} from '@ionic/angular/standalone';
import { apiEventsService } from 'src/app/api/services';
import { ToastService } from 'src/app/services/toast.service';
import { Router, ActivatedRoute } from '@angular/router';
import {
  apiEventsCreateModel,
  apiEventsModel,
  apiEventsUpdateModel,
} from 'src/app/api/models';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { HelperFunctionsService } from 'src/app/services/helper-functions.service';

@Component({
  selector: 'app-edit-event',
  templateUrl: './edit-event.page.html',
  styleUrls: ['./edit-event.page.scss'],
  standalone: true,
  imports: [
    IonInput,
    IonItem,
    IonList,
    IonCardContent,
    IonCardHeader,
    IonBackButton,
    IonRefresherContent,
    IonRefresher,
    IonCard,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSkeletonText,
    IonNote,
    CommonModule,
    FormsModule,
    ToolbarButtonsComponent,
    ReactiveFormsModule,
  ],
})
export class EditEventPage implements OnInit {
  private apiEvents = inject(apiEventsService);
  private toastService = inject(ToastService);
  public router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private helperFunctions = inject(HelperFunctionsService);

  event = signal<apiEventsModel | null>(null);
  isEditing = signal<boolean>(false);
  dataLoaded = signal<boolean>(false);

  eventForm = new FormGroup({
    event_name: new FormControl<string>('', [Validators.required]),
    event_short_name: new FormControl<string>('', [
      Validators.required,
      this.helperFunctions.noWhitespaceValidator,
    ]),
    athletes_per_team: new FormControl<number>(2, [
      Validators.required,
      Validators.min(1),
    ]),
    organization_name: new FormControl<string>('', [Validators.required]),
    city: new FormControl<string>('', [Validators.required]),
    country: new FormControl<string>('', [Validators.required]),
    year: new FormControl<number>(new Date().getFullYear(), [
      Validators.required,
    ]),
    start_date: new FormControl<string>('', [Validators.required]),
    end_date: new FormControl<string>('', [Validators.required]),
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
    const eventShortName = this.route.snapshot.paramMap.get('eventShortName');
    if (eventShortName) {
      this.isEditing.set(true);
      this.apiEvents
        .getEventInfoEventsEventShortNameGet({
          event_short_name: eventShortName,
        })
        .subscribe({
          next: (value: apiEventsModel) => {
            this.event.set(value);
            this.eventForm.patchValue({
              event_name: value.event_name,
              event_short_name: value.event_short_name,
              organization_name: value.organization_name,
              city: value.city,
              country: value.country,
              year: value.year,
              start_date: value.start_date,
              end_date: value.end_date,
            });
          },
          error: (err: any) => {
            console.error('Error getting event', err);
            this.event.set(null);
            this.toastService.showError(
              'Failed to load event data: ' + (err.message || 'Unknown error')
            );
          },
          complete: () => this.dataLoaded.set(true),
        });
    } else {
      // Creating new event
      this.isEditing.set(false);
      this.dataLoaded.set(true);
    }
  }

  isFormValid(): boolean {
    return this.eventForm.valid;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.eventForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return 'This field is required';
      }
      if (field.errors?.['whitespace']) {
        return 'Whitespace characters are not allowed';
      }
    }
    return null;
  }

  onSubmit() {
    if (!this.isFormValid()) {
      this.toastService.showError('Please fill in all required fields');
      return;
    }

    const formData = this.eventForm.value as apiEventsCreateModel;

    if (this.isEditing()) {
      // Update existing event
      const updateData: apiEventsUpdateModel = formData;
      this.apiEvents
        .updateEventEventsEventShortNamePatch({
          event_short_name: this.event()!.event_short_name,
          body: updateData,
        })
        .subscribe({
          next: () => {
            this.router.navigate(['admin', 'events'], { replaceUrl: true });
            this.toastService.showSuccess('Event updated successfully');
          },
          error: (error) => {
            console.error('Error updating event:', error);
            this.toastService.showError('Failed to update event');
          },
        });
    } else {
      // Create new event
      this.apiEvents
        .createEventEventsPost({
          body: formData,
        })
        .subscribe({
          next: () => {
            this.router.navigate(['admin', 'events'], { replaceUrl: true });
            this.toastService.showSuccess('Event created successfully');
          },
          error: (error) => {
            console.error('Error creating event:', error);
            this.toastService.showError('Failed to create event');
          },
        });
    }
  }

  onCancel() {
    this.location.back();
  }
}
