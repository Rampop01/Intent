# Intent AI - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Landing Page (/app)                                     │  │
│  │  - Hero section                                          │  │
│  │  - Features overview                                     │  │
│  │  - CTA buttons                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Main App (/app/app)                                     │  │
│  │  ┌────────────────┐          ┌────────────────────────┐ │  │
│  │  │    SIDEBAR     │          │   INTENT INPUT AREA    │ │  │
│  │  │                │          │                        │ │  │
│  │  │ • Dashboard    │          │ TextArea for intent    │ │  │
│  │  │ • Strategies   │          │ AI explanation         │ │  │
│  │  │ • Activity     │          │ Preset templates       │ │  │
│  │  │ • Transactions │          │                        │ │  │
│  │  │ • Settings     │          └────────────────────────┘ │  │
│  │  │                │                                      │  │
│  │  │ Wallet Display │    ┌────────────────────────────┐  │  │
│  │  │ Disconnect     │    │  STRATEGY PREVIEW AREA     │  │  │
│  │  └────────────────┘    │                            │  │  │
│  │                         │ • Asset allocation chart  │  │  │
│  │                         │ • Risk level badge        │  │  │
│  │                         │ • Amount & frequency      │  │  │
│  │                         │ • AI explanation          │  │  │
│  │                         │ • Execute button          │  │  │
│  │                         └────────────────────────────┘  │  │
│  │                                                         │  │
│  │    ┌──────────────────────────────────────────────┐    │  │
│  │    │  EXECUTION DISPLAY (when executing)          │    │  │
│  │    │  • Step 1: Validate Intent                   │    │  │
│  │    │  • Step 2: Calculate Allocation              │    │  │
│  │    │  • Step 3: Allocate to Stable Assets         │    │  │
│  │    │  • Step 4: Allocate to Liquid Tokens         │    │  │
│  │    │  • Step 5: Allocate to Growth Assets         │    │  │
│  │    │  • Step 6: Confirm Settlement                │    │  │
│  │    │                                              │    │  │
│  │    │  Success → Link to Dashboard                 │    │  │
│  │    └──────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Dashboard (/dashboard)                                  │  │
│  │  - Stats cards (total deployed, success rate, etc)       │  │
│  │  - Activity timeline (from Supabase)                     │  │
│  │  - Scheduled actions                                     │  │
│  │  - Quick action buttons                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  AppContext (React Context)                                   │
│  ├─ walletConnected                                            │
│  ├─ walletAddress                                              │
│  ├─ currentStrategy                                            │
│  ├─ isExecuting                                                │
│  ├─ executionSteps                                             │
│  ├─ activityLog                                                │
│  ├─ savedStrategies                                            │
│  └─ functions (connectWallet, executeStrategy, etc)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↑ HTTP/JSON
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  NEXT.JS API ROUTES / BACKEND                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  POST /api/parse-intent                                        │
│  ├─ Input: { intent: "user's financial goal" }                │
│  ├─ Processing:                                               │
│  │  └─ Call OpenAI GPT-4o-mini API                           │
│  ├─ Output: {                                                 │
│  │    amount,                                                 │
│  │    riskLevel,                                              │
│  │    allocation: {stable, liquid, growth},                  │
│  │    executionType,                                          │
│  │    monitoring,                                             │
│  │    explanation                                             │
│  │  }                                                         │
│  └─ Error Handling: Try/catch with meaningful messages        │
│                                                                 │
│  POST /api/strategies                                          │
│  ├─ Input: { walletAddress, intent, amount, ... }             │
│  ├─ Processing:                                               │
│  │  ├─ Get or create user from wallet_address               │
│  │  ├─ Insert strategy to strategies table                  │
│  │  └─ Log activity to activity_logs table                  │
│  ├─ Output: { id, user_id, status, ... }                     │
│  └─ Error Handling: Validation + DB constraints              │
│                                                                 │
│  GET /api/strategies?wallet=0x...                             │
│  ├─ Input: wallet address as query param                      │
│  ├─ Processing:                                               │
│  │  ├─ Find user by wallet_address                           │
│  │  └─ Query all strategies for user_id                      │
│  ├─ Output: [ strategy[], strategy[], ... ]                  │
│  └─ Error Handling: Empty array if no user found             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↑ HTTPS/API
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  OpenAI (Real LLM)                                             │
│  ├─ Model: gpt-4o-mini                                        │
│  ├─ API: /v1/chat/completions                                │
│  ├─ Cost: ~$0.002-0.004 per call                             │
│  └─ Via: Vercel AI Gateway (automatic)                        │
│                                                                 │
│  Supabase (Database)                                           │
│  ├─ Type: PostgreSQL                                          │
│  ├─ Auth: Service role + anon key                             │
│  ├─ Security: Row-Level Security (RLS)                        │
│  ├─ Tables:                                                   │
│  │  ├─ users (id, wallet_address, created_at, updated_at)   │
│  │  ├─ strategies (id, user_id, intent, amount, ...)         │
│  │  ├─ transactions (id, strategy_id, step_name, ...)        │
│  │  └─ activity_logs (id, user_id, action, details)          │
│  └─ Status: Live and tested                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↑ JSON
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               SMART CONTRACT (Ready for Deployment)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  IntentSettlement.sol                                          │
│  ├─ Language: Solidity 0.8.20                                 │
│  ├─ Libs: OpenZeppelin ERC20, SafeERC20, ReentrancyGuard      │
│  │                                                             │
│  ├─ Structs:                                                  │
│  │  ├─ Strategy {                                            │
│  │  │    strategyId,                                         │
│  │  │    user,                                               │
│  │  │    amount,                                             │
│  │  │    riskLevel,                                          │
│  │  │    allocation,                                         │
│  │  │    executionType,                                      │
│  │  │    createdAt,                                          │
│  │  │    executed                                            │
│  │  │  }                                                      │
│  │  ├─ AllocationBreakdown {                                │
│  │  │    stablePercent,                                      │
│  │  │    liquidPercent,                                      │
│  │  │    growthPercent                                       │
│  │  │  }                                                      │
│  │  └─ ExecutionStep {                                       │
│  │     stepId,                                               │
│  │     stepNumber,                                           │
│  │     assetType,                                            │
│  │     amount,                                               │
│  │     targetAsset,                                          │
│  │     executed                                              │
│  │   }                                                        │
│  │                                                             │
│  ├─ Functions:                                                │
│  │  ├─ createStrategy(amount, riskLevel, allocation)         │
│  │  ├─ executeStrategy(strategyId)                           │
│  │  ├─ executeStep(strategyId, stepNumber)                   │
│  │  ├─ getStrategy(strategyId)                               │
│  │  └─ getStrategySteps(strategyId)                          │
│  │                                                             │
│  └─ Ready For: Cronos testnet/mainnet deployment             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### User Creates Strategy

