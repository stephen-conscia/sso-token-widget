export const CRM_ORIGIN = 'https://conscia-test.crm4.dynamics.com';
export const WEBEX_ENDPOINT = 'https://webexapis.com/v1/people/me';

export function contactsEndpoint(phone: string): string {
  const value = phone.trim();
  if (!value) throw new Error('Enter a phone number.');
  const literal = value.replaceAll("'", "''");
  const url = new URL('/api/data/v9.2/contacts', CRM_ORIGIN);
  url.searchParams.set('$select', 'contactid,fullname,telephone1,telephone2,mobilephone,emailaddress1');
  url.searchParams.set('$filter', ['telephone1', 'telephone2', 'mobilephone'].map(field => `${field} eq '${literal}'`).join(' or '));
  url.searchParams.set('$top', '50');
  return url.href;
}

export function requestHeaders(token: string, dynamics = false): Record<string, string> {
  if (!token.trim()) throw new Error('Retrieve a Desktop token first.');
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    ...(dynamics ? { 'OData-Version': '4.0', 'OData-MaxVersion': '4.0' } : {}),
  };
}

export async function getOutput(url: string, headers: Record<string, string>, signal?: AbortSignal) {
  const start = performance.now();
  const response = await fetch(url, {
    method: 'GET', headers, signal, credentials: 'omit', redirect: 'error', cache: 'no-store',
  });
  const text = await response.text();
  let body: unknown = text;
  try { body = JSON.parse(text); } catch { /* Preserve non-JSON error bodies. */ }
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    durationMs: Math.round(performance.now() - start),
    body,
  };
}
