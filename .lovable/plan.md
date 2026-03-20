

## Problem Analysis

Two issues in the Admin panel:

1. **Plan change doesn't set expiration**: `updateLicensePlan` only updates the `plan` field but never sets `expires_at`. So changing to "monthly" or "yearly" has no effect on access duration.
2. **Can't reset password for existing users**: No UI or backend call to change a user's password from the admin panel.

## Plan

### 1. Fix plan change to auto-set expiration dates
In `AdminPage.tsx`, update `updateLicensePlan` to calculate and set `expires_at`:
- **monthly** → `expires_at = now + 30 days`
- **yearly** → `expires_at = now + 365 days`  
- **lifetime** → `expires_at = null`

Also auto-set `status = 'active'` when changing plan.

### 2. Add "Reset Password" button per user row
- Add a button in the actions column of each user row
- On click, show an inline dialog/input to set new password (with generate button)
- Call a new edge function endpoint or extend `create-test-user` to handle password-only updates via `supabaseAdmin.auth.admin.updateUserById(userId, { password })`

### 3. Create `reset-user-password` edge function
- Accepts `{ userId, newPassword }` 
- Verifies caller is admin (same pattern as `create-test-user`)
- Calls `supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword })`
- Returns success/error

### Files to change
- **`src/pages/AdminPage.tsx`**: Fix `updateLicensePlan`, add password reset UI per row
- **`supabase/functions/reset-user-password/index.ts`**: New edge function for admin password reset
- **`supabase/config.toml`**: Register new function

