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

/** BillFlow error envelope: { success:false, errorCode, message, path, fieldErrors[], timestamp }. */
interface FieldError {
  field: string;
  message: string;
  rejectedValue?: unknown;
}
interface BackendErrorBody {
  success?: boolean;
  errorCode?: string;
  message?: string;
  fieldErrors?: FieldError[];
}

export function isAppError(value: unknown): value is AppError {
  // Note the `!instanceof Error` guard: an Axios v1 AxiosError also has status/code/message,
  // so without it a raw AxiosError would be mistaken for an already-normalized AppError and
  // returned unchanged (losing the backend message + leaking a non-serializable value).
  return (
    typeof value === 'object' &&
    value !== null &&
    !(value instanceof Error) &&
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
    const details = body?.fieldErrors?.length
      ? Object.fromEntries(body.fieldErrors.map((f) => [f.field, f.message]))
      : undefined;
    return {
      status,
      code: body?.errorCode ?? (status === 0 ? 'NETWORK_ERROR' : `HTTP_${status}`),
      message: body?.message ?? error.message ?? 'Request failed',
      ...(details ? { details } : {}),
    };
  }

  if (error instanceof Error) {
    return { status: 0, code: 'UNKNOWN', message: error.message };
  }

  return { status: 0, code: 'UNKNOWN', message: 'An unexpected error occurred' };
}
