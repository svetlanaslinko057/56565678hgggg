// Market types for Arena with AI Intelligence
export interface MarketAI {
  probability: number;      // AI predicted probability (0-1)
  edge: number;             // AI prob - Market prob
  confidence: number;       // Model confidence (0-1)
  signal: 'buy' | 'sell' | 'wait';
  reasoning?: string;       // Short explanation
  lifecycle?: 'forming' | 'confirmed' | 'invalidated';
}

export interface MarketRisk {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number;            // 0-1
  factors: string[];        // What contributes to risk
}

export interface MarketFomo {
  trending: boolean;
  whale?: {
    amount: number;
    side: 'YES' | 'NO';
    timeAgo: string;
  };
  urgency?: 'high' | 'medium' | 'low';
  hotStreak?: number;
}

export interface MarketCard {
  id: string;
  title: string;
  yesPercent: number;
  noPercent: number;
  yesOdds: number;
  noOdds: number;
  volume: number;
  betsCount: number;
  closesAt: Date;
  fomo: MarketFomo;
  ai: MarketAI;
  risk: MarketRisk;
  category?: string;
  forYou?: boolean;         // Personalization flag
}

export interface BetSheetData {
  marketId: string;
  marketTitle: string;
  side: 'YES' | 'NO';
  odds: number;
  ai?: MarketAI;
  marketPercent?: number;
}

// Compute AI data for market
function computeAI(market: any): MarketAI {
  const yesPool = market.yesPool || 0;
  const noPool = market.noPool || 0;
  const total = yesPool + noPool || 1;
  const marketProb = yesPool / total;
  
  // Simulate AI probability (in production, this comes from TA engine)
  const noise = (Math.random() - 0.5) * 0.2;
  const aiProb = Math.min(0.95, Math.max(0.05, marketProb + noise + 0.05));
  
  const edge = aiProb - marketProb;
  const confidence = 0.6 + Math.random() * 0.3;
  
  const signal: 'buy' | 'sell' | 'wait' = 
    edge > 0.08 ? 'buy' : 
    edge < -0.08 ? 'sell' : 'wait';
  
  const reasonings = [
    'Compression pattern + MTF bullish alignment',
    'Breakout forming with volume confirmation',
    'Range test with momentum divergence',
    'Trend continuation with support retest',
    'High timeframe bias aligned with entry'
  ];
  
  return {
    probability: aiProb,
    edge: edge,
    confidence: confidence,
    signal: signal,
    reasoning: reasonings[Math.floor(Math.random() * reasonings.length)],
    lifecycle: edge > 0.05 ? 'confirmed' : 'forming'
  };
}

// Compute Risk level
function computeRisk(ai: MarketAI, fomo: MarketFomo): MarketRisk {
  let score = 0.5;
  const factors: string[] = [];
  
  // Lifecycle impact
  if (ai.lifecycle === 'forming') {
    score += 0.15;
    factors.push('Pattern still forming');
  } else if (ai.lifecycle === 'confirmed') {
    score -= 0.15;
    factors.push('Pattern confirmed');
  }
  
  // Confidence impact
  if (ai.confidence < 0.5) {
    score += 0.2;
    factors.push('Low model confidence');
  } else if (ai.confidence > 0.7) {
    score -= 0.1;
    factors.push('High model confidence');
  }
  
  // Urgency impact
  if (fomo.urgency === 'high') {
    score += 0.1;
    factors.push('Closing soon');
  }
  
  // Edge impact (higher edge = usually lower risk for that side)
  if (Math.abs(ai.edge) > 0.1) {
    score -= 0.1;
    factors.push('Strong edge detected');
  }
  
  score = Math.max(0, Math.min(1, score));
  
  const level: 'LOW' | 'MEDIUM' | 'HIGH' = 
    score < 0.33 ? 'LOW' : 
    score < 0.66 ? 'MEDIUM' : 'HIGH';
  
  return { level, score, factors };
}

// Transform API response to MarketCard
export function transformMarket(apiMarket: any): MarketCard {
  const yesPool = apiMarket.yesPool || 0;
  const noPool = apiMarket.noPool || 0;
  const total = yesPool + noPool || 1;
  
  const yesPercent = Math.round((yesPool / total) * 100);
  const noPercent = 100 - yesPercent;
  
  const yesOdds = noPool > 0 ? +(total / yesPool).toFixed(2) : 2.0;
  const noOdds = yesPool > 0 ? +(total / noPool).toFixed(2) : 2.0;
  
  const volume = apiMarket.totalVolume || (yesPool + noPool);
  const betsCount = apiMarket.betsCount || Math.floor(volume / 50);
  const closesAt = new Date(apiMarket.endTime || apiMarket.closesAt || Date.now() + 86400000);
  
  const hoursLeft = (closesAt.getTime() - Date.now()) / (1000 * 60 * 60);
  
  const fomo: MarketFomo = {
    trending: volume > 5000 || betsCount > 50,
    urgency: hoursLeft < 2 ? 'high' : hoursLeft < 12 ? 'medium' : 'low',
  };
  
  if (volume > 10000) {
    fomo.whale = {
      amount: Math.floor(volume * 0.15),
      side: yesPercent > 50 ? 'YES' : 'NO',
      timeAgo: '5m ago'
    };
  }
  
  if (betsCount > 30) {
    fomo.hotStreak = Math.floor(betsCount / 10);
  }
  
  const ai = computeAI(apiMarket);
  const risk = computeRisk(ai, fomo);
  
  return {
    id: apiMarket._id || apiMarket.id || String(Math.random()),
    title: apiMarket.question || apiMarket.title || 'Unknown Market',
    yesPercent,
    noPercent,
    yesOdds,
    noOdds,
    volume,
    betsCount,
    closesAt,
    fomo,
    ai,
    risk,
    category: apiMarket.category
  };
}

