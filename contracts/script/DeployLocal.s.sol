// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/IntentSettlement.sol";
import "../contracts/mocks/MockERC20.sol";

/**
 * @title DeployLocal
 * @dev Deploy with mock tokens for LOCAL TESTING (Anvil)
 * @notice This creates fake tokens so you can test without real money!
 */
contract DeployLocal is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== LOCAL DEPLOYMENT WITH MOCK TOKENS ===");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy FAKE tokens (for testing)
        console.log("\n1. Deploying Mock Tokens...");
        
        MockERC20 usdc = new MockERC20("USD Coin", "USDC", 6);
        MockERC20 usdt = new MockERC20("Tether", "USDT", 6);
        MockERC20 dai = new MockERC20("Dai", "DAI", 18);
        MockERC20 cro = new MockERC20("Cronos", "CRO", 18);

        console.log("  USDC:", address(usdc));
        console.log("  USDT:", address(usdt));
        console.log("  DAI:", address(dai));
        console.log("  CRO:", address(cro));

        // 2. Mint yourself FREE test tokens!
        console.log("\n2. Minting Test Tokens to Deployer...");
        
        usdc.mint(deployer, 100000 * 10**6);   // 100,000 USDC
        usdt.mint(deployer, 100000 * 10**6);   // 100,000 USDT
        dai.mint(deployer, 100000 * 10**18);   // 100,000 DAI
        cro.mint(deployer, 100000 * 10**18);   // 100,000 CRO

        console.log("  Minted 100,000 of each token!");
        console.log("  Your USDT balance:", usdt.balanceOf(deployer) / 10**6, "USDT");

        // 3. Deploy IntentSettlement contract
        console.log("\n3. Deploying IntentSettlement Contract...");
        
        IntentSettlement intentSettlement = new IntentSettlement(
            address(usdc),
            address(usdt),
            address(dai),
            address(cro)
        );

        console.log("  IntentSettlement:", address(intentSettlement));

        vm.stopBroadcast();

        // 4. Print summary
        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("\nAdd these to your .env:");
        console.log("NEXT_PUBLIC_CONTRACT_ADDRESS=", address(intentSettlement));
        console.log("NEXT_PUBLIC_USDC_ADDRESS=", address(usdc));
        console.log("NEXT_PUBLIC_USDT_ADDRESS=", address(usdt));
        console.log("NEXT_PUBLIC_DAI_ADDRESS=", address(dai));
        console.log("NEXT_PUBLIC_CRO_ADDRESS=", address(cro));
        
        console.log("\nYour Test Token Balances:");
        console.log("USDC: 100,000");
        console.log("USDT: 100,000");
        console.log("DAI: 100,000");
        console.log("CRO: 100,000");
        
        console.log("\nNow you can test depositing 200 USDT without using real money!");
        console.log("\nNext steps:");
        console.log("1. Update your frontend with these addresses");
        console.log("2. In your frontend, approve the contract to spend USDT");
        console.log("3. Create and execute strategies with your FREE test tokens!");
    }
}
