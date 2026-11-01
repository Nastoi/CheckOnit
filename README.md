# CheckOnIt UI

Custom staff-facing chat interface for your Dify-based learner operations assistant.

## What this starter includes

- Custom CheckOnIt chat UI
- Two authentication modes:
  - `AUTH_MODE=disabled` for local development without Microsoft SSO
  - `AUTH_MODE=entra` for Microsoft Entra ID SSO
- Server-side proxy to Dify (`/api/chat`)
- Dify API key never exposed to browser JavaScript
- Dify `conversation_id` carried across messages
- Stable Dify user identity
- Quick actions for Overall Status, Attendance, Modules, Payment and Support Tickets
- Responsive desktop/mobile layout

## Architecture

```text
Staff Browser
   -> CheckOnIt Next.js UI
      -> /api/chat (server-side)
         -> Dify Service API
            -> your existing Dify / n8n / Power Automate / Power BI / Redis / RunPod stack

When AUTH_MODE=entra:
Staff Browser -> Microsoft Entra ID sign-in -> CheckOnIt -> Dify
```

Your existing Dify and n8n Docker containers continue running as they do today. This UI is a separate local Next.js process.

---

# Local development: no SSO required

This is the recommended starting point while you are waiting for IT/Entra access.

## 1. Prerequisites

Install Node.js 20+.

Confirm:

```bash
node --version
npm --version
```

Keep your existing Dify and n8n Docker containers running.

## 2. Install dependencies

Open a terminal in this project folder:

```bash
npm install
```

## 3. Create `.env.local`

Copy `.env.example` to `.env.local`.

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS/Linux:

```bash
cp .env.example .env.local
```

For local development, the minimum configuration is:

```env
AUTH_MODE=disabled

DEV_STAFF_ID=local-dev-staff
DEV_STAFF_NAME=Local Developer
DEV_STAFF_EMAIL=local@checkonit.dev

DIFY_BASE_URL=http://localhost/v1
DIFY_API_KEY=app-your-dify-service-api-key
```

You can leave the Microsoft Entra values blank while `AUTH_MODE=disabled`.

## 4. Find your Dify Service API details

Open the published CheckOnIt app in Dify and open its Service API / API Access page.

You need:

- Service API base URL
- App API key (`app-...`)

The UI sends chat requests to:

```text
POST {DIFY_BASE_URL}/chat-messages
```

Your exact local URL depends on how Dify Docker is exposed. Examples:

```env
DIFY_BASE_URL=http://localhost/v1
```

or:

```env
DIFY_BASE_URL=http://localhost:8080/v1
```

Use the base URL shown by Dify.

## 5. Run CheckOnIt

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Because `AUTH_MODE=disabled`, it will go directly to the chat interface.

The development identity shown in the UI comes from:

```env
DEV_STAFF_NAME=Local Developer
DEV_STAFF_EMAIL=local@checkonit.dev
```

and `DEV_STAFF_ID` is used as the Dify end-user identity.

## What should be running locally

```text
1. Docker Desktop
   - Dify
   - Dify PostgreSQL / Redis / related containers
   - n8n

2. CheckOnIt terminal
   npm run dev
   -> http://localhost:3000

3. Remote services
   - Power Automate
   - Power BI
   - RunPod
```

CheckOnIt talks to Dify. It does not need a direct connection to n8n because Dify already calls your existing n8n workflow.

---

# Enable Microsoft Entra SSO later

When IT provides an Entra app registration, switch:

```env
AUTH_MODE=entra
```

Then configure:

```env
AUTH_SECRET=...
MICROSOFT_ENTRA_TENANT_ID=...
MICROSOFT_ENTRA_CLIENT_ID=...
MICROSOFT_ENTRA_CLIENT_SECRET=...
```

Generate an Auth.js secret with:

```bash
npx auth secret
```

For local development, the Entra Web redirect URI is:

```text
http://localhost:3000/api/auth/callback/microsoft-entra-id
```

With `AUTH_MODE=entra`:

- `/` shows Microsoft sign-in.
- `/chat` requires a valid Microsoft session.
- `/api/chat` rejects unauthenticated requests.
- Dify's `user` value is derived from the signed-in Microsoft account.

### Optional company-domain restriction

```env
ALLOWED_EMAIL_DOMAIN=yourcompany.com
```

Leave it blank if the Entra tenant/app permissions already provide the access restriction you need.

---

# Moving to a server later

The application design does not need to change.

Typically you will:

1. Move Dify/n8n/Redis/Postgres from your laptop to company/server infrastructure.
2. Deploy this Next.js application as another service/container.
3. Change environment URLs, for example:

```env
DIFY_BASE_URL=https://dify.internal.company/v1
AUTH_MODE=entra
```

4. Add the production callback URL to the Entra app registration, for example:

```text
https://checkonit.company.com/api/auth/callback/microsoft-entra-id
```

5. Serve CheckOnIt over HTTPS.

The chat UI and Dify integration remain the same.

---

# Important security note

`AUTH_MODE=disabled` is for local development only. Do not expose a deployment to colleagues or the internet with authentication disabled.

Before company rollout:

- use `AUTH_MODE=entra`;
- keep `DIFY_API_KEY`, `AUTH_SECRET`, and Entra client secret server-side;
- use HTTPS;
- add staff authorization rules if different staff should have different learner access;
- add audit logging and rate limiting as appropriate;
- protect Dify/n8n administration interfaces.

---

# Files to know

- `app/page.tsx` - login page in Entra mode, automatic redirect in local mode
- `app/chat/page.tsx` - chat page and authentication gate
- `app/api/chat/route.ts` - server-side Dify proxy
- `app/api/auth/[...nextauth]/route.ts` - Microsoft authentication callback handler
- `components/ChatShell.tsx` - chat interface
- `auth.ts` - Microsoft Entra/Auth.js configuration
- `lib-auth-mode.ts` - development vs Entra mode switch
- `app/globals.css` - UI styling
- `.env.example` - configuration template

## Minimal glass chat UI

This starter now uses a single full-screen frosted-glass chat surface with an animated background and rotating conic-gradient border.

Before chat begins, the UI requires a learner email. The server sends that value to Dify on every chat request as:

```json
{
  "inputs": {
    "Learner_email": "learner@example.com"
  }
}
```

If your Dify start variable uses a different exact key, update `Learner_email` in `app/api/chat/route.ts`.
