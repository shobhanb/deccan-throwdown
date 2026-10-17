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
  IonSearchbar,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { callOutline, logoWhatsapp } from 'ionicons/icons';
import { apiTeamsService } from 'src/app/api/services';
import { apiErrorStatusText } from 'src/app/services/api-call.util';
import { AppConfigService } from 'src/app/services/app-config-service';
import { ToastService } from 'src/app/services/toast.service';
import { AdminPageHeaderComponent } from 'src/app/shared/admin-page-header/admin-page-header.component';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';

interface AthletePhone {
  id: string;
  name: string;
  teamName: string;
  phone: string;
  telUrl: string;
  whatsappUrl: string;
}

/**
 * Digits for tel: and wa.me. Numbers without a country code are treated as India (+91).
 */
function dialDigits(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const hasPlus = trimmed.startsWith('+');
  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  if (!hasPlus) {
    if (digits.length === 10) {
      digits = `91${digits}`;
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = `91${digits.slice(1)}`;
    }
  }
  return digits.length >= 7 ? digits : null;
}

@Component({
  selector: 'app-phones',
  templateUrl: './phones.page.html',
  styleUrls: ['./phones.page.scss'],
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
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonSkeletonText,
  ],
})
export class PhonesPage {
  private apiTeams = inject(apiTeamsService);
  private appConfigService = inject(AppConfigService);
  private toastService = inject(ToastService);

  eventName = this.appConfigService.eventName;
  private eventShortName = this.appConfigService.eventShortName;

  dataLoaded = signal(false);
  query = signal('');
  athletes = signal<AthletePhone[]>([]);

  visibleAthletes = computed(() => {
    const term = this.query().trim().toLowerCase();
    const list = this.athletes();
    if (!term) {
      return list;
    }
    return list.filter((athlete) =>
      `${athlete.name} ${athlete.teamName} ${athlete.phone}`
        .toLowerCase()
        .includes(term)
    );
  });

  constructor() {
    addIcons({ callOutline, logoWhatsapp });
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

  onSearch(event: CustomEvent) {
    this.query.set(String(event.detail.value ?? ''));
  }

  private async getData() {
    try {
      const teams = await this.apiTeams.getTeamsTeamsGet({
        event_short_name: this.eventShortName,
      });
      const athletes: AthletePhone[] = [];
      for (const team of teams) {
        for (const athlete of team.athletes) {
          const phone = athlete.phone_number?.trim();
          if (!phone) {
            continue;
          }
          const digits = dialDigits(phone);
          if (!digits) {
            continue;
          }
          athletes.push({
            id: athlete.id,
            name: `${athlete.first_name} ${athlete.last_name}`.trim(),
            teamName: team.team_name,
            phone,
            telUrl: `tel:+${digits}`,
            whatsappUrl: `https://wa.me/${digits}`,
          });
        }
      }
      athletes.sort((a, b) => a.name.localeCompare(b.name));
      this.athletes.set(athletes);
    } catch (err: unknown) {
      console.error(err);
      this.toastService.showError(
        `Error fetching phone numbers: ${apiErrorStatusText(err)}`
      );
    } finally {
      this.dataLoaded.set(true);
    }
  }
}
