import {
  Component,
  inject,
  ChangeDetectionStrategy,
  computed,
  effect,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import {
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  MenuController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  barbellOutline,
  barChartOutline,
  homeOutline,
  menuOutline,
  peopleOutline,
} from 'ionicons/icons';

const TAB_ROUTES = ['/home', '/wods', '/leaderboard', '/teams'];

@Component({
  selector: 'app-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    RouterLink,
    RouterLinkActive,
  ],
})
export class TabBarComponent {
  private router = inject(Router);
  private menuController = inject(MenuController);
  private document = inject(DOCUMENT);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  tabBarVisible = computed(() => {
    const path = this.currentUrl().split('?')[0];
    if (path.startsWith('/auth') || path.startsWith('/admin')) {
      return false;
    }
    if (path.startsWith('/register') || path.startsWith('/pics')) {
      return false;
    }
    if (TAB_ROUTES.includes(path)) {
      return true;
    }
    if (
      path.match(/^\/(leaderboard|teams|wods)\/[^/]+$/) &&
      !path.includes('dtteams2026')
    ) {
      return false;
    }
    return TAB_ROUTES.some((tab) => path === tab) || path === '/';
  });

  constructor() {
    addIcons({
      homeOutline,
      barbellOutline,
      barChartOutline,
      peopleOutline,
      menuOutline,
    });

    effect(() => {
      this.document.body.classList.toggle(
        'tab-bar-visible',
        this.tabBarVisible()
      );
    });
  }

  async openMenu() {
    await this.menuController.open('main-menu');
  }
}
