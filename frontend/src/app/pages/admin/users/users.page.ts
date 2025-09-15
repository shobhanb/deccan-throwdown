import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonItem,
  IonSkeletonText,
  IonSearchbar,
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
import { apiFireauthService } from 'src/app/api/services';
import { apiFirebaseUserRecord } from 'src/app/api/models';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { ellipsisHorizontalOutline } from 'ionicons/icons';
import { AlertService } from 'src/app/services/alert.service';
import { ToastService } from 'src/app/services/toast.service';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';

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
    IonSearchbar,
    IonSkeletonText,
    IonItem,
    IonLabel,
    IonSegmentButton,
    IonSegment,
    IonList,
    IonRefresherContent,
    IonRefresher,
    IonBackButton,
    IonButtons,
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
  private apiFireAuth = inject(apiFireauthService);
  private alertService = inject(AlertService);
  private toastService = inject(ToastService);
  private actionSheetController = inject(ActionSheetController);
  authService = inject(AuthService);

  dataLoaded = signal<boolean>(false);

  allUsers = signal<apiFirebaseUserRecord[]>([]);

  async presentActionSheet(user: apiFirebaseUserRecord) {
    const actionSheet = await this.actionSheetController.create({
      header: user.display_name!,
      buttons: [
        {
          text: user.custom_claims?.admin
            ? 'Revoke Admin Rights'
            : 'Make Admin',
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

  async onClickAdmin(user: apiFirebaseUserRecord) {
    const admin = user.custom_claims!.admin;
    const alertText = admin
      ? `Revoke admin rights for ${user.display_name}?`
      : `Make ${user.display_name} admin?`;
    const result = await this.alertService.showAlert(alertText);

    if (result.role === 'confirm') {
      this.apiFireAuth
        .updateUserAdminRightsFireauthChangeAdminUidPost({
          uid: user.uid,
          admin: !admin,
        })
        .subscribe({
          next: () => {
            this.toastService.showSuccess(
              `User ${user.display_name} is ${
                admin ? 'no longer' : ''
              } an admin`
            );
            const currentUser = this.authService.user();
            if (currentUser && currentUser.uid === user.uid) {
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
    }
  }

  async onClickDelete(user: apiFirebaseUserRecord) {
    const result = await this.alertService.showAlert(
      `Delete ${user.display_name}?`
    );

    if (result.role === 'confirm') {
      this.apiFireAuth
        .deleteUserFireauthUserUidDelete({ uid: user.uid })
        .subscribe({
          next: () => {
            this.toastService.showSuccess(`User ${user.display_name} deleted`);
            const currentUser = this.authService.user();
            if (currentUser && currentUser.uid === user.uid) {
              this.authService.logout();
            } else {
              this.getData();
            }
          },
          error: (err: any) => {
            console.error(err);
            this.toastService.showError(
              `Error deleting ${user.display_name}: ${err.message}`
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
    this.apiFireAuth.getAllUsersFireauthAllGet().subscribe({
      next: (data: apiFirebaseUserRecord[]) => {
        this.allUsers.set(
          data.sort((a: apiFirebaseUserRecord, b: apiFirebaseUserRecord) => {
            return a.display_name?.localeCompare(b.display_name!) || 0;
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
