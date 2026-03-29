import { MongoClient, ObjectId } from 'mongodb';

async function seedComments() {
  const client = new MongoClient('mongodb://localhost:27017/arena');
  await client.connect();
  const db = client.db();
  const comments = db.collection('comments');
  const predictions = db.collection('predictions');
  
  // Clear existing
  await comments.deleteMany({});
  
  const markets = await predictions.find({}).limit(5).toArray();
  const marketIds = markets.map(m => m._id.toString());
  
  const users = [
    { username: 'Mr.Cat', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cat', wallet: '0x1234567890abcdef1234567890abcdef12345678' },
    { username: 'CryptoWhale', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=whale', wallet: '0xabcdef1234567890abcdef1234567890abcdef12' },
    { username: 'DeFiMaster', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=defi', wallet: '0x9876543210fedcba9876543210fedcba98765432' },
    { username: 'BlockExplorer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=block', wallet: '0xfedcba9876543210fedcba9876543210fedcba98' },
  ];
  
  const commentTexts = [
    "That's actually impressive – especially the GraphQL endpoint generation. I've been using Dune and Flipside for dashboards, but real-time queries are always the bottleneck.",
    "I think this market is undervalued. The probability should be higher based on recent trends.",
    "Been following this closely. The sentiment is definitely shifting bullish.",
    "Great analysis! I'm placing my bet on Yes based on the technical indicators.",
    "This is a high-risk bet but the multiplier makes it worth it.",
    "The market makers are accumulating here. Good sign for long positions.",
  ];
  
  const now = new Date();
  const commentsData: any[] = [];
  
  // Add general comments
  for (let i = 0; i < 3; i++) {
    const user = users[i % users.length];
    const parentComment = {
      marketId: 'general',
      wallet: user.wallet,
      username: user.username,
      avatar: user.avatar,
      content: commentTexts[i],
      parentId: null,
      likes: Math.floor(Math.random() * 15) + 1,
      dislikes: Math.floor(Math.random() * 3),
      likedBy: [],
      dislikedBy: [],
      repliesCount: i === 0 ? 2 : 0,
      isDeleted: false,
      createdAt: new Date(now.getTime() - (i + 1) * 3600000),
      updatedAt: now,
    };
    commentsData.push(parentComment);
  }
  
  // Add comments for each market
  for (const marketId of marketIds) {
    for (let i = 0; i < 4; i++) {
      const user = users[i % users.length];
      const parentComment = {
        marketId,
        wallet: user.wallet,
        username: user.username,
        avatar: user.avatar,
        content: commentTexts[(i + 3) % commentTexts.length],
        parentId: null,
        likes: Math.floor(Math.random() * 20) + 1,
        dislikes: Math.floor(Math.random() * 5),
        likedBy: [],
        dislikedBy: [],
        repliesCount: i === 0 ? 2 : (i === 1 ? 1 : 0),
        isDeleted: false,
        createdAt: new Date(now.getTime() - (i + 1) * 3600000 * 2),
        updatedAt: now,
      };
      commentsData.push(parentComment);
    }
  }
  
  await comments.insertMany(commentsData);
  
  // Add some replies to first comments
  const parentComments = await comments.find({ repliesCount: { $gt: 0 } }).toArray();
  const repliesData: any[] = [];
  
  for (const parent of parentComments) {
    for (let r = 0; r < parent.repliesCount; r++) {
      const user = users[(r + 1) % users.length];
      repliesData.push({
        marketId: parent.marketId,
        wallet: user.wallet,
        username: user.username,
        avatar: user.avatar,
        content: 'Totally agree! ' + commentTexts[(r + 2) % commentTexts.length],
        parentId: parent._id.toString(),
        likes: Math.floor(Math.random() * 8),
        dislikes: 0,
        likedBy: [],
        dislikedBy: [],
        repliesCount: 0,
        isDeleted: false,
        createdAt: new Date(now.getTime() - r * 1800000),
        updatedAt: now,
      });
    }
  }
  
  if (repliesData.length > 0) {
    await comments.insertMany(repliesData);
  }
  
  console.log('Seeded', commentsData.length, 'comments and', repliesData.length, 'replies');
  await client.close();
}

seedComments().catch(console.error);
