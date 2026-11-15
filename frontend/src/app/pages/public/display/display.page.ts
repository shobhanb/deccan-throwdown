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
import { IonContent } from '@ionic/angular';
import { interval, startWith } from 'rxjs';
import { apiTeamsOutputDetailModel } from 'src/app/api/models';
import { appConfig, defaultConfig, WodConfig } from 'src/app/config/config';
import { EventTeamsDataService } from 'src/app/services/event-teams-data.service';
import {
  parseTtmmScoreDetail,
  ttmmScoreboardComponents,
  TtmmScoreboardComponentView,
} from 'src/app/shared/score-detail/ttmm';
import {
  buildIdleSlides,
  buildLiveSlides,
  buildRowsForSlide,
  DisplayRow,
  DisplaySlide,
  findActiveWod,
} from './display-logic';

const POLL_MS = 15_000;
const ROTATE_MS = 12_000;

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
  private destroyRef = inject(DestroyRef);

  private readonly eventShortName = defaultConfig;
  private readonly config = appConfig[this.eventShortName];

  eventName = this.config?.eventName ?? 'Deccan Throwdown';
  leaderboardEnabled = this.config?.leaderboardEnabled ?? false;
  categories = this.config?.categories ?? [];
  wods: WodConfig[] = this.config?.wods ?? [];
  private wodNumbers = this.wods.map((wod) => wod.wodNumber);

  teamsData = signal<apiTeamsOutputDetailModel[]>([]);
  dataLoaded = signal(false);
  lastUpdated = signal<Date | null>(null);
  slideIndex = signal(0);
  slideKey = signal(0);

  activeWod = computed(() =>
    findActiveWod(this.wodNumbers, this.teamsData())
  );

  isLive = computed(() => this.activeWod() != null);

  slides = computed((): DisplaySlide[] => {
    const active = this.activeWod();
    const teams = this.teamsData();
    if (active != null) {
      return buildLiveSlides(this.categories, active, teams);
    }
    return buildIdleSlides(this.categories, this.wodNumbers, teams);
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
    if (!slide) {
      return [];
    }
    return buildRowsForSlide(this.teamsData(), slide, this.isLive());
  });

  viewTitle = computed(() => {
    const slide = this.currentSlide();
    if (!slide) {
      return '';
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
    const view = slide?.view;
    if (!view || view.kind !== 'wod') {
      return false;
    }
    return (
      this.wods.find((w) => w.wodNumber === view.wodNumber)?.scoreDetailType ===
      'ttmm'
    );
  });

  ngOnInit(): void {
    if (!this.leaderboardEnabled) {
      this.dataLoaded.set(true);
      return;
    }

    interval(POLL_MS)
      .pipe(startWith(0), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pollTeams());

    interval(ROTATE_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.advanceSlide());
  }

  getTtmmComponents(row: DisplayRow): TtmmScoreboardComponentView[] {
    if (!row.score || !this.currentSlide()) {
      return [];
    }
    return ttmmScoreboardComponents(
      parseTtmmScoreDetail(row.score.score_detail),
      this.currentSlide()!.category
    );
  }

  private pollTeams(): void {
    this.eventTeamsData.load(
      'leaderboard',
      this.eventShortName,
      {
        onData: (data) => {
          const previousActive = this.activeWod();
          const previousSlideCount = this.slides().length;
          this.teamsData.set(data);
          this.lastUpdated.set(new Date());
          this.dataLoaded.set(true);

          const nextActive = findActiveWod(this.wodNumbers, data);
          const nextSlides =
            nextActive != null
              ? buildLiveSlides(this.categories, nextActive, data)
              : buildIdleSlides(this.categories, this.wodNumbers, data);

          // Reset rotation when mode or slide set changes materially.
          if (
            previousActive !== nextActive ||
            previousSlideCount !== nextSlides.length
          ) {
            this.slideIndex.set(0);
            this.slideKey.update((k) => k + 1);
          } else if (this.slideIndex() >= nextSlides.length) {
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
      return;
    }
    this.slideIndex.update((i) => (i + 1) % count);
    this.slideKey.update((k) => k + 1);
  }
}
