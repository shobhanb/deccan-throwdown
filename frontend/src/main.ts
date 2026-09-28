import { bootstrapApplication } from '@angular/platform-browser';
import { mergeApplicationConfig } from '@angular/core';
import { AppComponent } from './app/app.component';
import { appConfig, browserAppConfig } from './app/app.config';

bootstrapApplication(
  AppComponent,
  mergeApplicationConfig(appConfig, browserAppConfig)
);
