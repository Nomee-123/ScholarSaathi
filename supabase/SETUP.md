# Supabase scaffold setup

Authentication is disabled until both local Vite variables are set. Student profiles and saved scholarships continue to use local IndexedDB; this scaffold does not synchronize them to Supabase.

## Configure a Supabase project

1. Create a Supabase project and wait for its database to finish provisioning.
2. In **Project Settings → API**, copy the **Project URL** and the **publishable key** (or legacy **anon** key). These are public browser values; never use a secret or `service_role` key.
3. Copy `.env.example` to `.env.local` at the project root. Fill in:
   - `VITE_SUPABASE_URL` with the Project URL.
   - `VITE_SUPABASE_ANON_KEY` with the publishable/anon key.
4. Keep `.env.local` local. It is ignored by the existing `*.local` Git ignore rule. Vite variables prefixed with `VITE_` are embedded in browser code and are not secrets.
5. In **Authentication → URL Configuration**, set the local Site URL to `http://localhost:5173` and add that URL to the redirect allow list. Add the deployed HTTPS origin before deploying.
6. In **Authentication → Providers → Email**, enable email/password sign-in. Configure email confirmation and production SMTP according to your launch requirements. The app displays a confirmation-required message when sign-up does not return a session.
7. In **SQL Editor**, run `supabase/migrations/20261026220000_create_private_student_data.sql` once. Alternatively, use the Supabase CLI migration workflow after linking this project.
8. Restart `npm run dev` after changing `.env.local`. Open Login/Create account: the configuration warning should be gone. Confirm sign-up, email confirmation, login, password reset and reset-link redirects against your Supabase project before a demo.

## Data protection

The migration stores one JSONB student profile per authenticated user and saved scholarship IDs in a separate table. Row Level Security is enabled on both tables; every policy limits access to rows whose `user_id` matches `auth.uid()`. Anonymous roles receive no table privileges. Do not disable RLS or add service-role keys to this frontend.

The migration does not move existing guest data to the cloud. Any future guest-to-account merge should be an explicit, user-confirmed operation after login, should validate and upload only the supported profile fields and saved scholarship IDs, and should leave local IndexedDB intact unless the user explicitly chooses to clear it. Never automatically upload sensitive fields.
