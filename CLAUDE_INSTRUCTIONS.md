# Rewardy Club - Senior Full-Stack Development Prompt for Claude Code

## Project Status: Phase 3 Complete - Production Ready ✅

You are working on **Rewardy Club**, a digital stamp card platform with full subscription monetization. The MVP is complete and the platform is production-ready with Stripe integration for subscription management.


## Business Context

**Rewardy Club** is a digital loyalty platform connecting customers with local businesses.

**Problem:**
- Paper punch cards are easily lost
- Customers forget physical cards at home
- No data insights for businesses
- Manual tracking is error-prone

**Solution:**
- Mobile-first web app (no download needed)
- QR code scanning for instant stamp collection
- Real-time tracking for customers
- Analytics dashboard for businesses

## Technical Stack (Already Set Up)

- ✅ **Framework**: Next.js 16 with App Router
- ✅ **Styling**: Tailwind CSS 4
- ✅ **Language**: TypeScript (strict mode)
- ✅ **Authentication**: Firebase Authentication (Google OAuth)
- ✅ **Database**: Cloud Firestore
- ✅ **Storage**: Firebase Storage (for business logos)
- ✅ **Payments**: Stripe (Checkout + Customer Portal + Webhooks)
- ✅ **Server Operations**: Firebase Admin SDK

**Dependencies Installed:**
```bash
npm install firebase firebase-admin stripe @stripe/stripe-js qrcode.react html5-qrcode lucide-react date-fns
```

## Database Schema (Firestore)

### Collections Structure

```typescript
// Collection: users
interface User {
  uid: string;                    // Firebase Auth UID (primary key)
  email: string;
  displayName: string;
  photoURL?: string;
  userType: 'customer' | 'business';
  memberId: string;               // Format: RC-YYYY-XXXXXX (for customers)
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

// Collection: businesses
interface Business {
  id: string;                     // Document ID
  ownerId: string;                // References users.uid
  name: string;
  businessType: 'café' | 'restaurant' | 'retail' | 'other';
  email: string;
  phone?: string;
  logoURL?: string;               // Firebase Storage URL (Pro feature)
  stampCardConfig: {
    totalStamps: number;          // Free: fixed at 10, Pro: 3-50
    reward: string;               // e.g., "Free Coffee"
    colorClass: string;           // Tailwind gradient: "from-orange-500 to-orange-600"
  };
  stats: {
    totalCustomers: number;
    activeCards: number;
    totalStampsIssued: number;
  };
  subscription: {
    tier: 'free' | 'pro';
    status: 'active' | 'past_due' | 'canceled' | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    currentPeriodStart: Timestamp | null;
    currentPeriodEnd: Timestamp | null;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    maxCustomers: number;         // Free: 50, Pro: -1 (unlimited)
    maxMonthlyStamps: number;     // Free: 500, Pro: -1 (unlimited)
    currentMonthStamps: number;
    monthStartedAt: Timestamp;
    maxActivityFeedItems: number; // Free: 10, Pro: 100
    canUploadLogo: boolean;       // Free: false, Pro: true
    minStampCardStamps: number;   // Free: 10, Pro: 3
    maxStampCardStamps: number;   // Free: 10, Pro: 50
  };
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Collection: stampCards
interface StampCard {
  id: string;                     // Document ID
  userId: string;                 // References users.uid (customer)
  businessId: string;             // References businesses.id
  businessName: string;           // Denormalized for quick display
  businessType: 'café' | 'restaurant' | 'retail' | 'other';
  totalStamps: number;            // From business config
  currentStamps: number;          // Current progress (0 to totalStamps)
  reward: string;                 // From business config
  colorClass: string;             // From business config
  stamps: Array<{                 // Individual stamp records
    stampedAt: Timestamp;
    stampedBy: string;            // Business owner UID
  }>;
  isCompleted: boolean;           // true when currentStamps === totalStamps
  completedAt?: Timestamp;
  isRedeemed: boolean;
  redeemedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Collection: transactions (audit trail)
interface Transaction {
  id: string;
  type: 'stamp_added' | 'reward_redeemed' | 'card_created';
  customerId: string;
  businessId: string;
  stampCardId?: string;
  metadata: Record<string, any>;
  timestamp: Timestamp;
}
```

