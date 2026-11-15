# Deccan Throwdown — Baseline Context for Sister Projects

Use this document as the source of truth when modernizing another CF Games–family (or similar) project to match **deccan-throwdown**. Prefer patterns and versions from this repo over inventing new stack choices.

**Repo:** `deccan-throwdown`  
**Live domain pattern:** `{subdomain}.cfgames.site` (this app: `dt.cfgames.site`)  
**Product type:** Event competition PWA (athletes + volunteer admin)

---

## 1. Stack snapshot (target versions)

### Frontend
| Layer | Choice | Version (declared / locked) |
|-------|--------|-----------------------------|
| Framework | Angular (standalone) | **22.1.x** |
| UI shell | Ionic Angular | **9.0.x** |
| Icons | ionicons | **8.x** |
| Language | TypeScript | **~6.0.3** |
| Reactive | RxJS | **~7.8** |
| Change detection runtime | zone.js | **~0.15** |
| Auth / push client | `@angular/fire` | **^20.0.1** |
| SSR | `@angular/ssr` + Express | Angular 22 / Express **5.x** |
| PWA | `@angular/service-worker` + `ngsw-config.json` | Angular 22 |
| Build | Angular CLI application builder → static `www/` | CLI **22.1.x** |
| Lint | ESLint 9 flat + `angular-eslint` | ESLint **9.x** / angular-eslint **22.x** |
| Unit test | Karma + Jasmine | Karma **~6.4** / Jasmine **~5.1** |
| API client | `ng-openapi-gen` from FastAPI OpenAPI | Generated under `src/app/api/` |
| Native | **Not used** (no Capacitor/Cordova) | PWA only |

**Ionic project type:** `angular-standalone` (`ionic.config.json`). Mode: iOS-leaning Ionic chrome.

**TypeScript posture:** `strict: true`, `strictTemplates`, `target: es2022`, `moduleResolution: bundler`.

**Browsers:** Chrome/Firefox/Edge ≥106–107, Safari/iOS ≥16.1. `.npmrc` may set `legacy-peer-deps=true` for Angular Fire peer skew.

### Backend
| Layer | Choice | Version |
|-------|--------|---------|
| Runtime | Python | **3.12** (`.python-version`, Docker `python:3.12-slim-trixie`) |
| Package manager | **uv** + `uv.lock` | Image pin ~0.13.x |
| Framework | FastAPI (`fastapi[all]`) | **≥0.116.1** (locked 0.116.1) |
| Server | Uvicorn via `fastapi run` | locked ~0.35 |
| ORM | SQLAlchemy 2 async | **≥2.0.43** |
| DB driver | aiosqlite | **≥0.21** |
| Validation / settings | Pydantic v2 + pydantic-settings | **≥2.11.7** |
| Auth | firebase-admin | **≥7.1.0** |
| Email | Resend | **≥2.16** (lock may be newer) |
| Lint / types | ruff + ty | ruff **≥0.17**, ty **≥0.0.91** |

**Not in this baseline:** Alembic, pytest suite, GraphQL, Redis, Postgres (SQLite is intentional for this scale).

### Infrastructure
- **Docker Compose:** `backend` + `nginx:alpine` + `certbot/certbot`
- **Edge:** nginx serves `frontend/www`, TLS via Let’s Encrypt, proxies `/api/` → backend `:8000`
- **Backend root path:** `--root-path /api` (public URL `/api/...`)
- **Deploy:** DigitalOcean droplet; `scripts/deploy.sh` builds frontend locally, rsyncs `www/`, rebuilds compose on server
- **DB ops:** `scripts/backup-db.sh`, `scripts/sync-db.sh` for SQLite file sync

---

## 2. Repository layout to mirror

```
project/
├── frontend/          # Ionic Angular standalone SPA/PWA
├── backend/           # FastAPI + SQLite + Dockerfile
├── nginx/             # nginx.conf (+ nginx-initial.conf for first SSL)
├── certbot/           # Let’s Encrypt mounts
├── scripts/           # deploy, SSL init/renew, DB backup/sync
├── docker-compose.yaml
├── docker-compose.initial.yaml
└── README.md
```

