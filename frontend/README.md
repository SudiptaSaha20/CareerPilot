# CareerPilot — Next.js

AI-powered career intelligence platform. Migrated from React+Vite to **Next.js 15 (App Router)** with full authentication.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Auth**: Auth.js v5 (next-auth) — Google, GitHub, LinkedIn, Microsoft + Email/Password + OTP
- **Database**: Prisma + PostgreSQL (Neon or Supabase)
- **UI**: Tailwind CSS + shadcn/ui + Framer Motion
- **Forms**: React Hook Form + Zod

## Project Structure

```
app/
├── page.tsx              # Landing page (with auth modal)
├── layout.tsx            # Root layout
├── globals.css           # Global styles
├── upload/page.tsx       # Resume upload
├── dashboard/
│   ├── layout.tsx        # Dashboard sidebar layout
│   ├── page.tsx          # Overview
│   ├── resume/page.tsx   # Resume Analyzer
│   ├── interview/page.tsx # Interview Guide
│   ├── market/page.tsx   # Market Analyzer
│   └── report/page.tsx   # Generate Report
├── profile/page.tsx      # User Profile
└── api/
    ├── auth/[...nextauth]/route.ts  # NextAuth handler
    ├── auth/register/route.ts       # Email signup
    ├── auth/send-otp/route.ts       # Send OTP email
    └── auth/verify-otp/route.ts     # Verify OTP code

components/
├── auth/
│   ├── auth-modal.tsx    # Login/Signup modal (all providers)
│   └── otp-input.tsx     # 6-digit OTP input
├── providers.tsx         # SessionProvider + QueryClient
└── ui/                   # shadcn/ui components

lib/
├── prisma.ts             # Prisma client singleton
├── mailer.ts             # Nodemailer for OTP emails
├── mock-data.ts          # Demo data
└── utils.ts              # cn() utility

auth.ts                   # NextAuth config (all providers)
prisma/schema.prisma      # Database schema
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in the values — see `.env.example` for instructions on each provider.

### 3. Set up database

Free options:
- **Neon**: https://neon.tech (recommended — serverless Postgres)
- **Supabase**: https://supabase.com

```bash
npx prisma generate
npx prisma db push
```

### 4. Configure OAuth providers

Follow the inline comments in `.env.example` for each provider. Each takes ~5–10 minutes.

**LinkedIn tip**: You must add the "Sign In with LinkedIn using OpenID Connect" product in your app settings. Takes a few minutes to activate.

**Microsoft tip**: Set Tenant ID to `"common"` to support both personal and corporate accounts.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Auth Flow

| Method | How it works |
|--------|-------------|
| Google / GitHub / LinkedIn / Microsoft | OAuth 2.0 via Auth.js — one click, no password |
| Email + Password | Credentials provider — stored hashed with bcrypt |
| OTP Verification | After signup: 6-digit code sent to email via Nodemailer |
| Forgot Password | OTP flow to verify identity before reset |

## Deploying

Works out of the box on **Vercel**:

```bash
vercel deploy
```

Set all env vars in the Vercel dashboard. Update OAuth callback URLs to your production domain.
