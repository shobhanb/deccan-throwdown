import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';

export interface AlertResult {
  role?: 'confirm' | 'cancel';
  inputValue?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private alertController = inject(AlertController);

  async showConfirm(
    header: string,
    message: string,
    confirmText = 'OK',
    cancelText = 'Cancel'
  ): Promise<boolean> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        { text: cancelText, role: 'cancel' },
        { text: confirmText, role: 'confirm' },
      ],
    });

    await alert.present();
    const result = await alert.onDidDismiss();
    return result.role === 'confirm';
  }

  async showAlert(
    header: string,
    options?: {
      inputLabel?: string;
    }
  ): Promise<AlertResult> {
    const alertButtons = [
      {
        text: 'Cancel',
        role: 'cancel',
      },
      {
        text: 'OK',
        role: 'confirm',
      },
    ];

    const alertOptions: any = {
      header,
      buttons: alertButtons,
    };

    if (options?.inputLabel) {
      alertOptions.inputs = [
        {
          type: 'text',
          name: 'inputValue',
          value: options.inputLabel,
        },
      ];
    }

    const alert = await this.alertController.create(alertOptions);

    await alert.present();
    const result = await alert.onDidDismiss();

    return {
      role: result.role as 'confirm' | 'cancel',
      inputValue: result.data?.values?.inputValue,
    };
  }
}
