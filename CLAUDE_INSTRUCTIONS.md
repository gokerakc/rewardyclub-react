# Rewardy Club - Senior Full-Stack Development Prompt for Claude Code

## Project Status: Foundation Complete ✅

You are joining an existing Next.js project for **Rewardy Club**, a digital stamp card platform. The basic project structure has been set up locally, and you'll be implementing the core features as a senior full-stack engineer.


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

- ✅ **Framework**: Next.js
- ✅ **Styling**: Tailwind CSS
- ✅ **Language**: TypeScript
- ⚙️ **Authentication**: Firebase Authentication (to configure)
- ⚙️ **Database**: Cloud Firestore (to configure)
- ⚙️ **Hosting**: Firebase Hosting (to deploy)

**Dependencies to Install:**
```bash
npm install firebase qrcode.react html5-qrcode lucide-react
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
  stampCardConfig: {
    totalStamps: number;          // e.g., 10 stamps for reward
    reward: string;               // e.g., "Free Coffee"
    colorClass: string;           // Tailwind gradient: "from-purple-500 to-indigo-600"
  };
  stats: {
    totalCustomers: number;
    activeCards: number;
    totalStampsIssued: number;
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

**File: `.env.local`** (already exists, add these)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=rewardy-club.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=rewardy-club
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=rewardy-club.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
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

#### 5. Stamp Management Logic
**File: `lib/firestore.ts`**

**Functions to implement:**
```typescript
// User Management
export async function createUser(uid: string, userData: Partial<User>): Promise<void>
export async function getUser(uid: string): Promise<User | null>
export async function updateUserLoginTime(uid: string): Promise<void>

// Member ID Generation
export async function generateMemberId(): Promise<string>
// Format: RC-YYYY-XXXXXX (e.g., RC-2024-789456)

// Stamp Cards
export async function getUserStampCards(userId: string): Promise<StampCard[]>
export async function getOrCreateStampCard(userId: string, businessId: string): Promise<StampCard>
export async function addStampToCard(cardId: string, businessOwnerId: string): Promise<boolean>
// Returns false if stamp limit reached or cooldown active

// Business
export async function getBusinessByOwnerId(ownerId: string): Promise<Business | null>
export async function getBusinessStats(businessId: string): Promise<BusinessStats>
export async function createBusiness(businessData: Partial<Business>): Promise<string>

// Transactions
export async function logTransaction(transaction: Partial<Transaction>): Promise<void>
export async function getRecentTransactions(businessId: string, limit: number): Promise<Transaction[]>
```

**Validation Rules:**
- Prevent duplicate stamps within 15 minutes (same customer, same business)
- Validate member ID format (RC-YYYY-XXXXXX)
- Check stamp limit (can't exceed totalStamps)
- Ensure business and customer exist before adding stamp

**Tasks:**
- [ ] Implement all database helper functions
- [ ] Add member ID generator (RC-YYYY-XXXXXX format)
- [ ] Create stamp addition logic with validation
- [ ] Implement stamp cooldown (15 minutes)
- [ ] Add transaction logging for audit trail
- [ ] Write error handling for all database operations

---

#### 6. Firestore Security Rules
**File: `firestore.rules`**

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
      allow update, delete: if isAuthenticated() && 
        get(/databases/$(database)/documents/businesses/$(businessId)).data.ownerId == request.auth.uid;
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
    
    // Transactions collection (read-only for business owners)
    match /transactions/{transactionId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only via server-side functions
    }
  }
}
```

**Tasks:**
- [ ] Create firestore.rules file
- [ ] Test rules in Firebase Console
- [ ] Deploy rules: `firebase deploy --only firestore:rules`

---

### Phase 2: Enhanced Features (Post-MVP)

#### 7. Business Onboarding Flow
**File: `app/business/onboarding/page.tsx`**
- Multi-step form (business info → stamp config → preview)
- Business verification
- Customize stamp card design
- Set reward configuration

#### 8. Reward Redemption System
- Mark card as ready to redeem
- Generate redemption QR code
- Reset card after redemption
- Track redemption history

#### 9. Analytics Dashboard
- Customer retention metrics
- Peak usage times
- Export data as CSV
- Visual charts (use recharts library)

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

