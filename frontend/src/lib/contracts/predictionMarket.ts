import { BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";

// --------------------------------------------------
// StablePredictionMarketNFT client library
// Ethers v6, functional style
// --------------------------------------------------

export const MARKET_ABI = [
  "function stableToken() view returns (address)",
  "function stableTokenDecimals() view returns (uint8)",
  "function feeRecipient() view returns (address)",
  "function claimFeeBps() view returns (uint256)",
  "function minBet() view returns (uint256)",
  "function minInitialStake() view returns (uint256)",
  "function userMarketRequestsEnabled() view returns (bool)",
  "function nextMarketId() view returns (uint256)",
  "function nextTokenId() view returns (uint256)",
  "function nextRequestId() view returns (uint256)",
  "function owner() view returns (address)",
  "function resolvers(address) view returns (bool)",
  "function admins(address) view returns (bool)",
  "function markets(uint256) view returns (uint256 id, uint8 status, uint256 endTime, string question, uint8 outcomeCount, uint8 resolvedOutcome, uint256 totalStaked, uint256 totalWinningStaked, bool exists)",
  "function positions(uint256) view returns (uint256 marketId, uint8 outcome, uint256 amount, bool claimed)",
  "function outcomePool(uint256, uint8) view returns (uint256)",
  "function marketRequests(uint256) view returns (uint256 id, address creator, uint8 status, uint256 endTime, string question, uint8 outcomeCount, uint8 firstOutcome, uint256 firstStakeAmount)",
  "function getMarket(uint256 marketId) view returns ((uint256 id, uint8 status, uint256 endTime, string question, uint8 outcomeCount, uint8 resolvedOutcome, uint256 totalStaked, uint256 totalWinningStaked, bool exists))",
  "function getPosition(uint256 tokenId) view returns ((uint256 marketId, uint8 outcome, uint256 amount, bool claimed))",
  "function getMarketRequest(uint256 requestId) view returns ((uint256 id, address creator, uint8 status, uint256 endTime, string question, uint8 outcomeCount, uint8 firstOutcome, uint256 firstStakeAmount))",
  "function getMarketOutcomeLabel(uint256 marketId, uint8 outcome) view returns (string)",
  "function getRequestOutcomeLabel(uint256 requestId, uint8 outcome) view returns (string)",
  "function tokenInfo(uint256 tokenId) view returns (address tokenAddress, uint8 decimals_, uint256 marketId, uint8 outcome, uint256 amount, bool claimed, address currentOwner)",
  "function previewClaim(uint256 tokenId) view returns (bool claimable, uint256 grossAmount, uint256 feeAmount, uint256 netAmount)",
  "function previewRefund(uint256 tokenId) view returns (bool refundable, uint256 amount)",
  "function placeBet(uint256 marketId, uint8 outcome, uint256 amount) returns (uint256 tokenId)",
  "function claim(uint256 tokenId)",
  "function refund(uint256 tokenId)",
  "function requestMarket(uint256 endTime, string question, string[] labels, uint8 firstOutcome, uint256 firstStakeAmount) returns (uint256 requestId)",
  "function cancelOwnRequest(uint256 requestId)",
  "function createMarket(uint256 endTime, string question, string[] labels) returns (uint256 marketId)",
  "function lockMarket(uint256 marketId)",
  "function disputeMarket(uint256 marketId)",
  "function resolveMarket(uint256 marketId, uint8 outcome)",
  "function cancelMarket(uint256 marketId)",
  "function approveMarketRequest(uint256 requestId) returns (uint256 marketId, uint256 tokenId)",
  "function rejectMarketRequest(uint256 requestId)",
  "function changeOwner(address newOwner)",
  "function setResolver(address resolver, bool allowed)",
  "function setAdmin(address admin, bool allowed)",
  "function setFeeRecipient(address newRecipient)",
  "function setClaimFeeBps(uint256 newFeeBps)",
  "function setMinBet(uint256 newMinBet)",
  "function setMinInitialStake(uint256 newValue)",
  "function setUserMarketRequestsEnabled(bool enabled)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
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
] as const;

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
] as const;

export const MarketStatus = {
  OPEN: 0,
  LOCKED: 1,
  RESOLVED: 2,
  DISPUTED: 3,
  CANCELLED: 4,
} as const;

