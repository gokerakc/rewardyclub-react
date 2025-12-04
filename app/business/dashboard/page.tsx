'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  getBusinessByOwnerId,
  createBusiness,
  getUserByMemberId,
  getOrCreateStampCard,
  addStampToCard,
} from '@/lib/firestore';
import { Business, Transaction } from '@/types';
import StatsCard from '@/components/business/StatsCard';
import QRScanner from '@/components/business/QRScanner';
import RecentActivity from '@/components/business/RecentActivity';
import BusinessSettings from '@/components/business/BusinessSettings';
import SubscriptionBadge from '@/components/business/SubscriptionBadge';
import UpgradeModal from '@/components/business/UpgradeModal';
import UsageStats from '@/components/business/UsageStats';
import BillingManagement from '@/components/business/BillingManagement';
import { LogOut, Users, CreditCard, Award, QrCode, Store, AlertCircle, Settings } from 'lucide-react';

export default function BusinessDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    } else if (!authLoading && user && user.userType !== 'business') {
      router.push('/customer/dashboard');
    }
  }, [user, authLoading, router]);

  // Set up real-time listener for business data
  useEffect(() => {
    if (!user) return;

    let unsubscribeBusiness: (() => void) | undefined;

    const setupBusinessListener = async () => {
      try {
        // First, get the business ID (one-time lookup)
        const businessData = await getBusinessByOwnerId(user.uid);

        if (!businessData) {
          setShowOnboarding(true);
          setBusinessLoading(false);
          return;
        }

        // Set initial data
        setBusiness(businessData);
        setBusinessLoading(false);

        // Then set up real-time listener for updates (like subscription changes from webhooks)
        const businessRef = doc(db, 'businesses', businessData.id);
        unsubscribeBusiness = onSnapshot(
          businessRef,
          (snapshot) => {
            if (snapshot.exists()) {
              setBusiness({ id: snapshot.id, ...snapshot.data() } as Business);
            }
          },
          (error) => {
            console.error('Error listening to business updates:', error);
          }
        );
      } catch (error) {
        console.error('Error setting up business listener:', error);
        setBusinessLoading(false);
      }
    };

    setupBusinessListener();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribeBusiness) {
        unsubscribeBusiness();
      }
    };
  }, [user]);

  useEffect(() => {
    if (!business) return;

    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('businessId', '==', business.id),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const txs: Transaction[] = [];
        snapshot.forEach((doc) => {
          txs.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        setTransactions(txs);
        setTransactionsLoading(false);
      },
      (error) => {
        console.error('Error fetching transactions:', error);
        setTransactionsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [business]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleBusinessUpdate = async () => {
    // No need to manually refetch - the real-time listener will automatically update
  };

  const handleCreateBusiness = async () => {
    if (!user) return;

    try {
      const businessId = await createBusiness({
        ownerId: user.uid,
        name: `${user.displayName}'s Business`,
        businessType: 'café',
        email: user.email,
        stampCardConfig: {
          totalStamps: 10,
          reward: 'Free Item',
          colorClass: 'from-orange-500 to-orange-600',
        },
      });

      const businessData = await getBusinessByOwnerId(user.uid);
      setBusiness(businessData);
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error creating business:', error);
    }
  };

  const handleScan = async (memberId: string) => {
    if (!business) return;

    try {
      setScanError(null);
      setScanSuccess(null);

      // Validate member ID format
      if (!/^RC-\d{4}-\d{6}$/.test(memberId)) {
        throw new Error('Invalid QR code format. Please ask the customer to show their member card.');
      }

      // Get customer by member ID
      const customer = await getUserByMemberId(memberId);
      if (!customer) {
        throw new Error('Customer not found. Please ask them to sign up first.');
      }

      // Get or create stamp card
      const stampCard = await getOrCreateStampCard(customer.uid, business.id);

      // Add stamp
      await addStampToCard(stampCard.id, user!.uid, customer.displayName, customer.memberId);

      setScanSuccess(`Stamp added for ${customer.displayName}!`);
      setShowScanner(false);

      // Clear success message after 3 seconds
      setTimeout(() => setScanSuccess(null), 3000);
    } catch (error) {
      console.error('Error adding stamp:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add stamp';

      // Always close the scanner on error
      setShowScanner(false);

      // Check for subscription limit errors
      if (errorMessage === 'LIMIT_MONTHLY_STAMPS' || errorMessage === 'LIMIT_CUSTOMERS') {
        setShowUpgradeModal(true);
        setScanError(
          errorMessage === 'LIMIT_MONTHLY_STAMPS'
            ? 'Monthly stamp limit reached. Upgrade to Pro for unlimited stamps.'
            : 'Customer limit reached. Upgrade to Pro for unlimited customers.'
        );
      } else {
        setScanError(errorMessage);
      }

      // Clear error message after 5 seconds
      setTimeout(() => setScanError(null), 5000);
    }
  };

  if (authLoading || businessLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Rewardy Club</h1>
            <p className="text-gray-600 mb-6">
              Let's set up your business account to start issuing digital stamp cards.
            </p>
            <button
              onClick={handleCreateBusiness}
              className="w-full bg-linear-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              Create Business Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!business) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {business.logoURL ? (
              <img
                src={business.logoURL}
                alt={business.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-lg p-2">
                <Store className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-lg font-bold text-gray-800">{business.name}</h1>
                <p className="text-sm text-gray-600 capitalize">{business.businessType}</p>
              </div>
              <SubscriptionBadge business={business} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Success/Error Messages */}
        {scanSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <Award className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800 font-medium">{scanSuccess}</p>
          </div>
        )}

        {scanError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">{scanError}</p>
            </div>
            <button
              onClick={() => setScanError(null)}
              className="text-red-600 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            icon={Users}
            label="Total Customers"
            value={business.stats.totalCustomers}
            iconColor="text-blue-600"
            bgColor="bg-blue-100"
          />
          <StatsCard
            icon={CreditCard}
            label="Active Cards"
            value={business.stats.activeCards}
            iconColor="text-orange-600"
            bgColor="bg-orange-100"
          />
          <StatsCard
            icon={Award}
            label="Stamps Issued"
            value={business.stats.totalStampsIssued}
            iconColor="text-green-600"
            bgColor="bg-green-100"
          />
        </div>

        {/* Usage Stats (Free tier) and Billing Management (Pro tier) */}
        <UsageStats business={business} onUpgrade={() => setShowUpgradeModal(true)} />
        <BillingManagement business={business} />

        {/* Scan Button */}
        <button
          onClick={() => setShowScanner(true)}
          className="w-full bg-linear-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg flex items-center justify-center gap-3"
        >
          <QrCode className="w-6 h-6" />
          Scan Customer QR Code
        </button>

        {/* Recent Activity */}
        <RecentActivity transactions={transactions} loading={transactionsLoading} />
      </main>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => {
            setShowScanner(false);
            setScanError(null);
          }}
        />
      )}

      {/* Business Settings Modal */}
      {showSettings && (
        <BusinessSettings
          business={business}
          onClose={() => setShowSettings(false)}
          onUpdate={handleBusinessUpdate}
          onUpgrade={() => {
            setShowSettings(false);
            setShowUpgradeModal(true);
          }}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        business={business}
      />
    </div>
  );
}
