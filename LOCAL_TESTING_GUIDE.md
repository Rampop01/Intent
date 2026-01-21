# 🧪 Local Testing Without Real Tokens

## How to Test Depositing 200 USDT (Without Real Money!)

### Step-by-Step Guide

#### 1. Install Foundry (if not already)
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

#### 2. Install Dependencies
```bash
forge install OpenZeppelin/openzeppelin-contracts
```

#### 3. Start Local Blockchain (Anvil)
```bash
# Terminal 1 - Keep this running
anvil
```

This creates a **fake blockchain** on your computer with:
- 10 test accounts with 10,000 ETH each
- Instant transactions (no waiting!)
- Free gas (no costs!)
- Reset anytime

#### 4. Deploy Mock Tokens + Contract
```bash
# Terminal 2
forge script script/DeployLocal.s.sol:DeployLocal \
  --rpc-url http://localhost:8545 \
  --broadcast
```

This will:
- ✅ Deploy fake USDC, USDT, DAI, CRO tokens
- ✅ Give you **100,000 of each token for FREE!**
- ✅ Deploy the IntentSettlement contract
- ✅ Print all addresses you need

#### 5. Save the Addresses

The script will print something like:
```
NEXT_PUBLIC_CONTRACT_ADDRESS= 0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_USDT_ADDRESS= 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

Add these to your `.env` file.

#### 6. Connect Your Frontend to Local Network

In your wallet (MetaMask):
- Add Custom Network
- Network Name: `Localhost`
- RPC URL: `http://localhost:8545`
- Chain ID: `31337`
- Currency: `ETH`

Import one of Anvil's test accounts:
```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
(This is Account #0 from Anvil - it's public, only for testing!)
```

#### 7. Test Your Flow!

Now you can:

**A. Check Your Balance (FREE tokens!)**
```typescript
const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
const balance = await usdt.balanceOf(userAddress);
console.log("USDT Balance:", ethers.formatUnits(balance, 6));
// Shows: 100,000 USDT
```

**B. Deposit 200 USDT (Free test!)**
```typescript
// 1. Approve contract to spend your USDT
const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
await usdt.approve(CONTRACT_ADDRESS, ethers.parseUnits("200", 6));

// 2. Create strategy
const tx = await contract.createStrategy(
  ethers.parseUnits("200", 6),  // 200 USDT
  "low",
  "Save 200 USDT safely",
  70,  // 70% stable
  20,  // 20% liquid
  10,  // 10% growth
  0    // ONCE
);

const receipt = await tx.wait();
console.log("Strategy created!", receipt);

// 3. Execute strategy
const strategyId = receipt.logs[0].args[0];
await contract.executeStrategy(strategyId, USDT_ADDRESS);

console.log("✅ 200 USDT deposited and allocated!");
```

**C. Check Results**
```typescript
const strategy = await contract.getStrategy(strategyId);
console.log("Executed:", strategy.executed);  // true

const steps = await contract.getExecutionSteps(strategyId);
console.log("Steps:", steps.length);  // 3 steps
console.log("Stable allocation:", steps[0].amount);  // 140 USDT
```

## Visual Flow

```
┌─────────────────────────────────────────────┐
│  Terminal 1: Anvil (Local Blockchain)      │
│  - Runs fake blockchain on localhost:8545  │
│  - Gives you free ETH for gas              │
│  - Reset anytime: Ctrl+C and restart       │
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│  Terminal 2: Deploy Mock Tokens            │
│  - Creates fake USDT, USDC, DAI, CRO       │
│  - Mints 100,000 of each to you           │
│  - Deploys IntentSettlement contract       │
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│  Your Frontend (Next.js)                   │
│  - Connect wallet to localhost:8545        │
│  - Use the token addresses from deploy     │
│  - Test depositing 200 USDT (it's FREE!)  │
│  - Create strategies, execute, etc.        │
└─────────────────────────────────────────────┘
```

## Complete Testing Example

### Terminal 1: Start Anvil
```bash
anvil
```

### Terminal 2: Deploy Everything
```bash
forge script script/DeployLocal.s.sol:DeployLocal \
  --rpc-url http://localhost:8545 \
  --broadcast
```

### Terminal 3: Run Your Frontend
```bash
pnpm dev
```

Now in your browser:
1. Connect MetaMask to `localhost:8545`
2. Import Anvil test account
3. You have 100,000 USDT (fake, for testing!)
4. Deposit 200 USDT through your app
5. It works exactly like the real thing!

## When to Use What

| Scenario | Use This |
|----------|----------|
| 🧪 Local testing (free, fast) | MockERC20 + Anvil |
| 🌐 Testnet testing (almost real) | Real testnet tokens (what you have) |
| 🚀 Production (real money) | Real mainnet tokens |

## Summary

- **MockERC20** = Play money for **local testing only**
- **Testnet tokens** = Almost-real money for **testnet deployment**
- **Mainnet tokens** = Real money for **production**

You can test your 200 USDT deposit **for free** using MockERC20 + Anvil before deploying to testnet! 🎉

**Want to try it now?** I can help you set it up!
