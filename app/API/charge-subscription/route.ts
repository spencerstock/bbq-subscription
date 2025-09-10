import { NextRequest, NextResponse } from 'next/server';
import { base } from '@base-org/account';
import { createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { toCoinbaseSmartAccount, createBundlerClient } from 'viem/account-abstraction';

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId, privateKey } = await request.json();
    
    if (!subscriptionId || !privateKey) {
      return NextResponse.json(
        { error: 'Missing subscriptionId or privateKey' },
        { status: 400 }
      );
    }

    // Create public client for Base Sepolia
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });

    // Convert private key to owner account
    const owner = privateKeyToAccount(privateKey as `0x${string}`);
    
    // Create a Coinbase Smart Wallet account
    const smartAccount = await toCoinbaseSmartAccount({
      client: publicClient,
      owners: [owner],
      version: '1'
    });

    // Create bundler client for sending UserOperations
    const bundlerClient = createBundlerClient({
      account: smartAccount,
      chain: baseSepolia,
      client: publicClient,
      transport: http('https://public.pimlico.io/v2/84532/rpc')
    });

    // Simply attempt to charge $1 without checking status first
    const chargeAmount = 1.0;
    
    // Prepare charge transaction for $1
    const chargeCalls = await base.subscription.prepareCharge({
      id: subscriptionId,
      amount: chargeAmount.toString(),
      testnet: true
    });

    // Send UserOperation through bundler
    const userOpHash = await bundlerClient.sendUserOperation({
      calls: chargeCalls as any
    });

    // Wait for the UserOperation to be included
    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash
    });

    console.log(`Charged ${chargeAmount.toFixed(2)} USDC: ${receipt.receipt.transactionHash}`);

    return NextResponse.json({
      success: true,
      transactionHash: receipt.receipt.transactionHash,
      amount: chargeAmount.toFixed(2),
      message: `Successfully charged $${chargeAmount.toFixed(2)} USDC`
    });

  } catch (error: any) {
    console.error('Charge failed:', error);
    
    // Handle gas-related errors
    if (error.message?.includes('insufficient funds') || 
        error.message?.includes('insufficient balance') ||
        error.message?.includes('gas required exceeds') ||
        error.message?.includes('AA21') || // UserOp reverted - insufficient funds for gas
        error.message?.includes('AA40') || // Over verification gas limit
        error.message?.includes('prefund') ||
        error.message?.toLowerCase().includes('gas')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient Gas',
          message: 'The server wallet needs Base Sepolia ETH for gas fees',
          details: 'Please add Base Sepolia ETH to the server wallet address shown above to execute subscription charges.',
          originalError: error.message
        },
        { status: 400 }
      );
    }
    
    // Handle charge limit errors
    if (error.message?.includes('exceeds')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Charge Limit Exceeded',
          message: 'The charge amount exceeds the remaining allowance for this period',
          details: error.message
        },
        { status: 400 }
      );
    }
    
    // Handle subscription status errors
    if (error.message?.includes('revoked') || error.message?.includes('cancelled')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Subscription Inactive',
          message: 'The subscription has been cancelled or revoked',
          details: error.message
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Transaction Failed',
        message: error.message || 'Failed to charge subscription',
        details: 'An unexpected error occurred while processing the charge'
      },
      { status: 500 }
    );
  }
}
