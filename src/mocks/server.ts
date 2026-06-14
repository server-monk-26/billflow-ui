import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** Node MSW server for tests (CLAUDE.md §18). Started/stopped in src/test/setup.ts. */
export const server = setupServer(...handlers);
