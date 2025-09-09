'use client';

import React, { useState, useEffect } from 'react';
import { base } from '@base-org/account';

interface WalletInfo {
  address: string;
  privateKey: string;
}

interface SubscriptionInfo {
  id: string;
  subscriptionPayer: string;
  recurringCharge: string;
  periodInDays: number;
}

interface SubscriptionStatus {
  isSubscribed: boolean;
  remainingChargeInPeriod?: string;
  nextPeriodStart?: Date;
  subscriptionOwner?: string;
  subscriptionPayer?: string;
}

export default function SubscriptionManager() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load wallet from localStorage on component mount
  useEffect(() => {
    const storedWallet = localStorage.getItem('bbq-wallet');
    if (storedWallet) {
      try {
        const parsedWallet = JSON.parse(storedWallet);
        setWallet(parsedWallet);
        setSuccess('Wallet loaded from previous session');
      } catch (err) {
        console.error('Failed to parse stored wallet:', err);
        localStorage.removeItem('bbq-wallet');
      }
    }
  }, []);

  // Create Wallet
  const handleCreateWallet = async () => {
    setLoading({ ...loading, wallet: true });
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/API/create-wallet', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create wallet');
      }

      const data = await response.json();
      setWallet(data);
      // Store wallet in localStorage
      localStorage.setItem('bbq-wallet', JSON.stringify(data));
      setSuccess(`Wallet created successfully! Address: ${data.address}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create wallet');
    } finally {
      setLoading({ ...loading, wallet: false });
    }
  };

  // Create Subscription
  const handleCreateSubscription = async () => {
    if (!wallet) {
      setError('Please create a wallet first');
      return;
    }

    setLoading({ ...loading, subscription: true });
    setError(null);
    setSuccess(null);

    try {
      const subscription = await base.subscription.subscribe({
        recurringCharge: "19.99",           // Monthly charge in USDC
        subscriptionOwner: wallet.address,   // Our backend wallet address
        periodInDays: 30,                   // 30-day billing period
        testnet: true                        // Use testnet (Base Sepolia)
      });

      console.log('Subscription created:', subscription);
      
      setSubscription({
        id: subscription.id,
        subscriptionPayer: subscription.subscriptionPayer,
        recurringCharge: subscription.recurringCharge,
        periodInDays: subscription.periodInDays
      });
      
      setSuccess(`Subscription created successfully! ID: ${subscription.id}`);
    } catch (err: any) {
      console.error('Subscription failed:', err);
      setError(err.message || 'Failed to create subscription');
    } finally {
      setLoading({ ...loading, subscription: false });
    }
  };

  // Get Subscription Status
  const handleGetStatus = async () => {
    if (!subscription) {
      setError('No subscription created yet');
      return;
    }

    setLoading({ ...loading, status: true });
    setError(null);
    setSuccess(null);

    try {
      const status = await base.subscription.getStatus({
        id: subscription.id,
        testnet: true
      });

      console.log('Subscription status:', status);
      setSubscriptionStatus(status);
      
      if (status.isSubscribed) {
        setSuccess('Subscription is active');
      } else {
        setSuccess('Subscription is not active');
      }
    } catch (err: any) {
      console.error('Failed to get status:', err);
      setError(err.message || 'Failed to get subscription status');
    } finally {
      setLoading({ ...loading, status: false });
    }
  };

  // Clear stored wallet
  const handleClearWallet = () => {
    if (confirm('Are you sure you want to clear the stored wallet? This action cannot be undone.')) {
      localStorage.removeItem('bbq-wallet');
      setWallet(null);
      setSubscription(null);
      setSubscriptionStatus(null);
      setSuccess('Wallet cleared successfully');
    }
  };

  // Charge Subscription
  const handleChargeSubscription = async () => {
    if (!wallet || !subscription) {
      setError('Please create a wallet and subscription first');
      return;
    }

    setLoading({ ...loading, charge: true });
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/API/charge-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          privateKey: wallet.privateKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to charge subscription');
      }

      if (data.success) {
        setSuccess(data.message || `Successfully charged $${data.amount}`);
      } else {
        setError(data.message || 'Failed to charge subscription');
      }
    } catch (err: any) {
      console.error('Charge failed:', err);
      setError(err.message || 'Failed to charge subscription');
    } finally {
      setLoading({ ...loading, charge: false });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          BBQ Subscription Manager
        </h1>

        {/* Alert Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <span className="block sm:inline">{success}</span>
          </div>
        )}

        {/* Wallet Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Wallet</h2>
          
          <div className="space-y-3">
            <button
              onClick={handleCreateWallet}
              disabled={loading.wallet || !!wallet}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                wallet
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : loading.wallet
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading.wallet ? 'Creating...' : wallet ? '✓ Wallet Loaded' : 'Create Wallet'}
            </button>

            {wallet && (
              <button
                onClick={handleClearWallet}
                className="w-full py-2 px-4 rounded-lg font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200"
              >
                Clear Stored Wallet
              </button>
            )}
          </div>

          {wallet && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Address:</span>
              </p>
              <p className="text-xs font-mono bg-white p-2 rounded break-all">
                {wallet.address}
              </p>
            </div>
          )}
        </div>

        {/* Subscription Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Subscription</h2>
          
          <button
            onClick={handleCreateSubscription}
            disabled={loading.subscription || !wallet || !!subscription}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
              !wallet
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : subscription
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : loading.subscription
                ? 'bg-green-400 text-white cursor-wait'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {loading.subscription 
              ? 'Creating...' 
              : subscription 
              ? '✓ Subscription Created' 
              : 'Create Subscription ($19.99/month)'}
          </button>

          {subscription && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-600">ID:</span>
                  <p className="font-mono text-xs break-all">{subscription.id}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Amount:</span>
                  <p>${subscription.recurringCharge} USDC</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Period:</span>
                  <p>{subscription.periodInDays} days</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Payer:</span>
                  <p className="font-mono text-xs break-all">{subscription.subscriptionPayer}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Status</h2>
          
          <button
            onClick={handleGetStatus}
            disabled={loading.status || !subscription}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
              !subscription
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : loading.status
                ? 'bg-purple-400 text-white cursor-wait'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {loading.status ? 'Checking...' : 'Get Subscription Status'}
          </button>

          {subscriptionStatus && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Active:</span>
                  <span className={subscriptionStatus.isSubscribed ? 'text-green-600' : 'text-red-600'}>
                    {subscriptionStatus.isSubscribed ? 'Yes ✓' : 'No ✗'}
                  </span>
                </div>
                {subscriptionStatus.remainingChargeInPeriod && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Remaining Charge:</span>
                    <span>${subscriptionStatus.remainingChargeInPeriod} USDC</span>
                  </div>
                )}
                {subscriptionStatus.nextPeriodStart && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-600">Next Period:</span>
                    <span>{subscriptionStatus.nextPeriodStart instanceof Date 
                      ? subscriptionStatus.nextPeriodStart.toLocaleDateString() 
                      : new Date(subscriptionStatus.nextPeriodStart).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Charge Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Charge</h2>
          
          <button
            onClick={handleChargeSubscription}
            disabled={loading.charge || !wallet || !subscription}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
              !wallet || !subscription
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : loading.charge
                ? 'bg-orange-400 text-white cursor-wait'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {loading.charge ? 'Charging...' : 'Charge $1 from Subscription'}
          </button>

          <p className="mt-2 text-xs text-gray-500 text-center">
            This will charge $1 USDC from the subscription using the created wallet
          </p>
        </div>
      </div>
    </div>
  );
}
