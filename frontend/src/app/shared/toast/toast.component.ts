import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { IonToast } from '@ionic/angular';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonToast],
})
export class ToastComponent {
  toastService = inject(ToastService);

  toastCssClass = computed(() => `dt-toast dt-toast-${this.toastService.color()}`);

  toastButtons = [
    {
      text: 'Dismiss',
      role: 'cancel',
    },
  ];
}
