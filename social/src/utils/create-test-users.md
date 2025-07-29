# Creating Test Users for Authentication

The 400 Bad Request error occurs because users exist in your `profiles` table but not in Supabase Auth. Here's how to fix it:

## Step 1: Create Authentication Users

Go to your Supabase Dashboard:
1. Visit https://supabase.com/dashboard
2. Select your project: `efirzqcqkwdexhfeidkb`
3. Navigate to **Authentication** → **Users**
4. Click **"Add user"** and create these test users:

### Test Users to Create:

**Student User:**
- Email: `student@college.edu`
- Password: `password123`
- Email Confirm: Check "Auto Confirm User" if available

**Alumni User:**
- Email: `alumni@college.edu`  
- Password: `password123`
- Email Confirm: Check "Auto Confirm User" if available

**Admin User:**
- Email: `admin@college.edu`
- Password: `password123`
- Email Confirm: Check "Auto Confirm User" if available

## Step 2: Update Profile Records

After creating the auth users, you'll need to update your profile records with the actual user IDs from Supabase Auth.

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Copy the User ID for each user you created
3. Go to **Table Editor** → **profiles** table
4. Update the `user_id` field for each profile record with the corresponding auth user ID

## Step 3: Test Login

After completing steps 1-2, try logging in again with:
- Email: `student@college.edu`
- Password: `password123`

## Alternative: Check Authentication Settings

If you're still getting 400 errors, check these settings in Supabase Dashboard:

1. Go to **Authentication** → **Settings**
2. Under **User Management**:
   - Make sure "Enable email confirmations" is disabled for testing
   - Or make sure "Enable email confirmations" is enabled and you've confirmed the test emails

## Debugging Information

The updated login code now includes debugging information. Check the browser console for:
- Environment variable loading status
- Login attempt details
- Specific error messages

This will help identify if the issue is with:
- Missing environment variables
- User not found
- Email not confirmed
- Invalid credentials
