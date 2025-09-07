import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, calendarOutline, peopleOutline } from 'ionicons/icons';
import { ToastComponent } from './shared/toast/toast.component';
import { MenuComponent } from './shared/menu/menu.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, ToastComponent, MenuComponent],
})
export class AppComponent {
  constructor() {
    addIcons({ homeOutline, calendarOutline, peopleOutline });
  }
}
