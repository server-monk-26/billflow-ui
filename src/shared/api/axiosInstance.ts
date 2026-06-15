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
 */
export const axiosInstance = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeoutMs,
});

// ---- Request interceptor: attach auth, tenant, session, correlation, locale ----
axiosInstance.interceptors.request.use((req: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token) req.headers.set('Authorization', `Bearer ${token}`);

  const { tenantId, locale } = requestContext.get();
  if (tenantId) req.headers.set('X-Tenant-Id', tenantId);
  if (locale) req.headers.set('Accept-Language', locale);

  const sessionId = tokenStorage.getSessionId();
  if (sessionId) req.headers.set('X-Session-Id', sessionId);

  req.headers.set('X-Correlation-Id', correlationId());
  return req;
});

// ---- Refresh-token flow with stampede guard (single in-flight refresh) ----
let refreshPromise: Promise<string | null> | null = null;

interface RefreshData {
  accessToken: string;
  refreshToken?: string;
  sessionId?: string;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  // Bare axios (not the instance) to avoid recursive interceptors.
  // NOTE: endpoint/response shape will be confirmed when the backend is wired (deferred).
  const res = await axios.post<RefreshData>(
    `${config.api.baseUrl}/auth/refresh`,
    { refreshToken },
    { timeout: config.api.timeoutMs },
  );
  const data = res.data;
  tokenStorage.setAccessToken(data.accessToken);
  if (data.refreshToken) tokenStorage.setRefreshToken(data.refreshToken);
  if (data.sessionId) tokenStorage.setSessionId(data.sessionId);
  return data.accessToken;
}

interface RetriableConfig extends AxiosRequestConfig {
  _retried?: boolean;
}

// ---- Response interceptor: normalize errors, refresh-on-401 once, retry ----
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (RetriableConfig & InternalAxiosRequestConfig) | undefined;
    const status = error.response?.status;
    const isRefreshCall = original?.url?.includes('/auth/refresh');

    if (status === 401 && original && !original._retried && !isRefreshCall) {
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
      // Refresh failed → logout.
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
