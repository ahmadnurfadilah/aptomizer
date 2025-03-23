# Aptomizer

Aptomizer is an AI-powered portfolio management and optimization tool for the Aptos blockchain. It provides users with a smart assistant that can analyze portfolios, suggest yield opportunities, and execute transactions on the Aptos blockchain.

## Features

- **AI-Powered Assistant**: Chat with an AI assistant that understands your portfolio and can help optimize it
- **Wallet Integration**: Connect your Aptos wallet or let the AI create a managed wallet for you
- **Portfolio Analysis**: View your token balances, total value, and performance metrics
- **Yield Opportunities**: Discover and compare yield farming, staking, and lending opportunities
- **Transaction Execution**: Execute transactions directly through the AI assistant (token transfers, staking, etc.)
- **Risk Assessment**: Get insights into the risk level of your portfolio and strategies

## Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Shadcn UI, Radix UI
- **AI**: Vercel AI SDK, OpenAI API
- **Blockchain**: Aptos SDK, Move Agent Kit
- **Database**: Prisma, PostgreSQL (via Supabase)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- An OpenAI API key
- Aptos wallet (optional for connecting existing wallet)

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/aptomizer.git
   cd aptomizer
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Copy the `.env.example` file to `.env.local` and fill in your environment variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ENCRYPTION_KEY=your_secure_encryption_key
   PANORA_API_KEY=your_panora_api_key
   DATABASE_URL=your_database_url
   DIRECT_URL=your_direct_database_url
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   NETWORK=mainnet  # or testnet for development
   ```

4. Set up the database with Prisma:
   ```bash
   npx prisma db push
   ```

### Running the Application

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage

1. **Connect Your Wallet**: Use the wallet selector to connect your existing Aptos wallet
2. **Create an AI Wallet**: The onboarding flow can create a managed AI wallet for you
3. **Chat with the AI**: Ask questions about your portfolio, get recommendations, and execute transactions
4. **Explore Features**: Navigate through portfolio visualization, yield opportunities, and position management

## Security

This application handles private keys for AI-managed wallets. In production, ensure:

- The `ENCRYPTION_KEY` is a strong, unique value
- Database access is properly secured
- All communications occur over HTTPS
- Private keys are properly encrypted at rest

## License

This project is licensed under the MIT License.
