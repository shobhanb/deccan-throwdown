import { Component, inject, Input, ChangeDetectionStrategy } from '@angular/core';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  arrowDownCircleOutline,
  shareOutline,
  ellipsisVerticalOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-install-app-modal',
  templateUrl: './install-app-modal.component.html',
  styleUrls: ['./install-app-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonNote,
    IonLabel,
    IonItem,
    IonList,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
  ],
})
export class InstallAppModalComponent {
  private modalController = inject(ModalController);

  /** Plain @Input — Ionic modal componentProps overwrite signal inputs. */
  @Input() platformType: 'ios' | 'android' = 'ios';

  constructor() {
    addIcons({
      closeOutline,
      arrowDownCircleOutline,
      shareOutline,
      ellipsisVerticalOutline,
    });
  }

  closeModal() {
    this.modalController.dismiss();
  }
}
