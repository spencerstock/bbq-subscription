create a test app according to this spec using next.js.

The frontend will have 3 buttons

"Create wallet" - where a viem wallet is created to be the owner of subscriptions. This will be a backend behavior but will return the address to the FE to display and be used as address for the subscriptionOwner param when creating a new subscription

"Create Subscription" - frontend behavior for requesting a subscription from the user

"Get Subscription Status" - fetch and display subscription status - this can be a frontend behavior, we don't need a backend route for this despite what the spec says further down about it being part of the backend.

"Charge subscription" - this will charge $1 from the subscription itself using the viem wallet we setup earlier. This will be a backend behavior. 


one note, the API directory should be all caps "API" not lowercase "api"

The app doesn't need any storage and is only expected to do a new run on each new load

Use testnet flags to deal with testnet funds exclusively

Do not start the local server, I'll start the server and test locally when necessary


## Client-Side: Create Subscriptions

Users create subscriptions from your frontend application:

```typescript Backend
import { base } from '@base-org/account';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base as baseChain } from 'viem/chains';

// Initialize wallet client with subscription owner account
const account = privateKeyToAccount('0x...'); // Your app's private key
const walletClient = createWalletClient({
  account,
  chain: baseChain,
  transport: http()
});

async function chargeSubscription(subscriptionId: string) {
  try {
    // 1. Check subscription status
    const status = await base.subscription.getStatus({
      id: subscriptionId,
      testnet: false
    });

    if (!status.isSubscribed) {
      console.log('Subscription cancelled');
      return { success: false, reason: 'cancelled' };
    }

    const availableCharge = parseFloat(status.remainingChargeInPeriod || '0');

    if (availableCharge === 0) {
      console.log(`No charge available until ${status.nextPeriodStart}`);
      return { success: false, reason: 'no_charge_available' };
    }

    // 2. Prepare charge transaction for max available amount
    const chargeCalls = await base.subscription.prepareCharge({
      id: subscriptionId,
      amount: 'max-remaining-charge', // Always charge the maximum available
      testnet: false
    });

    // 3. Execute charge using sendCalls to handle all charge calls
    const hash = await walletClient.sendCalls({
      version: '2.0.0',
      chainId: '8453',
      atomicRequired: false,
      calls: chargeCalls
    });

    console.log(`Charged ${availableCharge.toFixed(2)} USDC: ${hash}`);

    return {
      success: true,
      transactionHash: hash,
      amount: availableCharge.toFixed(2)
    };

  } catch (error) {
    console.error('Charge failed:', error);
    return { success: false, error: error.message };
  }
}
```


```typescript Client (Browser)
import { base } from '@base-org/account';

// User creates a monthly subscription
async function createSubscription() {
  try {
    const subscription = await base.subscription.subscribe({
      recurringCharge: "19.99",           // Monthly charge in USDC
      subscriptionOwner: "0xYourAppWallet", // Your backend wallet address
      periodInDays: 30,                   // 30-day billing period
      testnet: false                      // Use mainnet
    });

    console.log('Subscription created:', subscription.id);
    console.log('Payer:', subscription.subscriptionPayer);
    console.log('Amount:', subscription.recurringCharge);
    console.log('Period:', subscription.periodInDays, 'days');

    // Store subscription.id however you need for charging later
    return subscription;

  } catch (error) {
    console.error('Subscription failed:', error.message);
    throw error;
  }
}
```


## Complete Implementation Example

<Tabs>
<Tab title="React Component">
```tsx SubscriptionButton.tsx
import React, { useState } from 'react';
import { base } from '@base-org/account';

export function SubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      // Create subscription
      const subscription = await base.subscription.subscribe({
        recurringCharge: "29.99",
        subscriptionOwner: "0xYourAppWallet", // Replace with your wallet address
        periodInDays: 30,
        testnet: false
      });

      // Store subscription.id however you need
      console.log('Subscription created:', subscription.id);
      console.log('Payer:', subscription.subscriptionPayer);

      setSubscribed(true);

    } catch (error) {
      console.error('Subscription failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return <div>✅ Subscription active</div>;
  }

  return (
    <button onClick={handleSubscribe} disabled={loading}>
      {loading ? 'Processing...' : 'Subscribe - $29.99/month'}
    </button>
  );
}
```
</Tab>

<Tab title="Node.js Backend">
```typescript chargeSubscriptions.ts
import { base } from '@base-org/account';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base as baseChain } from 'viem/chains';

// Example of charging a subscription from your backend
async function chargeSubscription(subscriptionId: string) {
  // Initialize wallet client with your subscription owner account
  const account = privateKeyToAccount('0x...'); // Your app's private key
  const walletClient = createWalletClient({
    account,
    chain: baseChain,
    transport: http()
  });

  try {
    // Check subscription status
    const status = await base.subscription.getStatus({
      id: subscriptionId,
      testnet: false
    });

    if (!status.isSubscribed) {
      console.log('Subscription cancelled');
      return;
    }

    const remainingAmount = parseFloat(status.remainingChargeInPeriod || '0');

    if (remainingAmount === 0) {
      console.log(`No charge available until ${status.nextPeriodStart}`);
      return;
    }

    // Prepare charge transaction
    const chargeCalls = await base.subscription.prepareCharge({
      id: subscriptionId,
      amount: 'max-remaining-charge',
      testnet: false
    });

    // Execute charge
    const hash = await walletClient.sendCalls({
      version: '2.0.0',
      chainId: '8453',
      atomicRequired: false,
      calls: chargeCalls
    });

    console.log(`Charged ${remainingAmount} USDC: ${hash}`);
    return hash;

  } catch (error) {
    console.error('Charge failed:', error);
    throw error;
  }
}
```
</Tab>
</Tabs>