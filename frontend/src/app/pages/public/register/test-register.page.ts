import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  isDevMode,
  OnInit,
  signal,
} from '@angular/core';
import {
  IonButton,
  IonContent,
  IonSpinner,
  ModalController,
} from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageToolbarComponent } from 'src/app/shared/page-toolbar/page-toolbar.component';
import { AppConfigService } from 'src/app/services/app-config-service';
import { apiTeamsService } from 'src/app/api/services';
import { apiTeamRegistrationResponseModel } from 'src/app/api/models';
import { SuccessComponent } from './success/success.component';
import { createTestRegistrationPayload } from './test-registration-data';

@Component({
  selector: 'app-test-register',
  templateUrl: './test-register.page.html',
  styleUrls: ['./test-register.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [PageToolbarComponent, IonContent, IonSpinner, IonButton, RouterLink],
})
export class TestRegisterPage implements OnInit {
  private appConfigService = inject(AppConfigService);
  private apiTeams = inject(apiTeamsService);
  private modalController = inject(ModalController);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  status = signal<'blocked' | 'submitting' | 'success' | 'error'>('submitting');
  teamName = signal('');
  errorMessage = signal('');

  ngOnInit(): void {
    if (!isDevMode()) {
      this.status.set('blocked');
      return;
    }

    this.registerFakeTeam();
  }

  registerFakeTeam(): void {
    if (this.appConfigService.registrationStatus !== 'open') {
      this.status.set('error');
      this.errorMessage.set('Registration is closed for this event.');
      return;
    }

    const payload = createTestRegistrationPayload({
      eventShortName: this.appConfigService.eventShortName,
      categories: this.appConfigService.categories,
      femaleCount: this.appConfigService.femaleAthletesPerTeam,
      maleCount: this.appConfigService.maleAthletesPerTeam,
    });

    this.teamName.set(payload.team_name);
    this.status.set('submitting');

    this.apiTeams
      .registerTeamTeamsRegisterPost({ body: payload })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (response: apiTeamRegistrationResponseModel) => {
          this.status.set('success');

          const modal = await this.modalController.create({
            component: SuccessComponent,
            componentProps: {
              responseData: response,
            },
          });

          await modal.present();
        },
        error: (error) => {
          console.error('Error registering test team:', error);
          this.status.set('error');
          this.errorMessage.set(
            error?.error?.detail ||
              error?.statusText ||
              'Failed to register test team.'
          );
        },
      });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
