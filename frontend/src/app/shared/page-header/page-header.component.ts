import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>();
}
