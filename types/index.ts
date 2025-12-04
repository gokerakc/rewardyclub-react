import { Timestamp } from 'firebase/firestore';

// User types
export type UserType = 'customer' | 'business';

export interface User {
  uid: string;                    // Firebase Auth UID (primary key)
  email: string;
  displayName: string;
  photoURL?: string;
  userType: UserType;
  memberId: string;               // Format: RC-YYYY-XXXXXX (for customers)
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

// Business types
export type BusinessType = 'café' | 'restaurant' | 'retail' | 'other';

export interface StampCardConfig {
  totalStamps: number;            // e.g., 10 stamps for reward
  reward: string;                 // e.g., "Free Coffee"
  colorClass: string;             // Tailwind gradient: "from-purple-500 to-indigo-600"
}

export interface BusinessStats {
  totalCustomers: number;
  activeCards: number;
  totalStampsIssued: number;
}

// Subscription types
export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete';

export interface SubscriptionData {
  tier: SubscriptionTier;
  status: SubscriptionStatus | null;  // null for free tier
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;       // monthly or yearly
  currentPeriodStart: Timestamp | null;
  currentPeriodEnd: Timestamp | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: Timestamp | null;         // Actual cancellation date (when cancel_at_period_end is true)
}

export interface UsageLimits {
  maxCustomers: number;              // 50 free, -1 pro (unlimited)
  maxMonthlyStamps: number;          // 500 free, -1 pro (unlimited)
  currentMonthStamps: number;        // Reset monthly
  monthStartedAt: Timestamp;         // Track when to reset
  maxActivityFeedItems: number;      // 10 free, 100 pro
  canUploadLogo: boolean;            // false free, true pro
  minStampCardStamps: number;        // 10 free (fixed), 3 pro
  maxStampCardStamps: number;        // 10 free (fixed), 50 pro
}

export interface Business {
  id: string;                     // Document ID
  ownerId: string;                // References users.uid
  name: string;
  businessType: BusinessType;
  email: string;
  phone?: string;
  logoURL?: string;               // Firebase Storage URL for business logo
  stampCardConfig: StampCardConfig;
  stats: BusinessStats;
  subscription: SubscriptionData;    // Subscription tier and status
  usage: UsageLimits;                // Usage limits based on tier
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Stamp card types
export interface Stamp {
  stampedAt: Timestamp;
  stampedBy: string;              // Business owner UID
}

export interface StampCard {
  id: string;                     // Document ID
  userId: string;                 // References users.uid (customer)
  businessId: string;             // References businesses.id
  businessName: string;           // Denormalized for quick display
  businessType: BusinessType;
  logoURL?: string;               // Business logo (denormalized)
  totalStamps: number;            // From business config
  currentStamps: number;          // Current progress (0 to totalStamps)
  reward: string;                 // From business config
  colorClass: string;             // From business config
  stamps: Stamp[];                // Individual stamp records
  isCompleted: boolean;           // true when currentStamps === totalStamps
  completedAt?: Timestamp;
  isRedeemed: boolean;
  redeemedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Transaction types
export type TransactionType = 'stamp_added' | 'reward_redeemed' | 'card_created';

export interface Transaction {
  id: string;
  type: TransactionType;
  customerId: string;
  businessId: string;
  stampCardId?: string;
  metadata: Record<string, any>;
  timestamp: Timestamp;
}
