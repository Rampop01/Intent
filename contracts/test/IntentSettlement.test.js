const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IntentSettlement", function () {
  let intentSettlement;
  let owner;
  let user;
  let usdc, usdt, dai, cro;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy mock ERC20 tokens for testing
    const MockERC20 = await ethers.getContractFactory("contracts/mocks/MockERC20.sol:MockERC20");
    usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    usdt = await MockERC20.deploy("Tether", "USDT", 6);
    dai = await MockERC20.deploy("Dai", "DAI", 18);
    cro = await MockERC20.deploy("Cronos", "CRO", 18);

    await usdc.waitForDeployment();
    await usdt.waitForDeployment();
    await dai.waitForDeployment();
    await cro.waitForDeployment();

    // Deploy IntentSettlement
    const IntentSettlement = await ethers.getContractFactory("IntentSettlement");
    intentSettlement = await IntentSettlement.deploy(
      await usdc.getAddress(),
      await usdt.getAddress(),
      await dai.getAddress(),
      await cro.getAddress()
    );

    await intentSettlement.waitForDeployment();

    // Mint tokens to user
    await usdc.mint(user.address, ethers.parseUnits("10000", 6));
    await usdt.mint(user.address, ethers.parseUnits("10000", 6));
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await intentSettlement.owner()).to.equal(owner.address);
    });

    it("Should register assets correctly", async function () {
      expect(await intentSettlement.assetRegistry("USDC")).to.equal(await usdc.getAddress());
      expect(await intentSettlement.assetRegistry("USDT")).to.equal(await usdt.getAddress());
    });
  });

  describe("Strategy Creation", function () {
    it("Should create a strategy successfully", async function () {
      const amount = ethers.parseUnits("1000", 6);
      
      const tx = await intentSettlement.connect(user).createStrategy(
        amount,
        "low",
        "Save safely with minimal risk",
        60, // 60% stable
        30, // 30% liquid
        10, // 10% growth
        0   // ONCE
      );

      await expect(tx).to.emit(intentSettlement, "StrategyCreated");

      const strategies = await intentSettlement.getUserStrategies(user.address);
      expect(strategies.length).to.equal(1);
    });

    it("Should fail with zero amount", async function () {
      await expect(
        intentSettlement.connect(user).createStrategy(
          0,
          "low",
          "Test",
          60,
          30,
          10,
          0
        )
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should fail with incorrect allocations", async function () {
      await expect(
        intentSettlement.connect(user).createStrategy(
          ethers.parseUnits("1000", 6),
          "low",
          "Test",
          50, // 50%
          30, // 30%
          10, // 10% = 90% total (should be 100%)
          0
        )
      ).to.be.revertedWith("Allocations must sum to 100%");
    });
  });

  describe("Strategy Execution", function () {
    let strategyId;

    beforeEach(async function () {
      const amount = ethers.parseUnits("1000", 6);
      const tx = await intentSettlement.connect(user).createStrategy(
        amount,
        "low",
        "Save safely",
        60,
        30,
        10,
        0
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "StrategyCreated"
      );
      strategyId = event.args[0];

      // Approve contract to spend tokens
      await usdc.connect(user).approve(await intentSettlement.getAddress(), amount);
    });

    it("Should execute strategy successfully", async function () {
      const tx = await intentSettlement.connect(user).executeStrategy(
        strategyId,
        await usdc.getAddress()
      );

      await expect(tx).to.emit(intentSettlement, "ExecutionCompleted");

      const strategy = await intentSettlement.getStrategy(strategyId);
      expect(strategy.executed).to.be.true;
    });

    it("Should fail when executed by non-owner", async function () {
      await expect(
        intentSettlement.connect(owner).executeStrategy(
          strategyId,
          await usdc.getAddress()
        )
      ).to.be.revertedWith("Only strategy owner can execute");
    });

    it("Should fail when executed twice", async function () {
      await intentSettlement.connect(user).executeStrategy(
        strategyId,
        await usdc.getAddress()
      );

      await expect(
        intentSettlement.connect(user).executeStrategy(
          strategyId,
          await usdc.getAddress()
        )
      ).to.be.revertedWith("Strategy already executed");
    });
  });

  describe("View Functions", function () {
    it("Should return user strategies", async function () {
      const amount = ethers.parseUnits("1000", 6);
      
      await intentSettlement.connect(user).createStrategy(
        amount, "low", "Test 1", 60, 30, 10, 0
      );
      
      await intentSettlement.connect(user).createStrategy(
        amount, "medium", "Test 2", 50, 30, 20, 0
      );

      const strategies = await intentSettlement.getUserStrategies(user.address);
      expect(strategies.length).to.equal(2);
    });

    it("Should return strategy details", async function () {
      const amount = ethers.parseUnits("1000", 6);
      
      const tx = await intentSettlement.connect(user).createStrategy(
        amount,
        "medium",
        "Balanced strategy",
        50,
        30,
        20,
        1 // WEEKLY
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "StrategyCreated"
      );
      const strategyId = event.args[0];

      const strategy = await intentSettlement.getStrategy(strategyId);
      
      expect(strategy.user).to.equal(user.address);
      expect(strategy.amount).to.equal(amount);
      expect(strategy.riskLevel).to.equal("medium");
      expect(strategy.allocation.stablePercent).to.equal(50);
      expect(strategy.executionType).to.equal(1); // WEEKLY
    });

    it("Should return user strategy count", async function () {
      const amount = ethers.parseUnits("1000", 6);
      
      await intentSettlement.connect(user).createStrategy(
        amount, "low", "Test", 60, 30, 10, 0
      );

      const count = await intentSettlement.getUserStrategyCount(user.address);
      expect(count).to.equal(1);
    });
  });
});
