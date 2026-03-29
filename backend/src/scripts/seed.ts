/**
 * Arena Seed Script
 * Creates:
 * - 20 markets (10 yesno, 6 multilevel, 4 conditional)
 * - 10 analysts
 * - 50 positions (15 listed, 5 sold, 30 open)
 * - 30 activity events
 * - 1 active season
 */
import { MongoClient, ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const MONGO_URL = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/arena';

// Sample data
const CATEGORIES = ['crypto', 'nft', 'defi', 'gaming', 'sports', 'politics', 'entertainment'];
const RISK_LEVELS = ['low', 'medium', 'high'];
const HYPE_LEVELS = ['low', 'medium', 'high'];

const ANALYST_NAMES = [
  'CryptoOracle', 'DeFiWhale', 'NFTSniper', 'BlockchainBoss', 'TokenMaster',
  'ChartWizard', 'AlphaHunter', 'DiamondHands', 'MoonShot', 'SatoshiFan'
];

const MARKET_TITLES = {
  crypto: [
    'ETH above $5,000 by Q2 2026',
    'BTC reaches new ATH in 2026',
    'SOL flips ETH market cap',
    'DOGE reaches $1',
    'Total crypto market cap exceeds $5T',
  ],
  nft: [
    'Bored Apes floor price above 50 ETH',
    'CryptoPunks average sale exceeds $500K',
    'NFT market volume exceeds $10B monthly',
  ],
  defi: [
    'Total DeFi TVL exceeds $500B',
    'Uniswap V4 launch by Q2',
    'Aave V4 dominates lending',
  ],
  gaming: [
    'First AAA blockchain game releases',
    'Gaming tokens outperform market',
  ],
  sports: [
    'Lakers win NBA Championship',
    'Chiefs repeat Super Bowl',
  ],
  politics: [
    'SEC approves more crypto ETFs',
    'EU finalizes MiCA implementation',
  ],
  entertainment: [
    'Metaverse concert exceeds 1M attendees',
    'Virtual real estate sale exceeds $10M',
  ],
};

async function seed() {
  console.log('🌱 Starting Arena seed...');
  
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db();
  
  // Collections
  const predictions = db.collection('predictions');
  const arenaUsers = db.collection('arenausers');
  const positions = db.collection('positions');
  const listings = db.collection('listings');
  const activityEvents = db.collection('activityevents');
  const seasons = db.collection('seasons');
  const seasonStats = db.collection('seasonstats');
  
  // Clear existing seed data (optional - comment out to append)
  console.log('🗑️  Clearing existing data...');
  await predictions.deleteMany({});
  await arenaUsers.deleteMany({});
  await positions.deleteMany({});
  await listings.deleteMany({});
  await activityEvents.deleteMany({});
  await seasons.deleteMany({});
  await seasonStats.deleteMany({});
  
  // Create Season
  console.log('📅 Creating season...');
  const now = new Date();
  const seasonEnd = new Date();
  seasonEnd.setMonth(seasonEnd.getMonth() + 3);
  
  const season = {
    seasonId: 'Q1_2026',
    name: 'Q1 2026 Season',
    description: 'First season of Arena - compete for the top of the leaderboard!',
    startDate: new Date('2026-01-01'),
    endDate: seasonEnd,
    status: 'active',
    totalParticipants: 0,
    totalVolume: 0,
    createdAt: now,
    updatedAt: now,
  };
  await seasons.insertOne(season);
  
  // Create Analysts
  console.log('👤 Creating 10 analysts...');
  const analysts: any[] = [];
  for (let i = 0; i < 10; i++) {
    const wallet = `0x${uuidv4().replace(/-/g, '').slice(0, 40)}`;
    const analyst = {
      wallet: wallet.toLowerCase(),
      username: ANALYST_NAMES[i],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${ANALYST_NAMES[i]}`,
      source: 'arena',
      xp: Math.floor(Math.random() * 5000) + 500,
      leaguePoints: Math.floor(Math.random() * 3000) + 100,
      tier: ['bronze', 'silver', 'gold', 'platinum'][Math.floor(Math.random() * 4)],
      badges: ['oracle', 'sniper', 'whale', 'diamond'].slice(0, Math.floor(Math.random() * 3) + 1),
      stats: {
        totalBets: Math.floor(Math.random() * 50) + 10,
        wins: Math.floor(Math.random() * 30) + 5,
        losses: Math.floor(Math.random() * 20) + 2,
        totalStaked: Math.floor(Math.random() * 10000) + 1000,
        totalProfit: Math.floor(Math.random() * 5000) - 1000,
        roi: (Math.random() * 100 - 20).toFixed(2),
        accuracy: (Math.random() * 40 + 50).toFixed(2),
      },
      duelStats: {
        wins: Math.floor(Math.random() * 10),
        losses: Math.floor(Math.random() * 5),
        streak: Math.floor(Math.random() * 3),
        bestStreak: Math.floor(Math.random() * 5) + 1,
      },
      createdAt: now,
      updatedAt: now,
    };
    analysts.push(analyst);
  }
  await arenaUsers.insertMany(analysts);
  
  // Create Markets
  console.log('📊 Creating 20 markets...');
  const markets: any[] = [];
  let marketIndex = 0;
  
  // 10 Yes/No markets
  for (let i = 0; i < 10; i++) {
    const category = CATEGORIES[i % CATEGORIES.length];
    const titles = MARKET_TITLES[category as keyof typeof MARKET_TITLES] || MARKET_TITLES.crypto;
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + Math.floor(Math.random() * 30) + 7);
    
    const market = {
      question: titles[i % titles.length] || `${category} prediction ${i + 1}`,
      description: `Make your prediction on this ${category} market.`,
      type: 'single',
      category,
      riskLevel: RISK_LEVELS[Math.floor(Math.random() * 3)],
      status: 'published',
      closeTime: closeDate,
      outcomes: [
        { id: 'yes', label: 'Yes', probability: 50 + Math.floor(Math.random() * 30), yesMultiplier: 1.5 + Math.random() },
        { id: 'no', label: 'No', probability: 50 - Math.floor(Math.random() * 30), noMultiplier: 2 + Math.random() },
      ],
      totalVolume: Math.floor(Math.random() * 50000) + 5000,
      totalBets: Math.floor(Math.random() * 100) + 20,
      createdBy: analysts[Math.floor(Math.random() * 10)].wallet,
      createdAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    };
    markets.push(market);
    marketIndex++;
  }
  
  // 6 Multi-level markets
  for (let i = 0; i < 6; i++) {
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + Math.floor(Math.random() * 45) + 14);
    
    const market = {
      question: `ETH price at end of Q${(i % 4) + 1} 2026`,
      description: 'Predict the price level of Ethereum.',
      type: 'multilevel',
      category: 'crypto',
      riskLevel: RISK_LEVELS[Math.floor(Math.random() * 3)],
      status: 'published',
      closeTime: closeDate,
      outcomes: [
        { id: '2500', label: '$2,500', probability: 15, yesMultiplier: 6.5 },
        { id: '3000', label: '$3,000', probability: 25, yesMultiplier: 4.0 },
        { id: '3500', label: '$3,500', probability: 35, yesMultiplier: 2.8 },
        { id: '4000', label: '$4,000+', probability: 25, yesMultiplier: 4.0 },
      ],
      totalVolume: Math.floor(Math.random() * 100000) + 10000,
      totalBets: Math.floor(Math.random() * 200) + 50,
      createdBy: analysts[Math.floor(Math.random() * 10)].wallet,
      createdAt: new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    };
    markets.push(market);
    marketIndex++;
  }
  
  // 4 Conditional (If-Then) markets
  for (let i = 0; i < 4; i++) {
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + Math.floor(Math.random() * 60) + 30);
    
    const market = {
      question: `IF BTC > $100K THEN ETH > $${5000 + i * 1000}`,
      description: 'Conditional prediction: If Bitcoin exceeds $100K, will Ethereum exceed the target?',
      type: 'conditional',
      category: 'crypto',
      riskLevel: 'high',
      status: 'published',
      closeTime: closeDate,
      outcomes: [
        { id: 'yes', label: 'Yes', probability: 40, yesMultiplier: 2.5 },
        { id: 'no', label: 'No', probability: 60, noMultiplier: 1.67 },
      ],
      condition: {
        if: { asset: 'BTC', operator: '>', value: 100000 },
        then: { asset: 'ETH', operator: '>', value: 5000 + i * 1000 },
      },
      totalVolume: Math.floor(Math.random() * 30000) + 5000,
      totalBets: Math.floor(Math.random() * 50) + 10,
      createdBy: analysts[Math.floor(Math.random() * 10)].wallet,
      createdAt: new Date(now.getTime() - Math.random() * 21 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    };
    markets.push(market);
  }
  
  const insertedMarkets = await predictions.insertMany(markets);
  const marketIds = Object.values(insertedMarkets.insertedIds).map(id => id.toString());
  
  // Create Positions
  console.log('🎯 Creating 50 positions...');
  const positionsData: any[] = [];
  const listingsData: any[] = [];
  
  for (let i = 0; i < 50; i++) {
    const market = markets[i % 20];
    const marketId = marketIds[i % 20];
    const analyst = analysts[Math.floor(Math.random() * 10)];
    const outcome = market.outcomes[Math.floor(Math.random() * market.outcomes.length)];
    const stake = Math.floor(Math.random() * 500) + 50;
    const odds = outcome.yesMultiplier || 2.0;
    const fee = stake * 0.03;
    
    let status = 'open';
    if (i < 15) status = 'listed';
    else if (i < 20) status = 'sold';
    
    const position = {
      marketId,
      predictionId: marketId,
      outcomeId: outcome.id,
      outcomeLabel: outcome.label,
      stake,
      odds,
      fee,
      potentialReturn: stake * odds,
      wallet: analyst.wallet,
      status,
      createdAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    };
    positionsData.push(position);
  }
  
  const insertedPositions = await positions.insertMany(positionsData);
  const positionIds = Object.values(insertedPositions.insertedIds).map(id => id.toString());
  
  // Create Listings for listed positions
  console.log('🏪 Creating marketplace listings...');
  for (let i = 0; i < 15; i++) {
    const position = positionsData[i];
    const listing = {
      positionId: positionIds[i],
      sellerWallet: position.wallet,
      price: position.potentialReturn * (0.7 + Math.random() * 0.5),
      status: 'active',
      marketId: position.marketId,
      outcomeLabel: position.outcomeLabel,
      stake: position.stake,
      odds: position.odds,
      potentialReturn: position.potentialReturn,
      createdAt: new Date(now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    };
    listingsData.push(listing);
  }
  await listings.insertMany(listingsData);
  
  // Create Activity Events
  console.log('📢 Creating 30 activity events...');
  const activityData: any[] = [];
  const eventTypes = ['bet_placed', 'position_listed', 'position_sold', 'market_created'];
  
  for (let i = 0; i < 30; i++) {
    const analyst = analysts[Math.floor(Math.random() * 10)];
    const marketIndex = Math.floor(Math.random() * 20);
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    const event = {
      eventName: eventType,
      user: analyst.wallet,
      username: analyst.username,
      marketId: marketIds[marketIndex],
      marketTitle: markets[marketIndex].question.slice(0, 50),
      amount: Math.floor(Math.random() * 500) + 50,
      outcomeId: markets[marketIndex].outcomes[0].id,
      timestamp: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000),
    };
    activityData.push(event);
  }
  await activityEvents.insertMany(activityData);
  
  // Create Season Stats for analysts
  console.log('🏆 Creating season stats...');
  const statsData = analysts.map(analyst => ({
    seasonId: 'Q1_2026',
    wallet: analyst.wallet,
    leaguePoints: analyst.leaguePoints,
    roi: parseFloat(analyst.stats.roi),
    accuracy: parseFloat(analyst.stats.accuracy),
    predictions: analyst.stats.totalBets,
    wins: analyst.stats.wins,
    losses: analyst.stats.losses,
    totalStake: analyst.stats.totalStaked,
    totalProfit: analyst.stats.totalProfit,
    duelWins: analyst.duelStats.wins,
    duelLosses: analyst.duelStats.losses,
    duelWinnings: analyst.duelStats.wins * 100,
    rank: 0,
    lastUpdated: now,
    createdAt: now,
    updatedAt: now,
  }));
  await seasonStats.insertMany(statsData);
  
  // Update season participant count
  await seasons.updateOne(
    { seasonId: 'Q1_2026' },
    { $set: { totalParticipants: 10, totalVolume: markets.reduce((sum, m) => sum + m.totalVolume, 0) } }
  );
  
  // Create duels
  console.log('Seed duels...');
  const duels = db.collection('duels');
  await duels.deleteMany({});
  
  const duelStatuses = ['pending', 'active', 'finished', 'canceled'];
  const duelsData = [];
  for (let i = 0; i < 8; i++) {
    const creator = analysts[i % analysts.length];
    const opponent = analysts[(i + 1) % analysts.length];
    const market = markets[i % markets.length];
    const status = duelStatuses[i % duelStatuses.length];
    const stakeAmount = [50, 100, 200, 500][Math.floor(Math.random() * 4)];
    
    const duel: any = {
      creatorWallet: creator.wallet,
      creatorUsername: creator.username,
      creatorAvatar: creator.avatar,
      creatorSide: i % 2 === 0 ? 'yes' : 'no',
      opponentWallet: status !== 'pending' ? opponent.wallet : null,
      opponentUsername: status !== 'pending' ? opponent.username : null,
      opponentAvatar: status !== 'pending' ? opponent.avatar : null,
      opponentSide: i % 2 === 0 ? 'no' : 'yes',
      marketId: market._id.toString(),
      predictionTitle: market.question,
      stakeAmount,
      totalPot: stakeAmount * 2,
      status,
      expiresAt: new Date(now.getTime() + (24 + i * 12) * 3600000),
      createdAt: new Date(now.getTime() - i * 3600000),
      updatedAt: now,
    };
    
    if (status === 'finished') {
      duel.winnerWallet = i % 3 === 0 ? creator.wallet : opponent.wallet;
      duel.resolvedAt = now;
    }
    
    duelsData.push(duel);
  }
  await duels.insertMany(duelsData);

  // Create notifications for demo
  console.log('🔔 Creating sample notifications...');
  const notifications = db.collection('notifications');
  await notifications.deleteMany({});
  
  const notificationTypes = [
    {
      type: 'prediction_won',
      title: 'Prediction Won! 🎉',
      message: 'Your prediction on "BTC > $100K by end of Q1" was correct!',
      payload: { payout: 250, xp: 15, marketId: marketIds[0] },
    },
    {
      type: 'prediction_lost',
      title: 'Prediction Lost',
      message: 'Your prediction on "ETH > $6000 by March" did not resolve in your favor',
      payload: { loss: 75, xp: 1, marketId: marketIds[1] },
    },
    {
      type: 'duel_request',
      title: 'New Duel Challenge! ⚔️',
      message: 'CryptoKing challenged you to a duel on "Fed Rate Decision"',
      payload: { 
        duelId: 'duel_demo_1', 
        stake: 100, 
        challengerSide: 'yes',
        expiresIn: '24h',
      },
    },
    {
      type: 'duel_accepted',
      title: 'Duel Accepted',
      message: 'WhaleWatch accepted your duel challenge!',
      payload: { duelId: 'duel_demo_2', totalPot: 200 },
    },
    {
      type: 'xp_earned',
      title: 'XP Earned! +25',
      message: 'You earned XP for your winning streak!',
      payload: { amount: 25, reason: 'winning prediction' },
    },
    {
      type: 'referral_bonus',
      title: 'Referral Bonus! 🎁',
      message: 'A friend joined via your link. You earned +25 XP and +10 LP!',
      payload: { xpAmount: 25, lpAmount: 10 },
    },
  ];
  
  const notificationsData = [];
  
  // Demo notifications for default user (no wallet connected)
  const demoNotifications = [
    {
      userWallet: '0xDefaultWallet',
      type: 'prediction_won',
      title: 'Prediction Won! 🎉',
      message: 'Your prediction on "BTC > $100K by Q1" was correct!',
      payload: { payout: 250, xp: 15 },
      read: false,
      createdAt: new Date(now.getTime() - 1800000), // 30 min ago
      updatedAt: now,
    },
    {
      userWallet: '0xDefaultWallet',
      type: 'duel_request',
      title: 'New Duel Challenge! ⚔️',
      message: 'CryptoKing challenged you to a duel on "Fed Rate Decision"',
      payload: { duelId: 'duel_demo', stake: 100, challengerSide: 'yes', expiresIn: '24h' },
      read: false,
      createdAt: new Date(now.getTime() - 3600000), // 1 hour ago
      updatedAt: now,
    },
    {
      userWallet: '0xDefaultWallet',
      type: 'xp_earned',
      title: 'XP Earned! +25',
      message: 'You earned XP for your first prediction!',
      payload: { amount: 25, reason: 'first prediction' },
      read: true,
      createdAt: new Date(now.getTime() - 7200000), // 2 hours ago
      updatedAt: now,
    },
  ];
  notificationsData.push(...demoNotifications);
  
  for (let i = 0; i < analysts.length; i++) {
    // Give each analyst 2-3 notifications
    const count = Math.floor(Math.random() * 2) + 2;
    for (let j = 0; j < count; j++) {
      const notifType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      notificationsData.push({
        userWallet: analysts[i].wallet,
        type: notifType.type,
        title: notifType.title,
        message: notifType.message,
        payload: notifType.payload,
        read: j > 0, // First notification is unread
        createdAt: new Date(now.getTime() - j * 3600000), // 1 hour apart
        updatedAt: now,
      });
    }
  }
  await notifications.insertMany(notificationsData);
  
  console.log('');
  console.log('Seed complete!');
  console.log('   - 20 markets (10 yesno, 6 multilevel, 4 conditional)');
  console.log('   - 10 analysts');
  console.log('   - 50 positions (15 listed, 5 sold, 30 open)');
  console.log('   - 15 marketplace listings');
  console.log('   - 30 activity events');
  console.log('   - 1 active season with leaderboard');
  console.log(`   - ${duelsData.length} duels`);
  console.log(`   - ${notificationsData.length} notifications`);
  
  await client.close();
}

seed().catch(console.error);