## Implementation Roadmap

### Phase 1: Core MVP Features (Priority: High)

#### 1. Firebase Setup & Configuration
**File: `lib/firebase.ts`**
```typescript
// Initialize Firebase with environment variables
// Export: auth, db, googleProvider
```

**File: `.env.local`** (already exists)
```bash
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=rewardy-club.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=rewardy-club
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=rewardy-club.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe (for subscription payments)
STRIPE_SECRET_KEY=sk_test_...                              # Stripe Secret Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...            # Stripe Publishable Key
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_...             # Monthly price ID (£15)
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=price_...              # Yearly price ID (£150)
STRIPE_WEBHOOK_SECRET=whsec_...                           # Webhook signing secret

# Firebase Admin SDK (for server-side operations)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account"...} # Service account JSON (optional)
```

**Tasks:**
- [ ] Create Firebase project at https://console.firebase.google.com/
- [ ] Enable Google Authentication
- [ ] Create Firestore database (start in test mode)
- [ ] Copy credentials to .env.local
- [ ] Initialize Firebase in lib/firebase.ts
- [ ] Test connection with simple auth check

---

#### 2. Authentication System
**File: `contexts/AuthContext.tsx`**
```typescript
// Create AuthContext with:
// - user: User | null
// - loading: boolean
// - loginWithGoogle: () => Promise<void>
// - logout: () => Promise<void>
// - Use onAuthStateChanged listener
// - Auto-create user document in Firestore on first login
```

**File: `app/layout.tsx`**
```typescript
// Wrap children with AuthProvider
// Keep existing layout structure
```

**File: `app/page.tsx`** (Login Page)
```typescript
// Features:
// - Toggle between Customer/Business login
// - Google Sign-In button with logo
// - Gradient background (purple to indigo)
// - QR code logo
// - Redirect to appropriate dashboard after login
```

**Tasks:**
- [ ] Create AuthContext with Firebase integration
- [ ] Implement Google OAuth flow
- [ ] Build login page UI
- [ ] Add user type selection (customer/business)
- [ ] Create user document in Firestore on first login
- [ ] Implement protected route logic
- [ ] Add logout functionality

---

#### 3. Customer Dashboard
**File: `app/customer/dashboard/page.tsx`**

**Features:**
- Display user's member QR code (scannable by businesses)
- List all active stamp cards
- Show progress for each card
- Real-time updates when stamps are added
- Empty state if no cards exist
- Loading spinner during data fetch

**Components to Create:**

**File: `components/customer/RewardCard.tsx`**
```typescript
// Customer's personal QR code card
// Props: userName, memberId
// Display QR code using qrcode.react (QRCodeSVG)
// Purple gradient design
// Show member ID below QR code
```

**File: `components/customer/StampCard.tsx`**
```typescript
// Individual stamp card component
// Props: businessName, businessType, totalStamps, currentStamps, reward, colorClass
// Show progress bar
// Display stamp circles (filled/empty)
// Show reward information
// Color-coded by business
```

**File: `components/customer/StampCardList.tsx`**
```typescript
// List container for stamp cards
// Handle loading state
// Handle empty state
// Map through cards and render StampCard components
```

**Tasks:**
- [ ] Create RewardCard component with QR code generation
- [ ] Create StampCard component with progress visualization
- [ ] Build customer dashboard page
- [ ] Fetch stamp cards from Firestore (useEffect + onSnapshot)
- [ ] Implement real-time updates
- [ ] Add loading and empty states
- [ ] Style with Tailwind (mobile-first)

---

#### 4. Business Dashboard
**File: `app/business/dashboard/page.tsx`**

**Features:**
- Display business statistics
- QR code scanner button
- Recent activity feed
- Add stamps to customer cards

**Components to Create:**

**File: `components/business/StatsCard.tsx`**
```typescript
// Statistics display card
// Props: icon, label, value, iconColor, bgColor
// Show metrics like total customers, active cards, today's stamps
```

