import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { AppConfigService } from './app-config-service';
import {
  SEO_DEFAULT_KEYWORDS,
  SEO_VENUE,
  SeoRouteData,
} from '../config/seo.config';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);
  private appConfig = inject(AppConfigService);

  private readonly siteUrl = environment.siteUrl.replace(/\/$/, '');
  private readonly defaultOgImage = `${this.siteUrl}/icons/logo_512.jpg`;

  applyForUrl(path: string, routeSeo?: SeoRouteData): void {
    const normalizedPath = this.normalizePath(path);
    const noindex =
      normalizedPath.startsWith('/admin') ||
      normalizedPath.startsWith('/auth');

    if (noindex) {
      this.applyNoIndex(normalizedPath);
      return;
    }

    const seo = routeSeo ?? this.defaultPublicSeo();
    this.applyIndexableMeta(seo, normalizedPath);

  }

  private defaultPublicSeo(): SeoRouteData {
    return {
      title: 'Deccan Throwdown — CrossFit Team Competition',
      description: this.homeDescription(),
    };
  }

  private homeDescription(): string {
    const { eventName, eventDates, tagline } = this.appConfig.config;
    return `${eventName} (${eventDates}) at ${SEO_VENUE.name} in ${SEO_VENUE.addressLocality}. ${tagline} Register, view WODs, teams, and the live CrossFit leaderboard.`;
  }

  private applyIndexableMeta(seo: SeoRouteData, path: string): void {
    const canonicalUrl = `${this.siteUrl}${path}`;

    this.title.setTitle(seo.title);
    this.setNamedMeta('description', seo.description);
    this.setNamedMeta('keywords', SEO_DEFAULT_KEYWORDS);
    this.setNamedMeta('robots', 'index, follow');

    this.setNamedMeta('og:title', seo.title, true);
    this.setNamedMeta('og:description', seo.description, true);
    this.setNamedMeta('og:url', canonicalUrl, true);
    this.setNamedMeta('og:type', 'website', true);
    this.setNamedMeta('og:image', this.defaultOgImage, true);
    this.setNamedMeta('og:site_name', 'Deccan Throwdown', true);

    this.setNamedMeta('twitter:card', 'summary_large_image');
    this.setNamedMeta('twitter:title', seo.title);
    this.setNamedMeta('twitter:description', seo.description);
    this.setNamedMeta('twitter:image', this.defaultOgImage);

    this.setLinkCanonical(canonicalUrl);
  }

  private applyNoIndex(path: string): void {
    const section = path.startsWith('/admin') ? 'Admin' : 'Account';
    this.title.setTitle(`Deccan Throwdown — ${section}`);
    this.setNamedMeta('description', 'Deccan Throwdown competition app.');
    this.setNamedMeta('robots', 'noindex, nofollow');
    this.removeLinkCanonical();
  }

  private setNamedMeta(
    name: string,
    content: string,
    isProperty = false
  ): void {
    const selector = isProperty ? `property='${name}'` : `name='${name}'`;
    const tag = isProperty ? 'property' : 'name';
    if (this.meta.getTag(selector)) {
      this.meta.updateTag({ [tag]: name, content });
    } else {
      this.meta.addTag({ [tag]: name, content });
    }
  }

  private setLinkCanonical(href: string): void {
    let link = this.document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private removeLinkCanonical(): void {
    this.document.querySelector('link[rel="canonical"]')?.remove();
  }

  private normalizePath(url: string): string {
    const path = url.split('?')[0].split('#')[0];
    if (!path || path === '/') {
      return '/';
    }
    return path.endsWith('/') && path.length > 1
      ? path.slice(0, -1)
      : path;
  }
}
