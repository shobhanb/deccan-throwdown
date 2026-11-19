import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { IonContent } from '@ionic/angular';
import { catchError, forkJoin, interval, of, startWith } from 'rxjs';
import { apiTeamsOutputDetailModel } from 'src/app/api/models';
import {
  appConfig,
  defaultConfig,
  galleryEventShortNames,
  WodConfig,
} from 'src/app/config/config';
import { EventTeamsDataService } from 'src/app/services/event-teams-data.service';
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
  buildIdleSlides,
  buildLiveSlides,
  buildPreviewSlides,
  buildRowsForSlide,
  DisplayRow,
  DisplaySlide,
  findActiveWod,
} from './display-logic';

const POLL_MS = 15_000;
const ROTATE_MS = 12_000;

interface ImageListData {
  images: Array<{ path: string }>;
}

@Component({
  selector: 'app-display',
  templateUrl: './display.page.html',
  styleUrls: ['./display.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonContent, DatePipe],
})
export class DisplayPage implements OnInit {
  private eventTeamsData = inject(EventTeamsDataService);
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  private readonly eventShortName = defaultConfig;
  private readonly config = appConfig[this.eventShortName];

  eventName = this.config?.eventName ?? 'Deccan Throwdown';
  leaderboardEnabled = this.config?.leaderboardEnabled ?? false;
  categories = this.config?.categories ?? [];
  wods: WodConfig[] = this.config?.wods ?? [];
  /** Slide duration — drives the next-screen progress bar animation. */
  readonly rotateMs = ROTATE_MS;
  private wodNumbers = this.wods.map((wod) => wod.wodNumber);

  teamsData = signal<apiTeamsOutputDetailModel[]>([]);
  galleryPaths = signal<string[]>([]);
  previewEpoch = signal(0);
  dataLoaded = signal(false);
  lastUpdated = signal<Date | null>(null);
  slideIndex = signal(0);
  slideKey = signal(0);

  activeWod = computed(() =>
    findActiveWod(this.wodNumbers, this.teamsData())
  );

  isLive = computed(() => this.activeWod() != null);

  isPreviewMode = computed(() => {
    if (this.activeWod() != null) {
      return false;
    }
    const idle = buildIdleSlides(
      this.categories,
      this.wodNumbers,
      this.teamsData()
    );
    return idle.length === 0;
  });

  slides = computed((): DisplaySlide[] => {
    const active = this.activeWod();
    const teams = this.teamsData();
    if (active != null) {
      return buildLiveSlides(this.categories, active, teams);
    }
    const idle = buildIdleSlides(this.categories, this.wodNumbers, teams);
    if (idle.length > 0) {
      return idle;
    }
    // Depend on previewEpoch so wrap reshuffles gallery groups.
    void this.previewEpoch();
    return buildPreviewSlides(this.wodNumbers, this.galleryPaths());
  });

  /** Show progress when the board will advance to another slide. */
  showRotateProgress = computed(() => {
    if (this.slides().length > 1) {
      return true;
    }
    return this.isPreviewMode() && this.galleryPaths().length > 0;
  });

  currentSlide = computed((): DisplaySlide | null => {
    const list = this.slides();
    if (list.length === 0) {
      return null;
    }
    return list[this.slideIndex() % list.length] ?? null;
  });

  rows = computed((): DisplayRow[] => {
    const slide = this.currentSlide();
    if (!slide || slide.kind !== 'standings') {
      return [];
    }
    return buildRowsForSlide(this.teamsData(), slide, this.isLive());
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

  viewTitle = computed(() => {
    const slide = this.currentSlide();
    if (!slide) {
      return '';
    }
    if (slide.kind === 'gallery') {
      return 'Gallery';
    }
    if (slide.kind === 'wodInfo') {
      const wod = this.currentWod();
      return wod
        ? `WOD ${wod.wodNumber} — ${wod.wodName}`
        : `WOD ${slide.wodNumber}`;
    }
    const view = slide.view;
    if (view.kind === 'overall') {
      return 'Overall Standings';
    }
    const wod = this.wods.find((w) => w.wodNumber === view.wodNumber);
    const name = wod?.wodName ?? `WOD ${view.wodNumber}`;
    return `WOD ${view.wodNumber} — ${name}`;
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

  ngOnInit(): void {
    this.loadGalleryImages();

    if (!this.leaderboardEnabled) {
      this.dataLoaded.set(true);
      return;
    }

    interval(POLL_MS)
      .pipe(startWith(0), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pollTeams());

    // Timer drives rotation; progress bar is visual and resets via slideKey.
    interval(ROTATE_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.advanceSlide());
  }

  getTtmmComponents(row: DisplayRow): TtmmScoreboardComponentView[] {
    const slide = this.currentSlide();
    if (!row.score || !slide || slide.kind !== 'standings') {
      return [];
    }
    return ttmmScoreboardComponents(
      parseTtmmScoreDetail(row.score.score_detail),
      slide.category
    );
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

  private gallerySourceEvents(): string[] {
    const eventType = this.config?.eventType;
    const matching = galleryEventShortNames.filter(
      (name) => appConfig[name]?.eventType === eventType
    );
    return matching.length > 0 ? matching : [...galleryEventShortNames];
  }

  private loadGalleryImages(): void {
    const sources = this.gallerySourceEvents();
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
        this.galleryPaths.set(paths);
      });
  }

  private pollTeams(): void {
    this.eventTeamsData.load(
      'leaderboard',
      this.eventShortName,
      {
        onData: (data) => {
          const previousActive = this.activeWod();
          const previousPreview = this.isPreviewMode();
          const previousSlideCount = this.slides().length;
          this.teamsData.set(data);
          this.lastUpdated.set(new Date());
          this.dataLoaded.set(true);

          const nextActive = findActiveWod(this.wodNumbers, data);
          const nextIdle =
            nextActive == null
              ? buildIdleSlides(this.categories, this.wodNumbers, data)
              : [];
          const nextPreview = nextActive == null && nextIdle.length === 0;
          const nextSlides =
            nextActive != null
              ? buildLiveSlides(this.categories, nextActive, data)
              : nextIdle.length > 0
                ? nextIdle
                : buildPreviewSlides(this.wodNumbers, this.galleryPaths());

          if (
            previousActive !== nextActive ||
            previousPreview !== nextPreview ||
            previousSlideCount !== nextSlides.length
          ) {
            this.slideIndex.set(0);
            this.slideKey.update((k) => k + 1);
          } else if (
            nextSlides.length > 0 &&
            this.slideIndex() >= nextSlides.length
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

  private advanceSlide(): void {
    const count = this.slides().length;
    if (count <= 1) {
      if (this.isPreviewMode() && this.galleryPaths().length > 0) {
        this.previewEpoch.update((epoch) => epoch + 1);
        this.slideKey.update((k) => k + 1);
      }
      return;
    }
    const next = (this.slideIndex() + 1) % count;
    if (next === 0 && this.isPreviewMode()) {
      this.previewEpoch.update((epoch) => epoch + 1);
    }
    this.slideIndex.set(next);
    this.slideKey.update((k) => k + 1);
  }
}
