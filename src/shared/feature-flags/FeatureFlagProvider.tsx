import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth, type WithAuth } from '@/shared/auth';
import { selectActiveTenant, type WithTenant } from '@/shared/tenant';

/**
 * Feature flags (CLAUDE.md §16.4). Effective value resolves by precedence:
 *   static defaults  →  server (auth payload)  →  tenant override  →  local dev override
 *
 * The provider interface is deliberately minimal so a SaaS provider (LaunchDarkly, Unleash)
 * can be dropped in later without touching `useFeatureFlag`/`<Feature>` call sites.
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
  const auth = useSelector((s: WithAuth) => selectAuth(s));
  const tenant = useSelector((s: WithTenant) => selectActiveTenant(s));

  const value = useMemo<FeatureFlagContextValue>(() => {
    const flags: Record<string, boolean> = {
      ...FLAG_DEFAULTS,
      ...auth.featureFlags,
      ...(tenant?.featureFlagOverrides ?? {}),
      ...loadDevOverrides(),
    };
    return {
      flags,
      isEnabled: (key) => flags[key] ?? false,
    };
  }, [auth.featureFlags, tenant?.featureFlagOverrides]);

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
