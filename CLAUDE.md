# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RewardyClub is a Next.js 16 application built with React 19, TypeScript, and Tailwind CSS 4. It's a digital stamp card platform connecting customers with local businesses, replacing traditional paper punch cards with a mobile-first web application.

**Brand**: Orange color scheme (#ea580c) throughout the application.

**Status**: Phase 3 Complete - Production-ready platform with subscription monetization:
- ✅ Landing page with product value proposition
- ✅ Authentication (Google OAuth) with user type selection
- ✅ Customer dashboard with QR code and real-time stamp cards
- ✅ Business dashboard with QR scanner, statistics, and activity feed
- ✅ Business settings with logo upload, stamp configuration, and reward management
- ✅ Firebase Storage integration for business logos
- ✅ **Subscription system with Stripe (Free/Pro tiers)**
- ✅ **Feature gating and usage limits enforcement**
- ✅ **Stripe Checkout and Customer Portal integration**
- ✅ **Webhook handler for subscription lifecycle events**
- ✅ Firestore composite indexes for optimized queries
- ✅ Secure Firestore rules preventing client tampering
- ✅ Responsive mobile-first design

## Development Commands

- **Start development server**: `npm run dev` (runs on http://localhost:3000)
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Run linter**: `npm run lint`

## Setup Required

### Firebase Setup

Before running the application, you need to:

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Google Authentication (Authentication → Sign-in method → Google)
3. Create a Firestore database (Firestore Database → Create database → Start in test mode)
4. Enable Firebase Storage (Storage → Get Started)
5. Copy Firebase config to `.env.local` (replace placeholder values)
6. Deploy Firestore security rules: `firebase deploy --only firestore:rules`
7. Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
8. Deploy Storage security rules: `firebase deploy --only storage`
9. Configure Storage CORS (see below)
10. **Download Firebase Admin SDK service account key** (for webhooks)

The `.env.local` file contains placeholder values that must be replaced with your actual Firebase credentials.

**Important**: The Firestore indexes are required for queries with multiple where clauses and orderBy. If you get an error saying "The query requires an index", make sure you've deployed the indexes from `firestore.indexes.json`.

### Stripe Setup (for Subscription System)

1. Create a Stripe account at https://stripe.com
2. Switch to **Test Mode** (toggle in top right)
3. Create a product "RewardyClub Pro":
   - Price 1: £15.00/month recurring
   - Price 2: £150.00/year recurring
4. Copy API keys and Price IDs to `.env.local`
5. Set up webhook endpoint (for local testing):
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
6. Copy webhook secret to `.env.local`

### Environment Variables

Add these to `.env.local`:

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (for webhooks)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_...
```

**Security**: Never commit `.env.local` to git. It's already in `.gitignore`.

### Firebase Storage CORS Configuration

To allow logo uploads from localhost during development, you need to configure CORS for Firebase Storage:

**Option 1: Using Google Cloud Console (Easiest)**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to Cloud Storage → Buckets
4. Click on your bucket (usually `[project-id].appspot.com`)
5. Go to the "Configuration" tab
6. Click "Edit CORS configuration"
7. Paste the contents of `storage.cors.json`
8. Save

**Option 2: Using gsutil (Command Line)**
```bash
# Install Google Cloud SDK if not already installed
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Apply CORS configuration
gsutil cors set storage.cors.json gs://YOUR_BUCKET_NAME.appspot.com
```

Replace `YOUR_PROJECT_ID` with your Firebase project ID and `YOUR_BUCKET_NAME` with your storage bucket name (found in Firebase Console → Storage).

## Architecture

### App Router Structure

This project uses Next.js App Router (not Pages Router). All routes are defined in the `app/` directory:

**Pages:**
- `app/page.tsx` - Landing page explaining the product value proposition
- `app/login/page.tsx` - Login page with Google OAuth and user type selection
- `app/layout.tsx` - Root layout wrapped with AuthProvider (Geist Sans & Geist Mono fonts)
- `app/customer/dashboard/page.tsx` - Customer dashboard showing QR code and stamp cards
- `app/business/dashboard/page.tsx` - Business dashboard with QR scanner and statistics

**API Routes:** (Server-side, using Firebase Admin SDK and Stripe)
- `app/api/stripe/create-checkout/route.ts` - Creates Stripe Checkout session for Pro upgrade
- `app/api/stripe/create-portal/route.ts` - Creates Stripe Customer Portal session for billing management
- `app/api/stripe/webhook/route.ts` - Handles Stripe webhook events (subscription lifecycle)

### Component Architecture

Components are organized by feature:

**Customer Components** (`components/customer/`):
- `RewardCard.tsx` - Displays customer's QR code for scanning
- `StampCard.tsx` - Shows individual stamp card progress with visual stamps
- `StampCardList.tsx` - Lists all stamp cards with loading/empty states

**Business Components** (`components/business/`):
- `StatsCard.tsx` - Reusable stat display card (customers, cards, stamps)
- `QRScanner.tsx` - Camera-based QR code scanner using html5-qrcode
- `RecentActivity.tsx` - Transaction feed showing recent stamp additions
- `BusinessSettings.tsx` - Settings modal for logo upload, business name, stamp count, and reward configuration
- **`SubscriptionBadge.tsx`** - Shows Free/Pro tier badge in dashboard header
- **`UpgradeModal.tsx`** - Pricing comparison and Stripe Checkout integration
- **`UsageStats.tsx`** - Progress bars for Free tier limits (customers, monthly stamps)
- **`BillingManagement.tsx`** - Stripe Customer Portal integration for Pro users

### Core Libraries and Data Layer

**Firebase Integration** (`lib/firebase.ts`):
- Initializes Firebase app, Auth, Firestore, and Storage
- Enables offline persistence for better mobile experience
- Exports `auth`, `db`, `storage`, and `googleProvider`

**Firebase Admin SDK** (`lib/firebase-admin.ts`):
- Server-side Firebase with full database access (bypasses security rules)
- Used by API routes and webhooks
- Supports service account credentials or application default credentials
- Exports `adminDb`, `adminAuth`

**Database Helpers** (`lib/firestore.ts`):
- User management: `createUser()`, `getUser()`, `getUserByMemberId()`
- Stamp cards: `getUserStampCards()`, `getOrCreateStampCard()`, `addStampToCard()`
- Business: `getBusinessByOwnerId()`, `createBusiness()`, `updateBusiness()`, `getBusinessStats()`
- Transactions: `logTransaction()`, `getRecentTransactions()`
- Member ID generation: Format `RC-YYYY-XXXXXX` (e.g., RC-2024-789456)
- **Subscription limit enforcement**: Checks customer and monthly stamp limits before operations

**Stripe Integration** (`lib/stripe.ts`):
- Initializes Stripe with secret key (server-side only)
- Exports `stripe` instance and price ID constants
- Used by API routes for checkout and portal session creation

**Subscription Helpers** (`lib/subscription.ts`):
- Helper functions: `isPro()`, `canAddCustomer()`, `canAddStamp()`, `canUploadLogo()`
- Default tier configurations: `getDefaultUsage()`, `getProUsage()`
- Usage calculations: `getUsagePercentage()`, `isApproachingLimit()`
- Monthly stamp reset logic: `shouldResetMonthlyStamps()`

**Authentication** (`contexts/AuthContext.tsx`):
- Global auth state using React Context
- Auto-creates user document in Firestore on first login
- Handles user type selection (customer/business)
- Provides `loginWithGoogle()` and `logout()` functions

**Type Definitions** (`types/index.ts`):
- Full TypeScript interfaces for User, Business, StampCard, Transaction
- **Subscription types**: SubscriptionData, UsageLimits, SubscriptionTier, SubscriptionStatus
- Ensures type safety across the application

### Client vs Server Components

- All dashboard pages and interactive components use 'use client' directive
- Server Components used for static layouts
- When adding interactivity, state, or browser APIs, components must have 'use client' at the top

### Styling & Branding

- Uses Tailwind CSS 4 with the new `@import "tailwindcss"` syntax (not the old @tailwind directives)
- **Primary Color**: Orange (#ea580c, #f97316) - used throughout UI for buttons, accents, and highlights
- CSS variables defined in `app/globals.css` for theming
- Dark mode support via `prefers-color-scheme` media query
- Custom theme variables: `--color-background`, `--color-foreground`, `--font-sans`, `--font-mono`
- Custom favicon: `app/icon.png` (loyalty program logo)

### TypeScript Configuration

- Path alias `@/*` maps to root directory (e.g., `@/app/components/Button`)
- Strict mode enabled
- Target: ES2017
- JSX runtime: `react-jsx` (automatic JSX transform, no need to import React in JSX files)

## Features

### For Customers
- **Universal QR Code**: Single QR code works at all participating businesses
- **Digital Stamp Cards**: Track progress across multiple businesses in one app
- **Real-time Updates**: See stamps added instantly via Firestore listeners
- **Progress Tracking**: Visual progress bars and stamp grids
- **Reward Visibility**: Clear display of rewards and completion status

### For Businesses

**Free Tier:**
- QR Code Scanning (unlimited)
- 50 customers maximum
- 500 monthly stamps
- Custom logo upload (Firebase Storage, max 2MB)
- Configurable stamp count (3-50 stamps)
- Last 10 transactions visible
- Basic analytics dashboard

**Pro Tier (£15/month or £150/year):**
- Unlimited customers
- Unlimited monthly stamps
- Custom logo upload (Firebase Storage, max 2MB)
- Configurable stamp count (3-50 stamps)
- Last 100 transactions
- Advanced analytics
- Stripe Customer Portal for billing management

**All Tiers Include:**
- Real-time QR code scanning with html5-qrcode
- Business settings customization
- Real-time transaction feed
- Simple onboarding (under 5 minutes)

## Important Business Logic

### Stamp Validation Rules (lib/firestore.ts)

The `addStampToCard()` function implements these validations:
- **Cooldown period**: 15 minutes between stamps (same customer, same business)
- **Stamp limit**: Cannot exceed `totalStamps` configured for the card
- **Completed cards**: Cannot add stamps to completed or redeemed cards
- **Auto-completion**: Card is marked complete when `currentStamps === totalStamps`
- **Monthly stamp limit**: Free tier limited to 500 stamps/month, resets after 30 days
- **Auto-reset**: Monthly stamp counter resets automatically after 30 days from `monthStartedAt`

### Subscription Limit Enforcement (lib/firestore.ts)

**Customer Limit** (`getOrCreateStampCard()`):
- Free tier: Maximum 50 unique customers
- Pro tier: Unlimited customers
- Error thrown: `LIMIT_CUSTOMERS` when limit reached
- Enforcement point: Before creating new stamp card for new customer

**Monthly Stamp Limit** (`addStampToCard()`):
- Free tier: Maximum 500 stamps per month
- Pro tier: Unlimited stamps
- Error thrown: `LIMIT_MONTHLY_STAMPS` when limit reached
- Enforcement point: Before adding stamp to card
- Auto-reset: After 30 days from `usage.monthStartedAt`

**Downgrade Behavior**:
- When Pro downgrades to Free, existing data is preserved
- New operations blocked if over Free tier limits
- Example: 100 customers kept, but can't add 101st until under 50

### Member ID Format

- Format: `RC-YYYY-XXXXXX`
- Example: `RC-2024-789456`
- RC = Rewardy Club prefix
- YYYY = Current year
- XXXXXX = Random 6-digit number
- Validated in business dashboard before processing scans

### Real-Time Updates

- Customer dashboard uses Firestore `onSnapshot` for real-time stamp updates
- Business dashboard shows live transaction feed
- All subscriptions properly cleaned up on component unmount

### Business Settings & Logo Management

- Businesses can upload logos via Firebase Storage
- Logo validation: Images only, max 2MB
- Old logos automatically deleted when replaced
- Logos stored at: `logos/{businessId}_{timestamp}.{ext}`
- Changes to stamp configuration apply only to new cards (existing cards unchanged)
- Settings changes trigger automatic dashboard refresh

## Key Conventions

- Server Components are the default; add 'use client' only when needed
- Use relative imports for components in the same feature area
- Use path alias `@/` for cross-cutting imports
- Follow Next.js App Router conventions for routing (folder-based routing with page.tsx files)
- Component files use PascalCase (e.g., `StampCard.tsx`)
- Utility files use camelCase (e.g., `firestore.ts`)

## Configuration Files

**Firebase:**
- `firestore.rules` - Firestore security rules (protects subscription/usage fields from client modification)
- `firestore.indexes.json` - Composite indexes for complex queries
- `storage.rules` - Firebase Storage security rules (images only, 2MB max, authenticated uploads)
- `storage.cors.json` - CORS configuration for Storage (allows localhost and production domains)
- `firebase.json` - Firebase deployment configuration

**Environment:**
- `.env.local` - Environment variables (Firebase, Stripe credentials) - NEVER commit this file
- `.gitignore` - Ensures sensitive files are not committed

## Subscription System Architecture

### Data Flow

**Upgrade Flow:**
1. User clicks "Upgrade to Pro" → Opens UpgradeModal
2. Selects monthly/yearly → Calls `/api/stripe/create-checkout`
3. API creates Stripe Checkout session → Redirects to Stripe
4. User completes payment → Stripe sends webhook to `/api/stripe/webhook`
5. Webhook handler updates Firestore (using Admin SDK) → Business upgraded to Pro
6. User returns to dashboard → Pro features unlocked

**Webhook Events Handled:**
- `checkout.session.completed` - Upgrades business to Pro tier
- `customer.subscription.updated` - Updates subscription status/dates
- `customer.subscription.deleted` - Downgrades business to Free tier
- `invoice.payment_failed` - Sets subscription status to `past_due`

### Security Architecture

**Client-Side (Security Rules):**
- Businesses can read their own data
- Businesses can update safe fields (name, stampCardConfig, logoURL)
- **Cannot** modify subscription or usage fields (server-only)
- Prevents tampering with tier limits

**Server-Side (Admin SDK):**
- Webhooks use Admin SDK (bypasses security rules)
- Full database access for subscription management
- Validates Stripe webhook signatures
- Updates subscription/usage atomically

**API Routes:**
- No Firestore reads (avoids auth issues)
- Receives necessary data from authenticated client
- Calls Stripe API directly
- Returns session URLs for checkout/portal

## Recent Fixes & Known Issues (Dec 2025)

### Firestore Security Rules - Critical Fixes

The security rules required several important fixes to enable the QR scanning workflow:

1. **User Collection Access** (firestore.rules:25):
   - Changed from: `allow read: if isOwner(userId)`
   - Changed to: `allow read: if isAuthenticated()`
   - **Why**: Businesses need to query users by `memberId` during QR scanning. Without this, `getUserByMemberId()` fails with "Missing or insufficient permissions"

2. **Business Ownership Helper Function** (firestore.rules:17-20):
   - Added `ownsBusiness(businessId)` helper function
   - **Critical**: `businessId` in stamp cards/transactions refers to the business **document ID**, not the owner's user ID
   - Old rules incorrectly used `isOwner(resource.data.businessId)` which would never match
   - New rules use `ownsBusiness()` to look up the business document and check ownership

3. **Stamp Cards Collection** (firestore.rules:62-77):
   - Added `allow create` and `allow update` rules for business owners
   - Uses `ownsBusiness()` to verify the authenticated user owns the business
   - Without this, `getOrCreateStampCard()` and `addStampToCard()` fail with permissions errors

4. **Transactions Collection** (firestore.rules:80-90):
   - Added `allow create` rule for business owners
   - Without this, `logTransaction()` fails silently (doesn't block main operations but no audit trail)

5. **Business Updates** (firestore.rules:44-58):
   - Modified to allow updates to usage counters while protecting limits
   - Allows: `usage.currentMonthStamps`, `usage.monthStartedAt`, `stats.*`, safe business fields
   - Protects: `subscription.*`, `usage.maxCustomers`, `usage.maxMonthlyStamps` (server-only)

### QR Scanner - Duplicate Scan Prevention

Fixed QR scanner continuously processing multiple scans (QRScanner.tsx:32-50):

1. **Synchronous Processing Flag** (line 17, 34-36):
   - Uses `processingRef.current` (ref, not state) for immediate synchronous check
   - Prevents race conditions where multiple scans trigger before state updates

2. **Immediate Scanner Stop** (line 43-47):
   - Scanner stops **before** calling `onScan()` callback
   - Prevents additional QR detections during async stamp processing

3. **Visual Feedback** (line 131-141):
   - Shows checkmark + "Processing scan..." overlay immediately
   - Disabled controls prevent accidental cancellation

4. **Error Handling** (dashboard page.tsx:170-186):
   - Scanner now closes on **all** errors (cooldown, invalid QR, limits, etc.)
   - Error messages auto-dismiss after 5 seconds
   - Subscription limit errors open upgrade modal

### Firestore Undefined Value Prevention

Fixed `undefined` value error when creating stamp cards (firestore.ts:149):

- Changed from: `logoURL: business.logoURL`
- Changed to: `...(business.logoURL && { logoURL: business.logoURL })`
- **Why**: Firestore rejects documents with `undefined` values
- Uses conditional spread to only include `logoURL` field if it exists

### Complete QR Scanning Flow (Now Working)

1. Business clicks "Scan Customer QR Code"
2. Camera opens, QR code detected
3. Scanner stops immediately, shows "Processing scan..."
4. Looks up customer by member ID → `getUserByMemberId()` ✓
5. Gets or creates stamp card → `getOrCreateStampCard()` ✓
6. Adds stamp with cooldown check → `addStampToCard()` ✓
7. Updates business stats and usage counters ✓
8. Logs transaction → `logTransaction()` ✓
9. Scanner closes, success message shows
10. Dashboard updates in real-time via Firestore listeners