### 1. QR Code Format
- Member ID format: `RC-YYYY-XXXXXX`
- Example: `RC-2024-789456`
- RC = Rewardy Club
- YYYY = Current year
- XXXXXX = Random 6-digit number

### 2. Camera Access (QR Scanner)
- Requires HTTPS (Firebase Hosting provides this)
- For local testing: Use `ngrok` or Firebase emulators
- Handle camera permission denial gracefully
- Show clear instructions to user

### 3. Real-Time Updates
- Use Firestore `onSnapshot` for customer stamp cards
- Unsubscribe on component unmount (cleanup)
- Show loading state during initial fetch

### 4. Stamp Cooldown Logic
```typescript
// Check if last stamp was within 15 minutes
const lastStamp = stampCard.stamps[stampCard.stamps.length - 1];
const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000);

if (lastStamp && lastStamp.stampedAt.toMillis() > fifteenMinutesAgo) {
  throw new Error('Please wait 15 minutes between stamps');
}
```

### 5. Mobile-First Design
- Test on actual mobile devices (iPhone, Android)
- Use responsive Tailwind breakpoints
- Touch targets minimum 44x44px
- Readable font sizes (16px minimum)

### 6. Error Messages
Be user-friendly and actionable:
- ✅ "QR code not found. Please ask the customer to show their member card."
- ❌ "Document does not exist in Firestore collection"

### 7. Loading States
Always show feedback during async operations:
- Button loading spinners
- Skeleton screens for content
- Progress indicators
- Never leave user in blank state

### 8. Offline Support
- Firestore has built-in offline persistence
- Enable it: `enableIndexedDbPersistence(db)`
- Show indicator when offline
- Queue operations for when back online

---

## Success Criteria

### Technical Metrics
- [ ] Page load time < 2 seconds on mobile 4G
- [ ] Lighthouse score > 90 (all categories)
- [ ] Zero critical security vulnerabilities
- [ ] All TypeScript strict mode passing
- [ ] Firebase rules deployed and tested

### Functional Requirements
- [ ] Customer can sign up with Google
- [ ] Customer can view their QR code
- [ ] Customer can see all stamp cards
- [ ] Business can scan QR codes
- [ ] Business can add stamps to customer cards
- [ ] Real-time updates work correctly
- [ ] Stamp cooldown prevents abuse
- [ ] Error handling works properly

### User Experience
- [ ] Smooth animations and transitions
- [ ] Clear loading states
- [ ] Helpful error messages
- [ ] Mobile-optimized (tested on real devices)
- [ ] Accessible (keyboard navigation, screen readers)

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

## Getting Started Checklist

- [ ] Install dependencies: `npm install firebase qrcode.react html5-qrcode lucide-react`
- [ ] Create Firebase project and enable Google Auth
- [ ] Add Firebase config to `.env.local`
- [ ] Create `lib/firebase.ts` and initialize Firebase
- [ ] Create `contexts/AuthContext.tsx` and implement authentication
- [ ] Update `app/layout.tsx` to wrap with AuthProvider
- [ ] Build login page at `app/page.tsx`
- [ ] Test authentication flow
- [ ] Proceed with customer dashboard implementation
- [ ] Then implement business dashboard
- [ ] Deploy Firestore security rules
- [ ] Test end-to-end flow
- [ ] Deploy to Firebase Hosting

---

## Questions to Consider

1. How do we handle a customer scanning their QR code twice at the same business within 15 minutes?
2. What happens if a business owner tries to add more stamps than the card allows?
3. How should we display errors when the camera permission is denied?
4. Should we show a confirmation before adding a stamp, or make it instant?
5. How do we handle timezone differences for "today's stamps" metric?
6. What's the UX for when a customer completes their card (reaches totalStamps)?
7. Should businesses be able to customize their card colors?
8. How do we prevent malicious QR codes from being scanned?

---

## Next Steps

Start with **Phase 1, Section 1** (Firebase Setup). Build incrementally and test each feature thoroughly before moving to the next. Focus on getting the core stamp collection flow working perfectly before adding enhancements.

Remember: Quality over speed. We're building a production app that real users will depend on daily.

Good luck! 🚀

**Let me know when you've completed each section, and I'll help you with the next steps or troubleshoot any issues.**