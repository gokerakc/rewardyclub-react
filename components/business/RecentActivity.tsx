'use client';

import { Transaction } from '@/types';
import { Clock, Award, Plus, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  transactions: Transaction[];
  loading: boolean;
}

const transactionIcons = {
  stamp_added: Plus,
  reward_redeemed: Award,
  card_created: Package,
};

const transactionLabels = {
  stamp_added: 'Stamp added',
  reward_redeemed: 'Reward redeemed',
  card_created: 'New card created',
};

const transactionColors = {
  stamp_added: 'bg-green-100 text-green-600',
  reward_redeemed: 'bg-orange-100 text-orange-600',
  card_created: 'bg-blue-100 text-blue-600',
};

function getTransactionLabel(transaction: Transaction): string {
  if (transaction.type === 'stamp_added' && transaction.metadata?.stampNumber) {
    const { memberId, stampNumber, totalStamps } = transaction.metadata;

    let label = '';
    if (totalStamps) {
      label = `Stamp ${stampNumber} of ${totalStamps} added`;
    } else {
      label = `Stamp ${stampNumber} added`;
    }

    // Add member ID for reference (privacy-friendly)
    if (memberId) {
      label += ` (MemberId: ${memberId})`;
    }

    return label;
  }
  return transactionLabels[transaction.type] || 'Activity';
}

export default function RecentActivity({ transactions, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No activity yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Scan customer QR codes to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        Recent Activity ({transactions.length})
      </h2>
      <div className="space-y-3">
        {transactions.map((transaction) => {
          const Icon = transactionIcons[transaction.type] || Plus;
          const colorClass = transactionColors[transaction.type];
          const label = getTransactionLabel(transaction);
          const timeAgo = formatDistanceToNow(transaction.timestamp.toDate(), {
            addSuffix: true,
          });
          const isCompleted = transaction.metadata?.isCompleted;

          return (
            <div
              key={transaction.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`${colorClass} rounded-lg p-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">
                  {label}
                  {isCompleted && (
                    <span className="ml-2 text-orange-600">🎉 Card completed!</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">{timeAgo}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
