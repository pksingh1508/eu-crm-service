# Google Workspace OAuth Setup

The CRM now uses Google OAuth 2.0 to acquire per-mailbox access and refresh tokens for Gmail. Complete these steps before connecting a workspace email inside the app.

---

## Part 1 - Google Cloud Console

1. **Create or select a project**
   - Go to https://console.cloud.google.com/.
   - Choose an existing project or click **New Project**, name it, pick the organization, and create.

2. **Enable the Gmail API**
   - With the project selected, open **APIs & Services > Library**.
   - Search for **Gmail API**, open it, and click **Enable**.

3. **Configure the OAuth consent screen**
   - Open **APIs & Services > OAuth consent screen**.
   - Pick the user type (`Internal` for the Workspace domain, or `External` if needed).
   - Provide app name, support email, developer contact email, and optional branding.
   - Under **Scopes**, add:
     ```
     https://www.googleapis.com/auth/gmail.send
     https://www.googleapis.com/auth/gmail.readonly
     ```
     Remove the `gmail.readonly` scope if you do not plan to read mailbox history.
   - Add test users (their Google Workspace emails) if the app is still in testing status.
   - Save the consent screen configuration.

4. **Create OAuth 2.0 credentials**
   - Navigate to **APIs & Services > Credentials > Create credentials > OAuth client ID**.
   - Choose **Web application** and give it a descriptive name (for example, `EU CRM Gmail OAuth`).
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/google/oauth/callback` for local development.
     - The production callback URL, e.g., `https://app.example.com/api/google/oauth/callback`.
   - Save and record the Client ID and Client Secret in a secure location.

---

## Part 2 - Application Configuration

1. **Provide OAuth client credentials to the app**
   - Add these values to `.env.local` (and production secrets):
     ```
     GOOGLE_OAUTH_CLIENT_ID=...
     GOOGLE_OAUTH_CLIENT_SECRET=...
     GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback
     ```
     Update `GOOGLE_OAUTH_REDIRECT_URI` for non-local environments.

2. **Restart the Next.js dev server** so the credentials are loaded.

3. **Prepare Supabase storage**
   - Confirm the `workspace_emails` table includes columns for `google_account_id`, `access_token`, `refresh_token`, `token_expires_at`, `token_scope`, and `token_type`.
   - Apply the latest SQL migration from `supabase_setup.md` if any columns are missing.

---

## Part 3 - Linking Workspace Mailboxes

1. Sign in as an admin user and open the Workspace Emails page inside the CRM.
2. Click **Connect with Google**, enter the mailbox email and display name, and submit.
3. When redirected to Google, sign in with the exact mailbox you want to link and approve the requested Gmail scopes.
4. After Google redirects back to the CRM, the server exchanges the code for tokens and stores the Gmail profile metadata.
5. The mailbox now appears in the list as **Active**. Repeat for every mailbox that must send email through the CRM.

---

## Part 4 - Ongoing Maintenance

- **Token expiration**: Gmail access tokens expire in about one hour. The CRM refreshes them automatically with the stored refresh token.
- **Revocation**: If a user revokes access or the refresh token becomes invalid, reconnect the mailbox via the admin UI to generate a new authorization.
- **Security**: Treat the OAuth client secret and stored refresh tokens as sensitive. Use a secrets manager, enable audit logging, and rotate credentials if they are exposed.
- **Scope changes**: If you add additional Gmail scopes, update the consent screen and have each mailbox re-authorize to grant the new permissions.

Once these steps are complete and at least one mailbox is connected, the CRM can send Gmail messages using OAuth tokens.

