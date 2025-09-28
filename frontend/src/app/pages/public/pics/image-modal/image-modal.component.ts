import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonImg,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';

@Component({
  selector: 'app-image-modal',
  templateUrl: './image-modal.component.html',
  styleUrls: ['./image-modal.component.scss'],
  standalone: true,
  imports: [
    IonImg,
    IonIcon,
    IonButton,
    IonButtons,
    IonToolbar,
    IonHeader,
    IonContent,
    CommonModule,
  ],
})
export class ImageModalComponent implements OnInit {
  @Input() imagePath: string = '';

  private modalController = inject(ModalController);

  constructor() {
    addIcons({ close });
  }

  ngOnInit() {}

  async closeModal() {
    await this.modalController.dismiss();
  }
}
