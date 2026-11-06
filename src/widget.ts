import { Desktop } from '@wxcc-desktop/sdk';
import { contactsEndpoint, getOutput, requestHeaders, WEBEX_ENDPOINT } from './api.ts';

class SsoTokenWidget extends HTMLElement {
  private root = this.attachShadow({ mode: 'open' });
  private token = '';
  private ready?: Promise<unknown>;
  private controllers = new Set<AbortController>();

  connectedCallback() {
    this.root.innerHTML = `
      <style>
        :host{display:block;height:100%;min-height:0;color:#172b42;font:14px/1.5 system-ui,sans-serif;background:#f4f6f8}
        *{box-sizing:border-box} main{height:100%;overflow:auto;padding:28px;max-width:1600px;margin:auto}
        h1{font-size:26px;letter-spacing:-.6px;margin:0} h2{font-size:19px;margin:0 0 8px}
        p{margin:8px 0 16px;color:#526175} .eyebrow{font-size:11px;font-weight:700;letter-spacing:1.5px;color:#14736c}
        .card{background:white;border:1px solid #dce3e9;border-radius:12px;padding:24px;margin-top:20px}
        .sections{display:grid;grid-template-columns:1fr 1fr;gap:20px}.sections .card{min-width:0}
        label{display:block;font-weight:600;margin-bottom:6px} input,textarea{width:100%;border:1px solid #aab9c8;border-radius:6px;padding:10px;font:inherit}
        textarea{font:12px/1.5 ui-monospace,monospace;resize:vertical;min-height:92px;word-break:break-all}
        button{border:0;border-radius:6px;padding:10px 16px;background:#176b67;color:white;font:600 14px system-ui;cursor:pointer}
        button:disabled{opacity:.5;cursor:wait}button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid #73b9f5;outline-offset:2px}
        .row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:14px 0}.status{color:#526175}
        pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.6 ui-monospace,monospace;background:#f2f5f8;border-radius:6px;padding:14px;max-height:420px;overflow:auto;margin:8px 0 18px}
        .output{background:#13283b;color:#dcebf6;min-height:180px} .note{border-left:3px solid #c28a21;padding-left:12px;font-size:13px}
        .error{color:#b12a34}.success{color:#14736c} h3{font-size:13px;margin:18px 0 6px}
        .findings{margin-top:24px;border-top:1px solid #dce3e9;padding-top:4px}
        .findings ol,.findings ul{padding-left:22px;color:#526175}.findings li{margin:8px 0}
        a{color:#126b9b;text-underline-offset:3px}a:focus-visible{outline:3px solid #73b9f5;outline-offset:2px}
        @media(max-width:900px){.sections{grid-template-columns:1fr}main{padding:16px}.card{padding:18px}}
      </style>
      <main>
        <div class="eyebrow">WEBEX CONTACT CENTER · DIAGNOSTICS</div>
        <h1>SSO Token Tester</h1>
        <p>Inspect the Desktop token and test it against Dynamics CRM and Webex.</p>
        <section class="card" aria-labelledby="token-title">
          <h2 id="token-title">Desktop SSO token</h2>
          <p><code>const accessToken = await Desktop.actions.getToken();</code></p>
          <label for="token">Access token</label><textarea id="token" readonly spellcheck="false" placeholder="Retrieve your token from Webex Desktop"></textarea>
          <div class="row"><button id="refresh">Retrieve / refresh token</button><span id="token-status" role="status">No token retrieved</span></div>
          <p class="note">This diagnostic displays the full credential. Keep this page and any screenshots private. Tokens stay in memory.</p>
        </section>
        <div class="sections">
          <section class="card" aria-labelledby="crm-title">
            <div class="eyebrow">01 · DYNAMICS CRM</div><h2 id="crm-title">Find contacts by phone</h2>
            <p>Exact match against business phone, business phone 2, or mobile phone. Returns up to 50 contacts.</p>
            <form id="crm-form"><label for="phone">Phone number</label><input id="phone" type="tel" required placeholder="e.g. +35312345678" autocomplete="off">
            <div class="row"><button id="crm-run" type="submit" disabled>Look up contacts</button></div></form>
            <p class="note">Dataverse normally requires an Entra token issued for this environment. This test deliberately uses the Webex token; a 401 is expected if it is not accepted.</p>
            <h3>GET endpoint</h3><pre id="crm-endpoint"></pre>
            <p>Uses the Desktop SSO token: <code>Authorization: Bearer {{sso_token}}</code></p>
            <h3>Response</h3><div id="crm-status" class="status" role="status">Not requested</div><pre id="crm-output" class="output">No response yet.</pre>
            <div class="findings">
              <h3>Finding: direct access to Dynamics</h3>
              <p><strong>The Webex Desktop token is not a Dynamics access token.</strong> Dataverse requires a Microsoft Entra access token issued for the CRM environment. Using the same corporate SSO provider does not make the two services' tokens interchangeable.</p>
              <p>To make requests as the logged-in Dynamics user, register a Microsoft Entra application and use a Microsoft authentication flow, such as MSAL with delegated Dataverse permissions. The agent must also have the necessary CRM privileges.</p>
              <p>This request intentionally sends the Webex token to demonstrate the limitation. An authentication rejection is expected; a browser network or CORS error alone does not prove that Dynamics rejected the token.</p>
              <h3>Official references</h3>
              <ul>
                <li><a href="https://learn.microsoft.com/en-us/power-apps/developer/data-platform/authenticate-oauth" target="_blank" rel="noopener noreferrer">Microsoft: Dataverse OAuth, delegated access, and application authentication</a></li>
                <li><a href="https://developer.webex.com/webex-contact-center/docs/desktop-sdk-getting-started" target="_blank" rel="noopener noreferrer">Cisco: Desktop SDK and getToken()</a></li>
              </ul>
            </div>
          </section>
          <section class="card" aria-labelledby="webex-title">
            <div class="eyebrow">02 · WEBEX</div><h2 id="webex-title">Get my own details</h2>
            <p>Retrieve the Webex profile associated with the current Desktop token.</p>
            <div class="row"><button id="webex-run" disabled>Get /people/me</button></div>
            <h3>GET endpoint</h3><pre id="webex-endpoint"></pre>
            <p>Uses the Desktop SSO token: <code>Authorization: Bearer {{sso_token}}</code></p>
            <h3>Response</h3><div id="webex-status" class="status" role="status">Not requested</div><pre id="webex-output" class="output">No response yet.</pre>
            <div class="findings">
              <h3>Proposed approach: a custom cloud API</h3>
              <p>Use the Webex token to authenticate the agent to a custom backend. The backend uses its own Dynamics integration to look up or create contacts in real time.</p>
              <ol>
                <li>The widget sends an HTTPS request to your API with <code>Authorization: Bearer {{sso_token}}</code> and the contact lookup or create data.</li>
                <li>Your API calls Webex <code>GET /v1/people/me</code> with the supplied token. Require a successful response and verify the returned identity belongs to the customer's allowed Webex organization. Reject requests if identity or organization cannot be verified.</li>
                <li>For verified users in that organization, your API allows the supported CRM operations. Do not trust user or organization identifiers supplied separately by the widget.</li>
                <li>Your API obtains a separate Microsoft Entra token using its server-side application credentials and calls Dataverse as an application user with contact-read and contact-create privileges.</li>
                <li>Your API returns the CRM result to the widget. The widget can trigger a lookup when a call arrives, or create a contact when the agent submits a form, without carrying CRM results through flow variables.</li>
              </ol>
              <p>The Webex request above tests whether this Desktop token can retrieve its associated identity. Production validation must happen on your server; the browser's response is not proof of authentication for the backend. Token scopes must permit the Webex identity request.</p>
              <p>A valid token establishes a Webex identity, not that Desktop is currently open or that the user signed in specifically through SSO. If corporate SSO is required, enforce it in the customer's Webex sign-in policy.</p>
              <p>Dynamics operations run as the integration application user by default, rather than under each agent's CRM permissions. Keep Microsoft credentials on the backend and record the verified Webex agent identity for application auditing.</p>
              <p class="note">Architecture proposal only: this widget currently calls Webex and Dynamics directly. No custom backend or contact creation is implemented.</p>
              <h3>Official references</h3>
              <ul>
                <li><a href="https://developer.webex.com/admin/docs/api/v1/people/get-my-own-details" target="_blank" rel="noopener noreferrer">Cisco: Get my own details</a></li>
                <li><a href="https://developer.webex.com/admin/docs/authentication" target="_blank" rel="noopener noreferrer">Cisco: Webex authentication and token permissions</a></li>
                <li><a href="https://learn.microsoft.com/en-us/power-apps/developer/data-platform/authenticate-oauth#connect-as-an-app" target="_blank" rel="noopener noreferrer">Microsoft: Connect to Dataverse as an application</a></li>
              </ul>
            </div>
          </section>
        </div>
      </main>`;
    this.el('refresh').addEventListener('click', () => void this.refresh());
    this.el('phone').addEventListener('input', () => this.preview());
    this.el('crm-form').addEventListener('submit', event => { event.preventDefault(); void this.run('crm'); });
    this.el('webex-run').addEventListener('click', () => void this.run('webex'));
    this.preview();
  }

