import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ToastComponent } from './shared/toast/toast.component';
import { MenuComponent } from './shared/menu/menu.component';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, ToastComponent, MenuComponent],
})
export class AppComponent {
  private swUpdate = inject(SwUpdate);

  constructor() {
    // Listen for service worker updates
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(
          filter(
            (evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'
          )
        )
        .subscribe(() => {
          if (confirm('A new version is available. Reload to update?')) {
            document.location.reload();
          }
        });
    }
  }
}
