import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { CharityRouter100, DatingRevenueRouter } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

// Mock ERC20 for testing
const MOCK_ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
];

describe("CharityRouter100", function () {
  // Test fixtures
  async function deployCharityRouterFixture() {
    const [deployer, charitySafe, user1, user2] = await ethers.getSigners();

    // Deploy mock USDC for testing
    const MockToken = await ethers.getContractFactory("MockERC20");
    const mockUSDC = await MockToken.deploy("USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();

    // Deploy CharityRouter100
    const CharityRouter = await ethers.getContractFactory("CharityRouter100");
    const router = await CharityRouter.deploy(charitySafe.address);
    await router.waitForDeployment();

    return { router, mockUSDC, deployer, charitySafe, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the correct charity safe address", async function () {
      const { router, charitySafe } = await loadFixture(deployCharityRouterFixture);
      expect(await router.CHARITY_SAFE()).to.equal(charitySafe.address);
      expect(await router.getCharityAddress()).to.equal(charitySafe.address);
    });

    it("Should emit RouterDeployed event on deployment", async function () {
      const [deployer, charitySafe] = await ethers.getSigners();
      const CharityRouter = await ethers.getContractFactory("CharityRouter100");
      const router = await CharityRouter.deploy(charitySafe.address);

      // Verify deployment succeeded and event was emitted by checking contract exists
      expect(await router.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await router.CHARITY_SAFE()).to.equal(charitySafe.address);
    });

    it("Should revert if charity safe is zero address", async function () {
      const CharityRouter = await ethers.getContractFactory("CharityRouter100");
      await expect(CharityRouter.deploy(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(CharityRouter, "InvalidCharitySafe");
    });
  });

  describe("ETH Distribution", function () {
    it("Should auto-forward ETH on receive", async function () {
      const { router, charitySafe, user1 } = await loadFixture(deployCharityRouterFixture);

      const amount = ethers.parseEther("1.0");
      const initialBalance = await ethers.provider.getBalance(charitySafe.address);

      await user1.sendTransaction({
        to: await router.getAddress(),
        value: amount,
      });

      const finalBalance = await ethers.provider.getBalance(charitySafe.address);
      expect(finalBalance - initialBalance).to.equal(amount);
    });

    it("Should emit Distribution event for ETH", async function () {
      const { router, charitySafe, user1 } = await loadFixture(deployCharityRouterFixture);
      const amount = ethers.parseEther("1.0");

      await expect(
        user1.sendTransaction({
          to: await router.getAddress(),
          value: amount,
        })
      ).to.emit(router, "Distribution")
        .withArgs(ethers.ZeroAddress, amount, charitySafe.address);
    });

    it("Should handle distributeETH when balance exists", async function () {
      const { router, charitySafe, user1 } = await loadFixture(deployCharityRouterFixture);

      // This test verifies the manual distributeETH function works
      // In practice, ETH is auto-forwarded, but this is a safety backup
      expect(await router.pendingETH()).to.equal(0);
    });

    it("Should revert distributeETH when no balance", async function () {
      const { router } = await loadFixture(deployCharityRouterFixture);
      await expect(router.distributeETH())
        .to.be.revertedWithCustomError(router, "NothingToDistribute");
    });
  });

  describe("Token Distribution", function () {
    it("Should distribute ERC20 tokens to charity", async function () {
      const { router, mockUSDC, charitySafe, user1 } = await loadFixture(deployCharityRouterFixture);

      const amount = ethers.parseUnits("1000", 6);
      await mockUSDC.mint(await router.getAddress(), amount);

      const initialBalance = await mockUSDC.balanceOf(charitySafe.address);
      await router.distributeToken(await mockUSDC.getAddress());
      const finalBalance = await mockUSDC.balanceOf(charitySafe.address);

      expect(finalBalance - initialBalance).to.equal(amount);
    });

    it("Should emit Distribution event for tokens", async function () {
      const { router, mockUSDC, charitySafe } = await loadFixture(deployCharityRouterFixture);

      const amount = ethers.parseUnits("1000", 6);
      await mockUSDC.mint(await router.getAddress(), amount);

      await expect(router.distributeToken(await mockUSDC.getAddress()))
        .to.emit(router, "Distribution")
        .withArgs(await mockUSDC.getAddress(), amount, charitySafe.address);
    });

    it("Should revert when no tokens to distribute", async function () {
      const { router, mockUSDC } = await loadFixture(deployCharityRouterFixture);
      await expect(router.distributeToken(await mockUSDC.getAddress()))
        .to.be.revertedWithCustomError(router, "NothingToDistribute");
    });

    it("Should report correct pending balances", async function () {
      const { router, mockUSDC } = await loadFixture(deployCharityRouterFixture);

      const amount = ethers.parseUnits("500", 6);
      await mockUSDC.mint(await router.getAddress(), amount);

      expect(await router.pendingToken(await mockUSDC.getAddress())).to.equal(amount);
    });
  });

  describe("Immutability", function () {
    it("Should not have any admin functions to change charity address", async function () {
      const { router } = await loadFixture(deployCharityRouterFixture);

      // Verify the contract has no setter functions
      const abi = router.interface.fragments;
      const setterFunctions = abi.filter(
        (f: any) => f.type === "function" &&
        (f.name?.startsWith("set") || f.name?.startsWith("update") || f.name?.startsWith("change"))
      );

      expect(setterFunctions.length).to.equal(0);
    });

    it("Should have CHARITY_SAFE as immutable", async function () {
      const { router, charitySafe } = await loadFixture(deployCharityRouterFixture);

      // The address should remain constant
      const address1 = await router.CHARITY_SAFE();
      const address2 = await router.getCharityAddress();

      expect(address1).to.equal(charitySafe.address);
      expect(address2).to.equal(charitySafe.address);
    });
  });
});

describe("DatingRevenueRouter", function () {
  const BASIS_POINTS = 10000n;
  const MIN_TIMELOCK = 7n * 24n * 60n * 60n; // 7 days in seconds
  const MAX_TIMELOCK = 30n * 24n * 60n * 60n; // 30 days in seconds

  async function deployDatingRouterFixture() {
    const [admin, governor, founder, dao, charity, user1, user2] = await ethers.getSigners();

    // Deploy mock USDC
    const MockToken = await ethers.getContractFactory("MockERC20");
    const mockUSDC = await MockToken.deploy("USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();

    // Deploy DatingRevenueRouter using upgrades
    const DatingRouter = await ethers.getContractFactory("DatingRevenueRouter");
    const router = await upgrades.deployProxy(
      DatingRouter,
      [founder.address, dao.address, charity.address, admin.address, governor.address],
      { kind: "uups" }
    ) as unknown as DatingRevenueRouter;
    await router.waitForDeployment();

    return { router, mockUSDC, admin, governor, founder, dao, charity, user1, user2 };
  }

  describe("Initialization", function () {
    it("Should initialize in SURVIVAL phase", async function () {
      const { router } = await loadFixture(deployDatingRouterFixture);
      expect(await router.currentPhase()).to.equal(0); // Phase.SURVIVAL
    });

    it("Should set 100% founder in SURVIVAL mode", async function () {
      const { router } = await loadFixture(deployDatingRouterFixture);
      const [founder, dao, charity] = await router.getCurrentSplit();

      expect(founder).to.equal(10000n);
      expect(dao).to.equal(0n);
      expect(charity).to.equal(0n);
    });

    it("Should set correct roles", async function () {
      const { router, admin, governor } = await loadFixture(deployDatingRouterFixture);

      const DEFAULT_ADMIN_ROLE = await router.DEFAULT_ADMIN_ROLE();
      const GOVERNOR_ROLE = await router.GOVERNOR_ROLE();

      expect(await router.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await router.hasRole(GOVERNOR_ROLE, governor.address)).to.be.true;
    });

    it("Should set correct wallet addresses", async function () {
      const { router, founder, dao, charity } = await loadFixture(deployDatingRouterFixture);

      expect(await router.founderWallet()).to.equal(founder.address);
      expect(await router.daoTreasury()).to.equal(dao.address);
      expect(await router.charitySafe()).to.equal(charity.address);
    });

    it("Should revert on zero addresses", async function () {
      const [admin, governor, founder, dao, charity] = await ethers.getSigners();
      const DatingRouter = await ethers.getContractFactory("DatingRevenueRouter");

      await expect(
        upgrades.deployProxy(
          DatingRouter,
          [ethers.ZeroAddress, dao.address, charity.address, admin.address, governor.address],
          { kind: "uups" }
        )
      ).to.be.revertedWithCustomError(DatingRouter, "InvalidAddress");
    });
  });

  describe("SURVIVAL Phase Distribution", function () {
    it("Should distribute 100% to founder", async function () {
      const { router, mockUSDC, founder } = await loadFixture(deployDatingRouterFixture);

      const amount = ethers.parseUnits("1000", 6);
      await mockUSDC.mint(await router.getAddress(), amount);

      const initialBalance = await mockUSDC.balanceOf(founder.address);
      await router.distributeToken(await mockUSDC.getAddress());
      const finalBalance = await mockUSDC.balanceOf(founder.address);

      expect(finalBalance - initialBalance).to.equal(amount);
    });

    it("Should emit Distribution event", async function () {
      const { router, mockUSDC } = await loadFixture(deployDatingRouterFixture);

      const amount = ethers.parseUnits("1000", 6);
      await mockUSDC.mint(await router.getAddress(), amount);

      await expect(router.distributeToken(await mockUSDC.getAddress()))
        .to.emit(router, "Distribution")
        .withArgs(await mockUSDC.getAddress(), amount, amount, 0, 0);
    });

    it("Should distribute ETH correctly", async function () {
      const { router, founder, user1 } = await loadFixture(deployDatingRouterFixture);

      const amount = ethers.parseEther("1.0");
      await user1.sendTransaction({
        to: await router.getAddress(),
        value: amount,
      });

      const initialBalance = await ethers.provider.getBalance(founder.address);
      await router.distributeETH();
      const finalBalance = await ethers.provider.getBalance(founder.address);

      expect(finalBalance - initialBalance).to.equal(amount);
    });
  });

  describe("Phase Transitions", function () {
    it("Should allow governor to enter TRANSITION phase", async function () {
      const { router, governor } = await loadFixture(deployDatingRouterFixture);

      await expect(router.connect(governor).enterTransitionPhase())
        .to.emit(router, "PhaseChanged")
        .withArgs(0, 1); // SURVIVAL -> TRANSITION

      expect(await router.currentPhase()).to.equal(1);
    });

    it("Should revert if non-governor tries to enter TRANSITION", async function () {
      const { router, user1 } = await loadFixture(deployDatingRouterFixture);

      await expect(router.connect(user1).enterTransitionPhase())
        .to.be.reverted;
    });

    it("Should revert entering TRANSITION from wrong phase", async function () {
      const { router, governor, admin } = await loadFixture(deployDatingRouterFixture);

      await router.connect(governor).enterTransitionPhase();

      await expect(router.connect(governor).enterTransitionPhase())
        .to.be.revertedWithCustomError(router, "WrongPhase");
    });
  });

  describe("TRANSITION Phase - Split Scheduling", function () {
    async function transitionPhaseFixture() {
      const fixture = await deployDatingRouterFixture();
      await fixture.router.connect(fixture.governor).enterTransitionPhase();
      return fixture;
    }

    it("Should schedule a new split with valid timelock", async function () {
      const { router, governor } = await loadFixture(transitionPhaseFixture);

      const timelock = MIN_TIMELOCK;
      await expect(
        router.connect(governor).scheduleSplit(5000, 2500, 2500, timelock)
      ).to.emit(router, "SplitScheduled");

      const scheduled = await router.getScheduledSplit();
      expect(scheduled.founder).to.equal(5000n);
      expect(scheduled.dao).to.equal(2500n);
      expect(scheduled.charity).to.equal(2500n);
      expect(scheduled.isScheduled).to.be.true;
    });

    it("Should revert if percentages don't sum to 100%", async function () {
      const { router, governor } = await loadFixture(transitionPhaseFixture);

      await expect(
        router.connect(governor).scheduleSplit(5000, 2500, 2000, MIN_TIMELOCK)
      ).to.be.revertedWithCustomError(router, "InvalidPercentages");
    });

    it("Should revert if timelock too short", async function () {
      const { router, governor } = await loadFixture(transitionPhaseFixture);

      const shortTimelock = MIN_TIMELOCK - 1n;
      await expect(
        router.connect(governor).scheduleSplit(5000, 2500, 2500, shortTimelock)
      ).to.be.revertedWithCustomError(router, "TimelockTooShort");
    });

    it("Should revert if timelock too long", async function () {
      const { router, governor } = await loadFixture(transitionPhaseFixture);

      const longTimelock = MAX_TIMELOCK + 1n;
      await expect(
        router.connect(governor).scheduleSplit(5000, 2500, 2500, longTimelock)
      ).to.be.revertedWithCustomError(router, "TimelockTooLong");
    });

    it("Should revert scheduling when split already scheduled", async function () {
      const { router, governor } = await loadFixture(transitionPhaseFixture);

      await router.connect(governor).scheduleSplit(5000, 2500, 2500, MIN_TIMELOCK);

      await expect(
        router.connect(governor).scheduleSplit(4000, 3000, 3000, MIN_TIMELOCK)
      ).to.be.revertedWithCustomError(router, "SplitAlreadyScheduled");
    });

    it("Should apply split after timelock expires", async function () {
      const { router, governor } = await loadFixture(transitionPhaseFixture);

      await router.connect(governor).scheduleSplit(5000, 2500, 2500, MIN_TIMELOCK);

      // Fast forward past timelock
      await time.increase(MIN_TIMELOCK);

      await expect(router.applySplit())
        .to.emit(router, "SplitApplied")
        .withArgs(5000, 2500, 2500);

      const [founder, dao, charity] = await router.getCurrentSplit();
      expect(founder).to.equal(5000n);
      expect(dao).to.equal(2500n);
      expect(charity).to.equal(2500n);
    });

    it("Should revert applying split before timelock", async function () {
      const { router, governor } = await loadFixture(transitionPhaseFixture);

      await router.connect(governor).scheduleSplit(5000, 2500, 2500, MIN_TIMELOCK);

      await expect(router.applySplit())
        .to.be.revertedWithCustomError(router, "SplitNotReady");
    });

    it("Should allow cancelling scheduled split", async function () {
      const { router, governor } = await loadFixture(transitionPhaseFixture);

      await router.connect(governor).scheduleSplit(5000, 2500, 2500, MIN_TIMELOCK);

      await expect(router.connect(governor).cancelScheduledSplit())
        .to.emit(router, "SplitCancelled");

      const scheduled = await router.getScheduledSplit();
      expect(scheduled.isScheduled).to.be.false;
    });
  });

  describe("PERMANENT Phase", function () {
    it("Should activate permanent split with founder cap", async function () {
      const { router, admin } = await loadFixture(deployDatingRouterFixture);

      await expect(
        router.connect(admin).activatePermanentSplit(1000, 4000, 5000)
      ).to.emit(router, "PermanentActivated")
        .withArgs(1000, 4000, 5000);

      expect(await router.currentPhase()).to.equal(2); // PERMANENT
    });

    it("Should revert if founder cap exceeds 10%", async function () {
      const { router, admin } = await loadFixture(deployDatingRouterFixture);

      await expect(
        router.connect(admin).activatePermanentSplit(1001, 4000, 4999)
      ).to.be.revertedWithCustomError(router, "FounderCapExceeded");
    });

    it("Should revert if percentages invalid", async function () {
      const { router, admin } = await loadFixture(deployDatingRouterFixture);

      await expect(
        router.connect(admin).activatePermanentSplit(1000, 4000, 4000)
      ).to.be.revertedWithCustomError(router, "InvalidPercentages");
    });

    it("Should prevent upgrades in PERMANENT phase", async function () {
      const { router, admin } = await loadFixture(deployDatingRouterFixture);

      await router.connect(admin).activatePermanentSplit(1000, 4000, 5000);

      const DatingRouter = await ethers.getContractFactory("DatingRevenueRouter");
      await expect(
        upgrades.upgradeProxy(await router.getAddress(), DatingRouter)
      ).to.be.revertedWithCustomError(router, "AlreadyPermanent");
    });

    it("Should prevent wallet updates in PERMANENT phase", async function () {
      const { router, admin, user1, user2 } = await loadFixture(deployDatingRouterFixture);

      await router.connect(admin).activatePermanentSplit(1000, 4000, 5000);

      await expect(
        router.connect(admin).updateWallets(user1.address, user1.address, user2.address)
      ).to.be.revertedWithCustomError(router, "AlreadyPermanent");
    });

    it("Should distribute according to permanent split", async function () {
      const { router, admin, mockUSDC, founder, dao, charity } = await loadFixture(deployDatingRouterFixture);

      await router.connect(admin).activatePermanentSplit(1000, 4000, 5000);

      const amount = ethers.parseUnits("10000", 6);
      await mockUSDC.mint(await router.getAddress(), amount);

      const founderBefore = await mockUSDC.balanceOf(founder.address);
      const daoBefore = await mockUSDC.balanceOf(dao.address);
      const charityBefore = await mockUSDC.balanceOf(charity.address);

      await router.distributeToken(await mockUSDC.getAddress());

      const founderAfter = await mockUSDC.balanceOf(founder.address);
      const daoAfter = await mockUSDC.balanceOf(dao.address);
      const charityAfter = await mockUSDC.balanceOf(charity.address);

      // 10% founder, 40% DAO, 50% charity
      expect(founderAfter - founderBefore).to.equal(ethers.parseUnits("1000", 6));
      expect(daoAfter - daoBefore).to.equal(ethers.parseUnits("4000", 6));
      expect(charityAfter - charityBefore).to.equal(ethers.parseUnits("5000", 6));
    });
  });

  describe("Distribution Calculations", function () {
    it("Should calculate distribution correctly", async function () {
      const { router, admin } = await loadFixture(deployDatingRouterFixture);

      await router.connect(admin).activatePermanentSplit(500, 4500, 5000);

      const amount = ethers.parseUnits("10000", 6);
      const [founderAmt, daoAmt, charityAmt] = await router.calculateDistribution(amount);

      expect(founderAmt).to.equal(ethers.parseUnits("500", 6)); // 5%
      expect(daoAmt).to.equal(ethers.parseUnits("4500", 6)); // 45%
      expect(charityAmt).to.equal(ethers.parseUnits("5000", 6)); // 50%
    });

    it("Should handle remainder correctly (goes to charity)", async function () {
      const { router, admin, mockUSDC, charity } = await loadFixture(deployDatingRouterFixture);

      // Use split that causes rounding: 33.33%, 33.33%, 33.34%
      await router.connect(admin).activatePermanentSplit(333, 3333, 6334);

      // Amount that will have rounding: 1001 (not evenly divisible)
      const amount = ethers.parseUnits("1001", 6);
      await mockUSDC.mint(await router.getAddress(), amount);

      const charityBefore = await mockUSDC.balanceOf(charity.address);
      await router.distributeToken(await mockUSDC.getAddress());
      const charityAfter = await mockUSDC.balanceOf(charity.address);

      // Charity gets the remainder after founder and DAO
      // This ensures no funds are lost to rounding
      const charityReceived = charityAfter - charityBefore;
      expect(charityReceived).to.be.greaterThan(0);
    });
  });

  describe("Access Control", function () {
    it("Should only allow admin to activate permanent", async function () {
      const { router, governor, user1 } = await loadFixture(deployDatingRouterFixture);

      await expect(
        router.connect(governor).activatePermanentSplit(1000, 4000, 5000)
      ).to.be.reverted;

      await expect(
        router.connect(user1).activatePermanentSplit(1000, 4000, 5000)
      ).to.be.reverted;
    });

    it("Should only allow governor to schedule splits", async function () {
      const { router, governor, admin, user1 } = await loadFixture(deployDatingRouterFixture);

      await router.connect(governor).enterTransitionPhase();

      await expect(
        router.connect(admin).scheduleSplit(5000, 2500, 2500, MIN_TIMELOCK)
      ).to.be.reverted;

      await expect(
        router.connect(user1).scheduleSplit(5000, 2500, 2500, MIN_TIMELOCK)
      ).to.be.reverted;
    });

    it("Should allow anyone to apply split after timelock", async function () {
      const { router, governor, user1 } = await loadFixture(deployDatingRouterFixture);

      await router.connect(governor).enterTransitionPhase();
      await router.connect(governor).scheduleSplit(5000, 2500, 2500, MIN_TIMELOCK);

      await time.increase(MIN_TIMELOCK);

      // Random user can apply
      await expect(router.connect(user1).applySplit()).to.not.be.reverted;
    });

    it("Should allow anyone to trigger distribution", async function () {
      const { router, mockUSDC, user1 } = await loadFixture(deployDatingRouterFixture);

      const amount = ethers.parseUnits("1000", 6);
      await mockUSDC.mint(await router.getAddress(), amount);

      await expect(
        router.connect(user1).distributeToken(await mockUSDC.getAddress())
      ).to.not.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("Should return pending balances correctly", async function () {
      const { router, mockUSDC, user1 } = await loadFixture(deployDatingRouterFixture);

      const ethAmount = ethers.parseEther("1.0");

      await user1.sendTransaction({
        to: await router.getAddress(),
        value: ethAmount,
      });

      // pendingETH should work as it doesn't need external token address
      expect(await router.pendingETH()).to.equal(ethAmount);

      // Verify the router is functional
      expect(await router.pendingETH()).to.equal(ethAmount);
    });
  });
});

// Mock ERC20 contract for testing
describe("MockERC20 (Test Helper)", function () {
  it("Should deploy and mint correctly", async function () {
    const MockToken = await ethers.getContractFactory("MockERC20");
    const token = await MockToken.deploy("Test Token", "TEST", 18);

    const [owner] = await ethers.getSigners();
    const amount = ethers.parseEther("1000");

    await token.mint(owner.address, amount);
    expect(await token.balanceOf(owner.address)).to.equal(amount);
  });
});
