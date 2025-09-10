# Subscription Demo

A Next.js application for testing Base blockchain subscriptions using the Base SDK.

## Features

- **Create Wallet**: Generate a new wallet to own subscriptions
- **Create Subscription**: Set up a $29.99/month subscription on Base
- **Get Subscription Status**: Check if subscription is active and view details
- **Charge Subscription**: Charge $1 from the subscription using the created wallet

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Base SDK (@base-org/account)
- Viem for Ethereum interactions

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd bbq-subscription
```

2. Install dependencies:
```bash
npm install
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Create Wallet**: Click "Create Wallet" to generate a new wallet address
2. **Create Subscription**: After creating a wallet, click "Create Subscription" to set up a $19.99/month subscription
3. **Check Status**: Use "Get Subscription Status" to verify the subscription is active
4. **Charge**: Click "Charge $1 from Subscription" to process a payment

## Important Notes

- This is a demo application. In production:
  - Never expose private keys to the frontend
  - Store private keys securely in a backend service
  - Implement proper authentication and authorization
  - Use environment variables for sensitive configuration

## API Routes

- `POST /API/create-wallet`: Creates a new wallet and returns the address
- `POST /API/charge-subscription`: Charges a subscription using the provided subscription ID and wallet

## Project Structure

```
bbq-subscription/
├── app/
│   ├── API/              # Backend API routes
│   │   ├── create-wallet/
│   │   └── charge-subscription/
│   ├── page.tsx          # Main page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   └── SubscriptionManager.tsx  # Main UI component
├── spec/
│   └── spec.md           # Original specification
└── package.json
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## License

MIT
