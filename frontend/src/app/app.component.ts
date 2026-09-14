import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { ToastComponent } from './shared/toast/toast.component';
import { MenuComponent } from './shared/menu/menu.component';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlertService } from './services/alert.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonApp, IonRouterOutlet, ToastComponent, MenuComponent],
})
export class AppComponent {
  private swUpdate = inject(SwUpdate);
  private alertService = inject(AlertService);

  /** iOS slide transitions render at viewport width and flash on centered desktop layout. */
  pageAnimationsEnabled = !window.matchMedia('(min-width: 769px)').matches;

  constructor() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(
          filter(
            (evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'
          ),
          takeUntilDestroyed()
        )
        .subscribe(async () => {
          const shouldReload = await this.alertService.showConfirm(
            'Update Available',
            'A new version is available. Reload to update?',
            'Reload',
            'Later'
          );
          if (shouldReload) {
            document.location.reload();
          }
        });
    }
  }
}
