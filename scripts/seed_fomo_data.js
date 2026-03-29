/**
 * FOMO Arena - Seed Script for FOMO Engine Demo
 * Creates markets with activity data to demonstrate FOMO Engine
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fomo_arena';

async function seedFomoData() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('fomo_arena');
    
    // Clear existing data
    await db.collection('markets_mirror').deleteMany({});
    await db.collection('positions_mirror').deleteMany({});
    await db.collection('activities').deleteMany({});
    await db.collection('indexer_state').deleteMany({});
    
    console.log('Cleared existing data');
    
    // Create markets
    const markets = [
      {
        marketId: 1,
        question: 'Will BTC reach $150K by end of Q1 2026?',
        outcomeLabels: ['YES', 'NO'],
        outcomeCount: 2,
        endTime: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
        status: 'active',
        totalStaked: '500000000000000000000000', // 500,000 USDT
        totalWinningStaked: '0',
        createdAt: new Date(Date.now() - 86400000 * 3),
        updatedAt: new Date(),
        txHash: '0x' + '1'.repeat(64),
        blockNumber: 97400000,
      },
      {
        marketId: 2,
        question: 'Will ETH flip BTC market cap in 2026?',
        outcomeLabels: ['YES', 'NO'],
        outcomeCount: 2,
        endTime: Math.floor(Date.now() / 1000) + 86400 * 60,
        status: 'active',
        totalStaked: '250000000000000000000000', // 250,000 USDT
        totalWinningStaked: '0',
        createdAt: new Date(Date.now() - 86400000 * 5),
        updatedAt: new Date(),
        txHash: '0x' + '2'.repeat(64),
        blockNumber: 97400100,
      },
      {
        marketId: 3,
        question: 'Will Solana reach $500 by March 2026?',
        outcomeLabels: ['YES', 'NO'],
        outcomeCount: 2,
        endTime: Math.floor(Date.now() / 1000) + 86400 * 45,
        status: 'active',
        totalStaked: '180000000000000000000000', // 180,000 USDT
        totalWinningStaked: '0',
        createdAt: new Date(Date.now() - 86400000 * 2),
        updatedAt: new Date(),
        txHash: '0x' + '3'.repeat(64),
        blockNumber: 97400200,
      },
      {
        marketId: 4,
        question: 'Will Trump sign crypto executive order in first 100 days?',
        outcomeLabels: ['YES', 'NO'],
        outcomeCount: 2,
        endTime: Math.floor(Date.now() / 1000) + 86400 * 20,
        status: 'active',
        totalStaked: '320000000000000000000000', // 320,000 USDT
        totalWinningStaked: '0',
        createdAt: new Date(Date.now() - 86400000 * 1),
        updatedAt: new Date(),
        txHash: '0x' + '4'.repeat(64),
        blockNumber: 97400300,
      },
      {
        marketId: 5,
        question: 'Will Apple announce Bitcoin on balance sheet in 2026?',
        outcomeLabels: ['YES', 'NO'],
        outcomeCount: 2,
        endTime: Math.floor(Date.now() / 1000) + 86400 * 90,
        status: 'active',
        totalStaked: '75000000000000000000000', // 75,000 USDT
        totalWinningStaked: '0',
        createdAt: new Date(Date.now() - 86400000 * 7),
        updatedAt: new Date(),
        txHash: '0x' + '5'.repeat(64),
        blockNumber: 97400400,
      },
      {
        marketId: 6,
        question: 'Will SEC approve Ethereum spot ETF options by Q2 2026?',
        outcomeLabels: ['YES', 'NO'],
        outcomeCount: 2,
        endTime: Math.floor(Date.now() / 1000) + 86400 * 75,
        status: 'active',
        totalStaked: '420000000000000000000000', // 420,000 USDT
        totalWinningStaked: '0',
        createdAt: new Date(Date.now() - 86400000 * 4),
        updatedAt: new Date(),
        txHash: '0x' + '6'.repeat(64),
        blockNumber: 97400500,
      },
    ];
    
    await db.collection('markets_mirror').insertMany(markets);
    console.log(`Created ${markets.length} markets`);
    
    // Create positions to demonstrate FOMO data
    const positions = [];
    const activities = [];
    const wallets = [
      '0x1234567890abcdef1234567890abcdef12345678',
      '0xabcdef1234567890abcdef1234567890abcdef12',
      '0x9876543210fedcba9876543210fedcba98765432',
      '0xfedcba9876543210fedcba9876543210fedcba98',
      '0x5555555555555555555555555555555555555555',
      '0x6666666666666666666666666666666666666666',
      '0x7777777777777777777777777777777777777777',
      '0x8888888888888888888888888888888888888888',
    ];
    
    let tokenId = 1;
    const now = new Date();
    
    // Generate positions and activities for each market
    for (const market of markets) {
      // Number of bets based on market "heat"
      const numBets = market.marketId === 1 ? 25 : // BTC - hot
                      market.marketId === 4 ? 18 : // Trump - trending
                      market.marketId === 6 ? 15 : // ETH ETF - trending
                      Math.floor(Math.random() * 10) + 5;
      
      for (let i = 0; i < numBets; i++) {
        const wallet = wallets[Math.floor(Math.random() * wallets.length)];
        const outcome = Math.random() > 0.35 ? 1 : 2; // 65% YES bias for bullish markets
        const amount = (Math.floor(Math.random() * 50) + 10) * 1e18; // 10-60 USDT
        
        // Some bets in last 5 minutes for FOMO activity
        const minutesAgo = i < 12 ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 60 * 24);
        const betTime = new Date(now.getTime() - minutesAgo * 60 * 1000);
        
        positions.push({
          tokenId: tokenId,
          marketId: market.marketId,
          owner: wallet,
          outcome: outcome,
          amount: amount.toString(),
          claimed: false,
          status: 'open',
          createdAt: betTime,
          updatedAt: betTime,
          txHash: '0x' + tokenId.toString(16).padStart(64, '0'),
          blockNumber: market.blockNumber + tokenId,
        });
        
        activities.push({
          type: 'BET',
          user: wallet,
          marketId: market.marketId,
          tokenId: tokenId,
          amount: amount.toString(),
          outcome: outcome,
          data: { question: market.question },
          txHash: '0x' + tokenId.toString(16).padStart(64, '0'),
          blockNumber: market.blockNumber + tokenId,
          createdAt: betTime,
        });
        
        tokenId++;
      }
    }
    
    await db.collection('positions_mirror').insertMany(positions);
    await db.collection('activities').insertMany(activities);
    
    console.log(`Created ${positions.length} positions`);
    console.log(`Created ${activities.length} activities`);
    
    // Create indexer state
    await db.collection('indexer_state').insertOne({
      key: 'main',
      lastSyncedBlock: 97400600,
      updatedAt: new Date(),
    });
    
    console.log('Created indexer state');
    
    // Verify counts
    const marketCount = await db.collection('markets_mirror').countDocuments();
    const posCount = await db.collection('positions_mirror').countDocuments();
    const actCount = await db.collection('activities').countDocuments();
    
    console.log('\n=== SEED COMPLETE ===');
    console.log(`Markets: ${marketCount}`);
    console.log(`Positions: ${posCount}`);
    console.log(`Activities: ${actCount}`);
    console.log('\nFOMO Engine should now show:');
    console.log('- Activity badges (X bets last 5 min)');
    console.log('- Sentiment bars (YES/NO percentages)');
    console.log('- Pressure indicators (High/Medium/Low)');
    console.log('- Trending flags on hot markets');
    
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await client.close();
  }
}

seedFomoData();