```
User Input
   "Save $200 safely"
   ↓
intent-form.tsx
   → POST /api/parse-intent
   ↓
OpenAI GPT-4o-mini
   ← Parse intent
   ↓
API Response
   {
     "amount": 200,
     "riskLevel": "low",
     "allocation": {"stable": 85, "liquid": 15, "growth": 0},
     "executionType": "once",
     "monitoring": "monthly",
     "explanation": "..."
   }
   ↓
strategy-display.tsx
   → Show allocation chart
   → Show AI explanation
   → Display Execute button
```

### User Executes Strategy

```
User Clicks Execute
   ↓
executeStrategy() in app-context.tsx
   → POST /api/strategies
   ↓
Supabase:
   1. Get or create user from wallet_address
   2. Insert strategy to strategies table
      {
        user_id,
        intent,
        amount,
        allocation,
        status: "executing"
      }
   3. Insert to activity_logs
   ↓
Execution Steps Display
   Step 1: Validate Intent [executing]
   Step 2: Calculate Allocation [pending]
   ...
   (Each step takes ~1.5 seconds)
   ↓
Steps Complete
   → Update strategy status: "completed"
   → Insert transactions for each asset type
   ↓
User Views Dashboard
   → GET /api/strategies?wallet=0x...
   ↓
Supabase:
   1. Find user by wallet_address
   2. Query all strategies for user_id
   3. Calculate totals
   4. Return activity logs
   ↓
Dashboard Display
   - Total deployed: $200
   - Success rate: 100%
   - Activity: Strategy executed
   - All data from Supabase
```

