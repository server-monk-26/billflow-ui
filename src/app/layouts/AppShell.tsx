import { Suspense, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Boxes,
  Database,
  BarChart3,
  ShieldCheck,
  Settings as SettingsIcon,
  Building2,
  Warehouse,
  ChevronRight,
  Moon,
  Sun,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useThemeMode } from '@/shared/theme';
import { loggedOut, tokenStorage } from '@/shared/auth';
import { clearTenant } from '@/shared/tenant';
import {
  clearOrg,
  selectBusiness,
  selectLegalEntities,
  selectStorageUnits,
  selectActiveLegalEntityId,
  selectActiveStorageUnitId,
  setActiveLegalEntity,
  setActiveStorageUnit,
} from '@/shared/org';
import { usePermissions } from '@/shared/permissions';
import { useLoadCurrentUser } from '@/features/auth';
import { Dropdown, Loader } from '@/shared/ui';
import { NAV, filterNav, type NavGroup } from '@/app/navigation';
import './AppShell.css';

/**
 * App shell (Design Spec §10). A full-width top nav-bar carries the brand (logo + BillFlow +
 * business name as subtext) on the left and the legal-entity / storage-unit context switchers
 * plus theme + sign-out on the right. The sidebar sits below the nav-bar and renders a
 * collapsible navigation tree filtered by the user's permissions (§16.1, §16.2).
 */
const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  purchase: ShoppingCart,
  sale: Receipt,
  inventory: Boxes,
  masterData: Database,
  report: BarChart3,
  admin: ShieldCheck,
  settings: SettingsIcon,
};

export function AppShell() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { mode, toggle } = useThemeMode();
  const { has } = usePermissions();

  // Loads GET /me into the global store on the authenticated home page.
  useLoadCurrentUser();

  const business = useAppSelector(selectBusiness);
  const legalEntities = useAppSelector(selectLegalEntities);
  const storageUnits = useAppSelector(selectStorageUnits);
  const activeLegalEntityId = useAppSelector(selectActiveLegalEntityId);
  const activeStorageUnitId = useAppSelector(selectActiveStorageUnitId);

  // A freshly-created business must finish onboarding before using the app.
  if (business?.status === 'PENDING_ONBOARDING') {
    return <Navigate to="/onboarding" replace />;
  }

  const nav = filterNav(NAV, has);

  const signOut = () => {
    tokenStorage.clear();
    dispatch(loggedOut());
    dispatch(clearTenant());
    dispatch(clearOrg());
  };

  return (
    <div className="shell">
      <header className="navbar">
        <div className="navbar__brand">
          <span className="navbar__logo">B</span>
          <span className="navbar__brand-text">
            <span className="navbar__brand-name">{t('app.name')}</span>
            {business?.name && <span className="navbar__brand-sub">{business.name}</span>}
          </span>
        </div>

        <div className="navbar__right">
          {legalEntities.length > 0 && (
            <Dropdown
              ariaLabel={t('context.legalEntity')}
              data-testid="le-switcher"
              value={activeLegalEntityId}
              onChange={(id) => dispatch(setActiveLegalEntity(id))}
              leadingIcon={<Building2 size={14} strokeWidth={1.8} style={{ color: 'var(--text-3)' }} />}
              options={legalEntities.map((e) => ({
                value: e.id,
                label: e.legalName,
                ...(e.gstin ? { sublabel: e.gstin } : {}),
              }))}
            />
          )}
          {storageUnits.length > 0 && (
            <Dropdown
              ariaLabel={t('context.storageUnit')}
              data-testid="su-switcher"
              value={activeStorageUnitId}
              onChange={(id) => dispatch(setActiveStorageUnit(id))}
              leadingIcon={<Warehouse size={14} strokeWidth={1.8} style={{ color: 'var(--text-3)' }} />}
              options={storageUnits.map((u) => ({
                value: u.id,
                label: u.name,
                ...(u.city ? { sublabel: u.city } : {}),
              }))}
            />
          )}

          <span className="navbar__divider" />

          <button type="button" className="icon-btn" onClick={toggle} aria-label={t('theme.toggle')}>
            {mode === 'dark' ? <Sun size={16} strokeWidth={1.6} /> : <Moon size={16} strokeWidth={1.6} />}
          </button>
          <button type="button" className="icon-btn" onClick={signOut} aria-label={t('actions.signOut')}>
            <LogOut size={16} strokeWidth={1.6} />
          </button>
        </div>
      </header>

      <div className="shell__body">
        <aside className="sidebar">
          <SidebarNav nav={nav} />
        </aside>
        <main className="content">
          <Suspense fallback={<Loader variant="page" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function SidebarNav({ nav }: { nav: NavGroup[] }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  // Auto-expand the group that owns the active route.
  const activeGroupId = nav.find((g) => g.children?.some((c) => pathname.startsWith(c.path)))?.id;
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    activeGroupId ? { [activeGroupId]: true } : {},
  );

  const toggleGroup = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {nav.map((group) => {
        const Icon = ICONS[group.icon] ?? LayoutDashboard;

        if (!group.children) {
          return (
            <NavLink
              key={group.id}
              to={group.path ?? '/'}
              end={group.path === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
            >
              <Icon size={16} strokeWidth={1.6} />
              <span>{t(group.labelKey)}</span>
            </NavLink>
          );
        }

        const isOpen = expanded[group.id] ?? false;
        return (
          <div key={group.id}>
            <button
              type="button"
              className="nav-group__toggle"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={isOpen}
            >
              <Icon size={16} strokeWidth={1.6} />
              <span className="nav-group__toggle-label">{t(group.labelKey)}</span>
              <ChevronRight
                size={14}
                strokeWidth={1.8}
                className={`nav-group__chevron${isOpen ? ' nav-group__chevron--open' : ''}`}
              />
            </button>
            {isOpen && (
              <div className="nav-subitems">
                {group.children.map((child) => (
                  <NavLink
                    key={child.id}
                    to={child.path}
                    className={({ isActive }) => `nav-subitem${isActive ? ' nav-subitem--active' : ''}`}
                  >
                    {t(child.labelKey)}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