  disconnectedCallback() {
    for (const controller of this.controllers) controller.abort();
    this.controllers.clear();
    this.token = '';
    this.root.replaceChildren();
  }

  private el<T extends HTMLElement = HTMLElement>(id: string): T {
    return this.root.getElementById(id) as T;
  }

  private preview() {
    try { this.el('crm-endpoint').textContent = contactsEndpoint(this.el<HTMLInputElement>('phone').value); }
    catch { this.el('crm-endpoint').textContent = 'https://conscia-test.crm4.dynamics.com/api/data/v9.2/contacts — enter a phone number to preview the query'; }
    this.el('webex-endpoint').textContent = WEBEX_ENDPOINT;
  }

  private async refresh() {
    const button = this.el<HTMLButtonElement>('refresh');
    button.disabled = true;
    this.token = '';
    this.el<HTMLTextAreaElement>('token').value = '';
    for (const section of ['crm', 'webex']) this.el<HTMLButtonElement>(`${section}-run`).disabled = true;
    this.preview();
    this.el('token-status').textContent = 'Connecting to Desktop…';
    try {
      this.ready ??= Promise.resolve(Desktop.config.init({ widgetName: 'sso-token-widget', widgetProvider: 'conscia' }));
      await this.ready;
      const accessToken = await Desktop.actions.getToken();
      if (typeof accessToken !== 'string' || !accessToken.trim()) throw new Error('Desktop returned an empty token.');
      if (!this.isConnected) return;
      this.token = accessToken;
      this.el<HTMLTextAreaElement>('token').value = accessToken;
      this.el('token-status').textContent = `Retrieved at ${new Date().toLocaleTimeString()}`;
      for (const section of ['crm', 'webex']) this.el<HTMLButtonElement>(`${section}-run`).disabled = false;
      this.preview();
    } catch {
      this.ready = undefined;
      if (this.isConnected) this.el('token-status').textContent = 'Unable to retrieve token. Open this widget inside a signed-in Webex Contact Center Desktop and retry.';
    } finally {
      if (this.isConnected) button.disabled = false;
    }
  }

