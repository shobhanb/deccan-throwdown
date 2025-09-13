import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  IonBackButton,
  IonButtons,
  IonNote,
  IonMenuButton,
} from '@ionic/angular/standalone';
import { MenuComponent } from 'src/app/shared/menu/menu.component';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { apiWodsService } from 'src/app/api/services';
import { apiWodOutputModel } from 'src/app/api/models';
import { ToastService } from 'src/app/services/toast.service';
import { AlertService } from 'src/app/services/alert.service';
import { addIcons } from 'ionicons';
import {
  addOutline,
  create,
  trash,
  barbell,
  trophy,
  barbellOutline,
  trophyOutline,
} from 'ionicons/icons';
import { appConfig } from 'src/app/config/config';

@Component({
  selector: 'app-wods',
  templateUrl: './wods.page.html',
  styleUrls: ['./wods.page.scss'],
  standalone: true,
  imports: [
    IonNote,
    IonCardSubtitle,
    IonSkeletonText,
    IonText,
    IonButton,
    IonLabel,
    IonItem,
    IonList,
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonIcon,
    IonFabButton,
    IonFab,
    IonRefresherContent,
    IonRefresher,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    MenuComponent,
    ToolbarButtonsComponent,
    IonMenuButton,
  ],
})
export class WodsPage implements OnInit {
  private apiWods = inject(apiWodsService);
  private alertService = inject(AlertService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  wods = signal<apiWodOutputModel[]>([]);
  dataLoaded = signal(false);

  eventShortName = signal<string>('');
  eventName = computed(() => appConfig[this.eventShortName()].eventName);

  headerContent = computed(() => {
    if (this.wods().length > 0) {
      return 'Click on a WOD to edit details or use the + button to create a new WOD.';
    } else {
      return 'No WODs found. Click the + button to create your first WOD.';
    }
  });

  constructor() {
    addIcons({
      barbellOutline,
      trophyOutline,
      addOutline,
      trophy,
      barbell,
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
    this.eventShortName.set(
      this.activatedRoute.snapshot.paramMap.get('eventShortName') || ''
    );
    this.apiWods
      .getWodsWodsGet({
        event_short_name: this.eventShortName(),
      })
      .subscribe({
        next: (wods) => {
          this.wods.set(wods.sort((a, b) => a.wod_number - b.wod_number));
        },
        error: (error) => {
          console.error('Error loading WODs:', error);
          this.toastService.showError(
            'Error loading WODs: ' + error.statusText
          );
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

  createWod() {
    this.router.navigate(['create-wod'], { relativeTo: this.activatedRoute });
  }

  editWod(wod: apiWodOutputModel) {
    this.router.navigate(['edit-wod', wod.id], {
      relativeTo: this.activatedRoute,
    });
  }

  async deleteWod(wod: apiWodOutputModel) {
    const confirmation = await this.alertService.showAlert(
      `Delete WOD "${wod.wod_name}"?`
    );
    if (confirmation.role === 'confirm') {
      this.apiWods
        .deleteWodWodsWodIdDelete({
          wod_id: wod.id,
        })
        .subscribe({
          next: () => {
            this.toastService.showSuccess('WOD deleted successfully');
            this.getData();
          },
          error: (error) => {
            this.toastService.showError(
              'Error deleting WOD: ' + error.statusText
            );
            console.error('Error deleting WOD:', error);
          },
        });
    }
  }

  formatWodDescription(description: string): string {
    return description.replace(/\n/g, '<br />');
  }
}
