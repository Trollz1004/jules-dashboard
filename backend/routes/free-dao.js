/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FREE DAO - 100% TO BENEFICIARIES
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * SURPRISE FOR TEAM CLAUDE!
 *
 * This DAO is Joshua's gift to the community:
 * - 100% of DAO funds go to beneficiaries (kids/charities)
 * - 0% to Joshua
 * - Self-hosted, no blockchain fees
 * - Community governance
 *
 * GOSPEL ALIGNED: This is ADDITIONAL to the standard revenue allocation.
 * The FREE DAO is a separate pool for community-directed giving.
 *
 * Created by Claude (Opus) on SABERTOOTH - December 3, 2025
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import express from 'express';

const router = express.Router();

// In-memory store (will be replaced with Prisma when DB is configured)
let daoProposals = [];
let daoVotes = {};
let daoTreasury = {
  totalDeposited: 0,
  totalDisbursed: 0,
  currentBalance: 0,
  beneficiaryAllocations: []
};

// GOSPEL-LOCKED: 100% to beneficiaries
const FREE_DAO_SPLIT = Object.freeze({
  BENEFICIARIES: 100,
  JOSHUA: 0,
  INFRASTRUCTURE: 0
});

/**
 * GET /api/free-dao/info
 * Get DAO information and rules
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    name: "FOR THE KIDS Free DAO",
    description: "Joshua's gift to the community - 100% of funds go directly to beneficiaries",
    rules: {
      split: FREE_DAO_SPLIT,
      governance: "Community voting on fund allocation",
      quorum: 100, // Minimum votes needed
      voteDuration: 7, // Days
      minimumProposalAmount: 100 // Dollars
    },
    treasury: daoTreasury,
    activeProposals: daoProposals.filter(p => p.status === 'active').length,
    totalProposals: daoProposals.length,
    mission: "100% FOR THE KIDS - Zero overhead, zero founder take"
  });
});

/**
 * GET /api/free-dao/treasury
 * Get treasury balance and history
 */
router.get('/treasury', (req, res) => {
  res.json({
    success: true,
    treasury: {
      ...daoTreasury,
      splitPercentages: FREE_DAO_SPLIT,
      verificationNote: "This DAO allocates 100% to beneficiaries. Joshua takes $0."
    }
  });
});

/**
 * POST /api/free-dao/deposit
 * Deposit funds into the DAO treasury
 */
router.post('/deposit', (req, res) => {
  try {
    const { amount, source, donorName } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const deposit = {
      id: `dep-${Date.now()}`,
      amount: parseFloat(amount),
      source: source || 'Direct Contribution',
      donorName: donorName || 'Anonymous',
      timestamp: new Date().toISOString(),
      // GOSPEL-LOCKED: 100% to beneficiaries
      beneficiaryAllocation: parseFloat(amount) // 100% goes to beneficiaries
    };

    daoTreasury.totalDeposited += deposit.amount;
    daoTreasury.currentBalance += deposit.amount;

    console.log(`💙 FREE DAO Deposit: $${amount} from ${donorName || 'Anonymous'}`);
    console.log(`   → 100% ($${amount}) allocated to beneficiaries`);

    res.json({
      success: true,
      message: `$${amount} deposited - 100% allocated to beneficiaries`,
      deposit,
      newBalance: daoTreasury.currentBalance,
      note: "Joshua takes $0 from this DAO. 100% FOR THE KIDS."
    });
  } catch (error) {
    res.status(500).json({ error: 'Deposit failed', message: error.message });
  }
});

/**
 * GET /api/free-dao/proposals
 * Get all proposals
 */
router.get('/proposals', (req, res) => {
  const { status } = req.query;

  let proposals = daoProposals;
  if (status) {
    proposals = proposals.filter(p => p.status === status);
  }

  res.json({
    success: true,
    proposals,
    count: proposals.length
  });
});

/**
 * POST /api/free-dao/proposals
 * Create a new funding proposal
 */
