# Implementation Plan

## 1. Project Foundations

- Initialize a Next.js 14 (App Router) project with TypeScript, ESLint, and Tailwind (or ShadCN UI) for consistent styling.
- Install required dependencies: `@supabase/supabase-js`, `supabase`, `next-auth` (if needed for session helpers), `zustand`, `@tanstack/react-query`, `resend`, `googleapis`, `zod`, `react-hook-form`, `date-fns`, and a UI component library.
- Configure `.env.local` using supplied keys; add runtime validation (e.g., with `zod`) to fail fast when env vars are missing.
- Set up project structure: `app/`, `lib/`, `components/`, `stores/`, `hooks/`, `server/`, `types/`, `emails/`, `features/`.

## 2. Supabase Setup

- In Supabase dashboard, create tables:
  - `profiles` (id UUID references auth.users, email unique, role enum `admin | team`, workspace_email_id nullable).
  - `workspace_emails` (id UUID, email, google_account_id, display_name, access_token, refresh_token, token_expires_at, token_scope, token_type, created_by, is_active).
  - `team_assignments` (id UUID, profile_id, workspace_email_id).
  - `leads` (id UUID, name, email, company, phone, notes, status, created_at, source metadata).
  - `lead_events` (id UUID, lead_id, actor_id, workspace_email_id, event_type enum, payload jsonb, created_at).
  - `otp_request` (id UUID, user_id, otp_code hashed, expires_at, consumed boolean).
- Enable Row-Level Security with policies:
  - Admin can manage all tables.
  - Team members can read leads, lead_events, and only their assignments.
  - Secure `otp_request` so only admins and the target user can read it.
- Create Supabase Edge Functions:
  - `ingest-lead`: authenticated via service role or signed secret, writes to `leads`.
  - `dispatch-otp`: called when login occurs, uses Resend to email OTP to admin.
- Configure Supabase Auth to disable signups; only admins can invite users via service role key.

## 3. Authentication & Authorization Flow

- Implement custom login page that collects email and password, calls Supabase `signInWithPassword`.
- After password auth, trigger `otp_request` creation via Supabase RPC; send OTP email via Edge Function or server action using Resend.
- Build OTP verification form. On submit, server action validates OTP (Supabase RPC) and issues Supabase auth session; store session cookie with Next.js middleware.
- Maintain auth state using Supabase client and `zustand` store; fetch user profile and role on load.
- Use `middleware.ts` to enforce route protection (`/admin/**` and `/team/**`), redirect unauthenticated users to `/login`.

## 4. Google Workspace Integration

- Configure Google Cloud project for OAuth 2.0 user consent (Internal/External), listing Gmail scopes (`https://www.googleapis.com/auth/gmail.send`, optionally `gmail.readonly`).
- Generate OAuth client credentials (web application) with redirect URIs pointing to the CRM callback (e.g., `http://localhost:3000/api/google/oauth/callback` + production URL).
- Implement helpers in `lib/google.ts` to exchange authorization codes for access/refresh tokens, refresh them when expired, and create Gmail API clients using stored tokens.
- Build admin workflow for workspace emails:
  - Admin initiates OAuth linking for a mailbox; after Google consent the callback persists tokens + metadata in `workspace_emails`.
  - Server action validates ownership and records display name, Google account id, access token, refresh token, and expiry.
- Create assignment flow:
  - Admin selects workspace email and team member; server action writes to `team_assignments`.
  - Update `profiles` to reference current assignment for faster lookups.

## 5. Lead Ingestion API

- Create API route `/api/leads` (route handler) secured by header token or Supabase service role key verification.
- Validate payload with `zod`; insert into `leads` and log event in `lead_events`.
- Respond with 201 Created; handle duplicates via `ON CONFLICT`.
- Document endpoint in `README` with request/response samples.

## 6. Email Sending Workflow

- Implement `/api/send-email` route handler:
  - Authenticate user via Supabase session; ensure team member has an assigned workspace email.
  - Accept lead ID, template ID, dynamic fields.
  - Fetch workspace OAuth tokens, refresh if necessary, send email via Gmail API, and log `lead_events`.
  - send email using google api
- Track metrics per team member by aggregating `lead_events` (type `email_sent`).

## 7. Frontend Features

- Global layout with sidebar (role-aware) and top header; use dynamic routes under `/admin` and `/team`.
- Admin views:
  - Dashboard: stats cards (emails sent per member, leads ingested).
  - Workspace emails management page (list, add, delete).
  - Team management page (list users, assign emails, delete users, invite new member via service role key).
  - Email activity log with filters.
- Team views:
  - Dashboard: personal vs team email counts, recent leads.
  - Leads list with search, filters, status tags.
  - Lead detail page with timeline (`lead_events`), email send modal.
  - Email modal uses templates dropdown and preview; submits to `/api/send-email`.
- Shared components: `Sidebar`, `ProtectedRoute` wrapper (or route groups), `DataTable`, `StatCard`, form components.
- State management with `zustand` for auth session, current role, selected lead, UI modals.

## 8. Protected Routes & Role-Based UI

- Implement layout-level guards: separate route groups `app/(admin)` and `app/(team)`.
- Fetch user profile server-side; redirect if role mismatch.
- Build hook `useRole()` reading from store, pass to components for conditional rendering.
- Ensure API routes verify role before processing.

## 9. Deployment & DevOps

- Configure Next.js with `next.config.js` for required headers and API defaults.
- Set up Supabase project environment, apply migrations via `supabase db push`.
- Use Vercel for deployment; set env vars in Vercel dashboard.
- Provision Resend and Google credentials in Vercel secrets.
- Automate schema changes via SQL migration scripts under `supabase/migrations`.

## 10. Testing & Quality

- Add unit tests with Jest/Testing Library for components and utilities.
- Create integration tests for API routes using Next.js `test` or `supertest`.
- Write smoke tests for critical flows (login + OTP, lead ingestion, email send) using Playwright.
- Configure linting `npm run lint` and formatting `npm run format`.
- Establish CI workflow (GitHub Actions) to run lint, tests, and Supabase migration checks before deploy.

## 11. Security & Compliance

- Encrypt sensitive credentials before storing in Supabase (use KMS or secrets manager).
- Rotate OAuth client secrets periodically; revoke and refresh stored tokens when staff change.
- Audit logs: persist key actions in `lead_events`.
- Ensure HTTPS everywhere; set strict Content Security Policy.
- Monitor rate limits on API endpoints; add request logging and alerts (e.g., via Supabase Logflare).

## 12. Rollout & Monitoring

- Prepare seed data scripts for local development.
- Document onboarding instructions in `README`.
- Set up monitoring (Vercel Analytics, Supabase logs) and on-call alerts for failures.
- Plan phased rollout: internal admin testing, team pilot, then full launch.
