import { Injectable } from '@angular/core';
import {
  appConfig,
  AppConfig,
  defaultConfig,
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
    const subdomain = window.location.hostname.split('.')[0];
    this._config = appConfig[subdomain] || appConfig[defaultConfig];

    if (subdomain === 'localhost' || subdomain === '127') {
      this._eventShortName = defaultConfig;
      this._apiBaseUrl = `http://localhost:8000`;
    } else {
      this._eventShortName = subdomain;
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

  get categories(): string[] {
    return this._config.categories;
  }

  get athletesPerTeam(): number {
    return this._config.athletesPerTeam;
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
