import { Component, inject, linkedSignal, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';

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
  IonItem,
  IonRefresherContent,
  IonRefresher,
  IonList,
  IonSkeletonText,
  IonCardContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular';
import { ToolbarButtonsComponent } from 'src/app/shared/toolbar-buttons/toolbar-buttons.component';
import { PageHeaderComponent } from 'src/app/shared/page-header/page-header.component';
import { addIcons } from 'ionicons';
import {
  documentOutline,
  documentTextOutline,
  trophyOutline,
} from 'ionicons/icons';
import { appConfig, defaultConfig, WodConfig } from 'src/app/config/config';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-wods',
  templateUrl: './wods.page.html',
  styleUrls: ['./wods.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    PageHeaderComponent,
    IonIcon,
    IonButtons,
    IonButton,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonItem,
    IonList,
    IonRefresherContent,
    IonRefresher,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSkeletonText,
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
  wodsUrl = linkedSignal(() => appConfig[this.eventShortName()]?.wodsUrl ?? '');
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
    addIcons({ trophyOutline, documentOutline, documentTextOutline });
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

  getWodTypeChips(scoreTypes: WodConfig['scoreTypes']): string[] {
    const labels: Record<string, string> = {
      Reps: 'AMRAP',
      Time: 'For Time',
      Weight: 'Max Weight',
      Tiebreak: 'Tiebreak',
    };
    return scoreTypes
      .filter((type) => type !== 'Tiebreak')
      .map((type) => labels[type] ?? type);
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