**File: `components/business/QRScanner.tsx`**
```typescript
// QR code scanner using html5-qrcode
// Props: onScan, onClose
// Request camera permission
// Scan customer QR code (format: RC-YYYY-XXXXXX)
// Display scanning UI
// Show success/error feedback
```

**File: `components/business/RecentActivity.tsx`**
```typescript
// Recent stamp additions feed
// Show last 20 transactions
// Display customer name, time, stamps added
```

**Tasks:**
- [ ] Create business dashboard page
- [ ] Build StatsCard component
- [ ] Implement QR scanner with camera access
- [ ] Create activity feed
- [ ] Fetch business stats from Firestore
- [ ] Add scan and stamp flow
- [ ] Implement error handling for invalid QR codes

---

#### 5. Database & Business Logic
**File: `lib/firestore.ts`**

**Functions implemented:**
```typescript
// User Management
export async function createUser(uid: string, userData: Partial<User>): Promise<void>
export async function getUser(uid: string): Promise<User | null>
export async function getUserByMemberId(memberId: string): Promise<User | null>

// Member ID Generation
export async function generateMemberId(): Promise<string>
// Format: RC-YYYY-XXXXXX (e.g., RC-2024-789456)

// Stamp Cards
export async function getUserStampCards(userId: string): Promise<StampCard[]>
export async function getOrCreateStampCard(userId: string, businessId: string): Promise<StampCard>
export async function addStampToCard(cardId: string, businessOwnerId: string): Promise<void>
// Throws: 'LIMIT_MONTHLY_STAMPS', 'LIMIT_CUSTOMERS', or validation errors

// Business
export async function getBusinessByOwnerId(ownerId: string): Promise<Business | null>
export async function getBusinessStats(businessId: string): Promise<BusinessStats>
export async function createBusiness(businessData: Partial<Business>): Promise<string>
export async function updateBusiness(businessId: string, data: Partial<Business>): Promise<void>
export async function uploadBusinessLogo(businessId: string, file: File): Promise<string>
export async function deleteBusinessLogo(logoURL: string): Promise<void>

// Transactions
export async function logTransaction(transaction: Partial<Transaction>): Promise<void>
export async function getRecentTransactions(businessId: string, limit: number): Promise<Transaction[]>
```

**File: `lib/subscription.ts`** ✅ Implemented

**Subscription helper functions:**
```typescript
export function isPro(business: Business): boolean
export function canAddCustomer(business: Business): boolean
export function canAddStamp(business: Business): boolean
export function canUploadLogo(business: Business): boolean
export function getDefaultUsage(): UsageLimits     // Free tier limits
export function getProUsage(): UsageLimits         // Pro tier limits
export function shouldResetMonthlyStamps(business: Business): boolean
```

**File: `lib/stripe.ts`** ✅ Implemented

**Stripe SDK initialization:**
```typescript
export const stripe: Stripe                        // Stripe server SDK
export const PRICE_ID_MONTHLY: string             // Monthly price ID
export const PRICE_ID_YEARLY: string              // Yearly price ID
```

**File: `lib/firebase-admin.ts`** ✅ Implemented

**Firebase Admin SDK for server-side operations:**
```typescript
export const adminDb: admin.firestore.Firestore   // Admin Firestore
export const adminAuth: admin.auth.Auth           // Admin Auth
export default admin                               // Full admin namespace
```

