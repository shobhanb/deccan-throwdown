import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-redirect',
  templateUrl: './redirect.page.html',
  styleUrls: ['./redirect.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
  ],
})
export class RedirectPage implements OnInit {
  private router = inject(Router);

  showInvalidUrl = false;
  redirectUrl = '';

  constructor() {}

  ngOnInit() {
    // Get the full query string and extract everything after 'link='
    const fullUrl = window.location.href;
    const linkIndex = fullUrl.indexOf('link=');

    if (linkIndex !== -1) {
      // Extract everything after 'link=' and decode it
      const encodedLink = fullUrl.substring(linkIndex + 5);
      const decodedLink = decodeURIComponent(encodedLink);

      console.log('Extracted link:', decodedLink); // Debug log

      if (decodedLink && this.isValidUrl(decodedLink)) {
        // Valid URL - redirect immediately
        window.location.href = decodedLink;
      } else {
        // Invalid URL - show error message
        this.redirectUrl = decodedLink || '';
        this.showInvalidUrl = true;

        // Navigate to home after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 3000);
      }
    } else {
      // No link parameter found - show error
      this.showInvalidUrl = true;

      // Navigate to home after 3 seconds
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 3000);
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols for security
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
