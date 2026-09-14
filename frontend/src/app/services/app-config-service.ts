import { Injectable } from '@angular/core';
import {
  appConfig,
  AppConfig,
  archiveEventShortNames,
  defaultConfig,
  RegistrationStatus,
  WodConfig,
} from '../config/config';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private _config: AppConfig;
  private _eventShortName: string;
  private _apiBaseUrl: string;

  constructor() {
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    this._config = appConfig[defaultConfig];
    this._eventShortName = defaultConfig;

    const isLocalDev =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      subdomain === '127' ||
      hostname.endsWith('.local');

    if (isLocalDev) {
      // Use same-origin relative URLs; ionic serve proxies to localhost:8000 (see proxy.conf.json).
      this._apiBaseUrl = 'http://localhost:8000';
    } else {
      this._apiBaseUrl = `https://${subdomain}.cfgames.site/api`;
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