**Validation Rules:**
- Prevent duplicate stamps within 15 minutes (same customer, same business)
- Validate member ID format (RC-YYYY-XXXXXX)
- Check stamp limit (can't exceed totalStamps)
- Check monthly stamp limit (Free tier: 500/month)
- Check customer limit (Free tier: 50 customers)
- Ensure business and customer exist before adding stamp
- Auto-reset monthly stamp counter after 30 days

---

#### 6. Firestore Security Rules
**File: `firestore.rules`** ✅ Implemented & Deployed

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    // Businesses collection
    match /businesses/{businessId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated()
        && isOwner(resource.data.ownerId)
        // Prevent client from modifying subscription/usage fields
        && !request.resource.data.diff(resource.data).affectedKeys()
          .hasAny(['subscription', 'usage']);
      allow delete: if isAuthenticated() && isOwner(resource.data.ownerId);
    }

    // Stamp cards collection
    match /stampCards/{cardId} {
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        get(/databases/$(database)/documents/businesses/$(resource.data.businessId)).data.ownerId == request.auth.uid
      );
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        resource.data.userId == request.auth.uid ||
        get(/databases/$(database)/documents/businesses/$(resource.data.businessId)).data.ownerId == request.auth.uid
      );
    }

    // Transactions collection (read-only for authenticated users)
    match /transactions/{transactionId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only via cloud functions or Admin SDK
    }
  }
}
```

**Security Architecture:**
- **Client SDK**: Subject to security rules, used for authenticated user operations
- **Admin SDK**: Bypasses security rules, used in API routes and webhooks
- **Subscription fields**: Protected from client modification, only writable via Admin SDK
- **Usage fields**: Protected from tampering, ensures feature limits are enforced

---

### Phase 2: Enhanced Features ✅ Complete

#### 7. Business Settings & Logo Management
**File: `components/business/BusinessSettings.tsx`** ✅ Implemented

**Features:**
- Update business name and contact information
- Configure stamp card (3-50 stamps for Pro, locked at 10 for Free)
- Set custom reward text
- Upload business logo (Pro feature, max 2MB, stored in Firebase Storage)
- Delete old logo when replacing
- Feature gates for Free tier with upgrade prompts

**File: `storage.rules`** ✅ Implemented & Deployed

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /logos/{businessLogoFile} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 2 * 1024 * 1024  // Max 2MB
        && request.resource.contentType.matches('image/.*');
      allow delete: if request.auth != null;
    }
  }
}
```

---

### Phase 3: Subscription Monetization ✅ Complete

#### 8. Stripe Integration

**Pricing Model:**
- **Free Tier**: £0/month
  - 50 customers max
  - 500 stamps/month max
  - Fixed 10 stamps per card
  - No logo upload
  - 10 activity feed items
- **Pro Tier**: £15/month or £150/year (save £30)
  - Unlimited customers
  - Unlimited stamps
  - Custom stamp cards (3-50 stamps)
  - Logo upload
  - 100 activity feed items

**API Routes:** ✅ Implemented

**File: `app/api/stripe/create-checkout/route.ts`**
- Creates Stripe Checkout session for upgrading to Pro
- Receives: priceId, businessId, businessEmail, stripeCustomerId
- Returns: Checkout session URL
- Redirects to Stripe hosted checkout page

**File: `app/api/stripe/create-portal/route.ts`**
- Creates Stripe Customer Portal session for billing management
- Receives: stripeCustomerId
- Returns: Portal session URL
- Allows Pro users to manage subscription, update payment method, view invoices

**File: `app/api/stripe/webhook/route.ts`**
- Handles Stripe webhook events using Admin SDK
- Verifies webhook signature for security
- Events handled:
  - `checkout.session.completed`: Upgrade business to Pro tier
  - `customer.subscription.updated`: Update subscription status
  - `customer.subscription.deleted`: Downgrade to Free tier
  - `invoice.payment_failed`: Mark subscription as past_due

**Stripe Setup:**
1. Create Stripe account at https://stripe.com
2. Create two products in Stripe Dashboard:
   - "Rewardy Club Pro - Monthly" (£15/month)
   - "Rewardy Club Pro - Yearly" (£150/year)
3. Copy price IDs to .env.local
4. Set up webhook endpoint at `/api/stripe/webhook`
5. Copy webhook signing secret to .env.local
6. Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

**Components:** ✅ Implemented

**File: `components/business/SubscriptionBadge.tsx`**
- Displays Free/Pro badge in dashboard header
- Crown icon for Pro tier
- Visual indicator of subscription status

