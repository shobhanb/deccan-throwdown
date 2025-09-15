import { Injectable } from '@angular/core';
import { appConfig, AppConfig, defaultConfig } from '../config/config';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private _config: AppConfig;
  private _eventShortName: string;

  constructor() {
    const subdomain = window.location.hostname.split('.')[0];
    this._config = appConfig[subdomain] || appConfig[defaultConfig];

    if (subdomain === 'localhost' || subdomain === '127') {
      this._eventShortName = defaultConfig;
    } else {
      this._eventShortName = subdomain;
    }
  }

  get config(): AppConfig {
    return this._config;
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
}
