import { isPlatformServer } from '@angular/common';
import {
  inject,
  Injectable,
  makeStateKey,
  PendingTasks,
  PLATFORM_ID,
  TransferState,
} from '@angular/core';
import { finalize } from 'rxjs';
import { apiTeamsOutputDetailModel } from '../api/models';
import { apiTeamsService } from '../api/services';
import { isArchivedEvent } from '../config/config';
import { fromApi } from './api-call.util';
import { pendingUntilComplete } from './ssr-pending-task.util';

export type EventTeamsLoadScope = 'leaderboard' | 'teams';

/** `transfer` = hydrated from TransferState; `network` = HTTP */
export type EventTeamsLoadResult = 'transfer' | 'network';

@Injectable({
  providedIn: 'root',
})
export class EventTeamsDataService {
  private apiTeams = inject(apiTeamsService);
  private transferState = inject(TransferState);
  private platformId = inject(PLATFORM_ID);
  private pendingTasks = inject(PendingTasks);

  load(
    scope: EventTeamsLoadScope,
    eventShortName: string,
    handlers: {
      onData: (data: apiTeamsOutputDetailModel[]) => void;
      onError: (error: unknown) => void;
      onSettled?: () => void;
    },
    options?: { forceNetwork?: boolean }
  ): EventTeamsLoadResult {
    const key = this.stateKey(scope, eventShortName);
    const forceNetwork = options?.forceNetwork ?? false;

    if (!forceNetwork && this.transferState.hasKey(key)) {
      handlers.onData(this.transferState.get(key, []));
      this.transferState.remove(key);
      handlers.onSettled?.();
      return 'transfer';
    }

    const archived = isArchivedEvent(eventShortName);

    const storeForTransfer =
      isPlatformServer(this.platformId) && archived && !forceNetwork;

    fromApi(
      this.apiTeams.getTeamsTeamsGet({
        event_short_name: eventShortName,
      })
    )
      .pipe(
        pendingUntilComplete(this.pendingTasks),
        finalize(() => handlers.onSettled?.())
      )
      .subscribe({
        next: (data) => {
          if (storeForTransfer) {
            this.transferState.set(key, data);
          }
          handlers.onData(data);
        },
        error: handlers.onError,
      });

    return 'network';
  }

  private stateKey(scope: EventTeamsLoadScope, eventShortName: string) {
    return makeStateKey<apiTeamsOutputDetailModel[]>(
      `${scope}-teams-${eventShortName}`
    );
  }
}
