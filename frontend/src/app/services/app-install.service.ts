import { inject, Injectable, signal } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { InstallAppModalComponent } from '../shared/install-app-modal/install-app-modal.component';
import { Platform } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class AppInstallService {
  private modalController = inject(ModalController);
  private platform = inject(Platform);
  private readonly STORAGE_KEY = 'dt-install-prompt-hidden';

  readonly showInstallButton = signal(false);

  constructor() {
    if (this.platform.is('pwa')) {
      this.showInstallButton.set(false);
    } else if (this.platform.is('ios') || this.platform.is('android')) {
      this.checkStoredPreference();
    }
  }

  private checkStoredPreference(): void {
    const storedPreference = localStorage.getItem(this.STORAGE_KEY);
    if (storedPreference === 'true') {
      this.showInstallButton.set(false);
    } else {
      this.showInstallButton.set(true);
    }
  }

  public dontShowAgain() {
    localStorage.setItem(this.STORAGE_KEY, 'true');
    this.showInstallButton.set(false);
  }

  async showInstallModal() {
    const modal = await this.modalController.create({
      component: InstallAppModalComponent,
      componentProps: {
        platformType: this.platform.is('ios') ? 'ios' : 'android',
      },
      initialBreakpoint: 0.75,
    });

    await modal.present();
  }
}