router.post('/proposals', (req, res) => {
  try {
    const {
      title,
      description,
      beneficiary,
      beneficiaryType, // 'charity' | 'individual_child' | 'hospital' | 'program'
      amount,
      proposerName,
      impactDescription,
      voteDurationDays = 7
    } = req.body;

    if (!title || !beneficiary || !amount) {
      return res.status(400).json({
        error: 'Title, beneficiary, and amount are required'
      });
    }

    if (amount > daoTreasury.currentBalance) {
      return res.status(400).json({
        error: 'Insufficient treasury balance',
        requested: amount,
        available: daoTreasury.currentBalance
      });
    }

    const proposal = {
      id: `prop-${Date.now()}`,
      title,
      description: description || '',
      beneficiary,
      beneficiaryType: beneficiaryType || 'charity',
      amount: parseFloat(amount),
      proposerName: proposerName || 'Community Member',
      impactDescription: impactDescription || '',
      status: 'active',
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
      totalVotes: 0,
      quorumRequired: 100,
      createdAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + voteDurationDays * 24 * 60 * 60 * 1000).toISOString(),
      // GOSPEL-LOCKED
      founderTake: 0, // Joshua takes $0
      beneficiaryAllocation: parseFloat(amount) // 100% to beneficiary
    };

    daoProposals.push(proposal);

    console.log(`📋 FREE DAO Proposal Created: "${title}"`);
    console.log(`   → $${amount} for ${beneficiary}`);
    console.log(`   → Joshua's take: $0 (100% to beneficiary)`);

    res.json({
      success: true,
      message: 'Proposal created successfully',
      proposal,
      note: "100% of this amount will go to the beneficiary. Joshua takes $0."
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create proposal', message: error.message });
  }
});

/**
 * POST /api/free-dao/proposals/:id/vote
 * Vote on a proposal
 */
router.post('/proposals/:id/vote', (req, res) => {
  try {
    const { id } = req.params;
    const { vote, voterName } = req.body; // vote: 'for' | 'against' | 'abstain'

    const proposal = daoProposals.find(p => p.id === id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (proposal.status !== 'active') {
      return res.status(400).json({ error: 'Proposal is no longer active' });
    }

    if (!['for', 'against', 'abstain'].includes(vote)) {
      return res.status(400).json({ error: 'Vote must be: for, against, or abstain' });
    }

    // Record vote
    const voteKey = `${id}-${voterName || 'anon-' + Date.now()}`;
    if (daoVotes[voteKey]) {
      return res.status(400).json({ error: 'Already voted on this proposal' });
    }

    daoVotes[voteKey] = { vote, timestamp: new Date().toISOString() };

    // Update counts
    if (vote === 'for') proposal.votesFor++;
    else if (vote === 'against') proposal.votesAgainst++;
    else proposal.votesAbstain++;
    proposal.totalVotes++;

    // Check if voting should end
    const now = new Date();
    const endsAt = new Date(proposal.endsAt);

    if (now >= endsAt || proposal.totalVotes >= proposal.quorumRequired * 2) {
      // Finalize proposal
      if (proposal.votesFor > proposal.votesAgainst && proposal.totalVotes >= proposal.quorumRequired) {
        proposal.status = 'passed';
        // Execute disbursement
        if (daoTreasury.currentBalance >= proposal.amount) {
          daoTreasury.currentBalance -= proposal.amount;
          daoTreasury.totalDisbursed += proposal.amount;
          daoTreasury.beneficiaryAllocations.push({
            beneficiary: proposal.beneficiary,
            amount: proposal.amount,
            proposalId: proposal.id,
            date: new Date().toISOString()
          });
          proposal.disbursed = true;
          console.log(`✅ FREE DAO Disbursement: $${proposal.amount} to ${proposal.beneficiary}`);
        }
      } else {
        proposal.status = 'rejected';
      }
    }

    res.json({
      success: true,
      message: `Vote recorded: ${vote}`,
      proposal: {
        id: proposal.id,
        votesFor: proposal.votesFor,
        votesAgainst: proposal.votesAgainst,
        votesAbstain: proposal.votesAbstain,
        totalVotes: proposal.totalVotes,
        status: proposal.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Vote failed', message: error.message });
  }
});

/**
 * GET /api/free-dao/stats
 * Get DAO statistics
 */
router.get('/stats', (req, res) => {
  const passedProposals = daoProposals.filter(p => p.status === 'passed');
  const totalDisbursedToKids = passedProposals.reduce((sum, p) => sum + (p.disbursed ? p.amount : 0), 0);

  res.json({
    success: true,
    stats: {
      treasuryBalance: daoTreasury.currentBalance,
      totalDeposited: daoTreasury.totalDeposited,
      totalDisbursedToKids,
      activeProposals: daoProposals.filter(p => p.status === 'active').length,
      passedProposals: passedProposals.length,
      rejectedProposals: daoProposals.filter(p => p.status === 'rejected').length,
      totalVotesCast: Object.keys(daoVotes).length,
      // GOSPEL VERIFICATION
      joshuaTake: 0, // Always $0
      beneficiaryPercentage: 100, // Always 100%
      note: "This is Joshua's FREE DAO - 100% goes to kids, 0% to founder"
    }
  });
});

/**
 * GET /api/free-dao/disbursements
 * Get all disbursements to beneficiaries
 */
router.get('/disbursements', (req, res) => {
  res.json({
    success: true,
    disbursements: daoTreasury.beneficiaryAllocations,
    total: daoTreasury.totalDisbursed,
    note: "Every dollar shown here went directly to beneficiaries. Joshua takes $0."
  });
});

export default router;