  private async run(section: 'crm' | 'webex') {
    const button = this.el<HTMLButtonElement>(`${section}-run`);
    const status = this.el(`${section}-status`);
    const output = this.el(`${section}-output`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    this.controllers.add(controller);
    button.disabled = true;
    this.el<HTMLButtonElement>('refresh').disabled = true;
    status.className = 'status';
    status.textContent = 'Sending request…';
    output.textContent = 'Waiting for response…';
    try {
      const endpoint = section === 'crm' ? contactsEndpoint(this.el<HTMLInputElement>('phone').value) : WEBEX_ENDPOINT;
      const headers = requestHeaders(this.token, section === 'crm');
      this.el(`${section}-endpoint`).textContent = endpoint;
      const result = await getOutput(endpoint, headers, controller.signal);
      if (!this.isConnected) return;
      status.textContent = `HTTP ${result.status} ${result.statusText} · ${result.durationMs} ms`;
      status.className = result.ok ? 'status success' : 'status error';
      output.textContent = JSON.stringify(result.body, null, 2);
    } catch (error) {
      if (!this.isConnected) return;
      status.className = 'status error';
      status.textContent = 'Request failed';
      output.textContent = JSON.stringify({
        error: error instanceof TypeError ? 'Browser could not complete the request. Check CORS, connectivity, TLS, redirects, and Desktop content security policy. No HTTP status is available.' : controller.signal.aborted ? 'Request timed out after 30 seconds.' : error instanceof Error ? error.message : 'Unknown request failure',
      }, null, 2);
    } finally {
      clearTimeout(timeout);
      this.controllers.delete(controller);
      if (this.isConnected) {
        button.disabled = !this.token;
        this.el<HTMLButtonElement>('refresh').disabled = this.controllers.size > 0;
      }
    }
  }
}

if (!customElements.get('sso-token-widget')) customElements.define('sso-token-widget', SsoTokenWidget);
