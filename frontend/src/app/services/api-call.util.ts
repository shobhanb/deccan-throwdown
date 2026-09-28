import { HttpErrorResponse } from '@angular/common/http';
import { from, Observable } from 'rxjs';

/** Wrap a generated OpenAPI client Promise as an Observable. */
export function fromApi<T>(promise: Promise<T>): Observable<T> {
  return from(promise);
}

export function apiErrorStatusText(error: unknown, fallback = 'Unknown error'): string {
  if (error instanceof HttpErrorResponse) {
    return error.statusText || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function apiErrorDetail(error: unknown): string | null {
  if (error instanceof HttpErrorResponse) {
    const body = error.error;
    if (body && typeof body === 'object' && 'detail' in body) {
      const detail = (body as { detail?: unknown }).detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
    if (typeof body === 'string') {
      return body;
    }
    return error.statusText || null;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return null;
}