### Frontend `src/app/` conventions
| Area | Path / pattern |
|------|----------------|
| Pages | `pages/public/`, `pages/admin/`, `pages/auth/` — `*.page.ts/html/scss` |
| Shared UI | `shared/<name>/<name>.component.ts` |
| Services | `services/*.service.ts` (`providedIn: 'root'`) |
| Guards | `guards/` functional guards |
| HTTP | `providers/http.interceptor.ts` (Bearer Firebase token) |
| Domain config | `config/config.ts` + `AppConfigService` (events, WODs, pricing, SEO) |
| Generated API | `api/` — do not hand-edit; regenerate from OpenAPI |
| Theme | `src/theme/variables.scss` + `src/global.scss` |

### Backend `app/` conventions
Domain packages with `models.py` / `schemas.py` / `views.py` (+ optional `service.py`):

- `athletes/`, `teams/`, `scores/`, `notifications/`, `firebase_auth/`, `apikey_auth/`
- Shared: `database/`, `settings.py`, `exceptions.py`, `schemas.py`, `main.py`
- Routes live in **`views.py`**, not `routers.py`
- UUID PKs, snake_case tables, `created_at` / `updated_at` on `Base`

---

## 3. Frontend architecture decisions

### Must follow
1. **Standalone components only** — no new NgModules (generated `ApiModule` is legacy residue).
2. **Lazy routes** via `loadComponent` / `loadChildren`; split `public` / `admin` / `auth` route files.
3. **Signals-first UI state** — `signal`, `computed`, `linkedSignal`, `input()`; RxJS for router, HTTP, Firebase streams.
4. **Angular Signal Forms** (`@angular/forms/signals`) for forms — prefer over classic `FormGroup` for new work.
5. **No NgRx / global store** — root services + page-local signals.
6. **OpenAPI client** — backend is source of truth; regenerate with `ng-openapi-gen` (`servicePrefix`/`modelPrefix`: `api`).
7. **SSR + static prerender** for public marketing/SEO routes; auth/admin and highly dynamic routes client-only.
8. **PWA** — service worker, web manifest, optional FCM messaging SW; install prompt UX allowed.
9. **Functional HTTP interceptor** attaches Firebase ID token as `Authorization: Bearer …`.
10. **Admin** behind functional `adminGuard` (Firebase custom claim `admin` + verified email).

### Shell UX
- `ion-app` → optional fixed admin banner → `ion-split-pane` (side menu ≥769px) + `ion-router-outlet` → custom floating bottom `tab-bar` on mobile → toast host.
- Desktop breakpoint: **769px**.
- Safe-area insets on toolbar, tab bar, FABs.
- Touch targets ≥44px.
- Ionic page transitions: **on mobile only**; disabled on desktop and suppressed on browser `popstate` (iOS double-transition fix).

### Feedback patterns
- `ToastService` (signal-driven custom toast)
- `AlertService` (Ionic alerts)
- `LoadingService` for blocking overlays
- API errors: extract detail/status helpers and toast; fail soft where appropriate (email/FCM)

---

## 4. Design system (copy these principles)

Brand tokens live in `frontend/src/theme/variables.scss`. CSS prefix for custom tokens/utilities: **`dt-*`**.

### Brand colors
| Token | Hex | Role |
|-------|-----|------|
| `--dt-brand-navy` | `#2b4c6f` | Primary brand / light-mode primary |
| `--dt-brand-steel` | `#4a6fa5` | Mid accent / category |
| `--dt-brand-silver` | `#8e9aaf` | Muted / unselected tabs |
| `--dt-brand-gold` | `#e5a319` | Secondary / selected tab / CTAs / live accents |
| Surfaces (light) | `#ffffff` / `#f2f2f7` | Cards / iOS-like grouped page bg |
| Surfaces (dark) | `#1a2332` / `#0a0f16` | Dark mode surfaces |

Ionic mapping: `--ion-color-primary` → navy (light) / `#8eb4e0` (dark); `--ion-color-secondary` → gold.  
Theme / PWA theme-color: navy. Border radius default: **12px**. Soft card shadow tinted with navy.

Hero gradient:
```scss
--dt-gradient-hero: linear-gradient(145deg, navy 0%, #1a3350 55%, #0f2438 100%);
```

### Typography
- **Display:** Bebas Neue (`--dt-font-display`) — uppercase titles, tight tracking, competition feel.
- **Body:** system / SF Pro / Segoe (`--ion-font-family`).
- Section labels: small uppercase, medium color, letter-spacing ~0.04em.

