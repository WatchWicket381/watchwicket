# Security Configuration for WatchWicket ScoreBox Pro

## Required Manual Configuration

### Enable Leaked Password Protection

Supabase Auth includes protection against compromised passwords by checking against the HaveIBeenPwned.org database. This feature must be enabled through the Supabase Dashboard.

#### Steps to Enable:

1. **Open Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]

2. **Access Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Go to "Policies" or "Settings" tab

3. **Enable Password Protection**
   - Look for "Password Protection" or "Breach Protection" settings
   - Toggle ON "Enable HaveIBeenPwned integration"
   - Or enable "Check for compromised passwords"

4. **Save Changes**
   - Click "Save" to apply the configuration

#### What This Does:

- **Prevents Weak Passwords**: Users cannot sign up with passwords that have been exposed in data breaches
- **Enhanced Security**: Checks passwords against the HaveIBeenPwned.org database (k-Anonymity API)
- **Privacy Preserved**: Uses a secure hashing method that doesn't expose the actual password
- **No Code Changes Required**: Works automatically once enabled in the dashboard

#### Alternative Configuration Methods:

If you have access to the Supabase CLI, you can also configure this in your `config.toml`:

```toml
[auth.password_requirements]
hibp_enabled = true
```

Then apply with:
```bash
supabase db push
```

## Completed Security Fixes

### ✅ Removed Unused Database Index

The unused index `idx_subscriptions_user_id` on the `subscriptions` table has been removed via migration to:
- Improve write performance
- Reduce storage overhead
- Clean up database structure

**Migration**: `remove_unused_index_subscriptions.sql`

## Security Best Practices

### Current Implementation

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Restrictive RLS policies using `auth.uid()`
- ✅ No public access without authentication
- ✅ Proper ownership checks on all data access
- ✅ Email/password authentication with secure hashing
- ✅ No hardcoded secrets or API keys in code

### Additional Recommendations

1. **Password Requirements**
   - Minimum 8 characters (enforced by Supabase)
   - Consider enabling password strength requirements

2. **Session Management**
   - Sessions expire automatically
   - Implement proper logout functionality

3. **API Security**
   - Anon key used only for client-side operations
   - Service role key never exposed to client

4. **Data Privacy**
   - User data isolated by RLS policies
   - No cross-user data access
   - Proper authentication checks on all operations

## Monitoring

After enabling leaked password protection, monitor:
- User signup success rates
- Password rejection feedback
- Security incident reports

If users report issues with password registration, they may need to choose a stronger, non-compromised password.
