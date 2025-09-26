import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonMenuButton,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
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
    IonImg,
    IonRow,
    IonGrid,
    IonCol,
    IonCardTitle,
    IonCardHeader,
    IonCardContent,
    IonCard,
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

  images: string[] = [];
  imageData: ImageData[] = [];
  isLoading = true;
  errorMessage = '';

  constructor() {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.loadImages();
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
    try {
      this.isLoading = true;
      this.errorMessage = '';

      // Load the generated image list JSON file
      this.http.get<ImageListData>('assets/image-list.json').subscribe({
        next: (data) => {
          // Randomize the order of images
          const shuffledImages = this.shuffleArray(data.images);
          this.imageData = shuffledImages;
          this.images = shuffledImages.map((img) => img.path);
          this.isLoading = false;
          console.log(
            `Loaded ${data.metadata.totalImages} images in random order (${data.metadata.totalSizeFormatted})`
          );
        },
        error: (error) => {
          console.error('Error loading image list:', error);
          this.errorMessage =
            'Failed to load image gallery. Please try again later.';
          this.isLoading = false;
        },
      });
    } catch (error) {
      console.error('Error in loadImages:', error);
      this.errorMessage = 'Failed to load image gallery.';
      this.isLoading = false;
    }
  }

  // Method to handle image loading errors
  onImageError(event: any, imagePath: string) {
    console.warn(`Failed to load image: ${imagePath}`);
    // Optionally hide the image or show a placeholder
    event.target.style.display = 'none';
  }
}
