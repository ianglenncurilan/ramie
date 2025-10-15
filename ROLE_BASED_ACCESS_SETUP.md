# RAMIE - Role-Based Access Control Setup

## Environment Variables Required

To run this application, you need to create a `.env` file in the root directory with your Supabase credentials:

```bash
# Create .env file
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a new project or select an existing one
3. Go to Settings > API
4. Copy the Project URL and anon/public key
5. Paste them into your `.env` file

## Running the Application

```bash
npm install
npm run dev
```

## Features Implemented

✅ **Admin Registration**: Users registered through the app are automatically set as admins
✅ **Role-Based Access**: Admin users have full access, normal users are restricted
✅ **Protected Routes**: Expenses and Manage Staff are admin-only
✅ **Forbidden Page**: Beautiful 404 page for unauthorized access
✅ **Dynamic Navigation**: Navigation bars adjust based on user role
✅ **Real-time Role Checking**: Reactive authentication system

## Testing

1. Register a new account - it will be created as an admin
2. Admin users can access all features including Expenses and Manage Staff
3. Normal users will see a forbidden page if they try to access admin features
4. Navigation automatically shows/hides admin-only buttons based on role
