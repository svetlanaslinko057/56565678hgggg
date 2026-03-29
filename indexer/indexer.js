/**
 * FOMO Arena Blockchain Indexer
 * 
 * Listens to smart contract events and mirrors them to MongoDB.
 * This enables real-time FOMO data and position tracking.
 * 
 * Events indexed:
 * - MarketCreated
 * - BetPlaced
 * - MarketResolved
 * - Claimed
 * - MarketCancelled
 */

const { ethers } = require('ethers');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '../backend/.env' });

// Configuration
const RPC_URL = process.env.CHAIN_RPC || 'https://bsc-testnet.publicnode.com';
const CONTRACT_ADDRESS = process.env.PREDICTION_CONTRACT || '0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e';
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'fomo_arena';

// Arena Core ABI (events only)
const ARENA_CORE_ABI = [
  'event MarketCreated(uint256 indexed marketId, string question, uint8 outcomeCount, uint256 endTime, address creator)',
  'event BetPlaced(uint256 indexed marketId, address indexed user, uint256 tokenId, uint8 outcomeId, uint256 amount, uint256 shares)',
  'event MarketResolved(uint256 indexed marketId, uint8 winningOutcome)',
  'event Claimed(uint256 indexed tokenId, address indexed user, uint256 payout)',
  'event MarketCancelled(uint256 indexed marketId)',
  'event Refunded(uint256 indexed tokenId, address indexed user, uint256 amount)',
];

