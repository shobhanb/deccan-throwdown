import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonMenuButton,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-registration-success',
  templateUrl: './registration-success.page.html',
  styleUrls: ['./registration-success.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonButton,
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
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
export class RegistrationSuccessPage implements OnInit {
  private router = inject(Router);

  constructor() {
    addIcons({ checkmarkCircleOutline });
  }

  ngOnInit() {}

  navigateToHome() {
    this.router.navigate(['/home'], { replaceUrl: true });
  }
}
