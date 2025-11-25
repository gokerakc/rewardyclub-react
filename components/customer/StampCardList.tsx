'use client';

import { StampCard as StampCardType } from '@/types';
import StampCard from './StampCard';
import { Loader2, Package } from 'lucide-react';

interface StampCardListProps {
  cards: StampCardType[];
  loading: boolean;
}

export default function StampCardList({ cards, loading }: StampCardListProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading your stamp cards...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-gray-100 rounded-full p-6 mb-4">
          <Package className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          No stamp cards yet
        </h3>
        <p className="text-gray-600 max-w-sm">
          Visit participating businesses and show your member QR code to start collecting stamps!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        My Stamp Cards ({cards.length})
      </h2>
      <div className="grid gap-4">
        {cards.map((card) => (
          <StampCard
            key={card.id}
            businessName={card.businessName}
            businessType={card.businessType}
            logoURL={card.logoURL}
            totalStamps={card.totalStamps}
            currentStamps={card.currentStamps}
            reward={card.reward}
            colorClass={card.colorClass}
          />
        ))}
      </div>
    </div>
  );
}
