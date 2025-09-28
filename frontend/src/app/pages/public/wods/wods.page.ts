import {
  Component,
  computed,
  inject,
  linkedSignal,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonMenuButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonLabel,
  IonItem,
  IonRefresherContent,
  IonRefresher,
  IonList,
  IonSkeletonText,
  IonCardContent,
  IonButton,
  IonText,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { addIcons } from 'ionicons';
import { trophyOutline } from 'ionicons/icons';
import { appConfig, defaultConfig, WodConfig } from 'src/app/config/config';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-wods',
  templateUrl: './wods.page.html',
  styleUrls: ['./wods.page.scss'],
  standalone: true,
  imports: [
    IonText,
    IonButton,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonLabel,
    IonItem,
    IonList,
    IonRefresherContent,
    IonRefresher,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSkeletonText,
    CommonModule,
    FormsModule,
    IonMenuButton,
    ToolbarButtonsComponent,
    IonSelect,
    IonSelectOption,
  ],
})
export class WodsPage implements OnInit {
  private activatedRoute = inject(ActivatedRoute);

  dataLoaded = signal<boolean>(false);

  eventShortName = linkedSignal(() => defaultConfig);
  eventName = linkedSignal(() => appConfig[this.eventShortName()]?.eventName);
  wods = linkedSignal(() => appConfig[this.eventShortName()]?.wods);
  movementStandardsUrl = linkedSignal(
    () => appConfig[this.eventShortName()]?.standardsUrl ?? ''
  );
  useCategoryWodDescription = linkedSignal(() =>
    appConfig[this.eventShortName()]?.wods?.some(
      (wod) => wod.categoryWodDescription
    )
  );
  categories = linkedSignal(() => appConfig[this.eventShortName()]?.categories);
  selectedCategory = linkedSignal<string | null>(
    () => this.categories()?.[0] || null
  );

  constructor() {
    addIcons({ trophyOutline });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.getData();
  }

  handleRefresh(event: CustomEvent) {
    this.getData();
    (event.target as HTMLIonRefresherElement).complete();
  }

  getData() {
    this.dataLoaded.set(true);

    const eventShortNameParam =
      this.activatedRoute.snapshot.paramMap.get('eventShortName');
    if (eventShortNameParam) {
      this.eventShortName.set(eventShortNameParam);
    }
  }

  onClickChangeCategory(event: CustomEvent) {
    this.selectedCategory.set(event.detail.value);
  }

  getWodDescription(wod: WodConfig): string[] {
    if (this.useCategoryWodDescription() && this.selectedCategory()) {
      return (
        wod.categoryWodDescription?.[this.selectedCategory()!] ??
        wod.wodDescription ??
        []
      );
    }
    return wod.wodDescription ?? [];
  }
}
