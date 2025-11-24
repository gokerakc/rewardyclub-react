'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { QrCode, Store, Users } from 'lucide-react';
import { UserType } from '@/types';

export default function Home() {
  const { user, loading, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [selectedUserType, setSelectedUserType] = useState<UserType>('customer');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      // Redirect based on user type
      if (user.userType === 'customer') {
        router.push('/customer/dashboard');
      } else if (user.userType === 'business') {
        router.push('/business/dashboard');
      }
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    try {
      setError(null);
      setIsLoggingIn(true);
      await loginWithGoogle(selectedUserType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-700">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-700 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4">
            <QrCode className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Rewardy Club</h1>
          <p className="text-gray-600">Digital stamp cards made simple</p>
        </div>

        {/* User Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedUserType('customer')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                selectedUserType === 'customer'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Users className={`w-8 h-8 mb-2 ${
                selectedUserType === 'customer' ? 'text-purple-600' : 'text-gray-400'
              }`} />
              <span className={`font-medium ${
                selectedUserType === 'customer' ? 'text-purple-600' : 'text-gray-600'
              }`}>
                Customer
              </span>
            </button>

            <button
              onClick={() => setSelectedUserType('business')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                selectedUserType === 'business'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Store className={`w-8 h-8 mb-2 ${
                selectedUserType === 'business' ? 'text-purple-600' : 'text-gray-400'
              }`} />
              <span className={`font-medium ${
                selectedUserType === 'business' ? 'text-purple-600' : 'text-gray-600'
              }`}>
                Business
              </span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-xl py-3 px-4 font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingIn ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-600"></div>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Additional Info */}
        <p className="text-xs text-gray-500 text-center mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </main>
  );
}
