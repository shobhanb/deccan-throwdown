import { Component, inject, Input, ChangeDetectionStrategy } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonButtons,
  ModalController,
} from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline } from 'ionicons/icons';
import { apiTeamRegistrationResponseModel } from 'src/app/api/models';

@Component({
  selector: 'app-success',
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonButtons,
    IonIcon,
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
  ],
})
export class SuccessComponent {
  private modalController = inject(ModalController);
  private router = inject(Router);

  @Input() responseData: apiTeamRegistrationResponseModel | null = null;

  constructor() {
    addIcons({ checkmarkCircleOutline });
  }

  async onClickClose() {
    await this.modalController.dismiss();
    this.router.navigate(['/teams'], { replaceUrl: true });
  }
}
