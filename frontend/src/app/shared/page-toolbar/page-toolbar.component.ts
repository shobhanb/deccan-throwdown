import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import {
  IonHeader,
  IonTitle,
  IonToolbar,
  IonMenuButton,
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
    ToolbarButtonsComponent,
  ],
})
export class PageToolbarComponent {
  title = input.required<string>();
  showMenuButton = input(true);
}
