'use client';

import { QRCodeSVG } from 'qrcode.react';
import { QrCode } from 'lucide-react';

interface RewardCardProps {
  userName: string;
  memberId: string;
}

export default function RewardCard({ userName, memberId }: RewardCardProps) {
  return (
    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <QrCode className="w-5 h-5" />
        <h2 className="text-xl font-bold">Your Member Card</h2>
      </div>

      <div className="bg-white rounded-xl p-6 flex flex-col items-center">
        <QRCodeSVG
          value={memberId}
          size={180}
          level="H"
          includeMargin={true}
        />
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 font-medium">Member ID</p>
          <p className="text-lg font-bold text-gray-800">{memberId}</p>
        </div>
      </div>

      <p className="text-sm text-purple-100 mt-4 text-center">
        Show this QR code to businesses to collect stamps
      </p>
    </div>
  );
}