**File: `components/business/UpgradeModal.tsx`**
- Pricing comparison table (Free vs Pro)
- Monthly/yearly billing toggle
- Initiates Stripe Checkout session
- Shows savings for yearly plan

**File: `components/business/UsageStats.tsx`**
- Displays usage progress bars for Free tier
- Shows customers (X/50) and monthly stamps (X/500)
- Warning indicators at 80%+ usage
- Upgrade button when approaching limits
- Hidden for Pro tier (unlimited usage)

**File: `components/business/BillingManagement.tsx`**
- Shows subscription status and next billing date
- Link to Stripe Customer Portal
- Manage subscription, update payment method, view invoices
- Cancel subscription button
- Only visible for Pro tier

**Feature Gating in Dashboard:**
- QR scanning blocked when monthly stamp limit reached (Free tier)
- Customer limit enforced when creating new stamp cards (Free tier)
- Logo upload blocked for Free tier with upgrade prompt
- Stamp configuration locked at 10 for Free tier
- Error handling shows upgrade modal when limits hit

---

### Phase 4: Advanced Features (Future)

#### 9. Business Onboarding Flow
**File: `app/business/onboarding/page.tsx`**
- Multi-step form (business info → stamp config → preview)
- Business verification
- Customize stamp card design
- Set reward configuration

#### 10. Reward Redemption System
- Mark card as ready to redeem
- Generate redemption QR code
- Reset card after redemption
- Track redemption history

#### 11. Advanced Analytics Dashboard
- Customer retention metrics
- Peak usage times
- Export data as CSV
- Visual charts (use recharts library)
- Revenue tracking (for Pro businesses)

---

## Technical Guidelines

### Code Quality Standards

1. **TypeScript Best Practices**
   - Use strict mode
   - Define interfaces in `/types` directory
   - Avoid `any` type
   - Use type guards for runtime validation

2. **React Patterns**
   - Functional components with hooks
   - Custom hooks for reusable logic
   - Memoization for expensive operations (useMemo, useCallback)
   - Proper error boundaries

3. **File Naming**
   - Components: PascalCase (`StampCard.tsx`)
   - Utilities: camelCase (`formatters.ts`)
   - Pages: lowercase (Next.js convention)

4. **Import Organization**
   - React imports first
   - Third-party libraries
   - Local components
   - Utilities and types
   - Styles last

5. **Error Handling**
   - Try-catch blocks for async operations
   - User-friendly error messages
   - Log errors to console (development)
   - Graceful fallbacks for UI components

### Performance Optimization

1. **Firestore Queries**
   - Use indexes for complex queries
   - Implement pagination (limit + startAfter)
   - Cache frequently accessed data
   - Use `onSnapshot` for real-time updates only when needed

2. **Component Optimization**
   - Lazy load heavy components (QR scanner)
   - Use React.memo for pure components
   - Debounce rapid user inputs
   - Optimize images with Next.js Image component

3. **Mobile Performance**
   - Mobile-first design (test on actual devices)
   - Minimize JavaScript bundle size
   - Use code splitting
   - Implement skeleton loading states

### Security Considerations

1. **Authentication**
   - Verify Firebase tokens on API routes
   - Implement middleware for protected routes
   - Handle expired sessions
   - Never expose Firebase admin SDK on client

2. **Input Validation**
   - Validate all user inputs (client + server)
   - Sanitize QR code data
   - Check email format
   - Prevent XSS attacks

3. **Rate Limiting**
   - Max 1 stamp per 15 minutes per customer per business
   - Max 50 QR scans per hour per business
   - Implement in Firestore security rules

4. **Data Privacy**
   - Store minimal user data
   - Hash sensitive information
   - Implement GDPR compliance (data export, deletion)

### Testing Strategy

1. **Unit Tests** (Jest + React Testing Library)
   - Test utility functions
   - Test custom hooks
   - Test component rendering

2. **Integration Tests**
   - Test authentication flow
   - Test stamp addition flow
   - Test Firestore operations

3. **E2E Tests** (Playwright or Cypress)
   - Customer signup → view cards → collect stamp
   - Business login → scan QR → add stamp

---

## Development Workflow

