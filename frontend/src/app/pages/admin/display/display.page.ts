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
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenuButton,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { defaultConfig } from 'src/app/config/config';
import {
  clampRotateSeconds,
  defaultHeatsDisplayConfig,
  mergeWodBlocks,
  normalizeHeatsDisplayConfig,
  normalizeHeatsPayload,
  partialForEditor,
  scheduleForEditor,
} from 'src/app/pages/public/display/heats-logic';
import {
  HeatsDisplayConfig,
  HeatsDocument,
  HeatsPartialPayload,
  HeatsPayload,
} from 'src/app/pages/public/display/heats-types';
import { apiErrorStatusText } from 'src/app/services/api-call.util';
import { AppConfigService } from 'src/app/services/app-config-service';
import { HeatsDataService } from 'src/app/services/heats-data.service';
import { ToastService } from 'src/app/services/toast.service';
import { AdminPageHeaderComponent } from 'src/app/shared/admin-page-header/admin-page-header.component';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';

type DisplayToggleKey = keyof Omit<HeatsDisplayConfig, 'rotateSeconds'>;
type EditorScope = 'full' | 1 | 2 | 3 | 4 | 5;

interface DisplayToggleGroup {
  title: string;
  toggles: Array<{ key: DisplayToggleKey; label: string }>;
}

const DISPLAY_TOGGLE_GROUPS: DisplayToggleGroup[] = [
  {
    title: 'Pics',
    toggles: [{ key: 'pics', label: 'Pics' }],
  },
  {
    title: 'WOD description',
    toggles: [
      { key: 'wodDesc1', label: 'WOD 1' },
      { key: 'wodDesc2', label: 'WOD 2' },
      { key: 'wodDesc3', label: 'WOD 3' },
      { key: 'wodDesc4', label: 'WOD 4' },
      { key: 'wodDesc5', label: 'WOD 5' },
    ],
  },
  {
    title: 'Heats',
    toggles: [
      { key: 'heatsWod1', label: 'WOD 1' },
      { key: 'heatsWod2', label: 'WOD 2' },
      { key: 'heatsWod3', label: 'WOD 3' },
      { key: 'heatsWod4Ttmm', label: 'WOD 4 — TTMM' },
      { key: 'heatsWod4Rope', label: 'WOD 4 — Rope' },
      { key: 'heatsWod4Hold', label: 'WOD 4 — Hold' },
      { key: 'heatsWod5', label: 'WOD 5' },
      { key: 'showJudges', label: 'Show judges' },
    ],
  },
  {
    title: 'Leaderboard',
    toggles: [
      { key: 'leaderboardWod1', label: 'WOD 1' },
      { key: 'leaderboardWod2', label: 'WOD 2' },
      { key: 'leaderboardWod3', label: 'WOD 3' },
      { key: 'leaderboardWod4', label: 'WOD 4' },
      { key: 'leaderboardWod5', label: 'WOD 5' },
      { key: 'leaderboardOverall', label: 'Overall' },
    ],
  },
];

const EDITOR_SCOPE_OPTIONS: Array<{ value: EditorScope; label: string }> = [
  { value: 'full', label: 'Full schedule' },
  { value: 1, label: 'WOD 1 only' },
  { value: 2, label: 'WOD 2 only' },
  { value: 3, label: 'WOD 3 only' },
  { value: 4, label: 'WOD 4 only' },
  { value: 5, label: 'WOD 5 only' },
];

@Component({
  selector: 'app-admin-display',
  templateUrl: './display.page.html',
  styleUrls: ['./display.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormsModule,
    AdminPageHeaderComponent,
    ToolbarButtonsComponent,
    IonHeader,
    IonToolbar,
    IonMenuButton,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonTextarea,
    IonButton,
    IonToggle,
    IonInput,
    IonSelect,
    IonSelectOption,
  ],
})
export class AdminDisplayPage {
  private heatsData = inject(HeatsDataService);
  private appConfigService = inject(AppConfigService);
  private toastService = inject(ToastService);

  eventName = this.appConfigService.eventName;
  private readonly eventShortName = defaultConfig;

  loading = signal(true);
  savingDisplay = signal(false);
  savingJson = signal(false);
  jsonText = signal('');
  editorScope = signal<EditorScope>('full');
  displayConfig = signal<HeatsDisplayConfig>(defaultHeatsDisplayConfig());
  /** Last saved/loaded full schedule — used when saving display or merging partials. */
  private committedPayload = signal<HeatsPayload>({ blocks: [] });
  updatedAt = signal<string | null>(null);

  displayToggleGroups = DISPLAY_TOGGLE_GROUPS;
  editorScopeOptions = EDITOR_SCOPE_OPTIONS;

  rotateSecondsValue = computed(() => String(this.displayConfig().rotateSeconds));
  busy = computed(() => this.savingDisplay() || this.savingJson());
  isPartialScope = computed(() => this.editorScope() !== 'full');
  editorScopeLabel = computed(() => {
    const scope = this.editorScope();
    return scope === 'full' ? 'full schedule' : `WOD ${scope}`;
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
      this.applyDocumentToForm(doc);
    } catch (err) {
      this.toastService.showError(
        `Could not load heats: ${apiErrorStatusText(err)}`
      );
    } finally {
      this.loading.set(false);
    }
  }

