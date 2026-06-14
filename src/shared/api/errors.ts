import { AxiosError } from 'axios';

/**
 * Normalized application error (CLAUDE.md §9). Every transport error is mapped to this
 * single shape before it reaches RTK Query, the toast, the logger, or RHF `setError`.
 */
export interface AppError {
  status: number;
  code: string;
  message: string;
  /** Field-level errors keyed by form field name, surfaced back into RHF (§13). */
  details?: Record<string, string>;
}

interface BackendErrorBody {
  code?: string;
  message?: string;
  errors?: Record<string, string>;
}

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'code' in value &&
    'message' in value
  );
}

/** Map any thrown value (Axios or otherwise) to a stable AppError. */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;

  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0;
    const body = error.response?.data as BackendErrorBody | undefined;
    return {
      status,
      code: body?.code ?? (status === 0 ? 'NETWORK_ERROR' : `HTTP_${status}`),
      message: body?.message ?? error.message ?? 'Request failed',
      ...(body?.errors ? { details: body.errors } : {}),
    };
  }

  if (error instanceof Error) {
    return { status: 0, code: 'UNKNOWN', message: error.message };
  }

  return { status: 0, code: 'UNKNOWN', message: 'An unexpected error occurred' };
}
