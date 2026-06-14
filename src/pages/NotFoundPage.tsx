import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui';

/** Explicit 404 route (CLAUDE.md §12). */
export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <CenteredMessage
      code="404"
      title={t('errors.notFound.title')}
      body={t('errors.notFound.body')}
      action={
        <Button
          onClick={() => {
            void navigate('/');
          }}
        >
          {t('nav.dashboard')}
        </Button>
      }
    />
  );
}

export function CenteredMessage({
  code,
  title,
  body,
  action,
}: {
  code: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-3)',
        minHeight: '70vh',
        textAlign: 'center',
      }}
    >
      <div className="mono" style={{ fontSize: 48, color: 'var(--text-3)' }}>
        {code}
      </div>
      <h1 style={{ fontSize: 'var(--fs-h2)', margin: 0 }}>{title}</h1>
      <p style={{ color: 'var(--text-2)', maxWidth: 420 }}>{body}</p>
      {action}
    </div>
  );
}
