import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonLabel,
  IonItem,
  IonSkeletonText,
  IonNote,
  IonIcon,
  IonButton,
  ActionSheetController,
  IonMenuButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonText,
} from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { ellipsisHorizontalOutline } from 'ionicons/icons';
import { AlertService } from 'src/app/services/alert.service';
import { ToastService } from 'src/app/services/toast.service';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { apiAuthService } from 'src/app/api/services';
import { apiUserRead } from 'src/app/api/models';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
  standalone: true,
  imports: [
    IonText,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonButton,
    IonIcon,
    IonNote,
    IonSkeletonText,
    IonItem,
    IonLabel,
    IonList,
    IonRefresherContent,
    IonRefresher,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    ToolbarButtonsComponent,
    IonMenuButton,
  ],
})
export class UsersPage implements OnInit {
  private apiAuth = inject(apiAuthService);
  private alertService = inject(AlertService);
  private toastService = inject(ToastService);
  private actionSheetController = inject(ActionSheetController);
  authService = inject(AuthService);

  dataLoaded = signal<boolean>(false);

  allUsers = signal<apiUserRead[]>([]);

  async presentActionSheet(user: apiUserRead) {
    const actionSheet = await this.actionSheetController.create({
      header: user.name!,
      buttons: [
        {
          text: user.is_superuser ? 'Revoke Admin Rights' : 'Make Admin',
          data: {
            action: 'admin',
          },
        },
        {
          text: 'Delete User',
          role: 'destructive',
          data: {
            action: 'delete',
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
          data: {
            action: 'cancel',
          },
        },
      ],
    });

    await actionSheet.present();

    const result = await actionSheet.onDidDismiss();
    if (result.data.action === 'delete') {
      await this.onClickDelete(user);
    } else if (result.data.action === 'admin') {
      await this.onClickAdmin(user);
    }
  }

  async onClickAdmin(user: apiUserRead) {
    const admin = user.is_superuser;
    const alertText = admin
      ? `Revoke admin rights for ${user.name}?`
      : `Make ${user.name} admin?`;
    const result = await this.alertService.showAlert(alertText);

    if (result.role === 'confirm') {
      this.apiAuth
        .usersPatchUserAuthIdPatch({
          id: user.id,
          body: { is_superuser: !admin },
        })
        .subscribe({
          next: () => {
            this.toastService.showSuccess(
              `User ${user.name} is ${admin ? 'no longer' : ''} an admin`
            );
            const currentUser = this.authService.user();
            if (currentUser && currentUser.id === user.id) {
              this.authService.logout();
            } else {
              this.getData();
            }
          },
          error: (err: any) => {
            console.error(err);
            this.toastService.showError(
              `Error changing admin status: ${err.message}`
            );
          },
        });
      return;
    }
  }

  async onClickDelete(user: apiUserRead) {
    const result = await this.alertService.showAlert(`Delete ${user.name}?`);

    if (result.role === 'confirm') {
      this.apiAuth.usersDeleteUserAuthIdDelete({ id: user.id }).subscribe({
        next: () => {
          this.toastService.showSuccess(`User ${user.name} deleted`);
          const currentUser = this.authService.user();
          if (currentUser && currentUser.id === user.id) {
            this.authService.logout();
          } else {
            this.getData();
          }
        },
        error: (err: any) => {
          console.error(err);
          this.toastService.showError(
            `Error deleting ${user.name}: ${err.message}`
          );
        },
      });
    }
  }

  constructor() {
    addIcons({
      ellipsisHorizontalOutline,
    });
  }

  private getData() {
    this.apiAuth.getUsersAuthUsersGet().subscribe({
      next: (data: apiUserRead[]) => {
        this.allUsers.set(
          data.sort((a: apiUserRead, b: apiUserRead) => {
            return a.name?.localeCompare(b.name!) || 0;
          })
        );
        this.dataLoaded.set(true);
      },
      error: (err: any) => {
        console.error(err);
        this.toastService.showError(`Error fetching users: ${err.message}`);
      },
    });
  }

  handleRefresh(event: CustomEvent) {
    this.dataLoaded.set(false);
    this.getData();
    (event.target as HTMLIonRefresherElement).complete();
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.getData();
  }
}
