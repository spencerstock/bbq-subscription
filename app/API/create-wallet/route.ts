import { NextResponse } from 'next/server';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { toCoinbaseSmartAccount } from 'viem/account-abstraction';

export async function POST() {
  try {
    // Generate a new private key
    const privateKey = generatePrivateKey();
    
    // Convert to owner account
    const owner = privateKeyToAccount(privateKey);
    
    // Create a public client for Base Sepolia
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });
    
    // Create a Coinbase Smart Wallet account
    const smartAccount = await toCoinbaseSmartAccount({
      client: publicClient,
      owners: [owner],
      version: '1'
    });
    
    // In production, you would securely store this private key
    // For this demo, we'll return both (DO NOT do this in production!)
    return NextResponse.json({
      address: smartAccount.address,
      privateKey: privateKey, // Only for demo purposes - store securely in production
    });
  } catch (error) {
    console.error('Error creating wallet:', error);
    return NextResponse.json(
      { error: 'Failed to create wallet' },
      { status: 500 }
    );
  }
}
