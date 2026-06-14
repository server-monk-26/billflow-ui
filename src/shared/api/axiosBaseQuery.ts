import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig } from 'axios';
import { axiosInstance } from './axiosInstance';
import { toAppError, type AppError } from './errors';

/**
 * Adapts the single axios instance to RTK Query's baseQuery signature (CLAUDE.md §9).
 * This is the reconciliation point: Axios is the transport + interceptor choke point,
 * RTK Query is the consumption layer. Errors are already normalized to AppError by the
 * response interceptor; we re-normalize defensively so the error type is always AppError.
 */
export interface AxiosBaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: unknown;
  params?: unknown;
  headers?: AxiosRequestConfig['headers'];
  signal?: AbortSignal;
}

export function axiosBaseQuery(): BaseQueryFn<AxiosBaseQueryArgs, unknown, AppError> {
  return async ({ url, method = 'GET', data, params, headers, signal }) => {
    try {
      // Build the config without undefined keys (exactOptionalPropertyTypes).
      const requestConfig: AxiosRequestConfig = { url, method };
      if (data !== undefined) requestConfig.data = data;
      if (params !== undefined) requestConfig.params = params;
      if (headers !== undefined) requestConfig.headers = headers;
      if (signal !== undefined) requestConfig.signal = signal;
      const result = await axiosInstance(requestConfig);
      return { data: result.data as unknown };
    } catch (error) {
      return { error: toAppError(error) };
    }
  };
}
