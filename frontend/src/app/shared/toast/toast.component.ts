import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { IonToast } from '@ionic/angular';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonToast],
})
export class ToastComponent implements OnInit {
  toastService = inject(ToastService);

  toastButtons = [
    {
      text: 'Dismiss',
      role: 'cancel',
    },
  ];

  constructor() {}

  ngOnInit() {}
}
