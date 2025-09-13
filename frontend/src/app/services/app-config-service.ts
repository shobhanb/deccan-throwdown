import { Injectable } from '@angular/core';
import { appConfig, AppConfig, defaultConfig } from '../config/config';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private config: AppConfig;
  private _eventShortName: string;

  constructor() {
    const subdomain = window.location.hostname.split('.')[0];
    this.config = appConfig[subdomain] || appConfig[defaultConfig];

    if (subdomain === 'localhost' || subdomain === '127') {
      this._eventShortName = defaultConfig;
    } else {
      this._eventShortName = subdomain;
    }
  }

  get eventShortName(): string {
    return this._eventShortName;
  }

  get eventName(): string {
    return this.config.eventName;
  }

  get categories(): string[] {
    return this.config.categories;
  }

  get athletesPerTeam(): number {
    return this.config.athletesPerTeam;
  }
}
