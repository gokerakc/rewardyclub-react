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
