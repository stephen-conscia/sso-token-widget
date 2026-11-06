import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contactsEndpoint, getOutput, requestHeaders, WEBEX_ENDPOINT } from '../src/api.ts';

test('phone query preserves plus signs and checks three standard phone fields', () => {
  const url = new URL(contactsEndpoint(' +35312345678 '));
  assert.equal(url.origin, 'https://conscia-test.crm4.dynamics.com');
  assert.equal(url.pathname, '/api/data/v9.2/contacts');
  assert.equal(url.searchParams.get('$filter'), "telephone1 eq '+35312345678' or telephone2 eq '+35312345678' or mobilephone eq '+35312345678'");
  assert.equal(url.searchParams.get('$top'), '50');
});

test('escapes OData literals and rejects blank phone input', () => {
  const filter = new URL(contactsEndpoint("1' or fullname ne 'x")).searchParams.get('$filter');
  assert.ok(filter?.includes("telephone1 eq '1'' or fullname ne ''x'"));
  assert.throws(() => contactsEndpoint('  '), /phone number/);
});

test('both APIs receive the exact supplied token', () => {
  for (const dynamics of [false, true]) {
    assert.equal(requestHeaders('test-token', dynamics).Authorization, 'Bearer test-token');
  }
  assert.equal(requestHeaders('test-token', true)['OData-Version'], '4.0');
  assert.throws(() => requestHeaders(''), /token first/);
});

test('returns JSON HTTP errors without discarding the body', async t => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer fake-token');
    assert.equal(options.redirect, 'error');
    assert.equal(options.credentials, 'omit');
    return new Response('{"error":{"message":"Invalid audience"}}', { status: 401 });
  });
  const result = await getOutput(WEBEX_ENDPOINT, requestHeaders('fake-token'));
  assert.equal(result.status, 401);
  assert.equal(result.ok, false);
  assert.deepEqual(result.body, { error: { message: 'Invalid audience' } });
});

test('preserves non-JSON responses', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('Service unavailable', { status: 503 }));
  assert.equal((await getOutput(WEBEX_ENDPOINT, requestHeaders('fake-token'))).body, 'Service unavailable');
});

test('propagates browser failures and passes cancellation through', async t => {
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.signal, controller.signal);
    throw new TypeError('Failed to fetch');
  });
  await assert.rejects(getOutput(WEBEX_ENDPOINT, requestHeaders('fake-token'), controller.signal), /Failed to fetch/);
});
