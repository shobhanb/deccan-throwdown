import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';


import { HttpClient } from '@angular/common/http';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonMenuButton,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
} from '@ionic/angular';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { PageHeaderComponent } from 'src/app/shared/page-header/page-header.component';
import { EmptyStateComponent } from 'src/app/shared/empty-state/empty-state.component';

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
    PageHeaderComponent,
    EmptyStateComponent,
    IonSkeletonText,
    IonRefresherContent,
    IonRefresher,
    IonImg,
    IonRow,
    IonGrid,
    IonCol,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonMenuButton,
    ToolbarButtonsComponent
],
})
export class PicsPage implements OnInit {
  private http = inject(HttpClient);

  imageData = signal<ImageData[]>([]);
  dataLoaded = signal(false);

  constructor() {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.loadImages();
  }

  handleRefresh(event: CustomEvent) {
    this.loadImages();
    (event.target as HTMLIonRefresherElement).complete();
  }

  // Helper method to shuffle array using Fisher-Yates algorithm
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]; // Create a copy to avoid mutating original
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
