// StablePredictionMarketNFT ABI - Events only for indexer
export const MARKET_ABI = [
  // Events
  "event MarketCreated(uint256 indexed marketId, uint256 endTime, string question, uint8 outcomeCount)",
  "event BetPlaced(uint256 indexed marketId, uint256 indexed tokenId, address indexed user, uint8 outcome, uint256 amount)",
  "event PositionMinted(uint256 indexed tokenId, address indexed owner, uint256 indexed marketId, uint8 outcome, uint256 amount)",
  "event MarketLocked(uint256 indexed marketId)",
  "event MarketDisputed(uint256 indexed marketId)",
  "event MarketCancelled(uint256 indexed marketId)",
  "event MarketResolved(uint256 indexed marketId, uint8 indexed resolvedOutcome, uint256 totalWinningStaked)",
  "event PositionClaimed(uint256 indexed tokenId, address indexed owner, uint256 grossAmount, uint256 feeAmount, uint256 netAmount)",
  "event Refund(uint256 indexed tokenId, address indexed owner, uint256 amount)",
  "event MarketRequested(uint256 indexed requestId, address indexed creator, uint256 endTime, string question, uint8 outcomeCount, uint8 firstOutcome, uint256 firstStakeAmount)",
  "event MarketRequestApproved(uint256 indexed requestId, uint256 indexed marketId, uint256 indexed tokenId)",
  "event MarketRequestRejected(uint256 indexed requestId)",
  "event MarketRequestCancelled(uint256 indexed requestId)",
  // ERC721 Transfer
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  // Read functions for backfill
  "function markets(uint256) view returns (uint256 id, uint8 status, uint256 endTime, string question, uint8 outcomeCount, uint8 resolvedOutcome, uint256 totalStaked, uint256 totalWinningStaked, bool exists)",
  "function positions(uint256) view returns (uint256 marketId, uint8 outcome, uint256 amount, bool claimed)",
  "function getMarket(uint256 marketId) view returns ((uint256 id, uint8 status, uint256 endTime, string question, uint8 outcomeCount, uint8 resolvedOutcome, uint256 totalStaked, uint256 totalWinningStaked, bool exists))",
  "function getPosition(uint256 tokenId) view returns ((uint256 marketId, uint8 outcome, uint256 amount, bool claimed))",
  "function getMarketOutcomeLabel(uint256 marketId, uint8 outcome) view returns (string)",
  "function nextMarketId() view returns (uint256)",
  "function nextTokenId() view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
] as const;

export const MarketStatus = {
  OPEN: 0,
  LOCKED: 1,
  RESOLVED: 2,
  DISPUTED: 3,
  CANCELLED: 4,
} as const;

export const MarketStatusNames: Record<number, string> = {
  0: 'active',
  1: 'locked',
  2: 'resolved',
  3: 'disputed',
  4: 'cancelled',
};