  onJsonInput(event: CustomEvent): void {
    const value = (event.target as HTMLIonTextareaElement).value ?? '';
    this.jsonText.set(typeof value === 'string' ? value : String(value));
  }

  async copyJson(): Promise<void> {
    const text = this.jsonText();
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      this.toastService.showSuccess('JSON copied');
    } catch {
      this.toastService.showError('Could not copy JSON');
    }
  }

  async pasteJson(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      this.jsonText.set(text);
      this.toastService.showSuccess('JSON pasted');
    } catch {
      this.toastService.showError('Could not paste from clipboard');
    }
  }

  onEditorScopeChange(event: CustomEvent): void {
    const raw = (event.detail as { value?: EditorScope | string }).value;
    let next: EditorScope = 'full';
    if (raw === 'full') {
      next = 'full';
    } else {
      const n = Number(raw);
      if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) {
        next = n;
      }
    }
    this.editorScope.set(next);
    this.refreshJsonFromCommitted();
  }

  onDisplayToggle(key: DisplayToggleKey, event: CustomEvent): void {
    const checked = !!(event.detail as { checked?: boolean }).checked;
    this.displayConfig.update((current) => ({ ...current, [key]: checked }));
  }

  onRotateSecondsChange(event: CustomEvent): void {
    const raw = Number((event.detail as { value?: string | number }).value);
    this.displayConfig.update((current) => ({
      ...current,
      rotateSeconds: clampRotateSeconds(raw),
    }));
  }

  async saveDisplay(): Promise<void> {
    this.savingDisplay.set(true);
    try {
      const doc = await firstValueFrom(
        this.heatsData.putHeats(
          this.eventShortName,
          this.committedPayload(),
          this.displayConfig()
        )
      );
      this.applyDisplayFromDocument(doc);
      this.toastService.showSuccess('Display settings saved');
    } catch (err) {
      this.toastService.showError(
        `Could not save display settings: ${apiErrorStatusText(err)}`
      );
    } finally {
      this.savingDisplay.set(false);
    }
  }

  async saveJson(): Promise<void> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(this.jsonText());
    } catch {
      this.toastService.showError('Heats JSON is not valid');
      return;
    }

    const scope = this.editorScope();
    let schedulePayload: HeatsPayload;

    if (scope === 'full') {
      const full = parsed as HeatsPayload;
      if (!full || typeof full !== 'object' || !Array.isArray(full.blocks)) {
        this.toastService.showError('Full payload must include a blocks array');
        return;
      }
      schedulePayload = scheduleForEditor(full);
    } else {
      const partial = parsed as HeatsPartialPayload;
      if (!partial || typeof partial !== 'object' || !Array.isArray(partial.blocks)) {
        this.toastService.showError('Partial payload must include a blocks array');
        return;
      }
      const wodNumber = Number(partial.wodNumber ?? scope);
      if (wodNumber !== scope) {
        this.toastService.showError(
          `Partial JSON wodNumber must be ${scope} (got ${partial.wodNumber})`
        );
        return;
      }
      for (const block of partial.blocks) {
        if (block.wodNumber != null && Number(block.wodNumber) !== scope) {
          this.toastService.showError(
            `All blocks in this partial must be WOD ${scope}`
          );
          return;
        }
      }
      schedulePayload = mergeWodBlocks(
        this.committedPayload(),
        scope,
        partial.blocks
      );
    }

    this.savingJson.set(true);
    try {
      const doc = await firstValueFrom(
        this.heatsData.putHeats(this.eventShortName, schedulePayload, null)
      );
      this.applyScheduleFromDocument(doc);
      this.toastService.showSuccess(
        scope === 'full'
          ? 'Full heats schedule saved'
          : `WOD ${scope} heats saved`
      );
    } catch (err) {
      this.toastService.showError(
        `Could not save heats: ${apiErrorStatusText(err)}`
      );
    } finally {
      this.savingJson.set(false);
    }
  }

  private applyDocumentToForm(doc: HeatsDocument): void {
    this.applyDisplayFromDocument(doc);
    this.applyScheduleFromDocument(doc);
  }

  private applyDisplayFromDocument(doc: HeatsDocument): void {
    this.displayConfig.set(normalizeHeatsDisplayConfig(doc.display));
    this.updatedAt.set(doc.updated_at ?? null);
  }

  private applyScheduleFromDocument(doc: HeatsDocument): void {
    const schedule = scheduleForEditor(doc.payload);
    this.committedPayload.set(schedule);
    this.refreshJsonFromCommitted();
    this.updatedAt.set(doc.updated_at ?? null);
  }

  private refreshJsonFromCommitted(): void {
    const schedule = normalizeHeatsPayload(this.committedPayload());
    const scope = this.editorScope();
    if (scope === 'full') {
      this.jsonText.set(JSON.stringify(schedule, null, 2));
      return;
    }
    this.jsonText.set(
      JSON.stringify(partialForEditor(schedule, scope), null, 2)
    );
  }
}
