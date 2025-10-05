import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';

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
  imports: [
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
    CommonModule,
    FormsModule,
    ToolbarButtonsComponent,
  ],
})
export class PicsPage implements OnInit {
  private http = inject(HttpClient);

  imageData = signal<ImageData[]>([]);

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
      // Images already loaded, just shuffle
      this.imageData.set(this.shuffleArray(this.imageData()));
      return;
    }
    try {
      // Load the generated image list JSON file
      this.http.get<ImageListData>('assets/image-list.json').subscribe({
        next: (data) => {
          // Randomize the order of images
          const shuffledImages = this.shuffleArray(data.images);
          this.imageData.set(shuffledImages);
        },
        error: (error) => {
          console.error('Error loading image list:', error);
        },
      });
    } catch (error) {
      console.error('Error in loadImages:', error);
    }
  }
}
