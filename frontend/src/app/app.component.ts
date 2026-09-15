import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { ToastComponent } from './shared/toast/toast.component';
import { MenuComponent } from './shared/menu/menu.component';
import { TabBarComponent } from './shared/tab-bar/tab-bar.component';
import { IonSplitPane } from '@ionic/angular';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlertService } from './services/alert.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonApp,
    IonSplitPane,
    IonRouterOutlet,
    ToastComponent,
    MenuComponent,
    TabBarComponent,
  ],
})
export class AppComponent {
  private swUpdate = inject(SwUpdate);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private document = inject(DOCUMENT);

  /** iOS slide transitions render at viewport width and flash on centered desktop layout. */
  pageAnimationsEnabled = !window.matchMedia('(min-width: 769px)').matches;

  showAdminBanner = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) =>
        (event as NavigationEnd).urlAfterRedirects.startsWith('/admin')
      ),
      startWith(this.router.url.startsWith('/admin'))
    ),
    { initialValue: false }
  );

  constructor() {
    effect(() => {
      this.document.body.classList.toggle(
        'admin-banner-visible',
        this.showAdminBanner()
      );
    });

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