### Layout & components
- Prefer Ionic primitives (`ion-list` inset, `ion-item`, `ion-toolbar`, etc.) over custom card frameworks.
- Elevated surfaces: `.card-elevated` / soft shadow — use for interactive or content groupings, not decorative chrome dumps.
- Hero pattern (`.dt-hero`): navy diagonal gradient block, optional brand watermark SVG, circular logo, display title, status pill, dates — athletic, not SaaS marketing collage.
- WOD / score cards: gold left border accents; podium ranks gold/silver/bronze.
- Live indicators: subtle gold pulse (`.dt-live-badge` / `dt-pulse`) — sparse motion only.
- Home quick actions: compact 2×2 action tiles with press scale feedback.
- Admin: fixed navy “Admin Mode” banner; denser list rows.

### Theme mode
- Class-based dark: `body.dark` + `html.ion-palette-dark` (Ionic `dark.class` palette).
- Persist preference in `localStorage` (this app: key `dt-theme`).
- Default: **light**.

### Design anti-patterns (do not introduce)
- Purple-on-white / purple–indigo “AI SaaS” gradients
- Warm cream + terracotta editorial look
- Dense broadsheet / newspaper layouts
- Overuse of pills, stat strips, floating badges on heroes
- Full dark-mode-by-default without brand need
- Heavy multi-layer shadows / glow effects
- Emoji as UI decoration

### Motion
Ship only a few intentional motions: live pulse, press feedback, skeletons with brand-tinted shimmer, Ionic transitions on mobile. Prefer presence over noise.

---

## 5. Backend architecture decisions

### Must follow
1. **FastAPI REST** only; OpenAPI is the contract for the Angular client.
2. **Fully async** handlers + SQLAlchemy `AsyncSession`.
3. **SQLite + aiosqlite** for this class of event app unless the sister project has a hard requirement otherwise; document any divergence.
4. **Schema bootstrap** via `Base.metadata.create_all` on lifespan (no Alembic in baseline). Treat schema changes carefully on live SQLite.
5. **Auth dual path:**
   - Firebase Bearer ID token (users/admins; admin = custom claim + verified email)
   - `X-API-KEY` for machine/admin tooling; combine with Firebase admin where needed
6. **pydantic-settings** from `.env` (`extra="ignore"`); never scatter raw `os.environ`.
7. **Domain packages** with explicit exception helpers (`401` / `404` / `409`).
8. **BackgroundTasks** for email/push side effects; fail soft + log.
9. Quality bar: **ruff** + **ty**; add tests if the sister project needs them (this repo has little/no backend test suite).

### Typical integrations (adopt when the product needs them)
- **Resend** for transactional email
- **Firebase FCM** topics (`event_{shortName}`, `admin`)
- Payment: external payment-link pattern (this app: Razorpay short links) — keep money out of the app DB beyond paid/verified flags

### API surface shape (reference)
Prefixes/tags: `/health`, `/fireauth`, `/athletes`, `/teams`, `/scores`, `/notifications`.  
Multi-event via `event_short_name` on teams/scores and frontend route params.

---

## 6. Frontend ↔ backend contract

1. Develop against local backend `http://localhost:8000`.
2. Generate client: OpenAPI at `/openapi.json` → `frontend/src/app/api/` via `ng-openapi-gen`.
3. Production browser base URL: `https://{subdomain}.cfgames.site/api`.
4. CORS allow frontend origin + Ionic `8100` + Angular `4200` with credentials.
5. Dev proxy may only cover a subset of paths; local `apiBaseUrl` often points straight at `:8000`.
6. Strip PII on public team/athlete payloads; full fields for admin.

---

## 7. Domain patterns worth reusing

Even if the sister event differs, keep these structures:

- **Event config as TypeScript** (`config.ts`): active event, archives, WOD definitions, registration rules, pricing — not only DB-driven.
- **Categories** with color tokens (open / intermediate / beginner → navy / steel / silver).
- **Leaderboard + podium** as first-class UX.
- **Registration wizard** with athlete slots and clear requirements.
- **Archive routes:** `/resource/:eventShortName`.
- **Admin volunteer tools:** teams, scores, users, notifications, emails/phones, registration pricing toggles.
- **SEO:** route `data.seo`, `SeoService`, JSON-LD where useful; prerender public pages.

---

## 8. Coding conventions checklist

### Angular / Ionic
- [ ] Standalone components; selectors `app-*`
- [ ] Pages suffix `*Page`; components `*Component`
- [ ] SCSS with `dt-*` tokens; prefer theme variables over hardcoded brand hex in components
- [ ] Signals for UI state; wrap OpenAPI Promises with Observable helpers when streaming fits
- [ ] Strict TypeScript; fix rather than loosen
- [ ] ESLint ignores generated `src/app/api/**`

