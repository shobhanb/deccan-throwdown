import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import {
  appConfig,
  AppConfig,
  archiveEventShortNames,
  defaultConfig,
  RegistrationStatus,
  WodConfig,
} from '../config/config';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private platformId = inject(PLATFORM_ID);
  private _config: AppConfig;
  private _eventShortName: string;
  private _apiBaseUrl: string;

  constructor() {
    this._config = appConfig[defaultConfig];
    this._eventShortName = defaultConfig;

    if (isPlatformBrowser(this.platformId)) {
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];
      const isLocalDev =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        subdomain === '127' ||
        hostname.endsWith('.local');

      if (isLocalDev) {
        this._apiBaseUrl = 'http://localhost:8000';
      } else {
        this._apiBaseUrl = `https://${subdomain}.cfgames.site/api`;
      }
    } else {
      this._apiBaseUrl = environment.prerenderApiBaseUrl;
    }
  }

  get config(): AppConfig {
    return this._config;
  }

  get apiBaseUrl(): string {
    return this._apiBaseUrl;
  }

  get eventShortName(): string {
    return this._eventShortName;
  }

  get eventName(): string {
    return this._config.eventName;
  }

  get eventDates(): string {
    return this._config.eventDates;
  }

  get tagline(): string {
    return this._config.tagline;
  }

  get registrationStatus(): RegistrationStatus {
    return this._config.registrationStatus;
  }

  get leaderboardEnabled(): boolean {
    return this._config.leaderboardEnabled;
  }

  get registrationPricing(): AppConfig['registrationPricing'] {
    return this._config.registrationPricing;
  }

  get archiveEvents(): { shortName: string; eventName: string }[] {
    return archiveEventShortNames.map((shortName) => ({
      shortName,
      eventName: appConfig[shortName].eventName,
    }));
  }

  get categories(): string[] {
    return this._config.categories;
  }

  get athletesPerTeam(): number {
    return this._config.athletesPerTeam;
  }

  get femaleAthletesPerTeam(): number {
    return (
      this._config.femaleAthletesPerTeam ??
      Math.floor(this._config.athletesPerTeam / 2)
    );
  }

  get maleAthletesPerTeam(): number {
    return (
      this._config.maleAthletesPerTeam ??
      this._config.athletesPerTeam - this.femaleAthletesPerTeam
    );
  }

  get wods(): WodConfig[] {
    return this._config.wods;
  }

  getWodByNumber(wodNumber: number): WodConfig | null {
    return (
      this._config.wods.filter(
        (value: WodConfig) => value.wodNumber === wodNumber
      )[0] || null
    );
  }
}
