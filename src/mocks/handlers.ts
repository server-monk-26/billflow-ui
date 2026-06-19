import { http, HttpResponse } from 'msw';
import { config } from '@/config';

/**
 * MSW request handlers (CLAUDE.md §18) — mock the BillFlow backend for tests (and optional local
 * dev). Responses use the standard envelope `{ success, message, data, timestamp }`; errors use
 * `{ success:false, errorCode, message, fieldErrors }`. Tests override individual handlers with
 * `server.use(...)` when they need a specific case (e.g. a PENDING_ONBOARDING /me).
 */
const base = config.api.baseUrl;
const ok = (data: unknown, status = 200) =>
  HttpResponse.json({ success: true, message: 'OK', data, timestamp: new Date().toISOString() }, { status });
const fail = (errorCode: string, message: string, status: number) =>
  HttpResponse.json({ success: false, errorCode, message, fieldErrors: [], timestamp: new Date().toISOString() }, { status });

export const meActive = {
  user: { id: 'u_1', username: '653410', status: 'ACTIVE' },
  roles: ['ADMIN'],
  permissions: ['PRODUCT.VIEW', 'CUSTOMER.VIEW', 'INVENTORY.VIEW', 'EMPLOYEE.VIEW', 'ROLE.VIEW', 'LEGAL_ENTITY.VIEW', 'SETTINGS.VIEW', 'DOCUMENT.VIEW', 'REPORT.SALES', 'REPORT.PURCHASE', 'REPORT.INVENTORY'],
  tenant: { id: 't_1', name: 'Acme Traders' },
  business: { id: 'b_1', tenantId: 't_1', name: 'Acme Traders', businessType: 'RETAILER', sector: 'Electronics', status: 'ACTIVE' },
  employee: { id: 'e_1', firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com', mobile: '9007091265', status: 'ACTIVE' },
  legalEntities: [{ id: 'le_1', legalName: 'Acme Traders Pvt Ltd', gstin: '27ABCDE1234F1Z5', city: 'Pune', state: 'Maharashtra', isPrimary: true, status: 'ACTIVE' }],
  storageUnits: [{ id: 'su_1', name: 'Main Warehouse', type: 'WAREHOUSE', city: 'Pune', isDefault: true, status: 'ACTIVE' }],
};

export const handlers = [
  http.post(`${base}/v1/auth/signup/initiate`, () => ok({ sessionId: 'sess_123' }, 201)),

  http.post(`${base}/v1/auth/verify-otp`, async ({ request }) => {
    const channel = new URL(request.url).searchParams.get('channel');
    const body = (await request.json().catch(() => ({}))) as { otp?: string };
    const expected = channel === 'EMAIL' ? '123456' : '987654';
    if (body.otp === expected) return ok({ verified: true });
    return fail('INVALID_OTP', 'Invalid OTP', 400);
  }),

  http.post(`${base}/v1/auth/onboard`, () =>
    ok({ tenantId: 't_1', businessId: 'b_1', employeeId: 'e_1', userId: 'u_1', username: '653410', email: 'jane@acme.com' }, 201),
  ),

  http.post(`${base}/v1/auth/login`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { username?: string; password?: string };
    if (body.password === 'wrong') return fail('INVALID_CREDENTIALS', 'Invalid username or password', 401);
    if (body.username === 'reset') {
      return ok({ status: 'PASSWORD_CHANGE_REQUIRED', passwordChangeToken: 'pct_123' });
    }
    return ok({ status: 'SUCCESS', accessToken: 'at_1', refreshToken: 'rt_1', sessionId: 'as_1', expiresIn: 1800 });
  }),

  http.post(`${base}/v1/auth/change-password`, () =>
    ok({ status: 'SUCCESS', accessToken: 'at_1', refreshToken: 'rt_1', sessionId: 'as_1', expiresIn: 1800 }),
  ),

  http.post(`${base}/v1/auth/refresh`, () =>
    ok({ accessToken: 'at_2', refreshToken: 'rt_2', sessionId: 'as_1', expiresIn: 1800 }),
  ),

  http.post(`${base}/v1/auth/logout`, () => ok(null)),

  http.get(`${base}/v1/users/me`, () => ok(meActive)),

  http.put(`${base}/v1/business/details`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { businessType?: string; sector?: string };
    return ok({ id: 'b_1', tenantId: 't_1', name: 'Acme Traders', businessType: body.businessType ?? 'RETAILER', sector: body.sector ?? null, status: 'ACTIVE' });
  }),

  http.post(`${base}/v1/legal-entities`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { legalName?: string; gstin?: string; city?: string; state?: string };
    return ok({ id: 'le_new', tenantId: 't_1', businessId: 'b_1', legalName: body.legalName ?? 'LE', gstin: body.gstin, city: body.city, state: body.state, isPrimary: true, status: 'ACTIVE' }, 201);
  }),

  http.post(`${base}/v1/storage-units`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { name?: string; type?: string; city?: string };
    return ok({ id: 'su_new', tenantId: 't_1', businessId: 'b_1', name: body.name ?? 'SU', type: body.type, city: body.city, isDefault: true, status: 'ACTIVE' }, 201);
  }),
];