### Local Development
```bash
# Start development server
npm run dev

# Run Firebase emulators (optional but recommended)
firebase emulators:start --only auth,firestore

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

### Git Workflow
```bash
# Feature branch
git checkout -b feature/customer-dashboard

# Commit with conventional commits
git commit -m "feat: Add customer dashboard with stamp cards"

# Push and create PR
git push origin feature/customer-dashboard
```

### Deployment
```bash
# Build for production
npm run build

# Export static files
npm run export

# Deploy to Firebase
firebase deploy --only hosting
```

---

## Important Implementation Notes

### 1. Subscription System Architecture

**Data Flow:**
1. User clicks "Upgrade to Pro" → Opens UpgradeModal
2. Modal sends priceId + businessId to `/api/stripe/create-checkout`
3. API creates Stripe Checkout session and returns URL
4. User redirects to Stripe hosted checkout page
5. After payment, Stripe redirects back to success URL
6. Stripe sends webhook to `/api/stripe/webhook`
7. Webhook handler (using Admin SDK) updates business in Firestore
8. Business dashboard reflects Pro tier instantly via real-time listener

**Security Model:**
- Client SDK reads subscription data (read-only for client)
- Admin SDK writes subscription data (webhooks, API routes)
- Firestore rules prevent client from modifying subscription/usage fields
- Feature gates enforced at database level (lib/firestore.ts)
- Monthly reset handled automatically in addStampToCard()

**Limit Enforcement:**
```typescript
// In lib/firestore.ts - addStampToCard()
if (!canAddStamp(business)) {
  throw new Error('LIMIT_MONTHLY_STAMPS');
}

// In lib/firestore.ts - getOrCreateStampCard()
if (!canAddCustomer(business)) {
  throw new Error('LIMIT_CUSTOMERS');
}
```

**Error Handling:**
- Dashboard catches 'LIMIT_MONTHLY_STAMPS' and 'LIMIT_CUSTOMERS' errors
- Automatically shows upgrade modal when limits hit
- Clear error messages guide user to upgrade

**Monthly Reset Logic:**
- Triggered automatically in addStampToCard()
- Checks if 30 days have passed since monthStartedAt
- Resets currentMonthStamps to 0 and updates monthStartedAt
- No cron job needed - happens organically during usage

### 2. Firebase Admin SDK Setup

**Required for server-side operations (webhooks, API routes):**

**Option 1: Service Account Key (Production)**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download JSON file
4. Minify JSON to single line (remove newlines)
5. Add to .env.local: `FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account"...}`

**Option 2: Application Default Credentials (Development)**
- Install gcloud CLI
- Run: `gcloud auth application-default login`
- Set project: `gcloud config set project YOUR_PROJECT_ID`
- No env variable needed (lib/firebase-admin.ts will auto-detect)

**Important:** Admin SDK bypasses Firestore security rules. Only use in trusted server environments (API routes, webhooks).

### 3. QR Code Format
- Member ID format: `RC-YYYY-XXXXXX`
- Example: `RC-2024-789456`
- RC = Rewardy Club
- YYYY = Current year
- XXXXXX = Random 6-digit number

### 4. Camera Access (QR Scanner)
- Requires HTTPS (Firebase Hosting provides this)
- For local testing: Use `ngrok` or Firebase emulators
- Handle camera permission denial gracefully
- Show clear instructions to user

### 5. Real-Time Updates
- Use Firestore `onSnapshot` for customer stamp cards and business dashboard
- Unsubscribe on component unmount (cleanup)
- Show loading state during initial fetch
- Dashboard updates automatically when subscription changes via webhook

### 6. Stamp Cooldown Logic
```typescript
// Check if last stamp was within 15 minutes
const lastStamp = stampCard.stamps[stampCard.stamps.length - 1];
const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000);

if (lastStamp && lastStamp.stampedAt.toMillis() > fifteenMinutesAgo) {
  throw new Error('Please wait 15 minutes between stamps');
}
```

