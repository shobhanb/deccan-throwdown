import {
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  linkedSignal,
  OnInit,
  PendingTasks,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeaderComponent } from 'src/app/shared/page-header/page-header.component';
import { PageToolbarComponent } from 'src/app/shared/page-toolbar/page-toolbar.component';
import { EmptyStateComponent } from 'src/app/shared/empty-state/empty-state.component';
import { addIcons } from 'ionicons';
import { pendingUntilComplete } from 'src/app/services/ssr-pending-task.util';
import {
  appConfig,
  galleryEventShortNames,
} from 'src/app/config/config';
import {
  cameraOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
  shareOutline,
} from 'ionicons/icons';

interface GalleryHubEvent {
  shortName: string;
  eventName: string;
  eventDates: string;
  eventTypeLabel: string;
  photoCount: number;
  coverPath: string | null;
}

interface ImageData {
  filename: string;
  path: string;
  size: number;
  sizeFormatted: string;
  extension: string;
  lastModified: string;
  type: string;
  folder: string;
  eventShortName: string;
}

interface ImageListData {
  metadata: {
    eventShortName: string;
    generatedAt: string;
    totalImages: number;
    totalSize: number;
    totalSizeFormatted: string;
    directory: string;
  };
  images: ImageData[];
}

@Component({
  selector: 'app-pics',
  templateUrl: './pics.page.html',
  styleUrls: ['./pics.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    PageToolbarComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    IonSkeletonText,
    IonRefresherContent,
    IonRefresher,
    IonContent,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    RouterLink,
  ],
})
export class PicsPage implements OnInit {
  private http = inject(HttpClient);
  private pendingTasks = inject(PendingTasks);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  eventShortName = linkedSignal<string | null>(() => null);
  eventName = computed(() => {
    const shortName = this.eventShortName();
    return shortName ? appConfig[shortName]?.eventName : null;
  });
  eventDates = computed(() => {
    const shortName = this.eventShortName();
    return shortName ? appConfig[shortName]?.eventDates : null;
  });
  showEventPicker = computed(() => this.eventShortName() === null);

  hubEvents = signal<GalleryHubEvent[]>([]);
  hubLoading = signal(false);

  imageData = signal<ImageData[]>([]);
  dataLoaded = signal(false);
  selectedImageIndex = signal<number | null>(null);
  private loadedForEvent: string | null = null;

  private static readonly MIN_ZOOM = 1;
  private static readonly MAX_ZOOM = 4;
  private static readonly DOUBLE_TAP_ZOOM = 2.5;

  zoomScale = signal(1);
  zoomTranslateX = signal(0);
  zoomTranslateY = signal(0);
  zoomTransform = computed(
    () =>
      `translate3d(${this.zoomTranslateX()}px, ${this.zoomTranslateY()}px, 0) scale(${this.zoomScale()})`
  );

  private pinchStartDistance = 0;
  private pinchStartScale = 1;
  private pinchOriginX = 0;
  private pinchOriginY = 0;
  private pinchStartTranslateX = 0;
  private pinchStartTranslateY = 0;
  private isPinching = false;
  private isPanning = false;
  private didInteract = false;
  private panStartX = 0;
  private panStartY = 0;
  private panStartTranslateX = 0;
  private panStartTranslateY = 0;
  private lastTapAt = 0;
  private lastTapX = 0;
  private lastTapY = 0;

  constructor() {
    addIcons({
      cameraOutline,
      closeOutline,
      chevronBackOutline,
      chevronForwardOutline,
      shareOutline,
    });
  }

