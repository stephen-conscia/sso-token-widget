# Webex SSO Token Tester

A TypeScript Web Component for a full custom navigation page in Webex Contact Center Desktop. It retrieves the signed-in Desktop token with `Desktop.actions.getToken()`, displays it, and uses that exact value as a bearer token for two manually triggered GET requests.

## Development

Requires Node.js 22.18+ and npm.

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
```

For local Desktop development, run `npm run build && npm run preview`, then set the layout item's `script` to `http://localhost:4173/sso-token-widget.js`. The preview server serves only the built files, allows cross-origin loading, and disables caching. Rebuild and reload Desktop after changes. Override the port with `PORT=4500 npm run preview`. The SDK is bundled into the JavaScript file; Desktop supplies the signed-in session. If the browser blocks local access, check its local-network permissions and Desktop content security policy.

`dev` watches the bundle and serves a preview at http://127.0.0.1:5173. A standalone preview can display the interface, but retrieving a token requires the widget to run inside a signed-in Webex Contact Center Desktop. There are no demo tokens or mocked production responses. `build` produces `dist/sso-token-widget.js` and a standalone preview HTML file. Tests use Node's built-in test runner with mocked fetch; they make no external requests. TypeScript strict mode enforces type checks; use two-space indentation. No separate linter is configured.

## Add to Desktop navigation

1. Host the contents of `dist/` on an HTTPS static host. Allow cross-origin loading of the JavaScript bundle from your Desktop origin, and serve it with a JavaScript MIME type. Ensure Desktop policy permits the host.
2. Download your team's current Desktop layout from Control Hub.
3. Copy the object in `layout/navigation-item.json` into the existing `agent.area.navigation` array. Add it to `supervisor.area.navigation` and/or `supervisorAgent.area.navigation` if those personas need access.
4. Replace `https://YOUR-WIDGET-HOST/sso-token-widget.js` with the hosted bundle URL. The snippet is one navigation item, not a complete layout; preserve the rest of your team's layout.
5. Keep this page's single widget at width 12, with flex layout enabled and desktop drag/drop disabled for a fixed full-page workspace. Upload and assign the updated layout to the test team, then reload Desktop.
6. Open **SSO Token Tester**, retrieve the token, enter a phone number, and run either request. Refresh retrieves a new token; requests use the currently displayed token. Each section shows its endpoint, an SSO bearer-token note, and the response.

## Requests and configuration

**Dynamics:** `GET https://conscia-test.crm4.dynamics.com/api/data/v9.2/contacts` with `$select`, `$filter`, and `$top=50`. The phone filter matches `telephone1`, `telephone2`, or `mobilephone` exactly, including stored punctuation and country code. The full encoded URL is displayed before sending. No automatic pagination is performed.

**Webex:** `GET https://webexapis.com/v1/people/me`.

Both send `Authorization: Bearer <Desktop token>` and `Accept: application/json`. Dynamics also sends `OData-Version: 4.0` and `OData-MaxVersion: 4.0`. Change the CRM origin or selected fields in `src/api.ts` if required. The dashboard `appid` is not needed to query contacts.

The supplied CRM URL is enough to construct this diagnostic request. Confirm the Web API endpoint in Power Apps developer resources. Successful Dataverse access normally requires a Microsoft Entra access token scoped for that environment and contact-read privileges. Sharing an SSO identity provider does not make a Webex access token valid for Dynamics. This widget intentionally does not substitute another token or implement an Entra login. A 401/403 is a useful diagnostic result. Webex success likewise depends on the Desktop token's permissions.

Browser cross-origin requests must be permitted by CORS and Desktop content security policy. If preflight or another network restriction blocks the request, the browser may hide the HTTP response; the widget reports that distinction instead of claiming authentication failed. Requests time out after 30 seconds and do not follow redirects.

## Validation and security

Verify in a test Desktop: token retrieval and refresh; a known phone number and a no-match number; both API responses; expired-token rejection; and a blocked network request. Live authentication and the final Desktop layout require tenant testing.

Tokens are displayed in full in the token section. They are held in component memory and cleared when it disconnects; nothing is saved in local storage or logged by application code. Each request section displays a placeholder explaining bearer authentication rather than repeating the credential. Avoid sharing screenshots containing credentials or contact data. No client secret is required or included.

## Structure and references

- `src/widget.ts`: isolated UI and Desktop SDK integration.
- `src/api.ts`: endpoints, headers, and HTTP response handling.
- `tests/`: offline request tests.
- `layout/`: Desktop navigation item.
- `scripts/build.mjs`: bundled IIFE build and local server.

Official documentation: [Desktop SDK](https://developer.webex.com/webex-contact-center/docs/desktop-sdk-getting-started), [Desktop layouts](https://help.webex.com/en-us/article/ng08gqeb), [Webex get my own details](https://developer.webex.com/admin/docs/api/v1/people/get-my-own-details), [Dataverse authentication](https://learn.microsoft.com/power-apps/developer/data-platform/authenticate-oauth).