export const RequestStatus = {
  NONE: 0,
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
  CANCELLED: 4,
} as const;

export type TxResult =
  | { ok: true; txHash: string; receipt: any }
  | { ok: false; error: string };

export type ReadResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function getErrorMessage(err: any): string {
  return (
    err?.shortMessage ||
    err?.reason ||
    err?.message ||
    "Unknown error"
  );
}

export async function getProvider() {
  if (!(window as any).ethereum) {
    throw new Error("Wallet not found. Install MetaMask or another EVM wallet.");
  }
  return new BrowserProvider((window as any).ethereum);
}

export async function requestWallet() {
  const provider = await getProvider();
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { provider, signer, address };
}

export async function getMarketContract(marketAddress: string, withSigner = false) {
  const provider = await getProvider();
  if (withSigner) {
    const signer = await provider.getSigner();
    return new Contract(marketAddress, MARKET_ABI, signer);
  }
  return new Contract(marketAddress, MARKET_ABI, provider);
}

export async function getStableTokenContract(marketAddress: string, withSigner = false) {
  const market = await getMarketContract(marketAddress, withSigner);
  const tokenAddress = await market.stableToken();
  if (withSigner) {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    return new Contract(tokenAddress, ERC20_ABI, signer);
  }
  const provider = await getProvider();
  return new Contract(tokenAddress, ERC20_ABI, provider);
}

