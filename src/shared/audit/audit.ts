// Audit is disabled in this build. Calls are no-ops to avoid outbound network requests.
export interface AuditEvent {
  action: string;
  target?: string;
  meta?: Record<string, string | number | boolean>;
  actor?: string;
  tenant?: string;
  timestamp?: string;
  correlationId?: string;
}

export const audit = {
  record(_: AuditEvent): void {
    /* no-op */
  },
  async flush(): Promise<void> {
    return;
  },
};
