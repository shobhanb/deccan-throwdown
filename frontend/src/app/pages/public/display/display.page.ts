import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { IonContent } from '@ionic/angular';
import { catchError, firstValueFrom, forkJoin, interval, of, startWith } from 'rxjs';
import { apiTeamsOutputDetailModel } from 'src/app/api/models';
import {
  appConfig,
  defaultConfig,
  galleryEventShortNames,
  WodConfig,
} from 'src/app/config/config';
import { DisplayChromeService } from 'src/app/services/display-chrome.service';
import { EventTeamsDataService } from 'src/app/services/event-teams-data.service';
import { HeatsDataService } from 'src/app/services/heats-data.service';
import {
  parseTtmmScoreDetail,
  ttmmScoreboardComponents,
  TtmmScoreboardComponentView,
} from 'src/app/shared/score-detail/ttmm';
import {
  resolveStationScheme,
  stationSummaryLines,
} from 'src/app/shared/score-detail/stations';
import {
  buildFlagDrivenSlides,
  buildRowsForSlide,
  DisplayRow,
  DisplaySlide,
  shuffleArray,
} from './display-logic';
import {
  defaultHeatsDisplayConfig,
  isTtmmHeatsKey,
  normalizeHeatsDisplayConfig,
  splitHeatsColumns,
} from './heats-logic';
import {
  HeatsDisplayConfig,
  HeatsHeatView,
  HeatsKey,
  HeatsPayload,
} from './heats-types';

const POLL_MS = 15_000;

interface ImageListData {
  images: Array<{ path: string }>;
}

interface SlideIdentity {
  kind: string;
  category: string | null;
  title: string;
}

