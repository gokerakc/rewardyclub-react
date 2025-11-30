'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Business } from '@/types';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  business?: Business;
}

export default function UpgradeModal({ open, onClose, business }: UpgradeModalProps) {
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleUpgrade = async () => {
    if (!user || !business) return;

    setLoading(true);
    try {
      const priceId = billingPeriod === 'monthly'
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY;

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          businessId: business.id,
          businessEmail: business.email,
          stripeCustomerId: business.subscription.stripeCustomerId,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  const features = [
    { name: 'Active Customers', free: '50', pro: 'Unlimited' },
    { name: 'Monthly Stamps', free: '500', pro: 'Unlimited' },
    { name: 'Active Stamp Cards', free: '100', pro: 'Unlimited' },
    { name: 'Logo Upload', free: '✗', pro: '✓' },
    { name: 'Stamp Configuration', free: 'Fixed (10)', pro: 'Custom (3-50)' },
    { name: 'Transaction History', free: 'Last 10', pro: 'Last 100' },
    { name: 'Real-time Updates', free: '✓', pro: '✓' },
    { name: 'QR Code Scanning', free: '✓', pro: '✓' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Upgrade to Pro
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              Monthly - £15/mo
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors relative ${
                billingPeriod === 'yearly'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              Yearly - £150/yr
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save £30
              </span>
            </button>
          </div>

          {/* Features Comparison Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-4 px-4 text-gray-900 dark:text-white font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 text-gray-900 dark:text-white font-semibold">Free</th>
                  <th className="text-center py-4 px-4 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-semibold">Pro</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{feature.name}</td>
                    <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">{feature.free}</td>
                    <td className="py-3 px-4 text-center bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-semibold">
                      {feature.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Upgrade to Pro - ${billingPeriod === 'monthly' ? '£15/mo' : '£150/yr'}`}
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Secure payment powered by Stripe. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
