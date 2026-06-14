import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/** Browser MSW worker for local dev (CLAUDE.md §18). Requires `npx msw init public` once. */
export const worker = setupWorker(...handlers);
