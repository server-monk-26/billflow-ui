/**
 * Ambient request context for the axios interceptors (CLAUDE.md §9, §11).
 *
 * The interceptor must attach X-Tenant-Id and the active locale to every request, but it
 * must NOT import the Redux store (that would create a transport→store→transport cycle and
 * an import-time singleton that breaks under module federation, §17). Instead the app keeps
 * this tiny context updated via a store subscriber, and the interceptor reads it synchronously.
 */

export interface RequestContext {
  tenantId: string | null;
  locale: string | null;
}

let context: RequestContext = { tenantId: null, locale: null };

export const requestContext = {
  set(next: Partial<RequestContext>): void {
    context = { ...context, ...next };
  },
  get(): Readonly<RequestContext> {
    return context;
  },
};
