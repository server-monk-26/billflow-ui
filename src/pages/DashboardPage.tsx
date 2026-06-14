import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/shared/lib';

/**
 * Placeholder dashboard — demonstrates the token system (stat tiles, mono numerics, status
 * pills) so the design language is visible from day one. Replace with a real feature in a
 * later phase. Numbers use the `mono` class for tabular figures (Design Spec P4).
 */
const STATS = [
  { labelKey: 'Outstanding', value: 1_240_500, accent: false },
  { labelKey: 'Paid this month', value: 8_640_000, accent: false },
  { labelKey: 'Overdue', value: 312_400, accent: true },
];

const ROWS = [
  { id: 'INV-2026-0418', customer: 'Reliance Retail Ltd.', status: 'Paid', amount: 124500 },
  { id: 'INV-2026-0417', customer: 'Tata Digital', status: 'Sent', amount: 89000 },
  { id: 'INV-2026-0416', customer: 'Big Bazaar', status: 'Overdue', amount: 56400 },
];

const STATUS_COLOR: Record<string, string> = {
  Paid: 'var(--success)',
  Sent: 'var(--info)',
  Overdue: 'var(--danger)',
};

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
      <h1 style={{ fontSize: 'var(--fs-title)', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
        {t('nav.dashboard')}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--sp-4)' }}>
        {STATS.map((s) => (
          <div
            key={s.labelKey}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              padding: 'var(--sp-4)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div style={{ fontSize: 'var(--fs-eyebrow)', textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.04em' }}>
              {s.labelKey}
            </div>
            <div
              className="mono"
              style={{ fontSize: 'var(--fs-title)', marginTop: 'var(--sp-2)', color: s.accent ? 'var(--danger)' : 'var(--text)' }}
            >
              {formatCurrency(s.value)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-body)' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {['Invoice', 'Customer', 'Status', 'Amount'].map((h, i) => (
                <th
                  key={h}
                  style={{
                    textAlign: i === 3 ? 'right' : 'left',
                    padding: 'var(--sp-2) var(--sp-3)',
                    fontSize: 'var(--fs-eyebrow)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--text-3)',
                    fontWeight: 600,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="mono" style={{ padding: 'var(--sp-2) var(--sp-3)' }}>{r.id}</td>
                <td style={{ padding: 'var(--sp-2) var(--sp-3)' }}>{r.customer}</td>
                <td style={{ padding: 'var(--sp-2) var(--sp-3)' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 'var(--fs-label)',
                      color: STATUS_COLOR[r.status],
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[r.status] }} />
                    {r.status}
                  </span>
                </td>
                <td className="mono" style={{ padding: 'var(--sp-2) var(--sp-3)', textAlign: 'right' }}>
                  {formatCurrency(r.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
