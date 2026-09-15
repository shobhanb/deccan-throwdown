import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-admin-page-header',
  templateUrl: './admin-page-header.component.html',
  styleUrls: ['./admin-page-header.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminPageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>();
}
