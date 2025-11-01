# EU CRM

## Lead Ingestion API

Send leads into the CRM from external systems via the `/api/leads` endpoint.

### Request

- **URL:** `POST /api/leads`
- **Headers:**
  - `Content-Type: application/json`
  - `x-api-key: <LEAD_INGESTION_API_KEY>`
- **Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "company": "Example Inc",
  "phone": "+1-555-0100",
  "notes": "Met at the conference.",
  "status": "new",
  "source": {
    "channel": "webform",
    "campaign": "fall-2025"
  }
}
```

`status` accepts: `new`, `contacted`, `qualified`, `proposal`, `negotiation`, `won`, `lost`.
All fields except `name` are optional.

### Responses

- `201 Created` when a new lead is stored.
- `200 OK` when an existing lead (matched by email) is updated.
- `400 Bad Request` if validation fails.
- `401 Unauthorized` if the API key is missing or invalid.

Every successful ingest operation logs a corresponding `lead_events` entry (`created` or `updated`) capturing the payload metadata.

## Send Email API (Authenticated)

- **URL:** `POST /api/send-email`
- **Auth:** Uses the current Supabase session cookie (password + OTP flow). Only admins or team members with an assigned workspace mailbox can send.
- **Headers:** `Content-Type: application/json`
- **Body:**

```json
{
  "leadId": "2b15293c-7a4d-4b93-b8e7-2bd1532a1f55",
  "subject": "Proposal follow-up",
  "textBody": "Hi Jane,\n\nGreat speaking with you today...\n",
  "htmlBody": "<p>Hi Jane,</p><p>Great speaking with you today...</p>",
  "cc": ["manager@example.com"],
  "bcc": [],
  "replyTo": "me@example.com"
}
```

At least one of `textBody` or `htmlBody` is required. If the caller is an admin, they may optionally include `workspaceEmailId` to choose a specific connected mailbox. Team members are limited to the workspace mailbox assigned in their profile.

### Responses

- `200 OK` on success with the Gmail `messageId` and `threadId`.
- `400 Bad Request` if validation fails or the lead lacks an email.
- `401 Unauthorized` when the caller is not signed in.
- `403 Forbidden` if attempting to send from an unassigned mailbox.
- `404 Not Found` when the lead ID is unknown.

Every successful send posts an `email_sent` entry in `lead_events`, linking the Gmail metadata with the lead history.

## Web App Overview
- Role-aware sidebar and topbar automatically adapt between admin and team experiences.
- Admins get dashboards, workspace mailbox management with OAuth linking, team assignment tooling, and an email activity log with filtering.
- Team members see their personal dashboard, lead list, and lead detail timeline with an email composer that supports templates, previews, and direct sends via `/api/send-email`.
- All sensitive actions use Supabase session checks, server actions, and the shared Zustand stores for auth role, active lead selection, and UI modals.
