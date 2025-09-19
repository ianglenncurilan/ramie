# Google OAuth Setup with Supabase

This guide will help you set up Google authentication for your Supabase project.

## Prerequisites

- A Google Cloud Console account
- A Supabase project
- Your application domain configured

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "Your App Name")
4. Click "Create"

### 1.2 Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### 1.3 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - `http://localhost:3000` (for development)
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

## Step 2: Supabase Configuration

### 2.1 Configure Google Provider

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" → "Providers"
3. Find "Google" and click "Enable"
4. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Click "Save"

### 2.2 Configure Site URL

1. In Supabase dashboard, go to "Authentication" → "URL Configuration"
2. Set **Site URL** to your production domain:
   - `https://yourdomain.com`
3. Add **Redirect URLs**:
   - `https://yourdomain.com/dashboard`
   - `http://localhost:3000/dashboard` (for development)

## Step 3: Environment Variables

Add these to your `.env` file:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Step 4: Test the Integration

1. Start your development server
2. Navigate to the login/register page
3. Click "Sign in with Google" or "Sign up with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authentication, you'll be redirected back to your dashboard

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Ensure the redirect URI in Google Cloud Console matches exactly with Supabase
   - Check for trailing slashes and protocol (http vs https)

2. **"invalid_client" error**
   - Verify your Client ID and Client Secret are correct
   - Ensure the Google+ API is enabled

3. **"access_denied" error**
   - Check if the OAuth consent screen is properly configured
   - Verify the user has granted necessary permissions

4. **Redirect not working**
   - Check your Supabase redirect URLs configuration
   - Ensure the redirect URL exists in your application

### Development vs Production

- **Development**: Use `http://localhost:3000` for both Google and Supabase
- **Production**: Use your actual domain with `https://`

## Security Best Practices

1. **Never expose Client Secret** in frontend code
2. **Use environment variables** for all sensitive data
3. **Configure proper redirect URLs** to prevent unauthorized redirects
4. **Regularly rotate** your OAuth credentials
5. **Monitor authentication logs** in Supabase dashboard

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Vue.js with Supabase Auth](https://supabase.com/docs/guides/getting-started/tutorials/with-vue-js)

## Support

If you encounter issues:

1. Check the browser console for errors
2. Review Supabase authentication logs
3. Verify Google Cloud Console configuration
4. Test with a fresh incognito window
