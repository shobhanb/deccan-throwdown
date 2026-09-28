import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter, map, merge, of, startWith } from 'rxjs';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { ToastComponent } from './shared/toast/toast.component';
import { MenuComponent } from './shared/menu/menu.component';
import { TabBarComponent } from './shared/tab-bar/tab-bar.component';
import { IonSplitPane } from '@ionic/angular';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlertService } from './services/alert.service';
import { SeoService } from './services/seo.service';
import { SeoRouteData } from './config/seo.config';

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
  private swUpdate = inject(SwUpdate, { optional: true });
  private alertService = inject(AlertService);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private seoService = inject(SeoService);

  /** iOS slide transitions render at viewport width and flash on centered desktop layout. */
  pageAnimationsEnabled = isPlatformBrowser(this.platformId)
    ? !window.matchMedia('(min-width: 769px)').matches
    : false;

  /**
   * iOS Safari/PWA runs its own interactive back transition on edge swipe. When
   * the gesture completes, history fires popstate and Ionic would animate back
   * again — skip that second transition (in-app back still uses imperative nav).
   */
  suppressPageAnimationForHistoryNav = false;

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
    merge(
      of(null),
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd))
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.applyRouteSeo());

    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.suppressPageAnimationForHistoryNav =
          event.navigationTrigger === 'popstate';
      } else if (event instanceof NavigationEnd) {
        this.suppressPageAnimationForHistoryNav = false;
      }
    });

    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        this.document.body.classList.toggle(
          'admin-banner-visible',
          this.showAdminBanner()
        );
      });
    }

    if (this.swUpdate?.isEnabled) {
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
            this.document.defaultView?.location.reload();
          }
        });
    }
  }

  private applyRouteSeo(): void {
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const seo = route.snapshot.data['seo'] as SeoRouteData | undefined;
    this.seoService.applyForUrl(this.router.url, seo);
  }
}
