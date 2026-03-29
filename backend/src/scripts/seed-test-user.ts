import { MongoClient, ObjectId } from 'mongodb';

async function seedTestUser() {
  const client = new MongoClient('mongodb://localhost:27017/arena');
  await client.connect();
  const db = client.db();
  
  const testWallet = '0xdemouser123456789abcdef1234567890abcdef';
  
  // Create user
  await db.collection('arenausers').updateOne(
    { wallet: testWallet },
    {
      $set: {
        wallet: testWallet,
        username: 'DemoTrader',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demotrader',
        bio: 'Professional prediction market analyst',
        tier: 'gold',
        badges: ['early_adopter', 'top_trader'],
        isVerified: true,
        xp: 2500,
        leaguePoints: 1850,
        streakCurrent: 3,
        streakBest: 7,
      },
      $setOnInsert: { createdAt: new Date('2025-12-01') }
    },
    { upsert: true }
  );
  
  // Get market IDs
  const markets = await db.collection('predictions').find({}).limit(5).toArray();
  
  // Create positions
  await db.collection('positions').deleteMany({ wallet: testWallet });
  
  const positions = [
    { status: 'open', stake: 100, odds: 1.8, payout: 0 },
    { status: 'open', stake: 250, odds: 2.2, payout: 0 },
    { status: 'won', stake: 150, odds: 1.5, payout: 225 },
    { status: 'claimed', stake: 200, odds: 2.0, payout: 400 },
    { status: 'lost', stake: 75, odds: 2.5, payout: 0 },
    { status: 'lost', stake: 50, odds: 3.0, payout: 0 },
  ];
  
  for (let i = 0; i < positions.length; i++) {
    const market = markets[i % markets.length];
    const pos = positions[i];
    await db.collection('positions').insertOne({
      wallet: testWallet,
      predictionId: market._id.toString(),
      marketId: market._id.toString(),
      outcomeLabel: i % 2 === 0 ? 'Yes' : 'No',
      stake: pos.stake,
      odds: pos.odds,
      potentialReturn: pos.stake * pos.odds,
      status: pos.status,
      payout: pos.payout,
      profit: pos.payout > 0 ? pos.payout - pos.stake : 0,
      createdAt: new Date(Date.now() - (i + 1) * 86400000 * 2),
      resolvedAt: pos.status !== 'open' ? new Date(Date.now() - i * 86400000) : null,
      claimedAt: pos.status === 'claimed' ? new Date() : null,
    });
  }
  
  // Create activity
  await db.collection('activities').deleteMany({ user: testWallet });
  
  const activities = [
    { eventName: 'bet_placed', amount: 100 },
    { eventName: 'won', amount: 225 },
    { eventName: 'bet_placed', amount: 250 },
    { eventName: 'lost', amount: 75 },
    { eventName: 'claimed', amount: 400 },
  ];
  
  for (let i = 0; i < activities.length; i++) {
    const market = markets[i % markets.length];
    await db.collection('activities').insertOne({
      eventName: activities[i].eventName,
      user: testWallet,
      username: 'DemoTrader',
      marketId: market._id.toString(),
      marketTitle: market.question,
      amount: activities[i].amount,
      outcomeId: i % 2 === 0 ? '1' : '2',
      timestamp: new Date(Date.now() - i * 3600000),
      createdAt: new Date(Date.now() - i * 3600000),
    });
  }
  
  console.log('Test user seeded:', testWallet);
  await client.close();
}

seedTestUser().catch(console.error);
