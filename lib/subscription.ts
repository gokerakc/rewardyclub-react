import { Business, SubscriptionData, UsageLimits } from '@/types';
import { Timestamp, serverTimestamp } from 'firebase/firestore';

// Check if business has active Pro subscription
export function isPro(business: Business): boolean {
  return business.subscription.tier === 'pro' &&
         (business.subscription.status === 'active' || business.subscription.status === null);
}

// Check if business can add a new customer
export function canAddCustomer(business: Business): boolean {
  if (business.usage.maxCustomers === -1) return true; // Unlimited
  return business.stats.totalCustomers < business.usage.maxCustomers;
}

// Check if business can add a stamp this month
export function canAddStamp(business: Business): boolean {
  if (business.usage.maxMonthlyStamps === -1) return true; // Unlimited
  return business.usage.currentMonthStamps < business.usage.maxMonthlyStamps;
}

// Check if business can upload logo
export function canUploadLogo(business: Business): boolean {
  return business.usage.canUploadLogo;
}

// Get stamp configuration limits based on tier
export function getStampConfigLimits(business: Business): { min: number; max: number } {
  return {
    min: business.usage.minStampCardStamps,
    max: business.usage.maxStampCardStamps,
  };
}

// Get activity feed limit based on tier
export function getActivityFeedLimit(business: Business): number {
  return business.usage.maxActivityFeedItems;
}

// Calculate remaining customers for free tier
export function getRemainingCustomers(business: Business): number | null {
  if (business.usage.maxCustomers === -1) return null; // Unlimited
  const remaining = business.usage.maxCustomers - business.stats.totalCustomers;
  return Math.max(0, remaining);
}

// Calculate remaining monthly stamps for free tier
export function getRemainingMonthlyStamps(business: Business): number | null {
  if (business.usage.maxMonthlyStamps === -1) return null; // Unlimited
  const remaining = business.usage.maxMonthlyStamps - business.usage.currentMonthStamps;
  return Math.max(0, remaining);
}

// Check if monthly stamp count should be reset (30 days passed)
export function shouldResetMonthlyStamps(business: Business): boolean {
  const now = Date.now();
  const monthStarted = business.usage.monthStartedAt.toMillis();
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

  return (now - monthStarted) >= thirtyDaysInMs;
}

// Get default subscription data for Free tier
export function getDefaultSubscription(): SubscriptionData {
  return {
    tier: 'free',
    status: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    cancelAt: null,
  };
}

// Get default usage limits for Free tier
export function getDefaultUsage(): UsageLimits {
  return {
    maxCustomers: 50,
    maxMonthlyStamps: 500,
    currentMonthStamps: 0,
    monthStartedAt: serverTimestamp() as Timestamp,
    maxActivityFeedItems: 10,
    canUploadLogo: true,
    minStampCardStamps: 3,
    maxStampCardStamps: 50,
  };
}

// Get usage limits for Pro tier
export function getProUsage(): UsageLimits {
  return {
    maxCustomers: -1,              // Unlimited
    maxMonthlyStamps: -1,          // Unlimited
    currentMonthStamps: 0,         // Reset on upgrade
    monthStartedAt: serverTimestamp() as Timestamp,
    maxActivityFeedItems: 100,
    canUploadLogo: true,
    minStampCardStamps: 3,
    maxStampCardStamps: 50,
  };
}

// Calculate usage percentage for progress bars (Free tier only)
export function getUsagePercentage(current: number, max: number): number {
  if (max === -1) return 0; // Unlimited
  return Math.min(100, Math.round((current / max) * 100));
}

// Check if usage is approaching limit (80% or more)
export function isApproachingLimit(current: number, max: number): boolean {
  if (max === -1) return false; // Unlimited
  return (current / max) >= 0.8;
}
