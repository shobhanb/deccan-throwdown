import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiHeatsDisplayConfigModel } from 'src/app/api/models/api-heats-display-config-model';
import { apiHeatsService } from 'src/app/api/services';
import {
  defaultHeatsDisplayConfig,
  normalizeHeatsDisplayConfig,
  normalizeHeatsPayload,
} from 'src/app/pages/public/display/heats-logic';
import {
  HeatsDisplayConfig,
  HeatsDocument,
  HeatsPayload,
} from 'src/app/pages/public/display/heats-types';

function mapDisplay(
  raw: apiHeatsDisplayConfigModel | null | undefined
): HeatsDisplayConfig {
  if (!raw) {
    return defaultHeatsDisplayConfig();
  }
  return normalizeHeatsDisplayConfig(raw);
}

function toApiDisplay(display: HeatsDisplayConfig): apiHeatsDisplayConfigModel {
  return {
    pics: display.pics,
    wod_desc_1: display.wodDesc1,
    wod_desc_2: display.wodDesc2,
    wod_desc_3: display.wodDesc3,
    wod_desc_4: display.wodDesc4,
    wod_desc_5: display.wodDesc5,
    heats_wod_1: display.heatsWod1,
    heats_wod_2: display.heatsWod2,
    heats_wod_3: display.heatsWod3,
    heats_wod_4_ttmm: display.heatsWod4Ttmm,
    heats_wod_4_rope: display.heatsWod4Rope,
    heats_wod_4_hold: display.heatsWod4Hold,
    heats_wod_5: display.heatsWod5,
    leaderboard_wod_1: display.leaderboardWod1,
    leaderboard_wod_2: display.leaderboardWod2,
    leaderboard_wod_3: display.leaderboardWod3,
    leaderboard_wod_4: display.leaderboardWod4,
    leaderboard_wod_5: display.leaderboardWod5,
    leaderboard_overall: display.leaderboardOverall,
    show_judges: display.showJudges,
    rotate_seconds: display.rotateSeconds,
  };
}

@Injectable({ providedIn: 'root' })
export class HeatsDataService {
  private apiHeats = inject(apiHeatsService);

  getHeats(eventShortName: string): Observable<HeatsDocument> {
    return from(
      this.apiHeats.readHeatsHeatsEventShortNameGet({
        event_short_name: eventShortName,
      })
    ).pipe(
      map(
        (doc): HeatsDocument => ({
          event_short_name: doc.event_short_name,
          payload: normalizeHeatsPayload(doc.payload as HeatsPayload),
          display: mapDisplay(doc.display),
          updated_at: doc.updated_at,
        })
      )
    );
  }

  putHeats(
    eventShortName: string,
    payload: HeatsPayload,
    display?: HeatsDisplayConfig | null
  ): Observable<HeatsDocument> {
    return from(
      this.apiHeats.upsertHeatsHeatsEventShortNamePut({
        event_short_name: eventShortName,
        body: {
          payload: normalizeHeatsPayload(payload),
          display: display ? toApiDisplay(display) : null,
        },
      })
    ).pipe(
      map(
        (doc): HeatsDocument => ({
          event_short_name: doc.event_short_name,
          payload: normalizeHeatsPayload(doc.payload as HeatsPayload),
          display: mapDisplay(doc.display),
          updated_at: doc.updated_at,
        })
      )
    );
  }
}
