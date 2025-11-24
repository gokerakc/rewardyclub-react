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
  reward_redeemed: 'bg-purple-100 text-purple-600',
  card_created: 'bg-blue-100 text-blue-600',
};

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
          const label = transactionLabels[transaction.type];
          const timeAgo = formatDistanceToNow(transaction.timestamp.toDate(), {
            addSuffix: true,
          });

          return (
            <div
              key={transaction.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`${colorClass} rounded-lg p-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{timeAgo}</p>
              </div>
              {transaction.metadata?.stampNumber && (
                <div className="bg-gray-100 rounded-full px-3 py-1">
                  <span className="text-xs font-semibold text-gray-700">
                    #{transaction.metadata.stampNumber}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
