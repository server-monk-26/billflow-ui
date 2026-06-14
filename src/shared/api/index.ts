export { baseApi } from './baseApi';
export { axiosBaseQuery } from './axiosBaseQuery';
export type { AxiosBaseQueryArgs } from './axiosBaseQuery';
export { apiBridge } from './apiBridge';
export { requestContext } from './requestContext';
export { toAppError, isAppError } from './errors';
export type { AppError } from './errors';
// Note: axiosInstance is intentionally NOT exported — components must use RTK Query hooks (§3.1).
