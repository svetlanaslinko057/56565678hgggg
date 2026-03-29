import { ethers, Contract, Provider, EventLog } from 'ethers';
import { config } from '../config/env';
import { MARKET_ABI } from './abi';

let provider: Provider | null = null;
let contract: Contract | null = null;

// Rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export function getProvider(): Provider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(config.rpcUrl);
  }
  return provider;
}

export function getContract(): Contract {
  if (!contract) {
    contract = new ethers.Contract(config.contractAddress, MARKET_ABI, getProvider());
  }
  return contract;
}

export async function getCurrentBlock(): Promise<number> {
  return await getProvider().getBlockNumber();
}

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.code === 'BAD_DATA' || error?.message?.includes('rate limit')) {
        if (i < retries - 1) {
          console.log(`  ⏳ Rate limited, waiting ${RETRY_DELAY * (i + 1)}ms...`);
          await delay(RETRY_DELAY * (i + 1));
          continue;
        }
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function getContractEvents(
  fromBlock: number,
  toBlock: number | 'latest'
): Promise<EventLog[]> {
  const contract = getContract();
  const events: EventLog[] = [];
  
  // Add delay to avoid rate limiting
  await delay(500);
  
  const logs = await retryWithBackoff(() => 
    getProvider().getLogs({
      address: config.contractAddress,
      fromBlock,
      toBlock,
    })
  );
  
  for (const log of logs) {
    try {
      const parsed = contract.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });
      
      if (parsed) {
        events.push({
          ...log,
          eventName: parsed.name,
          args: parsed.args,
        } as unknown as EventLog);
      }
    } catch (e) {
      // Skip unparseable logs
    }
  }
  
  return events;
}

export async function getMarketData(marketId: number) {
  const contract = getContract();
  try {
    const market = await contract.getMarket(marketId);
    const labels: string[] = [];
    
    for (let i = 0; i < Number(market.outcomeCount); i++) {
      try {
        const label = await contract.getMarketOutcomeLabel(marketId, i);
        labels.push(label);
      } catch {
        labels.push(`Outcome ${i}`);
      }
    }
    
    return {
      id: Number(market.id),
      status: Number(market.status),
      endTime: Number(market.endTime),
      question: market.question,
      outcomeCount: Number(market.outcomeCount),
      resolvedOutcome: Number(market.resolvedOutcome),
      totalStaked: market.totalStaked.toString(),
      totalWinningStaked: market.totalWinningStaked.toString(),
      exists: market.exists,
      labels,
    };
  } catch (error) {
    console.error(`Failed to get market ${marketId}:`, error);
    return null;
  }
}

export async function getPositionData(tokenId: number) {
  const contract = getContract();
  try {
    const position = await contract.getPosition(tokenId);
    const owner = await contract.ownerOf(tokenId);
    
    return {
      tokenId,
      marketId: Number(position.marketId),
      outcome: Number(position.outcome),
      amount: position.amount.toString(),
      claimed: position.claimed,
      owner: owner.toLowerCase(),
    };
  } catch (error) {
    console.error(`Failed to get position ${tokenId}:`, error);
    return null;
  }
}

export async function getNextMarketId(): Promise<number> {
  const contract = getContract();
  return Number(await contract.nextMarketId());
}

export async function getNextTokenId(): Promise<number> {
  const contract = getContract();
  return Number(await contract.nextTokenId());
}
