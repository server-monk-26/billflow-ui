import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';

/**
 * The single RTK Query API (CLAUDE.md §9). Features extend it with `injectEndpoints`
 * in features/<x>/api — never create another createApi instance. Cache invalidation
 * uses these tagTypes via providesTags / invalidatesTags.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  // Register feature tag types here as features are added (keeps invalidation explicit).
  tagTypes: ['Auth', 'Tenant', 'Invoice', 'Customer'],
  endpoints: () => ({}),
});
