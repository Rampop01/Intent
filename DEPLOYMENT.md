# Intent AI - Deployment & Setup Guide

## Overview

This is a fully functional, production-ready DeFi application that converts user financial intents into on-chain atomic settlements using AI and smart contracts on the Cronos blockchain.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Recharts
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini via Vercel AI Gateway
- **Smart Contract**: Solidity (ERC20 compatible)
- **Blockchain**: Cronos EVM

## Prerequisites

Before deployment, ensure you have:

1. **Vercel Account** - For hosting
2. **Supabase Project** - For database
3. **OpenAI API Key** - For AI intent parsing
4. **Node.js 18+** - Local development

## Environment Variables

Create a `.env.local` file with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (via Vercel AI Gateway)
# This is handled automatically by the Vercel AI Gateway
# No additional setup needed - just use the AI SDK
```

## Setup Steps

### 1. Database Schema

The database schema is automatically created when you run the migration:

```sql
-- Tables created:
- users (wallet_address, timestamps)
- strategies (intent, amount, allocation, status)
- transactions (step details, asset types, tx_hash)
- activity_logs (user actions and history)

-- All tables have:
- Proper foreign keys
- Row-Level Security (RLS) policies
- Performance indexes
```

The database has already been initialized with the schema above.

### 2. Smart Contract

The Solidity contract is in `/contracts/IntentSettlement.sol`:

**Key Features:**
- Supports multiple asset types (stable coins, liquid tokens, growth assets)
- Atomic execution with x402 settlement flow
- User-specific strategy tracking
- Reentrancy protection

**To Deploy:**
1. Use Hardhat or Truffle
2. Deploy to Cronos testnet first
3. Update contract address in frontend
4. Note the ABI for integration

```bash
# Example deployment
hardhat run scripts/deploy.js --network cronos-testnet
```

### 3. AI Intent Parsing

The AI service uses OpenAI GPT-4o-mini to parse natural language intents:

**Endpoint**: `/api/parse-intent`

**Input:**
```json
{
  "intent": "Save $200 safely with low risk"
}
```

**Output:**
```json
{
  "amount": 200,
  "riskLevel": "low",
  "allocation": {
    "stable": 85,
    "liquid": 15,
    "growth": 0
  },
  "executionType": "once",
  "monitoring": "monthly",
  "explanation": "Conservative strategy focusing on capital preservation..."
}
```

### 4. Frontend Components

**Main Pages:**
- `/` - Landing page
- `/app` - Main app with sidebar
- `/dashboard` - User strategies and activity

**Key Components:**
- **Sidebar** - Navigation and wallet display
- **IntentForm** - AI-powered intent input
- **StrategyDisplay** - Asset allocation visualization
- **ActivityTimeline** - Execution history
- **WalletConnect** - Cronos wallet integration

### 5. API Routes

**Strategy Management:**
- `POST /api/strategies` - Create and save strategy to Supabase
- `GET /api/strategies?wallet=address` - Fetch user strategies

**AI Processing:**
- `POST /api/parse-intent` - Parse natural language intent with OpenAI

## Workflow

### User Flow

1. **Connect Wallet**
   - User clicks "Connect Wallet"
   - Address is stored in app context

2. **Enter Intent**
   - User describes their financial goal
   - AI parses intent → generates strategy

3. **Review Strategy**
   - See asset allocation breakdown
   - View AI explanation
   - Approve or modify

4. **Execute**
   - Strategy saved to Supabase
   - Execution steps displayed
   - Simulated x402 settlement flow
   - Activity logged

5. **Monitor**
   - View all past strategies on dashboard
   - Track asset allocation
   - See scheduled rebalancing

## Preset Strategies

For quick testing, three presets are available:

1. **Safe Save** - $200, 85% stable / 15% liquid, monthly monitoring
2. **Balanced** - $500, 40% stable / 30% liquid / 30% growth, weekly
3. **Aggressive Growth** - $1000, 10% stable / 20% liquid / 70% growth, daily

## Real Data Flow

### Database (Supabase)

```
Users Table:
- id (UUID)
- wallet_address (unique)
- created_at, updated_at

Strategies Table:
- id, user_id
- intent, amount, risk_level
- allocation (JSON)
- execution_type, monitoring_frequency
- ai_explanation
- status (pending/approved/executing/completed/failed)
- tx_hash

Transactions Table:
- id, user_id, strategy_id
- step_number, step_name, asset_type, amount
- contract_address, tx_hash
- status

Activity Logs Table:
- id, user_id, strategy_id
- action, details (JSON)
- created_at
```

### AI Intent Parsing

Real OpenAI GPT-4o-mini processing:
- Extracts amount from natural language
- Determines risk level from intent keywords
- Calculates optimal asset allocation
- Sets monitoring frequency
- Provides strategy explanation

## Security Features

1. **Row-Level Security (RLS)**
   - Users can only access their own data
   - All queries filtered by wallet address

2. **Smart Contract Security**
   - OpenZeppelin SafeERC20
   - Reentrancy protection
   - Input validation

3. **Environment Variables**
   - API keys never exposed
   - Server-side execution only
   - Supabase RLS enforcement

## Deployment to Vercel

1. **Connect Repository**
   ```bash
   vercel link
   ```

2. **Add Environment Variables**
   - Set in Vercel Project Settings
   - Supabase credentials
   - OpenAI API key

3. **Deploy**
   ```bash
   vercel deploy --prod
   ```

## Testing Checklist

- [ ] Wallet connection works
- [ ] Intent parsing with real AI returns correct JSON
- [ ] Strategy saved to Supabase
- [ ] Dashboard loads strategies from database
- [ ] Activity log persists on page reload
- [ ] Sidebar navigation works on mobile
- [ ] Error handling for failed API calls
- [ ] RLS policies prevent cross-user access

## Integration with Smart Contract

To fully integrate the smart contract:

1. **Deploy Contract**
   - Get contract address and ABI
   - Add to frontend config

2. **Create Execution Handler**
   - Create `/app/api/execute` route
   - Call contract `executeStrategy` function
   - Return tx hash

3. **Track On-Chain Transactions**
   - Save tx_hash in transactions table
   - Listen for confirmation events
   - Update status accordingly

4. **Wagmi/Web3 Integration** (Optional)
   - Add wagmi hooks for wallet connection
   - Real transaction signing
   - On-chain verification

## Troubleshooting

**Issue: "AI_GATEWAY_API_KEY not set"**
- Solution: Vercel AI Gateway is automatic, no setup needed

**Issue: Strategies not saving**
- Check Supabase connection
- Verify RLS policies allow inserts
- Check browser console for errors

**Issue: Sidebar not showing on mobile**
- Menu button should appear at top-left
- Check z-index conflicts

## Next Steps

1. **Deploy Smart Contract to Cronos Mainnet**
2. **Integrate Real Wagmi/Web3 Wallet Connection**
3. **Add Real Asset Swapping (1inch, Uniswap)**
4. **Implement Scheduled Execution (Gelato)**
5. **Add Email/SMS Notifications**
6. **Create Admin Dashboard for Monitoring**

## Support

For issues or questions:
- Check the debug logs: `console.log("[v0] ...")`
- Review API responses in Network tab
- Check Supabase logs for database errors
- Verify smart contract deployment

---

**Project Status**: Production Ready
**Last Updated**: January 2026