@Component({
  selector: 'app-display',
  templateUrl: './display.page.html',
  styleUrls: ['./display.page.scss', './display-views.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonContent, DatePipe],
})
export class DisplayPage implements OnInit {
  private eventTeamsData = inject(EventTeamsDataService);
  private heatsData = inject(HeatsDataService);
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  private displayChrome = inject(DisplayChromeService);
  private platformId = inject(PLATFORM_ID);

  private readonly eventShortName = defaultConfig;
  private readonly config = appConfig[this.eventShortName];
  private rotateTimer: ReturnType<typeof setInterval> | null = null;

  eventName = this.config?.eventName ?? 'Deccan Throwdown';
  leaderboardEnabled = this.config?.leaderboardEnabled ?? false;
  categories = this.config?.categories ?? [];
  wods: WodConfig[] = this.config?.wods ?? [];
  wodNumbers = this.wods.map((wod) => wod.wodNumber);

  teamsData = signal<apiTeamsOutputDetailModel[]>([]);
  heatsPayload = signal<HeatsPayload | null>(null);
  heatsDisplay = signal<HeatsDisplayConfig>(defaultHeatsDisplayConfig());
  galleryPaths = signal<string[]>([]);
  previewEpoch = signal(0);
  dataLoaded = signal(false);
  lastUpdated = signal<Date | null>(null);
  slideIndex = signal(0);
  slideKey = signal(0);

  boardConfig = computed((): HeatsDisplayConfig =>
    normalizeHeatsDisplayConfig(this.heatsDisplay())
  );

  /** Slide duration — drives the next-screen progress bar animation. */
  rotateMs = computed(() => this.boardConfig().rotateSeconds * 1000);

  rotateSeconds = computed(() => this.boardConfig().rotateSeconds);

  picsEnabled = computed(() => this.boardConfig().pics);

  slides = computed((): DisplaySlide[] => {
    // previewEpoch reshuffles gallery groups when the rotation wraps.
    void this.previewEpoch();
    return buildFlagDrivenSlides({
      categories: this.categories,
      teams: this.teamsData(),
      heatsPayload: this.heatsPayload(),
      display: this.boardConfig(),
      imagePaths: this.galleryPaths(),
    });
  });

  /** Show progress when the board will advance to another slide. */
  showRotateProgress = computed(() => this.slides().length > 1);

  currentSlide = computed((): DisplaySlide | null => {
    const list = this.slides();
    if (list.length === 0) {
      return null;
    }
    return list[this.slideIndex() % list.length] ?? null;
  });

  nextSlide = computed((): DisplaySlide | null => {
    const list = this.slides();
    if (list.length <= 1) {
      return null;
    }
    return list[(this.slideIndex() + 1) % list.length] ?? null;
  });

  /** Header chip mirrors the current slide kind. */
  modeChip = computed((): { label: string; tone: 'preview' | 'live' | 'idle' } => {
    const slide = this.currentSlide();
    if (!slide) {
      return { label: 'Waiting', tone: 'preview' };
    }
    if (slide.kind === 'gallery') {
      return { label: 'Photos', tone: 'preview' };
    }
    if (slide.kind === 'wodInfo') {
      return { label: `WOD ${slide.wodNumber}`, tone: 'live' };
    }
    if (slide.kind === 'heats') {
      return { label: `Heats ${slide.heatsKey}`, tone: 'live' };
    }
    if (slide.view.kind === 'overall') {
      return { label: 'Overall', tone: 'idle' };
    }
    return { label: `WOD ${slide.view.wodNumber}`, tone: 'idle' };
  });

  rows = computed((): DisplayRow[] => {
    const slide = this.currentSlide();
    if (!slide || slide.kind !== 'standings') {
      return [];
    }
    return buildRowsForSlide(this.teamsData(), slide, false);
  });

  currentWod = computed((): WodConfig | null => {
    const slide = this.currentSlide();
    if (!slide) {
      return null;
    }
    if (slide.kind === 'wodInfo') {
      return this.wods.find((w) => w.wodNumber === slide.wodNumber) ?? null;
    }
    if (slide.kind === 'standings') {
      const view = slide.view;
      if (view.kind === 'wod') {
        return this.wods.find((w) => w.wodNumber === view.wodNumber) ?? null;
      }
    }
    return null;
  });

  /** Clear on-screen identity for the current slide. */
  slideIdentity = computed((): SlideIdentity =>
    this.identityForSlide(this.currentSlide())
  );

  /** Short label for the upcoming slide (shown when rotation has a next). */
  upNextLabel = computed((): string | null => {
    const next = this.nextSlide();
    if (!next) {
      return null;
    }
    if (next.kind === 'gallery') {
      return 'Pics';
    }
    if (next.kind === 'wodInfo') {
      return `WOD${next.wodNumber} description`;
    }
    if (next.kind === 'heats') {
      return `WOD${next.wodNumber} heats`;
    }
    if (next.view.kind === 'overall') {
      return 'Overall Leaderboard';
    }
    return `WOD${next.view.wodNumber} Leaderboard`;
  });

  isOverallView = computed(() => {
    const slide = this.currentSlide();
    return (
      !!slide &&
      slide.kind === 'standings' &&
      slide.view.kind === 'overall'
    );
  });

  isTtmmView = computed(() => {
    const slide = this.currentSlide();
    if (!slide || slide.kind !== 'standings') {
      return false;
    }
    const view = slide.view;
    if (view.kind !== 'wod') {
      return false;
    }
    return (
      this.wods.find((w) => w.wodNumber === view.wodNumber)?.scoreDetailType ===
      'ttmm'
    );
  });

  isStationsView = computed(() => {
    const slide = this.currentSlide();
    if (!slide || slide.kind !== 'standings') {
      return false;
    }
    const view = slide.view;
    if (view.kind !== 'wod') {
      return false;
    }
    return (
      this.wods.find((w) => w.wodNumber === view.wodNumber)?.scoreDetailType ===
      'stations'
    );
  });

  constructor() {
    // Cover first paint before Ionic fires ionViewWillEnter.
    this.displayChrome.fullscreen.set(true);
    // Ionic keeps pages in the stack; leave hooks clear chrome (not only destroy).
    this.destroyRef.onDestroy(() => {
      this.displayChrome.fullscreen.set(false);
      this.clearRotateTimer();
    });
  }

  /** Hide app chrome while this page is the active Ionic view. */
  ionViewWillEnter(): void {
    this.displayChrome.fullscreen.set(true);
  }

  ionViewWillLeave(): void {
    this.displayChrome.fullscreen.set(false);
  }

  ngOnInit(): void {
    this.loadGalleryImages();

    interval(POLL_MS)
      .pipe(startWith(0), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pollHeats();
        if (this.leaderboardEnabled) {
          this.pollTeams();
        } else {
          this.dataLoaded.set(true);
        }
      });

    this.restartRotateTimer();
  }

  private restartRotateTimer(): void {
    this.clearRotateTimer();
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.rotateTimer = setInterval(
      () => this.advanceSlide(),
      this.rotateMs()
    );
  }

  private clearRotateTimer(): void {
    if (this.rotateTimer != null) {
      clearInterval(this.rotateTimer);
      this.rotateTimer = null;
    }
  }

  getTtmmComponents(row: DisplayRow): TtmmScoreboardComponentView[] {
    const slide = this.currentSlide();
    if (!row.score || !slide || slide.kind !== 'standings') {
      return [];
    }
    const team = this.teamsData().find((entry) => entry.id === row.teamId);
    const nameById: Record<string, string> = {};
    for (const athlete of team?.athletes ?? []) {
      nameById[athlete.id] = `${athlete.first_name} ${athlete.last_name}`;
    }
    return ttmmScoreboardComponents(
      parseTtmmScoreDetail(row.score.score_detail),
      slide.category,
      nameById
    );
  }

  isTtmmHeatsSlide(heatsKey: HeatsKey): boolean {
    return isTtmmHeatsKey(heatsKey);
  }

  heatsColumns(heats: HeatsHeatView[]): HeatsHeatView[][] {
    const [left, right] = splitHeatsColumns(heats);
    return right.length > 0 ? [left, right] : [left];
  }

  getStationSummary(row: DisplayRow): string[] {
    const slide = this.currentSlide();
    if (!row.score || !slide || slide.kind !== 'standings') {
      return [];
    }
    const view = slide.view;
    if (view.kind !== 'wod') {
      return [];
    }
    const wod = this.wods.find((w) => w.wodNumber === view.wodNumber);
    const scheme = resolveStationScheme(wod, slide.category);
    return stationSummaryLines(row.score.reps, scheme);
  }

  wodDescriptionForCategory(category: string): string[] {
    const wod = this.currentWod();
    if (!wod) {
      return [];
    }
    return (
      wod.categoryWodDescription?.[category] ?? wod.wodDescription ?? []
    );
  }

  private loadGalleryImages(): void {
    const sources = [...galleryEventShortNames];
    if (sources.length === 0) {
      return;
    }

    forkJoin(
      sources.map((shortName) =>
        this.http
          .get<ImageListData>(`assets/image-list-${shortName}.json`)
          .pipe(catchError(() => of({ images: [] as Array<{ path: string }> })))
      )
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lists) => {
        const paths = lists.flatMap((list) =>
          (list.images ?? []).map((image) => image.path)
        );
        // Mix teams + pairs (and any other past galleries) into one random pool.
        this.galleryPaths.set(shuffleArray(paths));
      });
  }

  private async pollHeats(): Promise<void> {
    try {
      const doc = await firstValueFrom(
        this.heatsData.getHeats(this.eventShortName).pipe(catchError(() => of(null)))
      );
      if (!doc?.payload) {
        return;
      }
      const previousCount = this.slides().length;
      const previousRotate = this.rotateSeconds();
      this.heatsPayload.set(doc.payload);
      this.heatsDisplay.set(normalizeHeatsDisplayConfig(doc.display));
      const nextCount = this.slides().length;
      const nextRotate = this.rotateSeconds();
      if (previousRotate !== nextRotate) {
        this.restartRotateTimer();
        this.slideKey.update((k) => k + 1);
      }
      if (previousCount !== nextCount) {
        this.slideIndex.set(0);
        this.slideKey.update((k) => k + 1);
      } else if (nextCount > 0 && this.slideIndex() >= nextCount) {
        this.slideIndex.set(0);
        this.slideKey.update((k) => k + 1);
      }
    } catch {
      /* keep last known heats payload */
    }
  }

  private pollTeams(): void {
    this.eventTeamsData.load(
      'leaderboard',
      this.eventShortName,
      {
        onData: (data) => {
          const previousSlideCount = this.slides().length;
          this.teamsData.set(data);
          this.lastUpdated.set(new Date());
          this.dataLoaded.set(true);

          const nextSlideCount = this.slides().length;
          if (previousSlideCount !== nextSlideCount) {
            this.slideIndex.set(0);
            this.slideKey.update((k) => k + 1);
          } else if (
            nextSlideCount > 0 &&
            this.slideIndex() >= nextSlideCount
          ) {
            this.slideIndex.set(0);
            this.slideKey.update((k) => k + 1);
          }
        },
        onError: () => {
          this.dataLoaded.set(true);
        },
      },
      { forceNetwork: true }
    );
  }

  private identityForSlide(slide: DisplaySlide | null): SlideIdentity {
    if (!slide) {
      return { kind: '', category: null, title: '' };
    }
    if (slide.kind === 'gallery') {
      return { kind: 'Photos', category: null, title: 'Event gallery' };
    }
    if (slide.kind === 'wodInfo') {
      const wod = this.wods.find((w) => w.wodNumber === slide.wodNumber);
      const title = wod
        ? `WOD ${wod.wodNumber} — ${wod.wodName}`
        : `WOD ${slide.wodNumber}`;
      return {
        kind: 'Workout standards',
        category: null,
        title,
      };
    }
    if (slide.kind === 'heats') {
      const divisions = [
        ...new Set(
          slide.sections.map((section) => section.division).filter(Boolean)
        ),
      ];
      return {
        kind: 'Heats',
        category: divisions.length === 1 ? divisions[0] : null,
        title: `WOD ${slide.wodNumber} — ${slide.wodLabel}`,
      };
    }
    const view = slide.view;
    if (view.kind === 'overall') {
      return {
        kind: 'Leaderboard',
        category: slide.category,
        title: 'Overall standings',
      };
    }
    const wod = this.wods.find((w) => w.wodNumber === view.wodNumber);
    const name = wod?.wodName ?? `WOD ${view.wodNumber}`;
    return {
      kind: 'Leaderboard',
      category: slide.category,
      title: `WOD ${view.wodNumber} — ${name}`,
    };
  }

  private advanceSlide(): void {
    const list = this.slides();
    const count = list.length;
    const hasPics = this.picsEnabled() && this.galleryPaths().length > 0;
    if (count <= 1) {
      if (hasPics) {
        this.previewEpoch.update((epoch) => epoch + 1);
        this.slideKey.update((k) => k + 1);
      }
      return;
    }
    const next = (this.slideIndex() + 1) % count;
    const landingOnGallery = list[next]?.kind === 'gallery';
    // Reshuffle before switching so Pics never flashes the previous set.
    if (hasPics && landingOnGallery) {
      this.previewEpoch.update((epoch) => epoch + 1);
    }
    this.slideIndex.set(next);
    this.slideKey.update((k) => k + 1);
  }
}
