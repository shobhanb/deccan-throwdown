import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonToggle,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeOutline, notificationsOutline } from 'ionicons/icons';
import { PushNotificationService } from 'src/app/services/push-notification.service';

@Component({
  selector: 'app-event-updates-opt-in',
  templateUrl: './event-updates-opt-in.component.html',
  styleUrls: ['./event-updates-opt-in.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonButton, IonIcon, IonItem, IonLabel, IonList, IonToggle],
})
export class EventUpdatesOptInComponent {
  private pushNotificationService = inject(PushNotificationService);

  /** `banner` for Home; `menu` for side menu row; `inline` for page toggle list. */
  variant = input<'banner' | 'inline' | 'menu'>('inline');

  subscribed = this.pushNotificationService.subscribed;
  enabling = signal(false);

  constructor() {
    addIcons({ closeOutline, notificationsOutline });
  }

  dismissBanner(): void {
    this.pushNotificationService.dismissEventUpdatesPrompt();
  }

  async enableFromBanner(): Promise<void> {
    if (this.enabling()) {
      return;
    }
    this.enabling.set(true);
    try {
      await this.pushNotificationService.setSubscribed(true);
    } finally {
      this.enabling.set(false);
    }
  }

  async onPushToggle(event: CustomEvent): Promise<void> {
    const enabled = event.detail.checked;
    await this.pushNotificationService.setSubscribed(enabled);
    if (!enabled) {
      (event.target as HTMLIonToggleElement).checked = false;
    } else if (!this.pushNotificationService.subscribed()) {
      (event.target as HTMLIonToggleElement).checked = false;
    }
  }
}