### Python / FastAPI
- [ ] Modern typing (`|`, `list[]`, `Annotated`)
- [ ] Pydantic v2 models; `response_model=` on routes
- [ ] Depends aliases (`db_dependency`, admin/api-key deps)
- [ ] UUID PKs; active-record helpers on `Base` (`find`, `find_or_raise`, …) where already established
- [ ] Lock deps with uv; Docker installs `--locked`

### Ops
- [ ] Compose: backend mounts `.env`, DB file, Firebase service account
- [ ] nginx: static SPA `try_files` + `/api/` reverse proxy + ACME webroot
- [ ] Deploy script builds frontend → rsync `www` → remote compose up
- [ ] Never overwrite production SQLite casually; use backup/sync scripts

---

## 9. Reference files to open first in this repo

| Purpose | Path |
|---------|------|
| Brand tokens | `frontend/src/theme/variables.scss` |
| Global UI utilities | `frontend/src/global.scss` |
| App shell | `frontend/src/app/app.component.*` |
| Bootstrap / providers | `frontend/src/app/app.config.ts` |
| Routes | `frontend/src/app/app.routes.ts` |
| Event domain config | `frontend/src/app/config/config.ts` |
| OpenAPI gen config | `frontend/ng-openapi-gen.json` |
| Representative UI | `frontend/src/app/pages/public/home/`, `leaderboard/`, `register/` |
| Shared chrome | `frontend/src/app/shared/menu/`, `tab-bar/`, `page-toolbar/` |
| FastAPI entry | `backend/app/main.py` |
| Settings | `backend/app/settings.py` |
| DB base | `backend/app/database/base.py` |
| Example domain | `backend/app/teams/`, `backend/app/scores/` |
| Compose / nginx | `docker-compose.yaml`, `nginx/nginx.conf` |
| Deploy | `scripts/deploy.sh` |

---

## 10. Modernization guidance for the sister project

When updating the other repo:

1. **Align versions** to the tables in §1 (Angular 22, Ionic 9, TS 6, Python 3.12, FastAPI 0.116+, SQLAlchemy 2 async, uv).
2. **Adopt standalone + signals + Signal Forms**; remove NgModules and outdated form patterns as you touch files.
3. **Rebuild theme** from `variables.scss` / `global.scss` principles — re-skin brand hex/fonts if the sister event has its own identity, but keep token structure, Ionic mapping, spacing scale, and anti-patterns.
4. **Wire OpenAPI codegen** instead of hand-written API DTOs where possible.
5. **Match shell UX** (split-pane + mobile tab bar + admin banner) before inventing a new navigation model.
6. **Match deploy shape** (static `www` + nginx `/api` + Compose) unless the sister project already has a better host; document divergences.
7. Prefer **behavior parity with this baseline** over one-off “modern” libraries (no random state managers, UI kits, or CSS frameworks) unless there is a clear gap.

### Intentional gaps in this baseline (only diverge with reason)
- No Capacitor / native apps
- No Alembic migrations
- Minimal automated backend tests
- SQLite, not Postgres
- `ChangeDetectionStrategy` not uniformly OnPush / not zoneless yet

---

## 11. One-paragraph briefing (paste into another agent)

> Treat **deccan-throwdown** as the design and stack baseline. Target Ionic Angular **standalone** on Angular **22** + Ionic **9**, TypeScript **6**, signals and Signal Forms, PWA/SSR to static `www/`, Firebase auth + FCM via `@angular/fire`, and OpenAPI clients from FastAPI. Backend is Python **3.12** + **uv**, FastAPI **0.116+**, SQLAlchemy **2 async** on SQLite, Firebase Admin + optional `X-API-KEY`, Resend email, Docker Compose with nginx/certbot on a VPS (`/api` reverse proxy). UI: navy `#2b4c6f` + gold `#e5a319` athletic brand, Bebas Neue display + system body, iOS-leaning Ionic chrome, class-based dark mode, sparse motion, `dt-*` design tokens in `theme/variables.scss`. Structure pages under public/admin/auth, shared shell components, domain config in TypeScript, no NgRx. Follow `BASELINE_CONTEXT.md` and the reference files listed there; do not introduce purple SaaS themes, extra UI kits, or Capacitor unless explicitly requested.
