'use client';

import { useState } from 'react';
import { Business } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface BillingManagementProps {
  business: Business;
}

export default function BillingManagement({ business }: BillingManagementProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Only show for Pro tier
  if (business.subscription.tier !== 'pro') {
    return null;
  }

  const handleManageBilling = async () => {
    if (!user || !business.subscription.stripeCustomerId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripeCustomerId: business.subscription.stripeCustomerId
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      alert('Failed to open billing portal. Please try again.');
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    const status = business.subscription.status;

    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          Active
        </span>
      );
    } else if (status === 'past_due') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Payment Issue
        </span>
      );
    } else if (status === 'canceled') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Canceled
        </span>
      );
    }

    return null;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-2 border-orange-200 dark:border-orange-900">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pro Subscription
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your billing and subscription
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-3 mb-6">
        {/* Subscription Status */}
        {business.subscription.status === 'past_due' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              There's an issue with your payment. Please update your payment method to continue enjoying Pro features.
            </p>
          </div>
        )}

        {/* Subscription Active Until */}
        {business.subscription.currentPeriodEnd && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {business.subscription.cancelAtPeriodEnd ? 'Expires on:' : 'Subscription active until:'}
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatDate(business.subscription.currentPeriodEnd)}
            </span>
          </div>
        )}

        {/* Cancellation Notice */}
        {business.subscription.cancelAtPeriodEnd && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              Your subscription is set to cancel. You'll continue to have Pro access until the end of your billing period.
            </p>
          </div>
        )}
      </div>

      {/* Manage Billing Button */}
      <button
        onClick={handleManageBilling}
        disabled={loading}
        className="w-full px-4 py-3 bg-gray-900 dark:bg-gray-700 text-white font-semibold rounded-lg shadow hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Opening...' : 'Manage Billing'}
      </button>

      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
        Update payment method, view invoices, or cancel subscription
      </p>
    </div>
  );
}
