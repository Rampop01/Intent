# Smart Contract Deployment Guide

## Overview
This guide will help you deploy the IntentSettlement smart contract to Cronos blockchain.

## Prerequisites

1. **Install Dependencies**
```bash
pnpm install
```

2. **Set Up Environment Variables**
Create a `.env` file in the root directory:
```bash
# Your wallet private key (DO NOT COMMIT THIS)
PRIVATE_KEY=your_private_key_here

# Cronoscan API key for contract verification
CRONOSCAN_API_KEY=your_api_key_here

# Optional: Custom RPC URLs
CRONOS_TESTNET_RPC=https://evm-t3.cronos.org
CRONOS_MAINNET_RPC=https://evm.cronos.org
```

## Get Testnet CRO

1. Visit the [Cronos Testnet Faucet](https://cronos.org/faucet)
2. Enter your wallet address
3. Request test CRO tokens

## Contract Features

The `IntentSettlement` contract supports:

### Core Functions
- ✅ **createStrategy**: Create a new financial strategy with custom allocations
- ✅ **executeStrategy**: Execute the strategy and allocate funds
- ✅ **getStrategy**: Retrieve strategy details
- ✅ **getUserStrategies**: Get all strategies for a user
- ✅ **getExecutionSteps**: Get detailed execution steps for a strategy

### Strategy Parameters
- Amount: Total amount to allocate
- Risk Level: low, medium, or high
- Intent: Natural language description
- Allocations: 
  - Stable (USDC)
  - Liquid (USDT)
  - Growth (CRO)
- Execution Type: ONCE or WEEKLY

## Deployment Steps

### 1. Compile Contracts
```bash
npx hardhat compile
```

### 2. Deploy to Cronos Testnet
```bash
npx hardhat run scripts/deploy.js --network cronosTestnet
```

### 3. Deploy to Cronos Mainnet (when ready)
```bash
npx hardhat run scripts/deploy.js --network cronosMainnet
```

### 4. Deploy to Local Network (for testing)
```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy
npx hardhat run scripts/deploy.js --network localhost
```

## After Deployment

1. **Save the Contract Address**
   - The deployment script will save it to `deployments/{network}.json`
   - Add it to your `.env` file:
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
   ```

2. **Verify Contract on Cronoscan**
   - Verification happens automatically during deployment
   - Or verify manually:
   ```bash
   npx hardhat verify --network cronosTestnet CONTRACT_ADDRESS \
     USDC_ADDRESS USDT_ADDRESS DAI_ADDRESS CRO_ADDRESS
   ```

3. **Update Frontend**
   - Update contract address in your frontend configuration
   - The contract ABI is in `artifacts/contracts/IntentSettlementSimplified.sol/IntentSettlement.json`

## Contract Integration

### Frontend Integration Example

```javascript
import { ethers } from 'ethers';
import IntentSettlementABI from './artifacts/contracts/IntentSettlementSimplified.sol/IntentSettlement.json';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new ethers.Contract(contractAddress, IntentSettlementABI.abi, signer);

// Create a strategy
const tx = await contract.createStrategy(
  ethers.parseUnits("1000", 6), // 1000 USDC
  "low",                         // Risk level
  "Save safely with minimal risk", // Intent
  60,                            // 60% stable
  30,                            // 30% liquid
  10,                            // 10% growth
  0                              // ONCE execution
);
await tx.wait();
```

## Testing

### Run Tests
```bash
npx hardhat test
```

### Test on Local Network
1. Start local node: `npx hardhat node`
2. Deploy contract: `npx hardhat run scripts/deploy.js --network localhost`
3. Interact with contract using frontend or scripts

## Troubleshooting

### Common Issues

1. **Insufficient Gas**
   - Ensure you have enough CRO for gas fees
   - Testnet: Get more from faucet
   - Mainnet: Add more CRO to your wallet

2. **Private Key Error**
   - Make sure PRIVATE_KEY is set in `.env`
   - Don't include `0x` prefix in the private key

3. **Network Connection**
   - Verify RPC URL is correct
   - Check network status at [Cronos Status](https://cronos.org/status)

4. **Verification Failed**
   - Verify manually with the command above
   - Check that constructor arguments match deployment

## Token Addresses

### Cronos Mainnet
- USDC: `0xc21223249CA28397B4B6541dfFaEcC539BfF0c59`
- USDT: `0x66e428c3f67a68878562e79A0234c1F83c208770`
- DAI: `0xF2001B145b43032AAF5Ee2884e456CCd805F677D`
- WCRO: `0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23`

### Cronos Testnet
⚠️ **Update these addresses** with actual testnet token contracts before deploying!

## Security Notes

1. **Never commit your `.env` file**
2. **Use a separate wallet for deployment**
3. **Test thoroughly on testnet before mainnet deployment**
4. **Consider a multi-sig wallet for mainnet contract ownership**
5. **Get a security audit before mainnet deployment with real funds**

## Next Steps

1. Deploy to testnet
2. Test all functions with your frontend
3. Get user feedback
4. Prepare for mainnet deployment
5. Consider audit if handling significant funds

## Support

- Cronos Documentation: https://cronos.org/docs
- Hardhat Documentation: https://hardhat.org/docs
- OpenZeppelin: https://docs.openzeppelin.com/

---

**Important**: Always test on testnet first! Never deploy to mainnet without thorough testing.
