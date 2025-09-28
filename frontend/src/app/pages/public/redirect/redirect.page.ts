import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  showInvalidUrl = false;
  redirectUrl = '';

  constructor() {}

  ngOnInit() {
    // Get the 'link' query parameter
    this.route.queryParams.subscribe((params) => {
      const linkParam = params['link'];

      if (linkParam && this.isValidUrl(linkParam)) {
        // Valid URL - redirect immediately
        window.location.href = linkParam;
      } else {
        // Invalid or missing URL - show error message
        this.redirectUrl = linkParam || '';
        this.showInvalidUrl = true;

        // Navigate to home after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 3000);
      }
    });
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
