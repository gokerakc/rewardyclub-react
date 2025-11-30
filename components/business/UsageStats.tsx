'use client';

import { Business } from '@/types';
import { getUsagePercentage, isApproachingLimit } from '@/lib/subscription';

interface UsageStatsProps {
  business: Business;
  onUpgrade: () => void;
}

export default function UsageStats({ business, onUpgrade }: UsageStatsProps) {
  // Only show for Free tier
  if (business.subscription.tier !== 'free') {
    return null;
  }

  const customerPercentage = getUsagePercentage(
    business.stats.totalCustomers,
    business.usage.maxCustomers
  );

  const stampPercentage = getUsagePercentage(
    business.usage.currentMonthStamps,
    business.usage.maxMonthlyStamps
  );

  const customersApproaching = isApproachingLimit(
    business.stats.totalCustomers,
    business.usage.maxCustomers
  );

  const stampsApproaching = isApproachingLimit(
    business.usage.currentMonthStamps,
    business.usage.maxMonthlyStamps
  );

  const showWarning = customersApproaching || stampsApproaching;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-2 border-orange-200 dark:border-orange-900">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Free Plan Usage
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your monthly limits
          </p>
        </div>
        {showWarning && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Approaching Limit
          </span>
        )}
      </div>

      {/* Customers Usage */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Customers
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {business.stats.totalCustomers} / {business.usage.maxCustomers}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${
              customersApproaching
                ? 'bg-yellow-500'
                : customerPercentage >= 100
                ? 'bg-red-500'
                : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(customerPercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Monthly Stamps Usage */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Monthly Stamps
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {business.usage.currentMonthStamps} / {business.usage.maxMonthlyStamps}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${
              stampsApproaching
                ? 'bg-yellow-500'
                : stampPercentage >= 100
                ? 'bg-red-500'
                : 'bg-green-600'
            }`}
            style={{ width: `${Math.min(stampPercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onUpgrade}
          className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow hover:shadow-lg transition-all"
        >
          Upgrade to Pro for Unlimited Access
        </button>
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
          £15/month or £150/year • Cancel anytime
        </p>
      </div>
    </div>
  );
}
