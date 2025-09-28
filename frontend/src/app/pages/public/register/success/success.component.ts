import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonButtons,
  ModalController,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline } from 'ionicons/icons';
import { apiTeamRegistrationResponseModel } from 'src/app/api/models';

@Component({
  selector: 'app-success',
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.scss'],
  standalone: true,
  imports: [
    IonButtons,
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
    CommonModule,
  ],
})
export class SuccessComponent implements OnInit {
  private modalController = inject(ModalController);
  private router = inject(Router);

  @Input() responseData: apiTeamRegistrationResponseModel | null = null;

  constructor() {
    addIcons({ checkmarkCircleOutline });
  }

  ngOnInit() {
    if (this.responseData) {
      console.log('Registration Successful:', this.responseData);
    }
  }

  async onClickClose() {
    await this.modalController.dismiss();
    this.router.navigate(['/teams'], { replaceUrl: true });
  }
}