### 7. Mobile-First Design
- Test on actual mobile devices (iPhone, Android)
- Use responsive Tailwind breakpoints
- Touch targets minimum 44x44px
- Readable font sizes (16px minimum)

### 8. Error Messages
Be user-friendly and actionable:
- ✅ "QR code not found. Please ask the customer to show their member card."
- ❌ "Document does not exist in Firestore collection"
- ✅ "Monthly stamp limit reached. Upgrade to Pro for unlimited stamps."
- ❌ "Error: LIMIT_MONTHLY_STAMPS"

### 9. Loading States
Always show feedback during async operations:
- Button loading spinners
- Skeleton screens for content
- Progress indicators
- Never leave user in blank state

### 10. Offline Support
- Firestore has built-in offline persistence
- Enable it: `enableIndexedDbPersistence(db)`
- Show indicator when offline
- Queue operations for when back online

---

## Success Criteria

### Technical Metrics
- [x] Page load time < 2 seconds on mobile 4G
- [x] Lighthouse score > 90 (all categories)
- [x] Zero critical security vulnerabilities
- [x] All TypeScript strict mode passing
- [x] Firebase rules deployed and tested
- [x] Stripe webhook signature verification
- [x] Admin SDK properly isolated to server-side

### Functional Requirements (Phase 1-3 Complete)
- [x] Customer can sign up with Google
- [x] Customer can view their QR code
- [x] Customer can see all stamp cards
- [x] Business can scan QR codes
- [x] Business can add stamps to customer cards
- [x] Real-time updates work correctly
- [x] Stamp cooldown prevents abuse
- [x] Error handling works properly
- [x] Logo upload for Pro businesses
- [x] Subscription upgrade via Stripe Checkout
- [x] Subscription management via Stripe Customer Portal
- [x] Feature limits enforced for Free tier
- [x] Monthly stamp counter auto-resets
- [x] Webhooks handle subscription lifecycle

### User Experience
- [x] Smooth animations and transitions
- [x] Clear loading states
- [x] Helpful error messages
- [x] Mobile-optimized (tested on real devices)
- [x] Accessible (keyboard navigation, screen readers)
- [x] Usage stats visible for Free tier
- [x] Upgrade prompts when limits approached
- [x] Subscription badge in dashboard header

---

## Your Task as Senior Engineer

Approach this project with:

1. **Clean Architecture**
   - Separate concerns (UI, business logic, data access)
   - Reusable components and utilities
   - Consistent file structure

2. **Best Practices**
   - Follow React, TypeScript, Firebase best practices
   - Write self-documenting code
   - Add comments for complex logic

3. **User-Centric Development**
   - Think about edge cases
   - Provide clear feedback
   - Handle errors gracefully
   - Optimize for mobile

4. **Security & Performance**
   - Implement proper authentication checks
   - Write strict Firestore rules
   - Optimize queries and rendering
   - Minimize bundle size

5. **Maintainability**
   - Keep components focused (single responsibility)
   - Extract reusable logic into hooks
   - Write clear commit messages
   - Document complex decisions

6. **Testing Mindset**
   - Think about what could go wrong
   - Validate inputs
   - Test on multiple devices
   - Consider concurrent operations

---

## Getting Started Checklist (for new developers)

**Phase 1: Core MVP** ✅ Complete
- [x] Install dependencies: `npm install firebase firebase-admin stripe @stripe/stripe-js qrcode.react html5-qrcode lucide-react date-fns`
- [x] Create Firebase project and enable Google Auth
- [x] Enable Firestore and Firebase Storage
- [x] Add Firebase config to `.env.local`
- [x] Create `lib/firebase.ts` and initialize Firebase
- [x] Create `contexts/AuthContext.tsx` and implement authentication
- [x] Update `app/layout.tsx` to wrap with AuthProvider
- [x] Build login page at `app/page.tsx`
- [x] Implement customer dashboard
- [x] Implement business dashboard
- [x] Deploy Firestore security rules
- [x] Test end-to-end stamp flow

**Phase 2: Enhanced Features** ✅ Complete
- [x] Implement business settings modal
- [x] Add logo upload functionality
- [x] Deploy Storage security rules
- [x] Configure Storage CORS for localhost
- [x] Implement stamp card customization

