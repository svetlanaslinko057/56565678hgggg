/**
 * Contract ABIs for FOMO Arena
 * Only includes the functions and events needed by the frontend
 */

// ArenaCore - Main contract
export const ARENA_CORE_ABI = [
  // Betting
  {
    inputs: [
      {
        components: [
          { name: "user", type: "address" },
          { name: "marketId", type: "uint256" },
          { name: "outcomeId", type: "uint8" },
          { name: "amount", type: "uint256" },
          { name: "shares", type: "uint256" },
          { name: "entryPriceE18", type: "uint256" },
          { name: "deadline", type: "uint64" },
          { name: "nonce", type: "uint256" },
        ],
        name: "q",
        type: "tuple",
      },
      { name: "signature", type: "bytes" },
    ],
    name: "placeBetWithQuote",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  
  // Settlement
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenIds", type: "uint256[]" }],
    name: "batchClaim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "refund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  
  // Views
  {
    inputs: [{ name: "marketId", type: "uint256" }],
    name: "getMarket",
    outputs: [
      {
        components: [
          { name: "externalMarketId", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "closeTime", type: "uint64" },
          { name: "resolvedAt", type: "uint64" },
          { name: "claimEnabledAt", type: "uint64" },
          { name: "outcomeCount", type: "uint8" },
          { name: "winningOutcome", type: "uint8" },
          { name: "status", type: "uint8" },
          { name: "resolutionSource", type: "uint8" },
          { name: "resolutionRef", type: "bytes32" },
          { name: "creatorBond", type: "uint256" },
          { name: "totalDeposited", type: "uint256" },
          { name: "frozen", type: "bool" },
          { name: "exists", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "marketId", type: "uint256" }],
    name: "getMarketTotals",
    outputs: [
      {
        components: [
          { name: "totalDeposited", type: "uint256" },
          { name: "creatorBond", type: "uint256" },
          { name: "outcomeStake", type: "uint256[]" },
          { name: "outcomeShares", type: "uint256[]" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "nonce", type: "uint256" },
    ],
    name: "isNonceUsed",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  
  // Events (for filtering)
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "marketId", type: "uint256" },
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "outcomeId", type: "uint8" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "shares", type: "uint256" },
      { indexed: false, name: "entryPriceE18", type: "uint256" },
    ],
    name: "PositionCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "grossPayout", type: "uint256" },
      { indexed: false, name: "platformFee", type: "uint256" },
      { indexed: false, name: "creatorFee", type: "uint256" },
      { indexed: false, name: "netPayout", type: "uint256" },
    ],
    name: "PositionClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "refundAmount", type: "uint256" },
    ],
    name: "PositionRefunded",
    type: "event",
  },
] as const;

// ERC20 - For token approval
export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Position NFT - For viewing positions
export const POSITION_NFT_ABI = [
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getPosition",
    outputs: [
      {
        components: [
          { name: "marketId", type: "uint256" },
          { name: "outcomeId", type: "uint8" },
          { name: "stake", type: "uint256" },
          { name: "shares", type: "uint256" },
          { name: "entryPriceE18", type: "uint256" },
          { name: "openedAt", type: "uint64" },
          { name: "claimed", type: "bool" },
          { name: "refunded", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
