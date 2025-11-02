# Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create an account/project
2. Create a new project (note: you already have credentials according to your confirmation)

## Step 2: Run the Database Schema

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the contents of `schema.sql`
4. Paste and run it in the SQL Editor
5. Verify tables are created:
   - `users`
   - `natal_charts`
   - `conversations`
   - `scheduled_messages`

## Step 3: Get API Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 4: Set Environment Variables

1. Create a `.env.local` file in the project root (or use your existing `.env` file)
2. Add the environment variables from `.env.example`
3. Fill in your Supabase credentials

## Step 5: Verify Setup

The database layer (`lib/db.ts`) has been updated to use Supabase instead of in-memory storage.
All existing function signatures remain the same, so no other code changes are needed for the database migration itself.

## Note

- The `getHardcodedUser()` function has been removed from `lib/db.ts`
- API routes (`app/api/messages/route.ts` and `app/api/whatsapp/webhook/route.ts`) still reference it and will be updated in later steps to use proper user identification via phone number.

