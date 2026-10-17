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
  IonLabel,
  IonList,
  IonMenuButton,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSkeletonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { copyOutline, mailOutline } from 'ionicons/icons';
import { apiSentEmailDeliveryModel } from 'src/app/api/models/api-sent-email-delivery-model';
import { apiTeamsService } from 'src/app/api/services';
import { apiErrorStatusText } from 'src/app/services/api-call.util';
import { AppConfigService } from 'src/app/services/app-config-service';
import { ToastService } from 'src/app/services/toast.service';
import { AdminPageHeaderComponent } from 'src/app/shared/admin-page-header/admin-page-header.component';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';

/** Most mail apps reject mailto links longer than this. */
const MAILTO_URL_LIMIT = 1800;

type DeliveryFilter = 'undelivered' | 'pending' | 'all';

/** Split `Name <email>, Name <email>` without breaking commas inside a quoted name. */
function splitMailboxes(value: string): string[] {
  return value
    .split(/>(?:,\s*|$)/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => `${part}>`);
}

function formatSentAt(value: string): string {
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function eventLabel(lastEvent: string): string {
  return lastEvent.replaceAll('_', ' ');
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
    IonLabel,
    IonTextarea,
    IonButton,
    IonIcon,
    IonSkeletonText,
    IonSegment,
    IonSegmentButton,
  ],
})
export class EmailsPage {
  private apiTeams = inject(apiTeamsService);
  private appConfigService = inject(AppConfigService);
  private toastService = inject(ToastService);

  eventName = this.appConfigService.eventName;
  private eventShortName = this.appConfigService.eventShortName;

  recipientsLoaded = signal(false);
  /** `Name <email>` recipients, ready to paste into To or Bcc. */
  recipients = signal<string[]>([]);

  deliveriesLoaded = signal(false);
  deliveries = signal<apiSentEmailDeliveryModel[]>([]);
  hasMoreDeliveries = signal(false);
  deliveryFilter = signal<DeliveryFilter>('undelivered');

  emailText = computed(() => this.recipients().join(', '));
  mailtoUrl = computed(() => {
    const list = this.recipients();
    if (list.length === 0) {
      return null;
    }
    const url = `mailto:?bcc=${list.map((recipient) => encodeURIComponent(recipient)).join(',')}`;
    return url.length <= MAILTO_URL_LIMIT ? url : null;
  });

  undeliveredCount = computed(
    () => this.deliveries().filter((email) => email.status === 'undelivered').length
  );
  pendingCount = computed(
    () => this.deliveries().filter((email) => email.status === 'pending').length
  );
  deliveredCount = computed(
    () => this.deliveries().filter((email) => email.status === 'delivered').length
  );
  visibleDeliveries = computed(() => {
    const filter = this.deliveryFilter();
    const emails = this.deliveries();
    if (filter === 'all') {
      return emails;
    }
    return emails.filter((email) => email.status === filter);
  });

  formatSentAt = formatSentAt;
  eventLabel = eventLabel;

  constructor() {
    addIcons({ copyOutline, mailOutline });
  }

  ionViewWillEnter() {
    void this.getData();
  }

  handleRefresh(event: CustomEvent) {
    this.recipientsLoaded.set(false);
    this.deliveriesLoaded.set(false);
    void this.getData().finally(() => {
      (event.target as HTMLIonRefresherElement).complete();
    });
  }

  onDeliveryFilter(event: CustomEvent) {
    const value = event.detail.value as DeliveryFilter | undefined;
    if (value === 'undelivered' || value === 'pending' || value === 'all') {
      this.deliveryFilter.set(value);
    }
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
    await Promise.all([this.loadRecipients(), this.loadDeliveries()]);
  }

  private async loadRecipients() {
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
      this.recipientsLoaded.set(true);
    }
  }

  private async loadDeliveries() {
    try {
      const data =
        await this.apiTeams.getSentEmailDeliveriesTeamsEmailDeliveriesGet();
      this.deliveries.set(data.emails);
      this.hasMoreDeliveries.set(data.has_more);
    } catch (err: unknown) {
      console.error(err);
      this.toastService.showError(
        `Error fetching delivery status: ${apiErrorStatusText(err)}`
      );
    } finally {
      this.deliveriesLoaded.set(true);
    }
  }
}
