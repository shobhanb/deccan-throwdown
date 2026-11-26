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
  IonRefresher,
  IonRefresherContent,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { defaultConfig } from 'src/app/config/config';
import {
  heatsWithNumbers,
  normalizeHeatsPayload,
} from 'src/app/pages/public/display/heats-logic';
import {
  HeatsBlock,
  HeatsHeatView,
  HeatsPayload,
} from 'src/app/pages/public/display/heats-types';
import { apiErrorStatusText } from 'src/app/services/api-call.util';
import { AppConfigService } from 'src/app/services/app-config-service';
import { HeatsDataService } from 'src/app/services/heats-data.service';
import { ToastService } from 'src/app/services/toast.service';
import { AdminPageHeaderComponent } from 'src/app/shared/admin-page-header/admin-page-header.component';
import { EmptyStateComponent } from 'src/app/shared/empty-state/empty-state.component';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';

type WodOption = { value: string; label: string; wodNumber: number };

type HeatsSectionView = {
  division: string;
  wodLabel: string;
  heats: HeatsHeatView[];
};

function wodOptionsFromPayload(payload: HeatsPayload): WodOption[] {
  const options: WodOption[] = [];
  const seen = new Set<string>();
  for (const block of payload.blocks) {
    const label = (block.wodLabel ?? '').trim();
    if (!label || seen.has(label)) {
      continue;
    }
    seen.add(label);
    options.push({
      value: label,
      label,
      wodNumber: Number(block.wodNumber) || 0,
    });
  }
  return options.sort(
    (a, b) => a.wodNumber - b.wodNumber || a.label.localeCompare(b.label)
  );
}

@Component({
  selector: 'app-admin-heats',
  templateUrl: './heats.page.html',
  styleUrls: ['./heats.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    AdminPageHeaderComponent,
    EmptyStateComponent,
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
    IonSelect,
    IonSelectOption,
  ],
})
export class HeatsPage {
  private heatsData = inject(HeatsDataService);
  private appConfigService = inject(AppConfigService);
  private toastService = inject(ToastService);

  eventName = this.appConfigService.eventName;
  private readonly eventShortName = defaultConfig;

  loading = signal(true);
  payload = signal<HeatsPayload>({ blocks: [] });
  selectedWodLabel = signal<string>('');

  wodOptions = computed((): WodOption[] =>
    wodOptionsFromPayload(this.payload())
  );

  sections = computed((): HeatsSectionView[] => {
    const selected = this.selectedWodLabel();
    if (!selected) {
      return [];
    }
    return this.payload()
      .blocks.filter((block) => (block.wodLabel ?? '').trim() === selected)
      .map((block: HeatsBlock) => ({
        division: block.division,
        wodLabel: block.wodLabel,
        heats: heatsWithNumbers(block.heats),
      }));
  });

  constructor() {
    this.loadHeats();
  }

  async loadHeats(): Promise<void> {
    this.loading.set(true);
    try {
      const doc = await firstValueFrom(
        this.heatsData.getHeats(this.eventShortName)
      );
      const schedule = normalizeHeatsPayload(doc.payload);
      this.payload.set(schedule);
      this.ensureSelectedWodLabel(schedule);
    } catch (err) {
      this.toastService.showError(
        `Could not load heats: ${apiErrorStatusText(err)}`
      );
    } finally {
      this.loading.set(false);
    }
  }

  async handleRefresh(event: CustomEvent): Promise<void> {
    try {
      await this.loadHeats();
    } finally {
      (event.target as HTMLIonRefresherElement).complete();
    }
  }

  onWodChange(event: CustomEvent): void {
    const raw = (event.detail as { value?: string }).value;
    if (typeof raw === 'string') {
      this.selectedWodLabel.set(raw);
    }
  }

  private ensureSelectedWodLabel(schedule: HeatsPayload): void {
    const options = wodOptionsFromPayload(schedule);
    if (options.length === 0) {
      this.selectedWodLabel.set('');
      return;
    }
    if (!options.some((o) => o.value === this.selectedWodLabel())) {
      this.selectedWodLabel.set(options[0].value);
    }
  }
}
