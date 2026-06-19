import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * Feature flags (CLAUDE.md §16.4). Effective value resolves by precedence:
 *   static defaults  →  local dev override
 *
 * The provider interface is deliberately minimal so a SaaS provider (LaunchDarkly, Unleash) or
 * server-driven flags can be layered in later without touching `useFeatureFlag`/`<Feature>` sites.
 */

/** Build-time defaults. Add keys here; server/tenant can override at runtime. */
export const FLAG_DEFAULTS: Record<string, boolean> = {
  'invoices.bulkActions': false,
  'billing.newDashboard': false,
};

const DEV_OVERRIDE_KEY = 'billflow.flags';

function loadDevOverrides(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(DEV_OVERRIDE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

interface FeatureFlagContextValue {
  flags: Record<string, boolean>;
  isEnabled: (key: string) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const value = useMemo<FeatureFlagContextValue>(() => {
    const flags: Record<string, boolean> = { ...FLAG_DEFAULTS, ...loadDevOverrides() };
    return { flags, isEnabled: (key) => flags[key] ?? false };
  }, []);

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
}

export function useFeatureFlag(key: string): boolean {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) throw new Error('useFeatureFlag must be used within a FeatureFlagProvider');
  return ctx.isEnabled(key);
}

export function Feature({
  flag,
  fallback = null,
  children,
}: {
  flag: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const enabled = useFeatureFlag(flag);
  return <>{enabled ? children : fallback}</>;
}
