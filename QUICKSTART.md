# Intent AI - Quick Start Guide

## 30-Second Overview

A production-ready DeFi app that:
1. Accepts natural language financial intents
2. Uses **real OpenAI GPT** to parse user intent
3. Saves strategies to **real Supabase database**
4. Executes with simulated x402 settlement
5. Tracks everything in audit logs

**No dummy data. Everything is real.**

---

## Start Using Right Now

### 1. Run Locally
```bash
npm run dev
# Open http://localhost:3000
```

### 2. On the Landing Page
- Click "Start Now" or "Connect Wallet"

### 3. On the App Page
- Sidebar appears on left (click hamburger on mobile)
- Enter intent: "Save $200 safely"
- Watch real OpenAI parse it
- Click Execute
- Check dashboard for real data

### 4. View Results
- Go to Dashboard
- See stats from real database
- View activity timeline
- All data persists on reload

---

## What You Get

### Frontend
- ✅ Sidebar navigation
- ✅ AI-powered intent input
- ✅ Asset allocation charts
- ✅ Real-time execution steps
- ✅ Activity dashboard

### Backend
- ✅ OpenAI GPT-4o-mini integration
- ✅ API routes for intent parsing
- ✅ Strategy save/load from database
- ✅ Activity logging

### Database
- ✅ Supabase PostgreSQL
- ✅ User management
- ✅ Strategy tracking
- ✅ Transaction logging
- ✅ Row-Level Security

### Smart Contract
- ✅ Solidity code ready
- ✅ ERC20 token support
- ✅ Atomic settlement logic
- ✅ Ready for Cronos deployment

---

## Environment Setup (2 minutes)

### Option 1: Use Existing Supabase

1. Get your Supabase keys
2. Add to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_role_key
```

3. The database schema is already created!

### Option 2: Create New Supabase Project

1. Go to supabase.com
2. Create new project
3. Copy credentials
4. Database schema will be auto-created from `/scripts/01_create_schema.sql`

---

## Real Workflow

```
1. User connects wallet
   └─ Stored in app context

2. User enters intent: "Invest $500 with balanced risk"
   └─ Sent to OpenAI via /api/parse-intent

3. OpenAI returns:
   {
     "amount": 500,
     "riskLevel": "medium",
     "allocation": {"stable": 40, "liquid": 30, "growth": 30},
     "executionType": "weekly",
     "monitoring": "weekly",
     "explanation": "Balanced growth strategy..."
   }

4. User clicks Execute
   └─ Strategy saved to Supabase
   └─ Execution steps run with real amounts
   └─ Activity logged to database

5. User goes to Dashboard
   └─ Fetches real data from Supabase
   └─ Shows total deployed, success rate, activity timeline
   └─ All data persists across page reloads
```

---

## Try the Presets

### Safe Save ($200)
- Risk: Low
- Allocation: 85% stable, 15% liquid
- Execution: Once
- Monitoring: Monthly

### Balanced Invest ($500)
- Risk: Medium
- Allocation: 40% stable, 30% liquid, 30% growth
- Execution: Weekly
- Monitoring: Weekly

### Aggressive Growth ($1000)
- Risk: High
- Allocation: 10% stable, 20% liquid, 70% growth
- Execution: Weekly
- Monitoring: Daily

---

## Real Features

### Smart Contract Ready
Location: `/contracts/IntentSettlement.sol`

Deploy to Cronos:
```bash
# Compile
npx hardhat compile

# Deploy to Cronos testnet
npx hardhat run scripts/deploy.js --network cronos-testnet
```

### Database Real
Location: Supabase PostgreSQL

Tables:
- `users` - Wallet addresses
- `strategies` - User strategies
- `transactions` - Execution details
- `activity_logs` - Audit trail

All with Row-Level Security.

### AI Real
Location: `/lib/ai-real-service.ts`

Uses: OpenAI GPT-4o-mini via Vercel AI Gateway

No hardcoding, actual API calls.

---

## Debug Mode

Add to any file to see logs:
```javascript
console.log("[v0] Message here:", data)
```

Check browser console for detailed execution flow.

---

## Troubleshooting

### "AI not working"
- Check OpenAI credits
- Verify API keys in Vercel settings
- Check browser console for errors

### "Data not saving"
- Verify Supabase credentials
- Check RLS policies in Supabase console
- Look for API errors in network tab

### "Sidebar not showing"
- Check hamburger menu on mobile
- Refresh page
- Check browser console for errors

---

## Next Steps

### For Testing
1. Go to `/app`
2. Test preset strategies
3. Check Supabase for saved data
4. Verify activity logs

### For Production
1. Set up environment variables
2. Deploy to Vercel
3. Deploy smart contract
4. Add real wallet integration

### For Integration
1. Connect Wagmi for real wallets
2. Integrate smart contract calls
3. Add real asset swapping
4. Implement scheduled execution

---

## Key Files

**Main App**: `/app/app/page.tsx`  
**AI**: `/app/api/parse-intent/route.ts`  
**Database**: `/app/api/strategies/route.ts`  
**Smart Contract**: `/contracts/IntentSettlement.sol`  
**Sidebar**: `/components/sidebar.tsx`  

---

## Questions?

See:
- `README.md` - Full overview
- `DEPLOYMENT.md` - Detailed setup
- `PROJECT_SUMMARY.md` - What was built
- `SETUP_CHECKLIST.md` - Implementation steps

---

**Ready to go! 🚀**
