import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import {
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenu,
  IonButton,
  IonRouterLink,
  MenuController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  barbellOutline,
  barChartOutline,
  calculatorOutline,
  cameraOutline,
  checkmarkCircleOutline,
  createOutline,
  fingerPrintOutline,
  homeOutline,
  peopleOutline,
} from 'ionicons/icons';
import { AppConfigService } from 'src/app/services/app-config-service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonButton,
    IonLabel,
    IonIcon,
    IonItem,
    IonList,
    IonContent,
    IonMenu,
    RouterLink,
    IonRouterLink,
    RouterLinkActive,
  ],
})
export class MenuComponent {
  private appConfigService = inject(AppConfigService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private menuController = inject(MenuController);

  adminUser = this.authService.adminUser;

  eventName = this.appConfigService.eventName;
  eventDates = this.appConfigService.eventDates;
  registrationStatus = this.appConfigService.registrationStatus;
  archiveEvents = this.appConfigService.archiveEvents;
  registrationOpen =
    this.appConfigService.registrationStatus === 'open';
  leaderboardEnabled = this.appConfigService.leaderboardEnabled;

  constructor() {
    addIcons({
      homeOutline,
      barChartOutline,
      peopleOutline,
      barbellOutline,
      calculatorOutline,
      checkmarkCircleOutline,
      fingerPrintOutline,
      cameraOutline,
      createOutline,
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        void this.menuController.close('main-menu');
      });
  }
}