**Phase 3: Subscription System** ✅ Complete
- [x] Create Stripe account and products
- [x] Add Stripe keys to `.env.local`
- [x] Set up Firebase Admin SDK
- [x] Create subscription helper functions
- [x] Implement Stripe API routes
- [x] Build subscription UI components
- [x] Add feature gates to database functions
- [x] Set up Stripe webhook endpoint
- [x] Update Firestore rules to protect subscription fields
- [x] Test subscription upgrade flow
- [x] Test webhook handling
- [x] Test feature limits enforcement

**Deployment:**
- [x] Build for production: `npm run build`
- [x] Deploy to Firebase Hosting
- [x] Configure Stripe webhook in production
- [x] Test production subscription flow

---

## Questions Addressed

1. **How do we handle a customer scanning their QR code twice at the same business within 15 minutes?**
   - ✅ Implemented: 15-minute cooldown prevents duplicate stamps

2. **What happens if a business owner tries to add more stamps than the card allows?**
   - ✅ Implemented: Validation prevents exceeding totalStamps limit

3. **How should we display errors when the camera permission is denied?**
   - ✅ Implemented: Clear error message with instructions

4. **Should we show a confirmation before adding a stamp, or make it instant?**
   - ✅ Implemented: Instant with success message

5. **How do we handle timezone differences for "today's stamps" metric?**
   - ✅ Implemented: Using Firestore server timestamps

6. **What's the UX for when a customer completes their card (reaches totalStamps)?**
   - ✅ Implemented: Card marked as completed, visual indication

7. **Should businesses be able to customize their card colors?**
   - ✅ Implemented: Fixed orange theme for brand consistency

8. **How do we prevent malicious QR codes from being scanned?**
   - ✅ Implemented: Member ID format validation (RC-YYYY-XXXXXX)

9. **How do we prevent businesses from bypassing subscription limits?**
   - ✅ Implemented: Firestore rules prevent client modification of subscription/usage fields

10. **What happens when a Pro business downgrades to Free and exceeds limits?**
    - ✅ Implemented: Existing data preserved, new operations blocked (soft limit)

11. **How do we handle failed payments for Pro subscriptions?**
    - ✅ Implemented: Webhook updates status to 'past_due', Stripe handles retry logic

---

## Current Status & Next Steps

**Current Status: Phase 3 Complete ✅**

The platform is production-ready with:
- ✅ Full authentication system
- ✅ Customer and business dashboards
- ✅ QR code stamp collection
- ✅ Real-time updates
- ✅ Business settings and logo uploads
- ✅ Two-tier subscription system (Free/Pro)
- ✅ Stripe payment integration
- ✅ Feature limits and gating
- ✅ Comprehensive security rules

**Potential Future Enhancements (Phase 4):**

1. **Reward Redemption System**
   - QR code for redemption
   - Track redemption history
   - Auto-reset cards after redemption

2. **Advanced Analytics**
   - Customer retention metrics
   - Peak usage times analysis
   - Revenue tracking dashboard
   - Data export (CSV)

3. **Marketing Features**
   - Email notifications
   - Push notifications (PWA)
   - Promotional campaigns
   - Referral program

4. **Multi-Location Support**
   - Business chains with multiple locations
   - Centralized management dashboard
   - Location-specific analytics

5. **Enhanced Customer Experience**
   - Customer profile pages
   - Transaction history
   - Achievement badges
   - Social sharing

**Development Guidelines:**

Remember: Quality over speed. We're building a production app that real users will depend on daily.

- Always test on real mobile devices
- Monitor Stripe webhook logs for issues
- Keep Firebase Admin SDK secure (server-side only)
- Test subscription flows thoroughly before deploying
- Monitor usage limits to ensure enforcement works correctly

---

**For Questions or Issues:**
- Check CLAUDE.md for project overview and setup instructions
- Review this file for architectural decisions
- Test locally with Stripe CLI for webhook debugging
- Use Firebase emulators for local development