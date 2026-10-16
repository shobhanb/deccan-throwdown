import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import {
  IonIcon,
  IonItem,
  IonLabel,
  IonToggle,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { notificationsOutline } from 'ionicons/icons';
import { PushNotificationService } from 'src/app/services/push-notification.service';

@Component({
  selector: 'app-event-updates-opt-in',
  templateUrl: './event-updates-opt-in.component.html',
  styleUrls: ['./event-updates-opt-in.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonIcon, IonItem, IonLabel, IonToggle],
})
export class EventUpdatesOptInComponent {
  private pushNotificationService = inject(PushNotificationService);

  subscribed = this.pushNotificationService.subscribed;

  constructor() {
    addIcons({ notificationsOutline });
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
