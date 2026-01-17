import { ethers } from 'ethers';
import crypto from 'crypto';

/**
 * HeartDAO Service
 * Integrates blockchain DAO with dating platform
 *
 * FOR THE KIDS! 💛
 */

// Contract ABIs (simplified for essential functions)
const HEART_DAO_ABI = [
  "function distributeRevenue() external payable",
  "function donateToCharity(string message) external payable",
  "function isRoyaltyFounder(address) view returns (bool)",
  "function getRoyaltyStatus(address) view returns (bool, string)",
  "event RevenueDistributed(uint256 totalAmount, uint256 charityAmount, uint256 infraAmount, uint256 founderAmount, uint256 timestamp)"
];

const ROYALTY_NFT_ABI = [
  "function isRoyaltyHolder(address) view returns (bool)",
  "function getCardDetails(uint256) view returns (uint8, address, string)",
  "function getRemainingCards() view returns (bool, bool, bool, bool, bool)"
];

class DAOService {
  constructor() {
    this.provider = null;
    this.daoContract = null;
    this.nftContract = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'https://polygon-rpc.com';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    if (process.env.HEART_DAO_ADDRESS) {
      this.daoContract = new ethers.Contract(
        process.env.HEART_DAO_ADDRESS,
        HEART_DAO_ABI,
        this.provider
      );
    }

    if (process.env.ROYALTY_NFT_ADDRESS) {
      this.nftContract = new ethers.Contract(
        process.env.ROYALTY_NFT_ADDRESS,
        ROYALTY_NFT_ABI,
        this.provider
      );
    }

    this.isInitialized = true;
    console.log('💛 HeartDAO Service initialized - FOR THE KIDS!');
  }

  /**
   * Check if user is a Royalty Founder
   */
  async isRoyaltyFounder(walletAddress) {
    if (!this.nftContract) return false;
    try {
      return await this.nftContract.isRoyaltyHolder(walletAddress);
    } catch (error) {
      console.error('Error checking royalty status:', error);
      return false;
    }
  }

  /**
   * Get remaining Royalty Cards
   */
  async getRemainingCards() {
    if (!this.nftContract) {
      return {
        ace: true,
        king: true,
        queen: true,
        jack: true,
        joker: true
      };
    }

    try {
      const [ace, king, queen, jack, joker] = await this.nftContract.getRemainingCards();
      return { ace, king, queen, jack, joker };
    } catch (error) {
      console.error('Error getting remaining cards:', error);
      return { ace: true, king: true, queen: true, jack: true, joker: true };
    }
  }

  /**
   * Calculate revenue split
   */
  calculateRevenueSplit(totalAmount) {
    const total = parseFloat(totalAmount);
    return {
      total,
      charity: (total * 1.0).toFixed(2),      // 100% to verified pediatric charities
      infrastructure: (0).toFixed(2), // 0% Platform (SURVIVAL MODE)
      founder: (0).toFixed(2)        // 0% Founder (SURVIVAL MODE)
    };
  }
}

/**
 * Pre-order Management Service
 */
class PreOrderService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create pre-order with transaction ID for Joker drawing
   */
  async createPreOrder(userId, type, paymentDetails) {
    const transactionId = this.generateTransactionId();

    const preOrder = await this.db.preOrder.create({
      data: {
        userId,
        type, // 'EARLY_BIRD' or 'ROYALTY_CARD'
        cardType: paymentDetails.cardType || null, // ACE, KING, QUEEN, JACK
        amount: paymentDetails.amount,
        transactionId,
        squarePaymentId: paymentDetails.squarePaymentId,
        status: 'CONFIRMED',
        jokerEligible: true, // All pre-orders enter Joker drawing
        createdAt: new Date()
      }
    });

    return {
      ...preOrder,
      message: `🎰 Your transaction ID ${transactionId} is entered in the Valentine's Day Joker drawing!`
    };
  }

  /**
   * Generate unique transaction ID for Joker drawing
   */
  generateTransactionId() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `HEART-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Get all Joker-eligible entries
   */
  async getJokerDrawingEntries() {
    return await this.db.preOrder.findMany({
      where: {
        jokerEligible: true,
        status: 'CONFIRMED'
      },
      select: {
        transactionId: true,
        userId: true,
        type: true,
        createdAt: true
      }
    });
  }

  /**
   * Perform Joker random drawing
   * Uses cryptographically secure randomness
   */
  async performJokerDrawing() {
    const entries = await this.getJokerDrawingEntries();

    if (entries.length === 0) {
      throw new Error('No eligible entries for Joker drawing');
    }

    // Cryptographically secure random selection
    const randomBytes = crypto.randomBytes(4);
    const randomIndex = randomBytes.readUInt32BE(0) % entries.length;

    const winner = entries[randomIndex];

    // Record the drawing result
    await this.db.jokerDrawing.create({
      data: {
        winnerTransactionId: winner.transactionId,
        winnerUserId: winner.userId,
        totalEntries: entries.length,
        drawnAt: new Date(),
        verificationHash: crypto.createHash('sha256')
          .update(JSON.stringify(entries.map(e => e.transactionId)))
          .digest('hex')
      }
    });

    return winner;
  }

  /**
   * Get pre-order statistics
   */
  async getPreOrderStats() {
    const [earlyBird, royalty, total] = await Promise.all([
      this.db.preOrder.count({ where: { type: 'EARLY_BIRD' } }),
      this.db.preOrder.count({ where: { type: 'ROYALTY_CARD' } }),
      this.db.preOrder.count()
    ]);

    return {
      earlyBirdCount: earlyBird,
      earlyBirdRemaining: Math.max(0, 100 - earlyBird), // 100 early bird limit
      royaltyCardsSold: royalty,
      royaltyCardsRemaining: Math.max(0, 4 - royalty), // 4 cards (Joker is drawing)
      totalPreOrders: total,
      jokerEntries: total // All pre-orders = Joker entries
    };
  }
}

export const daoService = new DAOService();
export { PreOrderService };
