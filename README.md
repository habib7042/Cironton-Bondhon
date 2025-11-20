# Friends Fund

A community savings application ("Samity" style) built with Next.js, Tailwind CSS, and Neon (PostgreSQL).

## Features
- **Group Savings:** View collective fund stats.
- **Transactions:** Deposit and Withdraw requests.
- **Admin Panel:** Approve or reject member requests.
- **AI Assistant:** "Shonali" (Gemini-powered) for help.
- **Secure Login:** Phone + PIN authentication.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env.local` file:
   ```env
   DATABASE_URL=postgres://user:password@host/neondb?sslmode=require
   API_KEY=your_gemini_api_key
   ```

3. **Database Setup:**
   Run the SQL commands in `db/schema.sql` in your Neon console.

4. **Run Locally:**
   ```bash
   npm run dev
   ```

## Tech Stack
- Next.js 14
- TypeScript
- Tailwind CSS
- PostgreSQL (Neon)
- Google Gemini AI