  ngOnInit() {
    this.activatedRoute.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncRouteAndLoad());
  }

  ionViewWillEnter() {
    this.syncRouteAndLoad();
  }

  handleRefresh(event: CustomEvent) {
    this.loadImages(true);
    (event.target as HTMLIonRefresherElement).complete();
  }

  openLightbox(index: number) {
    this.resetZoom();
    this.selectedImageIndex.set(index);
  }

  closeLightbox() {
    this.resetZoom();
    this.selectedImageIndex.set(null);
  }

  prevImage() {
    const current = this.selectedImageIndex();
    if (current !== null && current > 0) {
      this.resetZoom();
      this.selectedImageIndex.set(current - 1);
    }
  }

  nextImage() {
    const current = this.selectedImageIndex();
    if (current !== null && current < this.imageData().length - 1) {
      this.resetZoom();
      this.selectedImageIndex.set(current + 1);
    }
  }

  private selectedImage(): ImageData | null {
    const index = this.selectedImageIndex();
    if (index === null) {
      return null;
    }
    return this.imageData()[index] ?? null;
  }

  resetZoom() {
    this.zoomScale.set(1);
    this.zoomTranslateX.set(0);
    this.zoomTranslateY.set(0);
    this.isPinching = false;
    this.isPanning = false;
    this.didInteract = false;
    this.pinchStartDistance = 0;
  }

  onZoomTouchStart(event: TouchEvent) {
    if (event.touches.length === 2) {
      event.preventDefault();
      this.isPinching = true;
      this.isPanning = false;
      this.didInteract = true;
      this.lastTapAt = 0;
      this.pinchStartDistance = this.touchDistance(
        event.touches[0],
        event.touches[1]
      );
      this.pinchStartScale = this.zoomScale();
      this.pinchStartTranslateX = this.zoomTranslateX();
      this.pinchStartTranslateY = this.zoomTranslateY();
      const mid = this.touchMidpoint(event.touches[0], event.touches[1]);
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this.pinchOriginX = mid.x - rect.left - rect.width / 2;
      this.pinchOriginY = mid.y - rect.top - rect.height / 2;
      return;
    }

    if (event.touches.length === 1 && this.zoomScale() > 1) {
      this.isPanning = true;
      this.didInteract = false;
      this.panStartX = event.touches[0].clientX;
      this.panStartY = event.touches[0].clientY;
      this.panStartTranslateX = this.zoomTranslateX();
      this.panStartTranslateY = this.zoomTranslateY();
    }
  }

  onZoomTouchMove(event: TouchEvent) {
    if (this.isPinching && event.touches.length === 2) {
      event.preventDefault();
      this.didInteract = true;
      const distance = this.touchDistance(event.touches[0], event.touches[1]);
      if (this.pinchStartDistance <= 0) {
        return;
      }
      const nextScale = this.clampZoom(
        this.pinchStartScale * (distance / this.pinchStartDistance)
      );
      const scaleRatio = nextScale / this.pinchStartScale;
      this.zoomScale.set(nextScale);
      this.zoomTranslateX.set(
        this.pinchStartTranslateX + this.pinchOriginX * (1 - scaleRatio)
      );
      this.zoomTranslateY.set(
        this.pinchStartTranslateY + this.pinchOriginY * (1 - scaleRatio)
      );
      this.clampPan(event.currentTarget as HTMLElement);
      return;
    }

    if (this.isPanning && event.touches.length === 1 && this.zoomScale() > 1) {
      event.preventDefault();
      const dx = event.touches[0].clientX - this.panStartX;
      const dy = event.touches[0].clientY - this.panStartY;
      if (dx * dx + dy * dy > 25) {
        this.didInteract = true;
      }
      this.zoomTranslateX.set(this.panStartTranslateX + dx);
      this.zoomTranslateY.set(this.panStartTranslateY + dy);
      this.clampPan(event.currentTarget as HTMLElement);
    }
  }

  onZoomTouchEnd(event: TouchEvent) {
    const wasPinching = this.isPinching;
    if (event.touches.length < 2) {
      this.isPinching = false;
    }

    if (event.touches.length === 0) {
      this.isPanning = false;

      if (this.zoomScale() > 1 && this.zoomScale() <= 1.05) {
        this.resetZoom();
        return;
      }

      // Double-tap zoom when the gesture was a tap, not a pan/pinch.
      if (
        event.changedTouches.length === 1 &&
        !wasPinching &&
        !this.didInteract
      ) {
        const touch = event.changedTouches[0];
        const now = Date.now();
        const dt = now - this.lastTapAt;
        const dx = touch.clientX - this.lastTapX;
        const dy = touch.clientY - this.lastTapY;
        if (dt > 0 && dt < 300 && dx * dx + dy * dy < 400) {
          this.toggleZoomAt(
            event.currentTarget as HTMLElement,
            touch.clientX,
            touch.clientY
          );
          this.lastTapAt = 0;
          return;
        }
        this.lastTapAt = now;
        this.lastTapX = touch.clientX;
        this.lastTapY = touch.clientY;
      }
      return;
    }

    if (event.touches.length === 1 && this.zoomScale() > 1) {
      this.isPanning = true;
      this.panStartX = event.touches[0].clientX;
      this.panStartY = event.touches[0].clientY;
      this.panStartTranslateX = this.zoomTranslateX();
      this.panStartTranslateY = this.zoomTranslateY();
    }
  }

  onZoomWheel(event: WheelEvent) {
    event.preventDefault();
    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const originX = event.clientX - rect.left - rect.width / 2;
    const originY = event.clientY - rect.top - rect.height / 2;
    const prevScale = this.zoomScale();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const nextScale = this.clampZoom(prevScale * delta);
    if (nextScale === prevScale) {
      return;
    }
    const ratio = nextScale / prevScale;
    this.zoomScale.set(nextScale);
    this.zoomTranslateX.set(
      this.zoomTranslateX() + originX * (1 - ratio)
    );
    this.zoomTranslateY.set(
      this.zoomTranslateY() + originY * (1 - ratio)
    );
    if (nextScale <= 1) {
      this.resetZoom();
      return;
    }
    this.clampPan(container);
  }

  onZoomDoubleClick(event: MouseEvent) {
    event.preventDefault();
    this.toggleZoomAt(
      event.currentTarget as HTMLElement,
      event.clientX,
      event.clientY
    );
  }

  private toggleZoomAt(
    container: HTMLElement,
    clientX: number,
    clientY: number
  ) {
    if (this.zoomScale() > 1) {
      this.resetZoom();
      return;
    }
    const rect = container.getBoundingClientRect();
    const originX = clientX - rect.left - rect.width / 2;
    const originY = clientY - rect.top - rect.height / 2;
    const nextScale = PicsPage.DOUBLE_TAP_ZOOM;
    this.zoomScale.set(nextScale);
    this.zoomTranslateX.set(originX * (1 - nextScale));
    this.zoomTranslateY.set(originY * (1 - nextScale));
    this.clampPan(container);
  }

  private clampZoom(scale: number): number {
    return Math.min(
      PicsPage.MAX_ZOOM,
      Math.max(PicsPage.MIN_ZOOM, scale)
    );
  }

  private clampPan(container: HTMLElement) {
    const scale = this.zoomScale();
    if (scale <= 1) {
      this.zoomTranslateX.set(0);
      this.zoomTranslateY.set(0);
      return;
    }
    const maxX = (container.clientWidth * (scale - 1)) / 2;
    const maxY = (container.clientHeight * (scale - 1)) / 2;
    this.zoomTranslateX.set(
      Math.min(maxX, Math.max(-maxX, this.zoomTranslateX()))
    );
    this.zoomTranslateY.set(
      Math.min(maxY, Math.max(-maxY, this.zoomTranslateY()))
    );
  }

  private touchDistance(a: Touch, b: Touch): number {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.hypot(dx, dy);
  }

  private touchMidpoint(a: Touch, b: Touch): { x: number; y: number } {
    return {
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2,
    };
  }

  async shareImage(): Promise<void> {
    const image = this.selectedImage();
    if (!image || typeof window === 'undefined') {
      return;
    }

    const absoluteUrl = new URL(image.path, window.location.origin).href;
    const title = this.eventName() ?? 'Deccan Throwdown';
    const text = `${title} photo`;

    try {
      const response = await fetch(image.path);
      if (!response.ok) {
        throw new Error(`Share fetch failed: ${response.status}`);
      }
      const blob = await response.blob();
      const file = new File([blob], image.filename, {
        type: blob.type || 'image/jpeg',
      });

      if (
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file], title, text });
        return;
      }

      if (typeof navigator.share === 'function') {
        await navigator.share({ title, text, url: absoluteUrl });
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
    }

    // Desktop / unsupported Web Share: copy image URL instead of downloading.
    try {
      await navigator.clipboard.writeText(absoluteUrl);
    } catch {
      // Ignore clipboard failures.
    }
  }

  @HostListener('document:keydown', ['$event'])
  onLightboxKeydown(event: KeyboardEvent) {
    if (this.selectedImageIndex() === null) {
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.prevImage();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextImage();
        break;
      case 'Escape':
        event.preventDefault();
        this.closeLightbox();
        break;
    }
  }

  private syncRouteAndLoad() {
    const param = this.activatedRoute.snapshot.paramMap.get('eventShortName');
    if (param && !galleryEventShortNames.includes(param)) {
      this.eventShortName.set(null);
      this.imageData.set([]);
      this.dataLoaded.set(true);
      this.selectedImageIndex.set(null);
      this.loadHubSummaries();
      return;
    }
    this.eventShortName.set(param);
    this.selectedImageIndex.set(null);
    if (param) {
      this.loadImages();
    } else {
      this.imageData.set([]);
      this.dataLoaded.set(true);
      this.loadedForEvent = null;
      this.loadHubSummaries();
    }
  }

  photoCountLabel(count: number): string {
    if (count === 0) {
      return 'Coming soon';
    }
    return count === 1 ? '1 photo' : `${count} photos`;
  }

  private loadHubSummaries() {
    this.hubLoading.set(true);
    const requests = galleryEventShortNames.map((shortName) =>
      this.http
        .get<ImageListData>(`assets/image-list-${shortName}.json`)
        .pipe(
          catchError(() =>
            of({
              metadata: {
                eventShortName: shortName,
                generatedAt: '',
                totalImages: 0,
                totalSize: 0,
                totalSizeFormatted: '0 B',
                directory: '',
              },
              images: [],
            })
          )
        )
    );

    forkJoin(requests)
      .pipe(pendingUntilComplete(this.pendingTasks))
      .subscribe({
        next: (results) => {
          const cards = galleryEventShortNames.map((shortName, index) => {
            const config = appConfig[shortName];
            const data = results[index];
            const images = data.images;
            const photoCount =
              data.metadata?.totalImages ?? images.length ?? 0;
            return {
              shortName,
              eventName: config.eventName,
              eventDates: config.eventDates,
              eventTypeLabel:
                config.eventType === 'pairs' ? 'Pairs' : 'Teams',
              photoCount,
              coverPath: this.pickRandomCover(images),
            };
          });
          this.hubEvents.set(cards);
          this.hubLoading.set(false);
        },
        error: () => {
          this.hubLoading.set(false);
        },
      });
  }

  private pickRandomCover(images: ImageData[]): string | null {
    if (images.length === 0) {
      return null;
    }
    const index = Math.floor(Math.random() * images.length);
    return images[index].path;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  loadImages(forceReload = false) {
    const event = this.eventShortName();
    if (!event) {
      return;
    }

    if (
      !forceReload &&
      this.loadedForEvent === event &&
      this.imageData().length > 0
    ) {
      this.imageData.set(this.shuffleArray(this.imageData()));
      this.dataLoaded.set(true);
      return;
    }

    this.dataLoaded.set(false);
    this.imageData.set([]);

    this.http
      .get<ImageListData>(`assets/image-list-${event}.json`)
      .pipe(pendingUntilComplete(this.pendingTasks))
      .subscribe({
        next: (data) => {
          this.imageData.set(this.shuffleArray(data.images));
          this.loadedForEvent = event;
          this.dataLoaded.set(true);
        },
        error: (error) => {
          console.error('Error loading image list:', error);
          this.loadedForEvent = event;
          this.dataLoaded.set(true);
        },
      });
  }
}
