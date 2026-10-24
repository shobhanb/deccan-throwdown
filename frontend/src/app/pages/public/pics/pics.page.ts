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

  constructor() {
    addIcons({
      cameraOutline,
      closeOutline,
      chevronBackOutline,
      chevronForwardOutline,
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
    this.selectedImageIndex.set(index);
  }

  closeLightbox() {
    this.selectedImageIndex.set(null);
  }

  prevImage() {
    const current = this.selectedImageIndex();
    if (current !== null && current > 0) {
      this.selectedImageIndex.set(current - 1);
    }
  }

  nextImage() {
    const current = this.selectedImageIndex();
    if (current !== null && current < this.imageData().length - 1) {
      this.selectedImageIndex.set(current + 1);
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
            const images = this.sortImages(data.images);
            const photoCount =
              data.metadata?.totalImages ?? images.length ?? 0;
            return {
              shortName,
              eventName: config.eventName,
              eventDates: config.eventDates,
              eventTypeLabel:
                config.eventType === 'pairs' ? 'Pairs' : 'Teams',
              photoCount,
              coverPath: images[0]?.path ?? null,
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

  private sortImages(images: ImageData[]): ImageData[] {
    return [...images].sort((a, b) =>
      a.filename.localeCompare(b.filename, undefined, { sensitivity: 'base' })
    );
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
          this.imageData.set(this.sortImages(data.images));
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
