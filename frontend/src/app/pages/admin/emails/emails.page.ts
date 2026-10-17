import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonList,
  IonMenuButton,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { copyOutline, mailOutline } from 'ionicons/icons';
import { apiTeamsService } from 'src/app/api/services';
import { apiErrorStatusText } from 'src/app/services/api-call.util';
import { AppConfigService } from 'src/app/services/app-config-service';
import { ToastService } from 'src/app/services/toast.service';
import { AdminPageHeaderComponent } from 'src/app/shared/admin-page-header/admin-page-header.component';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';

/** Most mail apps reject mailto links longer than this. */
const MAILTO_URL_LIMIT = 1800;

/** Split `Name <email>, Name <email>` without breaking commas inside a quoted name. */
function splitMailboxes(value: string): string[] {
  return value
    .split(/>(?:,\s*|$)/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => `${part}>`);
}

@Component({
  selector: 'app-emails',
  templateUrl: './emails.page.html',
  styleUrls: ['./emails.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    AdminPageHeaderComponent,
    ToolbarButtonsComponent,
    IonHeader,
    IonToolbar,
    IonMenuButton,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonItem,
    IonTextarea,
    IonButton,
    IonIcon,
    IonSkeletonText,
  ],
})
export class EmailsPage {
  private apiTeams = inject(apiTeamsService);
  private appConfigService = inject(AppConfigService);
  private toastService = inject(ToastService);

  eventName = this.appConfigService.eventName;
  private eventShortName = this.appConfigService.eventShortName;

  dataLoaded = signal(false);
  /** `Name <email>` recipients, ready to paste into To or Bcc. */
  recipients = signal<string[]>([]);

  emailText = computed(() => this.recipients().join(', '));
  mailtoUrl = computed(() => {
    const list = this.recipients();
    if (list.length === 0) {
      return null;
    }
    const url = `mailto:?bcc=${list.map((recipient) => encodeURIComponent(recipient)).join(',')}`;
    return url.length <= MAILTO_URL_LIMIT ? url : null;
  });

  constructor() {
    addIcons({ copyOutline, mailOutline });
  }

  ionViewWillEnter() {
    void this.getData();
  }

  handleRefresh(event: CustomEvent) {
    this.dataLoaded.set(false);
    void this.getData().finally(() => {
      (event.target as HTMLIonRefresherElement).complete();
    });
  }

  async copyEmails() {
    const text = this.emailText();
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      this.toastService.showSuccess('Email addresses copied');
    } catch (err: unknown) {
      console.error(err);
      this.toastService.showError('Could not copy the addresses');
    }
  }

  openMailClient() {
    const url = this.mailtoUrl();
    if (!url) {
      return;
    }
    window.location.href = url;
  }

  private async getData() {
    try {
      const data = await this.apiTeams.getTeamEmailsTeamsEmailsGet({
        event_short_name: this.eventShortName,
      });
      this.recipients.set(splitMailboxes(data));
    } catch (err: unknown) {
      console.error(err);
      this.toastService.showError(
        `Error fetching emails: ${apiErrorStatusText(err)}`
      );
    } finally {
      this.dataLoaded.set(true);
    }
  }
}
