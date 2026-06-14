import { useLocation } from 'react-router-dom';

/**
 * Generic placeholder for routes whose feature lands in a later phase (CLAUDE.md §20).
 * Keeps the shell navigable while the vertical feature slices are built.
 */
export default function PlaceholderPage() {
  const { pathname } = useLocation();
  const title = pathname.replace('/', '') || 'page';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
      <h1 style={{ fontSize: 'var(--fs-title)', fontWeight: 600, letterSpacing: '-0.02em', margin: 0, textTransform: 'capitalize' }}>
        {title}
      </h1>
      <p style={{ color: 'var(--text-2)' }}>
        This screen is scaffolded. Build the <code className="mono">{title}</code> feature here
        following the Phase 4 pattern (DataTable + RTK Query + RHF/Zod).
      </p>
    </div>
  );
}
