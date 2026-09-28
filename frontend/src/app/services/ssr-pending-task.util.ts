import { PendingTasks } from '@angular/core';
import { finalize, MonoTypeOperatorFunction } from 'rxjs';

/** Keeps SSG/prerender from finishing until an HTTP request completes. */
export function pendingUntilComplete<T>(
  pendingTasks: PendingTasks
): MonoTypeOperatorFunction<T> {
  const removeTask = pendingTasks.add();
  return finalize(() => removeTask());
}
