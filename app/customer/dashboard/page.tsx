'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StampCard } from '@/types';
import RewardCard from '@/components/customer/RewardCard';
import StampCardList from '@/components/customer/StampCardList';
import { LogOut, User } from 'lucide-react';

export default function CustomerDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [stampCards, setStampCards] = useState<StampCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    } else if (!authLoading && user && user.userType !== 'customer') {
      router.push('/business/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const cardsRef = collection(db, 'stampCards');
    const q = query(
      cardsRef,
      where('userId', '==', user.uid),
      where('isRedeemed', '==', false),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cards: StampCard[] = [];
        snapshot.forEach((doc) => {
          cards.push({ id: doc.id, ...doc.data() } as StampCard);
        });
        setStampCards(cards);
        setCardsLoading(false);
      },
      (error) => {
        console.error('Error fetching stamp cards:', error);
        setCardsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-2">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                {user.displayName}
              </h1>
              <p className="text-sm text-gray-600">Customer</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Member QR Code Card */}
        <RewardCard userName={user.displayName} memberId={user.memberId} />

        {/* Stamp Cards List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <StampCardList cards={stampCards} loading={cardsLoading} />
        </div>
      </main>
    </div>
  );
}
