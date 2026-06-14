import type { AppError } from './errors';

/**
 * Decouples the transport from the store (CLAUDE.md §9, §17). The axios interceptor invokes
 * these hooks; the app registers concrete handlers at startup (dispatch logout, show toast,
 * record audit). Keeps the interceptor free of import-time store dependencies.
 */

type AuthFailureHandler = () => void;
type ErrorHandler = (error: AppError) => void;

let onAuthFailure: AuthFailureHandler = () => {};
let onError: ErrorHandler = () => {};

export const apiBridge = {
  registerAuthFailureHandler(fn: AuthFailureHandler): void {
    onAuthFailure = fn;
  },
  registerErrorHandler(fn: ErrorHandler): void {
    onError = fn;
  },
  emitAuthFailure(): void {
    onAuthFailure();
  },
  emitError(error: AppError): void {
    onError(error);
  },
};
