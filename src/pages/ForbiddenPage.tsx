import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui';
import { CenteredMessage } from './NotFoundPage';

/** Explicit 403 route (CLAUDE.md §12). ProtectedRoute redirects here on permission failure. */
export default function ForbiddenPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <CenteredMessage
      code="403"
      title={t('errors.forbidden.title')}
      body={t('errors.forbidden.body')}
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
