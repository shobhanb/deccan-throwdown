import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonNote,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular';
import { apiTeamsService } from 'src/app/api/services';
import { apiRegistrationPricingModel } from 'src/app/api/models';
import { firstValueFrom } from 'rxjs';
import { apiErrorStatusText, fromApi } from 'src/app/services/api-call.util';
import { AppConfigService } from 'src/app/services/app-config-service';
import { ToastService } from 'src/app/services/toast.service';
import { AdminPageHeaderComponent } from 'src/app/shared/admin-page-header/admin-page-header.component';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-admin-registration',
  templateUrl: './registration.page.html',
  styleUrls: ['./registration.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    AdminPageHeaderComponent,
    ToolbarButtonsComponent,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonMenuButton,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonToggle,
  ],
})
export class RegistrationPage {
  private apiTeams = inject(apiTeamsService);
  private appConfigService = inject(AppConfigService);
  private toastService = inject(ToastService);

  eventName = this.appConfigService.eventName;
  earlyBirdDeadline =
    this.appConfigService.registrationPricing?.earlyBirdDeadline;

  pricing = signal<apiRegistrationPricingModel | null>(null);
  loading = signal(true);
  saving = signal(false);

  useEarlyBird = computed(() => this.pricing()?.use_early_bird_fee ?? false);

  constructor() {
    this.loadPricing();
  }

  async loadPricing(): Promise<void> {
    this.loading.set(true);
    try {
      const pricing = await firstValueFrom(
        fromApi(this.apiTeams.getRegistrationPricingTeamsRegistrationPricingGet())
      );
      this.pricing.set(pricing);
    } catch (err) {
      this.toastService.showError(
        `Could not load registration pricing: ${apiErrorStatusText(err)}`
      );
    } finally {
      this.loading.set(false);
    }
  }

  async onEarlyBirdToggle(event: CustomEvent): Promise<void> {
    const checked = (event.target as HTMLIonToggleElement).checked;
    const previous = this.pricing();
    if (!previous || checked === previous.use_early_bird_fee) {
      return;
    }

    this.saving.set(true);
    try {
      const pricing = await firstValueFrom(
        fromApi(
          this.apiTeams.updateRegistrationPricingTeamsRegistrationPricingPatch({
            body: { use_early_bird_fee: checked },
          })
        )
      );
      this.pricing.set(pricing);
      this.toastService.showSuccess(
        checked
          ? 'Early bird pricing is now active'
          : 'Regular pricing is now active'
      );
    } catch (err) {
      (event.target as HTMLIonToggleElement).checked =
        previous.use_early_bird_fee;
      this.toastService.showError(
        `Could not update pricing: ${apiErrorStatusText(err)}`
      );
    } finally {
      this.saving.set(false);
    }
  }
}
