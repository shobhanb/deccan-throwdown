import { Component, DestroyRef, inject, linkedSignal, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  IonContent,
  IonRefresherContent,
  IonRefresher,
  IonSkeletonText,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular';
import { PageHeaderComponent } from 'src/app/shared/page-header/page-header.component';
import { PageToolbarComponent } from 'src/app/shared/page-toolbar/page-toolbar.component';
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
    PageToolbarComponent,
    PageHeaderComponent,
    IonSegment,
    IonSegmentButton,
    IonIcon,
    IonButton,
    IonRefresherContent,
    IonRefresher,
    IonContent,
    IonSkeletonText,
  ],
})
export class WodsPage implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

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

  ngOnInit() {
    this.activatedRoute.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.getData());
  }

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
    this.eventShortName.set(eventShortNameParam ?? defaultConfig);
    this.selectedCategory.set(this.categories()?.[0] || null);
  }

  onClickChangeCategory(event: CustomEvent) {
    this.selectedCategory.set(event.detail.value);
  }

  onSegmentChangeCategory(event: CustomEvent) {
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
