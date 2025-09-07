import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonText,
  IonSkeletonText,
  IonCardSubtitle,
  IonMenuButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  create,
  trash,
  locationOutline,
  calendarOutline,
  timeOutline,
  addOutline,
  codeOutline,
  peopleOutline,
} from 'ionicons/icons';
import { apiEventsService } from 'src/app/api/services';
import { apiEventsModel } from 'src/app/api/models';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { ToastService } from 'src/app/services/toast.service';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.page.html',
  styleUrls: ['./events.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonRefresher,
    IonRefresherContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonText,
    IonButton,
    IonSkeletonText,
    CommonModule,
    FormsModule,
    ToolbarButtonsComponent,
    IonMenuButton,
  ],
})
export class EventsPage implements OnInit {
  private apiEvents = inject(apiEventsService);
  private alertService = inject(AlertService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  events = signal<apiEventsModel[]>([]);
  dataLoaded = signal(false);

  headerContent = computed(() => {
    if (this.events().length > 0) {
      return 'Click on an event to view details or use the + button to create a new event.';
    } else {
      return 'No events found. Click the + button to create your first event.';
    }
  });

  constructor() {
    addIcons({
      peopleOutline,
      codeOutline,
      timeOutline,
      locationOutline,
      calendarOutline,
      addOutline,
      add,
      create,
      trash,
    });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.getData();
  }

  getData() {
    this.dataLoaded.set(false);
    this.apiEvents.getEventsEventsGet().subscribe({
      next: (events) => {
        this.events.set(
          events.sort(
            (a, b) =>
              new Date(b.start_date).getTime() -
              new Date(a.start_date).getTime()
          )
        );
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.toastService.showError('Error loading events');
      },
      complete: () => {
        this.dataLoaded.set(true);
      },
    });
  }

  handleRefresh(event: CustomEvent) {
    this.getData();
    (event.target as HTMLIonRefresherElement).complete();
  }

  createEvent() {
    this.router.navigate(['admin', 'events', 'create-event']);
  }

  editEvent(event: apiEventsModel) {
    this.router.navigate(['admin', 'events', event.event_short_name]);
  }

  async deleteEvent(event: apiEventsModel) {
    const confirmation = await this.alertService.showAlert(
      `Delete event "${event.event_name}"?`
    );
    if (confirmation.role === 'confirm') {
      this.apiEvents
        .deleteEventEventsEventShortNameDelete({
          event_short_name: event.event_short_name,
        })
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Event deleted successfully');
            this.getData();
          },
          error: (error) => {
            this.toastService.showError('Error deleting event');
            console.error('Error deleting event:', error);
          },
        });
    }
  }

  formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  }
}
