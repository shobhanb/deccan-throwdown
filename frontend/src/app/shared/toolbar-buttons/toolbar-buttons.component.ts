import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { IonButtons } from '@ionic/angular';
import { ThemeComponent } from './theme/theme.component';
import { AuthStateComponent } from './auth-state/auth-state.component';

@Component({
  selector: 'app-toolbar-buttons',
  templateUrl: './toolbar-buttons.component.html',
  styleUrls: ['./toolbar-buttons.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ThemeComponent, AuthStateComponent, IonButtons],
})
export class ToolbarButtonsComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
