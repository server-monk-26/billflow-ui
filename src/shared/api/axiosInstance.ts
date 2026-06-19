import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { config } from '@/config';
import { logger } from '@/shared/logger';
import { correlationId } from '@/shared/lib';
import { tokenStorage } from '@/shared/auth/tokenStorage';
import { apiBridge } from './apiBridge';
import { requestContext } from './requestContext';
import { toAppError } from './errors';

/**
 * The single axios instance and the ONLY place interceptors live (CLAUDE.md §9).
 * RTK Query consumes this via axiosBaseQuery; components never import it directly.
 *
 * The BillFlow backend wraps every response in `{ success, message, data, timestamp }`. The
 * success interceptor unwraps `.data`. On 401 the body carries an `errorCode`:
 *   - AUTH_TOKEN_EXPIRED    → refresh the access token (once, stampede-guarded) and retry.
 *   - REFRESH_TOKEN_EXPIRED → force logout (refresh is gone).
 *   - anything else (401)   → force logout (unauthorized).
 */
export const axiosInstance = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeoutMs,
});

interface ApiEnvelope<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

function isEnvelope(value: unknown): value is ApiEnvelope {
  return typeof value === 'object' && value !== null && 'success' in value && 'data' in value;
}

function errorCodeOf(error: AxiosError): string | undefined {
  const body = error.response?.data as { errorCode?: string } | undefined;
  return body?.errorCode;
}

// ---- Request interceptor: attach auth, correlation, locale ----
axiosInstance.interceptors.request.use((req: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token) req.headers.set('Authorization', `Bearer ${token}`);

  const { locale } = requestContext.get();
  if (locale) req.headers.set('Accept-Language', locale);

  req.headers.set('X-Correlation-Id', correlationId());
  return req;
});

// ---- Refresh-token flow with stampede guard (single in-flight refresh) ----
let refreshPromise: Promise<string | null> | null = null;

interface RefreshData {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  const sessionId = tokenStorage.getSessionId();
  if (!refreshToken || !sessionId) return null;

  // Bare axios (not the instance) to avoid recursive interceptors; unwrap the envelope manually.
  const res = await axios.post(
    `${config.api.baseUrl}/v1/auth/refresh`,
    { sessionId, refreshToken },
    { timeout: config.api.timeoutMs },
  );
  const payload: unknown = res.data;
  const data = (isEnvelope(payload) ? payload.data : payload) as RefreshData;
  tokenStorage.setAccessToken(data.accessToken);
  tokenStorage.setRefreshToken(data.refreshToken);
  tokenStorage.setSessionId(data.sessionId);
  return data.accessToken;
}

interface RetriableConfig extends AxiosRequestConfig {
  _retried?: boolean;
}

// ---- Response interceptor: unwrap envelope, normalize errors, refresh-on-401, retry ----
axiosInstance.interceptors.response.use(
  (response) => {
    if (isEnvelope(response.data)) response.data = response.data.data;
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as (RetriableConfig & InternalAxiosRequestConfig) | undefined;
    const status = error.response?.status;
    const code = errorCodeOf(error);
    const isRefreshCall = original?.url?.includes('/auth/refresh');

    if (status === 401 && original && !original._retried && !isRefreshCall) {
      if (code === 'AUTH_TOKEN_EXPIRED') {
        original._retried = true;
        try {
          refreshPromise ??= refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
          const newToken = await refreshPromise;
          if (newToken) {
            original.headers.set('Authorization', `Bearer ${newToken}`);
            return axiosInstance(original);
          }
        } catch (refreshError) {
          logger.warn('Token refresh failed; logging out', toAppError(refreshError));
        }
      }
      // REFRESH_TOKEN_EXPIRED, a failed refresh, or any other 401 → force logout.
      tokenStorage.clear();
      apiBridge.emitAuthFailure();
    }

    const appError = toAppError(error);
    logger.error(`API error: ${appError.code}`, appError);
    apiBridge.emitError(appError);
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- AppError is the normalized error shape that axiosBaseQuery unwraps (§9).
    return Promise.reject(appError);
  },
);
