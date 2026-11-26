import { Injectable, signal } from '@angular/core';

/**
 * DisplayPage sets this while active so app chrome (menu/tabs) stays hidden
 * even if the router URL briefly desyncs under Ionic's stack.
 */
@Injectable({ providedIn: 'root' })
export class DisplayChromeService {
  fullscreen = signal(false);
}
