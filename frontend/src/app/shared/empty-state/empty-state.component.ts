import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  barbellOutline,
  cameraOutline,
  peopleOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonIcon],
})
export class EmptyStateComponent {
  icon = input('barbell-outline');
  message = input.required<string>();

  constructor() {
    addIcons({ barbellOutline, cameraOutline, peopleOutline });
  }
}
