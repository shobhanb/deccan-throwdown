import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import {
  form,
  FormField,
  minLength,
  required,
} from '@angular/forms/signals';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonTextarea,
  IonTitle,
  IonToolbar,
  IonMenuButton,
} from '@ionic/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { apiNotificationsService } from 'src/app/api/services';
import {
  apiErrorDetail,
  fromApi,
} from 'src/app/services/api-call.util';
import { AdminPageHeaderComponent } from 'src/app/shared/admin-page-header/admin-page-header.component';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { AppConfigService } from 'src/app/services/app-config-service';
import { AlertService } from 'src/app/services/alert.service';
import { ToastService } from 'src/app/services/toast.service';
import { AdminCustomNotificationFormModel } from 'src/app/shared/models/form-models';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    AdminPageHeaderComponent,
    ToolbarButtonsComponent,
    FormField,
    IonHeader,
    IonToolbar,
    IonMenuButton,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonTextarea,
    IonButton,
  ],
})
export class NotificationsPage {
  private apiNotifications = inject(apiNotificationsService);
  private appConfigService = inject(AppConfigService);
  private alertService = inject(AlertService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  eventName = this.appConfigService.eventName;
  eventShortName = this.appConfigService.eventShortName;

  sending = signal(false);

  notificationModel = signal<AdminCustomNotificationFormModel>({
    title: '',
    body: '',
    route: '/home',
  });

  notificationForm = form(this.notificationModel, (schemaPath) => {
    required(schemaPath.title, { message: 'Title is required' });
    minLength(schemaPath.title, 1, {
      message: 'Title is required',
    });
    required(schemaPath.body, { message: 'Message is required' });
    minLength(schemaPath.body, 1, {
      message: 'Message is required',
    });
  });

  formValid(): boolean {
    const route = this.notificationModel().route.trim();
    if (route && !route.startsWith('/')) {
      return false;
    }
    return this.notificationForm().valid();
  }

  async onSubmit() {
    if (!this.formValid() || this.sending()) {
      return;
    }

    const { title, body, route } = this.notificationModel();
    const normalizedRoute = route.trim() || '/home';
    if (!normalizedRoute.startsWith('/')) {
      this.toastService.showError('Open page must start with /');
      return;
    }

    const confirmed = await this.alertService.showConfirm(
      'Send push notification?',
      `This will notify everyone who enabled Event updates for ${this.eventName}.<br><br><strong>${title}</strong><br>${body}`,
      'Send',
      'Cancel'
    );
    if (!confirmed) {
      return;
    }

    this.sending.set(true);
    fromApi(
      this.apiNotifications.sendCustomNotificationNotificationsCustomPost({
        body: {
          title: title.trim(),
          body: body.trim(),
          event_short_name: this.eventShortName,
          route: normalizedRoute,
        },
      })
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.showToast('Notification sent', 'success', null, 2500);
          this.notificationModel.set({
            title: '',
            body: '',
            route: '/home',
          });
        },
        error: (error: unknown) => {
          this.sending.set(false);
          const detail = apiErrorDetail(error);
          this.toastService.showError(
            detail ? `Failed to send: ${detail}` : 'Failed to send notification'
          );
        },
        complete: () => {
          this.sending.set(false);
        },
      });
  }
}
