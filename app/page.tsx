'use client';

import Link from 'next/link';
import { QrCode, Smartphone, Store, Award, ArrowRight, CheckCircle, Zap, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-lg p-2">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">Rewardy Club</span>
          </div>
          <Link
            href="/login"
            className="px-6 py-2 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl mb-6">
          <QrCode className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          One Digital Card
          <br />
          <span className="bg-linear-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            Every Reward
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Say goodbye to lost stamp cards and hello to rewards in your pocket. Collect stamps from all your favorite local businesses in one place.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-8 py-4 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:border-gray-400 transition-all"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* For Customers Section */}
      <section className="bg-linear-to-br from-orange-50 to-orange-100 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-200 rounded-full px-4 py-2 mb-4">
                <Users className="w-4 h-4 text-orange-700" />
                <span className="text-sm font-semibold text-orange-700">FOR CUSTOMERS</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                All Your Stamp Cards in One Place
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Never lose a stamp card again. Track your rewards from coffee shops, restaurants, salons, and more—all from your phone.
              </p>
              <div className="space-y-4">
                {[
                  'One QR code for all participating businesses',
                  'Real-time stamp tracking and progress',
                  'Never forget or lose physical cards',
                  'Get notified when rewards are ready',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-orange-600 shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Coffee Haven</h3>
                    <p className="text-sm text-white/80">Café</p>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <div
                      key={num}
                      className={`aspect-square rounded-lg flex items-center justify-center ${
                        num <= 5
                          ? 'bg-white text-orange-600'
                          : 'bg-white/20 border border-white/40'
                      }`}
                    >
                      {num <= 5 && <span className="text-sm font-bold">{num}</span>}
                    </div>
                  ))}
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <div>
                    <p className="text-xs text-white/80">Reward</p>
                    <p className="font-semibold">Free Coffee</p>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <QrCode className="w-32 h-32 mx-auto text-gray-800" />
                <p className="text-sm text-gray-600 mt-2">Your universal QR code</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Businesses Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Simple Setup</h3>
                  <p className="text-gray-600">Get started in under 5 minutes</p>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: Store, title: 'Create Account', desc: 'Sign up with Google' },
                    { icon: Award, title: 'Configure Rewards', desc: 'Set stamps & prizes' },
                    { icon: Smartphone, title: 'Scan QR Codes', desc: 'Start issuing stamps' },
                  ].map((step, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl">
                      <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-lg p-2 shrink-0">
                        <step.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{step.title}</h4>
                        <p className="text-sm text-gray-600">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 bg-orange-200 rounded-full px-4 py-2 mb-4">
                <Store className="w-4 h-4 text-orange-700" />
                <span className="text-sm font-semibold text-orange-700">FOR BUSINESSES</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Boost Loyalty - Effortlessly
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                No hardware, no apps to download, no complexity. Just scan QR codes with your phone's camera and watch customer loyalty grow.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Zap, text: 'Set up in 5 minutes—no technical skills needed' },
                  { icon: Smartphone, text: 'Works with any smartphone camera' },
                  { icon: Award, text: 'Customizable stamp cards and rewards' },
                  { icon: Users, text: 'Track customer engagement in real-time' },
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="bg-orange-100 rounded-lg p-2">
                      <feature.icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-gray-700">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 mb-12">Simple for customers, easy for businesses</p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: QrCode,
                title: 'Sign Up',
                desc: 'Customers get one QR code. Businesses create their account.',
              },
              {
                step: '2',
                icon: Smartphone,
                title: 'Scan & Stamp',
                desc: 'Customers show QR code. Businesses scan it to add stamps.',
              },
              {
                step: '3',
                icon: Award,
                title: 'Earn Rewards',
                desc: 'Complete the card, get the reward. Everyone wins.',
              },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-md">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl mb-4">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-2">{item.step}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join businesses and customers already building loyalty together.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 Rewardy Club. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
