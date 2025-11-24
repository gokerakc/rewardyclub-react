'use client';

import { Coffee, ShoppingBag, Utensils, Store, Award } from 'lucide-react';
import { BusinessType } from '@/types';

interface StampCardProps {
  businessName: string;
  businessType: BusinessType;
  totalStamps: number;
  currentStamps: number;
  reward: string;
  colorClass: string;
}

const businessIcons: Record<BusinessType, typeof Coffee> = {
  café: Coffee,
  restaurant: Utensils,
  retail: ShoppingBag,
  other: Store,
};

export default function StampCard({
  businessName,
  businessType,
  totalStamps,
  currentStamps,
  reward,
  colorClass,
}: StampCardProps) {
  const Icon = businessIcons[businessType] || Store;
  const progress = (currentStamps / totalStamps) * 100;
  const isCompleted = currentStamps >= totalStamps;

  return (
    <div className={`bg-gradient-to-br ${colorClass} rounded-xl p-5 text-white shadow-md`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <div>
            <h3 className="font-bold text-lg">{businessName}</h3>
            <p className="text-xs text-white/80 capitalize">{businessType}</p>
          </div>
        </div>
        {isCompleted && (
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-xs font-semibold">Ready!</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">
            {currentStamps} of {totalStamps} stamps
          </span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
          <div
            className="bg-white h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stamps Grid */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {Array.from({ length: totalStamps }).map((_, index) => (
          <div
            key={index}
            className={`aspect-square rounded-lg flex items-center justify-center ${
              index < currentStamps
                ? 'bg-white text-purple-600'
                : 'bg-white/20 border border-white/40'
            }`}
          >
            {index < currentStamps && (
              <span className="text-xl font-bold">{index + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* Reward Info */}
      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
        <Award className="w-5 h-5" />
        <div>
          <p className="text-xs text-white/80">Reward</p>
          <p className="font-semibold">{reward}</p>
        </div>
      </div>
    </div>
  );
}
