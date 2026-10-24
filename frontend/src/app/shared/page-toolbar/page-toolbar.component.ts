import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import {
  IonHeader,
  IonTitle,
  IonToolbar,
  IonMenuButton,
  IonButtons,
  IonBackButton,
} from '@ionic/angular';
import { ToolbarButtonsComponent } from '../toolbar-buttons/toolbar-buttons.component';

@Component({
  selector: 'app-page-toolbar',
  templateUrl: './page-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonMenuButton,
    IonButtons,
    IonBackButton,
    ToolbarButtonsComponent,
  ],
})
export class PageToolbarComponent {
  title = input.required<string>();
  showMenuButton = input(true);
  /** When set, shows a back button that navigates here if history is empty. */
  backHref = input<string | null>(null);
}
