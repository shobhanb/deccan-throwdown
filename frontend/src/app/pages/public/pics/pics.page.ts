import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
import { PageHeaderComponent } from 'src/app/shared/page-header/page-header.component';
import { PageToolbarComponent } from 'src/app/shared/page-toolbar/page-toolbar.component';
import { EmptyStateComponent } from 'src/app/shared/empty-state/empty-state.component';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
} from 'ionicons/icons';

interface ImageData {
  filename: string;
  path: string;
  size: number;
  sizeFormatted: string;
  extension: string;
  lastModified: string;
  type: 'square' | 'horizontal' | 'general' | string;
  folder: string;
}

interface ImageListData {
  metadata: {
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
  ],
})
export class PicsPage implements OnInit {
  private http = inject(HttpClient);

  imageData = signal<ImageData[]>([]);
  dataLoaded = signal(false);
  selectedImageIndex = signal<number | null>(null);

  constructor() {
    addIcons({ closeOutline, chevronBackOutline, chevronForwardOutline });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.loadImages();
  }

  handleRefresh(event: CustomEvent) {
    this.loadImages();
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

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async loadImages() {
    if (this.imageData().length > 0) {
      this.imageData.set(this.shuffleArray(this.imageData()));
      this.dataLoaded.set(true);
      return;
    }
    this.dataLoaded.set(false);
    try {
      this.http.get<ImageListData>('assets/image-list.json').subscribe({
        next: (data) => {
          const shuffledImages = this.shuffleArray(data.images);
          this.imageData.set(shuffledImages);
          this.dataLoaded.set(true);
        },
        error: (error) => {
          console.error('Error loading image list:', error);
          this.dataLoaded.set(true);
        },
      });
    } catch (error) {
      console.error('Error in loadImages:', error);
      this.dataLoaded.set(true);
    }
  }
}
