-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('admin', 'team');
CREATE TYPE event_type AS ENUM ('created', 'updated', 'assigned', 'status_changed', 'note_added', 'contacted', 'email_sent', 'email_received');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost');

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
email TEXT UNIQUE NOT NULL,
role user_role NOT NULL DEFAULT 'team',
workspace_email_id UUID,
full_name TEXT,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKSPACE EMAILS TABLE
-- ============================================
CREATE TABLE workspace_emails (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
email TEXT UNIQUE NOT NULL,
google_account_id TEXT,
display_name TEXT,
access_token TEXT,
refresh_token TEXT,
token_expires_at TIMESTAMPTZ,
token_scope TEXT,
token_type TEXT,
created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
is_active BOOLEAN DEFAULT true,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Now we can add the foreign key constraint for profiles
ALTER TABLE profiles
ADD CONSTRAINT fk_workspace_email
FOREIGN KEY (workspace_email_id)
REFERENCES workspace_emails(id)
ON DELETE SET NULL;

-- ============================================
-- TEAM ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE team_assignments (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
workspace_email_id UUID NOT NULL REFERENCES workspace_emails(id) ON DELETE CASCADE,
assigned_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE(profile_id, workspace_email_id)
);

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE leads (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name TEXT NOT NULL,
email TEXT UNIQUE,
company TEXT,
phone TEXT,
notes TEXT,
status lead_status DEFAULT 'new',
source JSONB,
assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEAD EVENTS TABLE
-- ============================================
CREATE TABLE lead_events (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
workspace_email_id UUID REFERENCES workspace_emails(id) ON DELETE SET NULL,
event_type event_type NOT NULL,
payload JSONB,
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OTP REQUEST TABLE
-- ============================================
CREATE TABLE otp_requests (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
otp_code_hash TEXT NOT NULL,
expires_at TIMESTAMPTZ NOT NULL,
consumed BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_workspace_emails_email ON workspace_emails(email);
CREATE INDEX idx_workspace_emails_google_account ON workspace_emails(google_account_id);
CREATE INDEX idx_team_assignments_profile ON team_assignments(profile_id);
CREATE INDEX idx_team_assignments_workspace ON team_assignments(workspace_email_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_lead_events_lead ON lead_events(lead_id);
CREATE INDEX idx_lead_events_created_at ON lead_events(created_at DESC);
CREATE INDEX idx_otp_requests_user ON otp_requests(user_id);
CREATE INDEX idx_otp_requests_expires ON otp_requests(expires_at);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_emails_updated_at BEFORE UPDATE ON workspace_emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- WORKSPACE EMAILS POLICIES
-- ============================================
CREATE POLICY "Admins can manage workspace emails"
  ON workspace_emails FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Team can view workspace emails"
  ON workspace_emails FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- TEAM ASSIGNMENTS POLICIES
-- ============================================
CREATE POLICY "Admins can manage assignments"
  ON team_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Team can view own assignments"
  ON team_assignments FOR SELECT
  USING (profile_id = auth.uid());

-- ============================================
-- LEADS POLICIES
-- ============================================
CREATE POLICY "Admins can manage all leads"
  ON leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Team can view all leads"
  ON leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'team'
    )
  );

CREATE POLICY "Team can update assigned leads"
  ON leads FOR UPDATE
  USING (
    assigned_to = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'team'
    )
  );

-- ============================================
-- LEAD EVENTS POLICIES
-- ============================================
CREATE POLICY "Admins can view all events"
  ON lead_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Team can view all events"
  ON lead_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'team'
    )
  );

CREATE POLICY "Authenticated users can insert events"
  ON lead_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- OTP REQUESTS POLICIES
-- ============================================
CREATE POLICY "Admins can view all OTP requests"
  ON otp_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view own OTP requests"
  ON otp_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage OTP requests"
  ON otp_requests FOR ALL
  USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS
$$

BEGIN
RETURN EXISTS (
SELECT 1 FROM profiles
WHERE id = auth.uid() AND role = 'admin'
);
END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create lead event
CREATE OR REPLACE FUNCTION create_lead_event(
  p_lead_id UUID,
  p_event_type event_type,
  p_payload JSONB DEFAULT NULL
)
RETURNS UUID AS
$$

DECLARE
v_event_id UUID;
v_workspace_email_id UUID;
BEGIN
-- Get workspace email for current user
SELECT workspace_email_id INTO v_workspace_email_id
FROM profiles
WHERE id = auth.uid();

INSERT INTO lead_events (lead_id, actor_id, workspace_email_id, event_type, payload)
VALUES (p_lead_id, auth.uid(), v_workspace_email_id, p_event_type, p_payload)
RETURNING id INTO v_event_id;

RETURN v_event_id;
END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired OTPs
CREATE OR REPLACE FUNCTION clean_expired_otps()
RETURNS void AS
$$

BEGIN
DELETE FROM otp_requests
WHERE expires_at < NOW() OR consumed = true;
END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INITIAL SETUP
-- ============================================

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS
$$

BEGIN
INSERT INTO profiles (id, email, role)
VALUES (NEW.id, NEW.email, 'team');
RETURN NEW;
END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