class FomoIndexer {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.db = null;
    this.isRunning = false;
    this.lastProcessedBlock = 0;
  }

  async initialize() {
    console.log('🚀 Initializing FOMO Arena Indexer...');
    console.log(`📡 RPC: ${RPC_URL}`);
    console.log(`📜 Contract: ${CONTRACT_ADDRESS}`);

    // Connect to blockchain
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, ARENA_CORE_ABI, this.provider);

    // Test connection
    const network = await this.provider.getNetwork();
    console.log(`⛓️ Connected to chain: ${network.chainId}`);

    // Connect to MongoDB
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    this.db = client.db(DB_NAME);
    console.log(`🗄️ Connected to MongoDB: ${DB_NAME}`);

    // Create indexes
    await this.createIndexes();

    // Load last synced block
    await this.loadState();

    console.log('✅ Indexer initialized successfully');
  }

  async createIndexes() {
    // Markets mirror
    await this.db.collection('markets_mirror').createIndex({ marketId: 1 }, { unique: true });
    await this.db.collection('markets_mirror').createIndex({ status: 1 });
    await this.db.collection('markets_mirror').createIndex({ createdAt: -1 });

    // Positions mirror
    await this.db.collection('positions_mirror').createIndex({ tokenId: 1 }, { unique: true });
    await this.db.collection('positions_mirror').createIndex({ marketId: 1 });
    await this.db.collection('positions_mirror').createIndex({ owner: 1 });
    await this.db.collection('positions_mirror').createIndex({ status: 1 });

    // Activities
    await this.db.collection('activities').createIndex({ marketId: 1 });
    await this.db.collection('activities').createIndex({ user: 1 });
    await this.db.collection('activities').createIndex({ type: 1 });
    await this.db.collection('activities').createIndex({ createdAt: -1 });

    // Indexer state
    await this.db.collection('indexer_state').createIndex({ key: 1 }, { unique: true });

    console.log('📊 Indexes created');
  }

  async loadState() {
    const state = await this.db.collection('indexer_state').findOne({ key: 'main' });
    if (state) {
      this.lastProcessedBlock = state.lastSyncedBlock || 0;
      console.log(`📍 Resuming from block ${this.lastProcessedBlock}`);
    } else {
      // Start from recent blocks (last ~1000)
      const currentBlock = await this.provider.getBlockNumber();
      this.lastProcessedBlock = Math.max(0, currentBlock - 1000);
      console.log(`📍 Starting fresh from block ${this.lastProcessedBlock}`);
    }
  }

  async saveState(blockNumber) {
    await this.db.collection('indexer_state').updateOne(
      { key: 'main' },
      {
        $set: {
          lastSyncedBlock: blockNumber,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  // =============================================
  // EVENT HANDLERS
  // =============================================

  async handleMarketCreated(marketId, question, outcomeCount, endTime, creator, event) {
    console.log(`📊 MarketCreated: ${marketId} - "${question.slice(0, 50)}..."`);

    const market = {
      marketId: Number(marketId),
      question,
      outcomeCount: Number(outcomeCount),
      endTime: Number(endTime),
      creator: creator.toLowerCase(),
      status: 'active',
      totalVolume: '0',
      totalBets: 0,
      outcomes: Array.from({ length: Number(outcomeCount) }, (_, i) => ({
        id: i + 1,
        name: i === 0 ? 'YES' : 'NO',
        totalStaked: '0',
        betsCount: 0,
      })),
      createdAt: new Date(),
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };

    await this.db.collection('markets_mirror').updateOne(
      { marketId: market.marketId },
      { $set: market },
      { upsert: true }
    );

    // Log activity
    await this.logActivity({
      type: 'MARKET_CREATED',
      marketId: market.marketId,
      user: creator.toLowerCase(),
      txHash: event.transactionHash,
      data: { question },
    });
  }

  async handleBetPlaced(marketId, user, tokenId, outcomeId, amount, shares, event) {
    console.log(`🎯 BetPlaced: Market ${marketId}, User ${user.slice(0, 10)}..., ${ethers.formatUnits(amount, 18)} USDT`);

    const userAddress = user.toLowerCase();
    const amountStr = amount.toString();

    // Create position
    const position = {
      tokenId: Number(tokenId),
      marketId: Number(marketId),
      owner: userAddress,
      outcome: Number(outcomeId),
      amount: amountStr,
      shares: shares.toString(),
      status: 'open',
      createdAt: new Date(),
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };

    await this.db.collection('positions_mirror').updateOne(
      { tokenId: position.tokenId },
      { $set: position },
      { upsert: true }
    );

    // Update market stats
    await this.db.collection('markets_mirror').updateOne(
      { marketId: Number(marketId) },
      {
        $inc: {
          totalBets: 1,
          [`outcomes.${Number(outcomeId) - 1}.betsCount`]: 1,
        },
        $set: { updatedAt: new Date() },
      }
    );

    // Log activity
    await this.logActivity({
      type: 'BET',
      marketId: Number(marketId),
      user: userAddress,
      tokenId: Number(tokenId),
      amount: amountStr,
      outcome: Number(outcomeId),
      txHash: event.transactionHash,
    });
  }

  async handleMarketResolved(marketId, winningOutcome, event) {
    console.log(`✅ MarketResolved: ${marketId} -> Outcome ${winningOutcome}`);

    // Update market
    await this.db.collection('markets_mirror').updateOne(
      { marketId: Number(marketId) },
      {
        $set: {
          status: 'resolved',
          resolvedOutcome: Number(winningOutcome),
          resolvedAt: new Date(),
          resolutionTxHash: event.transactionHash,
        },
      }
    );

    // Update positions - mark winners and losers
    await this.db.collection('positions_mirror').updateMany(
      { marketId: Number(marketId), outcome: Number(winningOutcome) },
      { $set: { status: 'won' } }
    );

    await this.db.collection('positions_mirror').updateMany(
      { marketId: Number(marketId), outcome: { $ne: Number(winningOutcome) } },
      { $set: { status: 'lost' } }
    );

    // Log activity
    await this.logActivity({
      type: 'MARKET_RESOLVED',
      marketId: Number(marketId),
      data: { winningOutcome: Number(winningOutcome) },
      txHash: event.transactionHash,
    });
  }

  async handleClaimed(tokenId, user, payout, event) {
    console.log(`💰 Claimed: Token ${tokenId} by ${user.slice(0, 10)}..., ${ethers.formatUnits(payout, 18)} USDT`);

    await this.db.collection('positions_mirror').updateOne(
      { tokenId: Number(tokenId) },
      {
        $set: {
          status: 'claimed',
          payout: payout.toString(),
          claimedAt: new Date(),
          claimTxHash: event.transactionHash,
        },
      }
    );

    await this.logActivity({
      type: 'CLAIM',
      tokenId: Number(tokenId),
      user: user.toLowerCase(),
      amount: payout.toString(),
      txHash: event.transactionHash,
    });
  }

  async handleMarketCancelled(marketId, event) {
    console.log(`❌ MarketCancelled: ${marketId}`);

    await this.db.collection('markets_mirror').updateOne(
      { marketId: Number(marketId) },
      { $set: { status: 'cancelled', cancelledAt: new Date() } }
    );

    await this.db.collection('positions_mirror').updateMany(
      { marketId: Number(marketId) },
      { $set: { status: 'refundable' } }
    );

    await this.logActivity({
      type: 'MARKET_CANCELLED',
      marketId: Number(marketId),
      txHash: event.transactionHash,
    });
  }

  async handleRefunded(tokenId, user, amount, event) {
    console.log(`🔄 Refunded: Token ${tokenId}`);

    await this.db.collection('positions_mirror').updateOne(
      { tokenId: Number(tokenId) },
      {
        $set: {
          status: 'refunded',
          refundedAt: new Date(),
          refundTxHash: event.transactionHash,
        },
      }
    );

    await this.logActivity({
      type: 'REFUND',
      tokenId: Number(tokenId),
      user: user.toLowerCase(),
      amount: amount.toString(),
      txHash: event.transactionHash,
    });
  }

  // =============================================
  // HELPERS
  // =============================================

  async logActivity(activity) {
    await this.db.collection('activities').insertOne({
      ...activity,
      createdAt: new Date(),
    });
  }

  // =============================================
  // MAIN SYNC LOOP
  // =============================================

  async syncHistoricalEvents(fromBlock, toBlock) {
    console.log(`📚 Syncing historical events from block ${fromBlock} to ${toBlock}`);

    const events = [
      { name: 'MarketCreated', handler: this.handleMarketCreated.bind(this) },
      { name: 'BetPlaced', handler: this.handleBetPlaced.bind(this) },
      { name: 'MarketResolved', handler: this.handleMarketResolved.bind(this) },
      { name: 'Claimed', handler: this.handleClaimed.bind(this) },
      { name: 'MarketCancelled', handler: this.handleMarketCancelled.bind(this) },
      { name: 'Refunded', handler: this.handleRefunded.bind(this) },
    ];

    for (const { name, handler } of events) {
      try {
        const filter = this.contract.filters[name]();
        const logs = await this.contract.queryFilter(filter, fromBlock, toBlock);

        for (const log of logs) {
          await handler(...log.args, log);
        }

        if (logs.length > 0) {
          console.log(`  - ${name}: ${logs.length} events`);
        }
      } catch (err) {
        console.error(`Error syncing ${name}:`, err.message);
      }
    }
  }

  async startListening() {
    console.log('👂 Starting real-time event listeners...');

    // MarketCreated
    this.contract.on('MarketCreated', async (marketId, question, outcomeCount, endTime, creator, event) => {
      await this.handleMarketCreated(marketId, question, outcomeCount, endTime, creator, event);
      await this.saveState(event.blockNumber);
    });

    // BetPlaced
    this.contract.on('BetPlaced', async (marketId, user, tokenId, outcomeId, amount, shares, event) => {
      await this.handleBetPlaced(marketId, user, tokenId, outcomeId, amount, shares, event);
      await this.saveState(event.blockNumber);
    });

    // MarketResolved
    this.contract.on('MarketResolved', async (marketId, winningOutcome, event) => {
      await this.handleMarketResolved(marketId, winningOutcome, event);
      await this.saveState(event.blockNumber);
    });

    // Claimed
    this.contract.on('Claimed', async (tokenId, user, payout, event) => {
      await this.handleClaimed(tokenId, user, payout, event);
      await this.saveState(event.blockNumber);
    });

    // MarketCancelled
    this.contract.on('MarketCancelled', async (marketId, event) => {
      await this.handleMarketCancelled(marketId, event);
      await this.saveState(event.blockNumber);
    });

    // Refunded
    this.contract.on('Refunded', async (tokenId, user, amount, event) => {
      await this.handleRefunded(tokenId, user, amount, event);
      await this.saveState(event.blockNumber);
    });

    console.log('✅ Event listeners active');
  }

  async run() {
    await this.initialize();

    // Sync historical events
    const currentBlock = await this.provider.getBlockNumber();
    if (this.lastProcessedBlock < currentBlock) {
      await this.syncHistoricalEvents(this.lastProcessedBlock, currentBlock);
      await this.saveState(currentBlock);
    }

    // Start listening for new events
    await this.startListening();

    this.isRunning = true;
    console.log('🔥 FOMO Arena Indexer is running!');

    // Keep alive
    while (this.isRunning) {
      await new Promise(r => setTimeout(r, 10000));
      
      // Periodic status log
      const block = await this.provider.getBlockNumber();
      const marketCount = await this.db.collection('markets_mirror').countDocuments();
      const positionCount = await this.db.collection('positions_mirror').countDocuments();
      
      console.log(`📊 Status: Block ${block}, Markets: ${marketCount}, Positions: ${positionCount}`);
    }
  }
}

// Run indexer
const indexer = new FomoIndexer();
indexer.run().catch(err => {
  console.error('💥 Indexer crashed:', err);
  process.exit(1);
});