// Ranking score for smart sorting
export function rankMarket(m: MarketCard): number {
  const edge = Math.abs(m.ai.edge);
  const conf = m.ai.confidence;
  const liquidityFactor = Math.min(1.2, 0.5 + m.volume / 100000);
  const riskBonus = m.risk.level === 'LOW' ? 1.2 : m.risk.level === 'MEDIUM' ? 1.0 : 0.8;
  
  return edge * conf * liquidityFactor * riskBonus;
}

// Mock markets with AI intelligence
export const mockMarkets: MarketCard[] = [
  {
    id: '1',
    title: 'BTC → $100k by end of Q1 2026',
    yesPercent: 68,
    noPercent: 32,
    yesOdds: 1.47,
    noOdds: 3.12,
    volume: 124500,
    betsCount: 287,
    closesAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    fomo: {
      trending: true,
      whale: { amount: 5000, side: 'YES', timeAgo: '3m ago' },
      urgency: 'high',
      hotStreak: 12
    },
    ai: {
      probability: 0.77,
      edge: 0.09,
      confidence: 0.72,
      signal: 'buy',
      reasoning: 'Compression pattern + MTF bullish alignment',
      lifecycle: 'confirmed'
    },
    risk: {
      level: 'LOW',
      score: 0.28,
      factors: ['Pattern confirmed', 'High model confidence', 'Strong edge detected']
    },
    category: 'Crypto',
    forYou: true
  },
  {
    id: '2', 
    title: 'ETH will flip BTC market cap in 2026',
    yesPercent: 23,
    noPercent: 77,
    yesOdds: 4.35,
    noOdds: 1.30,
    volume: 89200,
    betsCount: 156,
    closesAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    fomo: {
      trending: true,
      urgency: 'low',
      hotStreak: 8
    },
    ai: {
      probability: 0.31,
      edge: 0.08,
      confidence: 0.65,
      signal: 'buy',
      reasoning: 'Mean reversion setup with oversold conditions',
      lifecycle: 'forming'
    },
    risk: {
      level: 'MEDIUM',
      score: 0.52,
      factors: ['Pattern still forming', 'Moderate confidence']
    },
    category: 'Crypto'
  },
  {
    id: '3',
    title: 'SOL → $500 before April 2026',
    yesPercent: 45,
    noPercent: 55,
    yesOdds: 2.22,
    noOdds: 1.82,
    volume: 67800,
    betsCount: 198,
    closesAt: new Date(Date.now() + 45 * 60 * 1000),
    fomo: {
      trending: true,
      whale: { amount: 2500, side: 'NO', timeAgo: '1m ago' },
      urgency: 'high',
    },
    ai: {
      probability: 0.58,
      edge: 0.13,
      confidence: 0.78,
      signal: 'buy',
      reasoning: 'Breakout forming with volume confirmation',
      lifecycle: 'confirmed'
    },
    risk: {
      level: 'LOW',
      score: 0.25,
      factors: ['Pattern confirmed', 'Strong edge detected', 'High confidence']
    },
    category: 'Crypto',
    forYou: true
  },
  {
    id: '4',
    title: 'Will Trump win 2028 election?',
    yesPercent: 52,
    noPercent: 48,
    yesOdds: 1.92,
    noOdds: 2.08,
    volume: 234000,
    betsCount: 512,
    closesAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    fomo: {
      trending: true,
      urgency: 'low',
      hotStreak: 24
    },
    ai: {
      probability: 0.55,
      edge: 0.03,
      confidence: 0.45,
      signal: 'wait',
      reasoning: 'No clear edge - wait for setup',
      lifecycle: 'forming'
    },
    risk: {
      level: 'HIGH',
      score: 0.72,
      factors: ['Low model confidence', 'No strong edge', 'High uncertainty']
    },
    category: 'Politics'
  },
  {
    id: '5',
    title: 'DOGE → $1 this year',
    yesPercent: 15,
    noPercent: 85,
    yesOdds: 6.67,
    noOdds: 1.18,
    volume: 45600,
    betsCount: 89,
    closesAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    fomo: {
      trending: false,
      urgency: 'medium',
    },
    ai: {
      probability: 0.12,
      edge: -0.03,
      confidence: 0.82,
      signal: 'sell',
      reasoning: 'Strong NO bias with high confidence',
      lifecycle: 'confirmed'
    },
    risk: {
      level: 'LOW',
      score: 0.22,
      factors: ['Pattern confirmed', 'Very high confidence']
    },
    category: 'Crypto'
  }
];
