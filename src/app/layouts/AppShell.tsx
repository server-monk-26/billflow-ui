import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Moon,
  Sun,
  LogOut,
  PanelLeft,
  type LucideIcon,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useThemeMode, toggleSidebar } from '@/shared/theme';
import { selectMenus, loggedOut, tokenStorage } from '@/shared/auth';
import { clearTenant } from '@/shared/tenant';
import { usePermissions } from '@/shared/permissions';
import { Loader } from '@/shared/ui';
import './AppShell.css';

/**
 * App shell (Design Spec §10 — fixed left sidebar + main column). Nav renders from the
 * server-driven menu (filtered by permission, §16.1) with a static fallback. Footer carries
 * the theme toggle, sidebar collapse, and sign-out. Routes render lazily into the Outlet.
 */
const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  invoices: FileText,
  customers: Users,
  settings: Settings,
};

interface NavEntry {
  to: string;
  labelKey: string;
  icon: string;
  permission?: string;
}

const FALLBACK_NAV: NavEntry[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: 'dashboard' },
  { to: '/invoices', labelKey: 'nav.invoices', icon: 'invoices', permission: 'invoice:read' },
  { to: '/customers', labelKey: 'nav.customers', icon: 'customers', permission: 'customer:read' },
  { to: '/settings', labelKey: 'nav.settings', icon: 'settings' },
];

export function AppShell() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { mode, toggle } = useThemeMode();
  const { has } = usePermissions();
  const menus = useAppSelector(selectMenus);

  // Prefer server menus; fall back to the static set when none are provided yet.
  const nav: NavEntry[] =
    menus.length > 0
      ? menus.map((m) => ({
          to: m.path ?? '/',
          labelKey: m.labelKey,
          icon: m.icon ?? 'dashboard',
          ...(m.permission ? { permission: m.permission } : {}),
        }))
      : FALLBACK_NAV;

  const visibleNav = nav.filter((n) => !n.permission || has(n.permission));

  const signOut = () => {
    tokenStorage.clear();
    dispatch(loggedOut());
    dispatch(clearTenant());
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__logo">B</span>
          <span className="sidebar__brand-text">{t('app.name')}</span>
        </div>

        <nav className="sidebar__nav">
          {visibleNav.map((item) => {
            const Icon = ICONS[item.icon] ?? LayoutDashboard;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
              >
                <Icon size={16} strokeWidth={1.6} />
                <span>{t(item.labelKey)}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <button
            type="button"
            className="icon-btn"
            onClick={toggle}
            aria-label={t('theme.toggle')}
          >
            {mode === 'dark' ? <Sun size={16} strokeWidth={1.6} /> : <Moon size={16} strokeWidth={1.6} />}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => dispatch(toggleSidebar())}
            aria-label="Collapse sidebar"
          >
            <PanelLeft size={16} strokeWidth={1.6} />
          </button>
          <button type="button" className="icon-btn" onClick={signOut} aria-label={t('actions.signOut')}>
            <LogOut size={16} strokeWidth={1.6} />
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <span className="topbar__crumb">{t('app.name')}</span>
        </header>
        <main className="content">
          <Suspense fallback={<Loader variant="page" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