export async function getStableTokenMeta(marketAddress: string) {
  try {
    const token = await getStableTokenContract(marketAddress, false);
    const [name, symbol, decimals] = await Promise.all([
      token.name(),
      token.symbol(),
      token.decimals(),
    ]);
    return { ok: true, data: { name, symbol, decimals: Number(decimals) } };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export function toUnits(amountStr: string, decimals: number) {
  return parseUnits(amountStr, decimals);
}

export function fromUnits(amount: bigint, decimals: number) {
  return formatUnits(amount, decimals);
}

export async function approveStableToken(
  marketAddress: string,
  amountStr: string,
  decimals?: number
): Promise<TxResult> {
  try {
    const token = await getStableTokenContract(marketAddress, true);
    const tokenDecimals = decimals ?? Number(await token.decimals());
    const tx = await token.approve(marketAddress, parseUnits(amountStr, tokenDecimals));
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function getStableAllowance(
  marketAddress: string,
  ownerAddress: string
): Promise<ReadResult<{ allowance: bigint; allowanceFormatted: string; decimals: number }>> {
  try {
    const token = await getStableTokenContract(marketAddress, false);
    const decimals = Number(await token.decimals());
    const allowance = await token.allowance(ownerAddress, marketAddress);
    return {
      ok: true,
      data: {
        allowance,
        allowanceFormatted: formatUnits(allowance, decimals),
        decimals,
      },
    };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function getStableBalance(
  marketAddress: string,
  ownerAddress: string
): Promise<ReadResult<{ balance: bigint; balanceFormatted: string; decimals: number }>> {
  try {
    const token = await getStableTokenContract(marketAddress, false);
    const decimals = Number(await token.decimals());
    const balance = await token.balanceOf(ownerAddress);
    return {
      ok: true,
      data: {
        balance,
        balanceFormatted: formatUnits(balance, decimals),
        decimals,
      },
    };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function getConfig(marketAddress: string) {
  try {
    const contract = await getMarketContract(marketAddress, false);
    const [
      stableToken,
      stableTokenDecimals,
      feeRecipient,
      claimFeeBps,
      minBet,
      minInitialStake,
      userMarketRequestsEnabled,
      owner,
    ] = await Promise.all([
      contract.stableToken(),
      contract.stableTokenDecimals(),
      contract.feeRecipient(),
      contract.claimFeeBps(),
      contract.minBet(),
      contract.minInitialStake(),
      contract.userMarketRequestsEnabled(),
      contract.owner(),
    ]);

    return {
      ok: true,
      data: {
        stableToken,
        stableTokenDecimals: Number(stableTokenDecimals),
        feeRecipient,
        claimFeeBps: Number(claimFeeBps),
        minBet,
        minBetFormatted: formatUnits(minBet, Number(stableTokenDecimals)),
        minInitialStake,
        minInitialStakeFormatted: formatUnits(minInitialStake, Number(stableTokenDecimals)),
        userMarketRequestsEnabled,
        owner,
      },
    };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function getMarket(marketAddress: string, marketId: number | bigint) {
  try {
    const contract = await getMarketContract(marketAddress, false);
    const market = await contract.getMarket(marketId);

    return {
      ok: true,
      data: {
        id: market.id,
        status: Number(market.status),
        endTime: Number(market.endTime),
        question: market.question,
        outcomeCount: Number(market.outcomeCount),
        resolvedOutcome: Number(market.resolvedOutcome),
        totalStaked: market.totalStaked,
        totalWinningStaked: market.totalWinningStaked,
        exists: market.exists,
      },
    };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function getMarketWithLabels(marketAddress: string, marketId: number | bigint) {
  try {
    const marketRes = await getMarket(marketAddress, marketId);
    if (!marketRes.ok) return marketRes;

    const contract = await getMarketContract(marketAddress, false);
    const labels: string[] = [];
    for (let i = 0; i < marketRes.data.outcomeCount; i++) {
      labels.push(await contract.getMarketOutcomeLabel(marketId, i));
    }

    return {
      ok: true,
      data: {
        ...marketRes.data,
        labels,
      },
    };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function getPosition(marketAddress: string, tokenId: number | bigint) {
  try {
    const contract = await getMarketContract(marketAddress, false);
    const info = await contract.tokenInfo(tokenId);

    return {
      ok: true,
      data: {
        tokenAddress: info.tokenAddress,
        decimals: Number(info.decimals_),
        marketId: info.marketId,
        outcome: Number(info.outcome),
        amount: info.amount,
        amountFormatted: formatUnits(info.amount, Number(info.decimals_)),
        claimed: info.claimed,
        currentOwner: info.currentOwner,
      },
    };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function previewClaim(marketAddress: string, tokenId: number | bigint) {
  try {
    const contract = await getMarketContract(marketAddress, false);
    const decimals = Number(await contract.stableTokenDecimals());
    const result = await contract.previewClaim(tokenId);

    return {
      ok: true,
      data: {
        claimable: result.claimable,
        grossAmount: result.grossAmount,
        grossAmountFormatted: formatUnits(result.grossAmount, decimals),
        feeAmount: result.feeAmount,
        feeAmountFormatted: formatUnits(result.feeAmount, decimals),
        netAmount: result.netAmount,
        netAmountFormatted: formatUnits(result.netAmount, decimals),
        decimals,
      },
    };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function previewRefund(marketAddress: string, tokenId: number | bigint) {
  try {
    const contract = await getMarketContract(marketAddress, false);
    const decimals = Number(await contract.stableTokenDecimals());
    const result = await contract.previewRefund(tokenId);

    return {
      ok: true,
      data: {
        refundable: result.refundable,
        amount: result.amount,
        amountFormatted: formatUnits(result.amount, decimals),
        decimals,
      },
    };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function placeBet(
  marketAddress: string,
  marketId: number,
  outcome: number,
  amountStr: string,
  decimals?: number
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tokenDecimals = decimals ?? Number(await contract.stableTokenDecimals());
    const tx = await contract.placeBet(
      marketId,
      outcome,
      parseUnits(amountStr, tokenDecimals)
    );
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function claimPosition(
  marketAddress: string,
  tokenId: number | bigint
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tx = await contract.claim(tokenId);
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function refundPosition(
  marketAddress: string,
  tokenId: number | bigint
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tx = await contract.refund(tokenId);
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function requestMarket(
  marketAddress: string,
  params: {
    endTime: number;
    question: string;
    labels: string[];
    firstOutcome: number;
    firstStakeAmountStr: string;
    decimals?: number;
  }
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tokenDecimals = params.decimals ?? Number(await contract.stableTokenDecimals());

    const tx = await contract.requestMarket(
      params.endTime,
      params.question,
      params.labels,
      params.firstOutcome,
      parseUnits(params.firstStakeAmountStr, tokenDecimals)
    );
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function cancelOwnRequest(
  marketAddress: string,
  requestId: number | bigint
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tx = await contract.cancelOwnRequest(requestId);
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

// --------------------------------------------------
// Admin / resolver functions
// --------------------------------------------------

export async function createMarket(
  marketAddress: string,
  endTime: number,
  question: string,
  labels: string[]
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tx = await contract.createMarket(endTime, question, labels);
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function approveMarketRequest(
  marketAddress: string,
  requestId: number | bigint
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tx = await contract.approveMarketRequest(requestId);
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function rejectMarketRequest(
  marketAddress: string,
  requestId: number | bigint
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tx = await contract.rejectMarketRequest(requestId);
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function lockMarket(
  marketAddress: string,
  marketId: number | bigint
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tx = await contract.lockMarket(marketId);
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function disputeMarket(
  marketAddress: string,
  marketId: number | bigint
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tx = await contract.disputeMarket(marketId);
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function resolveMarket(
  marketAddress: string,
  marketId: number | bigint,
  outcome: number
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tx = await contract.resolveMarket(marketId, outcome);
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function cancelMarket(
  marketAddress: string,
  marketId: number | bigint
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tx = await contract.cancelMarket(marketId);
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function changeOwner(
  marketAddress: string,
  newOwner: string
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tx = await contract.changeOwner(newOwner);
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function setResolver(
  marketAddress: string,
  resolver: string,
  allowed: boolean
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tx = await contract.setResolver(resolver, allowed);
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function setAdmin(
  marketAddress: string,
  admin: string,
  allowed: boolean
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tx = await contract.setAdmin(admin, allowed);
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function setFeeRecipient(
  marketAddress: string,
  newRecipient: string
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tx = await contract.setFeeRecipient(newRecipient);
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function setClaimFeeBps(
  marketAddress: string,
  newFeeBps: number
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tx = await contract.setClaimFeeBps(newFeeBps);
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function setMinBet(
  marketAddress: string,
  amountStr: string,
  decimals?: number
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tokenDecimals = decimals ?? Number(await contract.stableTokenDecimals());
    const tx = await contract.setMinBet(parseUnits(amountStr, tokenDecimals));
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function setMinInitialStake(
  marketAddress: string,
  amountStr: string,
  decimals?: number
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tokenDecimals = decimals ?? Number(await contract.stableTokenDecimals());
    const tx = await contract.setMinInitialStake(parseUnits(amountStr, tokenDecimals));
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function setUserMarketRequestsEnabled(
  marketAddress: string,
  enabled: boolean
): Promise<TxResult> {
  try {
    const contract = await getMarketContract(marketAddress, true);
    const tx = await contract.setUserMarketRequestsEnabled(enabled);
    const receipt = await tx.wait();
    return { ok: true, txHash: receipt.hash, receipt };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

// --------------------------------------------------
// Role check helpers
// --------------------------------------------------

export async function isAdmin(marketAddress: string, address: string): Promise<ReadResult<boolean>> {
  try {
    const contract = await getMarketContract(marketAddress, false);
    const result = await contract.admins(address);
    return { ok: true, data: result };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function isResolver(marketAddress: string, address: string): Promise<ReadResult<boolean>> {
  try {
    const contract = await getMarketContract(marketAddress, false);
    const result = await contract.resolvers(address);
    return { ok: true, data: result };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function isOwner(marketAddress: string, address: string): Promise<ReadResult<boolean>> {
  try {
    const contract = await getMarketContract(marketAddress, false);
    const owner = await contract.owner();
    return { ok: true, data: owner.toLowerCase() === address.toLowerCase() };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

// --------------------------------------------------
// Optional helpers to parse event data from receipts
// --------------------------------------------------

export async function extractCreatedMarketId(marketAddress: string, receipt: any) {
  try {
    const contract = await getMarketContract(marketAddress, false);
    for (const log of receipt.logs ?? []) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed?.name === "MarketCreated") {
          return { ok: true, data: Number(parsed.args.marketId) };
        }
      } catch (_) {}
    }
    return { ok: false, error: "MarketCreated event not found" };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function extractPlacedTokenId(marketAddress: string, receipt: any) {
  try {
    const contract = await getMarketContract(marketAddress, false);
    for (const log of receipt.logs ?? []) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed?.name === "BetPlaced") {
          return { ok: true, data: Number(parsed.args.tokenId) };
        }
      } catch (_) {}
    }
    return { ok: false, error: "BetPlaced event not found" };
  } catch (err: any) {
    return { ok: false, error: getErrorMessage(err) };
  }
}
