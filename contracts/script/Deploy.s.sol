// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/IntentSettlement.sol";

contract DeployScript is Script {
    // Cronos Mainnet token addresses
    address constant CRONOS_MAINNET_USDC = 0xc21223249CA28397B4B6541dfFaEcC539BfF0c59;
    address constant CRONOS_MAINNET_USDT = 0x66e428c3f67a68878562e79A0234c1F83c208770;
    address constant CRONOS_MAINNET_DAI = 0xF2001B145b43032AAF5Ee2884e456CCd805F677D;
    address constant CRONOS_MAINNET_WCRO = 0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23;

    // Cronos Testnet token addresses (update these!)
    address constant CRONOS_TESTNET_USDC = 0x0000000000000000000000000000000000000000;
    address constant CRONOS_TESTNET_USDT = 0x0000000000000000000000000000000000000000;
    address constant CRONOS_TESTNET_DAI = 0x0000000000000000000000000000000000000000;
    address constant CRONOS_TESTNET_WCRO = 0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        console.log("Chain ID:", block.chainid);

        // Select addresses based on chain ID
        address usdc;
        address usdt;
        address dai;
        address wcro;

        if (block.chainid == 25) {
            // Cronos Mainnet
            console.log("Deploying to Cronos Mainnet");
            usdc = CRONOS_MAINNET_USDC;
            usdt = CRONOS_MAINNET_USDT;
            dai = CRONOS_MAINNET_DAI;
            wcro = CRONOS_MAINNET_WCRO;
        } else if (block.chainid == 338) {
            // Cronos Testnet
            console.log("Deploying to Cronos Testnet");
            console.log("WARNING: Update testnet token addresses!");
            usdc = CRONOS_TESTNET_USDC;
            usdt = CRONOS_TESTNET_USDT;
            dai = CRONOS_TESTNET_DAI;
            wcro = CRONOS_TESTNET_WCRO;
        } else {
            // Local/other network - use deployer as placeholder
            console.log("Deploying to local/unknown network");
            usdc = deployer;
            usdt = deployer;
            dai = deployer;
            wcro = deployer;
        }

        vm.startBroadcast(deployerPrivateKey);

        // Deploy IntentSettlement
        IntentSettlement intentSettlement = new IntentSettlement(
            usdc,
            usdt,
            dai,
            wcro
        );

        console.log("IntentSettlement deployed to:", address(intentSettlement));
        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("Contract Address:", address(intentSettlement));
        console.log("USDC:", usdc);
        console.log("USDT:", usdt);
        console.log("DAI:", dai);
        console.log("WCRO:", wcro);
        console.log("");
        console.log("Add to your .env:");
        console.log("NEXT_PUBLIC_CONTRACT_ADDRESS=", address(intentSettlement));

        vm.stopBroadcast();
    }
}