---

## Environment Variables

```
Frontend (Public):
├─ NEXT_PUBLIC_SUPABASE_URL      → Supabase project URL
└─ NEXT_PUBLIC_SUPABASE_ANON_KEY → Public API key

Backend (Server-side):
├─ SUPABASE_SERVICE_ROLE_KEY     → Private key for DB access
└─ (OpenAI handled via Vercel AI Gateway - no key needed)
```

---

## Security Layers

### Row-Level Security (RLS)
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own strategies"
  ON strategies
  FOR SELECT
  USING (auth.uid()::text = user_id::text);
```

### API Validation
```typescript
// Check wallet address format
// Validate amount > 0
// Verify allocation sums to 100%
// Sanitize string inputs
```

### Smart Contract
```solidity
// Reentrancy guard
// Safe ERC20 transfers
// Input validation
// User verification
```

---

## Deployment Architecture

```
┌─────────────────────────┐
│  Vercel (Frontend + API) │
├─────────────────────────┤
│ • Next.js 16 app        │
│ • API routes            │
│ • Environment variables │
│ • Auto-scaling          │
└────────────┬────────────┘
             │
             ├─────────────────────────┐
             │                         │
             ↓                         ↓
    ┌────────────────────┐   ┌─────────────────┐
    │ Supabase           │   │ OpenAI          │
    │ (PostgreSQL)       │   │ (LLM API)       │
    ├────────────────────┤   ├─────────────────┤
    │ • Database         │   │ • GPT-4o-mini   │
    │ • Auth             │   │ • Vercel Gateway│
    │ • Real-time        │   │ • No setup      │
    │ • Backups          │   │                 │
    └────────────────────┘   └─────────────────┘

┌─────────────────────────────────────┐
│ Cronos EVM (Optional)               │
├─────────────────────────────────────┤
│ • Smart contract deployment         │
│ • Transaction execution             │
│ • Asset swaps                       │
└─────────────────────────────────────┘
```

---

## Component Dependency Graph

```
App Layout
├─ AppProvider
│  └─ AppContext
│     ├─ walletConnected
│     ├─ currentStrategy
│     ├─ executionSteps
│     ├─ activityLog
│     └─ savedStrategies
│
├─ Sidebar
│  └─ Navigation links
│
├─ Main Pages
│  ├─ Landing (/page)
│  ├─ App (/app/page)
│  │  ├─ Sidebar
│  │  ├─ IntentForm
│  │  │  └─ AI parsing
│  │  ├─ StrategyDisplay
│  │  │  └─ Recharts
│  │  └─ ExecutionDisplay
│  │     └─ Activity timeline
│  │
│  └─ Dashboard (/dashboard)
│     ├─ Stats cards
│     ├─ ActivityTimeline
│     └─ Supabase queries
│
└─ UI Components
   └─ shadcn/ui (Button, Card, Badge, etc.)
```

---

## Performance Considerations

- **Frontend**: Next.js automatic code splitting
- **Database**: PostgreSQL indexes on wallet_address, user_id, created_at
- **API**: Lightweight responses, no unnecessary data
- **AI**: Model caching via Vercel AI Gateway
- **RLS**: Efficient row filtering at database level

---

This architecture ensures:
- ✅ Real data (Supabase)
- ✅ Real AI (OpenAI)
- ✅ Real security (RLS + validation)
- ✅ Real scalability (Vercel + Supabase)
- ✅ Production ready (all integrations tested)
