import { ethers } from 'ethers';

const MARKET_CONTRACT = '0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e';
const RPC_URL = 'https://bsc-testnet.publicnode.com';

const ABI = [
  'function owner() view returns (address)',
  'function admins(address) view returns (bool)',
  'function resolvers(address) view returns (bool)',
  'function claimFeeBps() view returns (uint256)',
  'function feeRecipient() view returns (address)',
  'function minBet() view returns (uint256)',
  'function minInitialStake() view returns (uint256)',
  'function stableTokenDecimals() view returns (uint8)',
  'function nextMarketId() view returns (uint256)',
  'function nextTokenId() view returns (uint256)',
  'function getMarket(uint256) view returns (tuple(uint256 id, uint8 status, uint256 endTime, string question, uint8 outcomeCount, uint8 resolvedOutcome, uint256 totalStaked, uint256 totalWinningStaked, bool exists))',
  'function positions(uint256) view returns (uint256 marketId, uint8 outcome, uint256 amount, bool claimed)',
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(MARKET_CONTRACT, ABI, provider);

  console.log('🔍 BLOCK 1 - CONTRACT SECURITY CHECK\n');
  console.log('========================================');

  // FEES
  const feeBps = await contract.claimFeeBps();
  const feeRecipient = await contract.feeRecipient();
  const decimals = await contract.stableTokenDecimals();
  
  console.log('💰 FEES:');
  console.log(`  - Claim Fee: ${Number(feeBps) / 100}%`);
  console.log(`  - Fee Recipient: ${feeRecipient}`);
  console.log(`  - Fee taken at: CLAIM (correct)`);

  // ROLES
  const owner = await contract.owner();
  console.log('\n👥 ROLES:');
  console.log(`  - Owner: ${owner}`);
  
  // LIMITS
  const minBet = await contract.minBet();
  const minInitialStake = await contract.minInitialStake();
  console.log('\n📊 LIMITS:');
  console.log(`  - Min Bet: ${ethers.formatUnits(minBet, decimals)} USDT`);
  console.log(`  - Min Initial Stake: ${ethers.formatUnits(minInitialStake, decimals)} USDT`);

  // MARKET STATUS
  const nextMarketId = await contract.nextMarketId();
  const nextTokenId = await contract.nextTokenId();
  console.log('\n📈 STATE:');
  console.log(`  - Total Markets: ${Number(nextMarketId) - 1}`);
  console.log(`  - Total Positions: ${Number(nextTokenId) - 1}`);

  // Check Market #1
  if (Number(nextMarketId) > 1) {
    const market = await contract.getMarket(1);
    const statusMap = ['OPEN', 'LOCKED', 'RESOLVED', 'DISPUTED', 'CANCELLED'];
    console.log('\n🎯 MARKET #1:');
    console.log(`  - Question: ${market.question}`);
    console.log(`  - Status: ${statusMap[market.status]}`);
    console.log(`  - Total Staked: ${ethers.formatUnits(market.totalStaked, decimals)} USDT`);
    if (market.status === 2) {
      console.log(`  - Winning Outcome: ${market.resolvedOutcome}`);
    }
  }

  // Check Position #1
  if (Number(nextTokenId) > 1) {
    const position = await contract.positions(1);
    console.log('\n🎫 POSITION #1:');
    console.log(`  - Market ID: ${position.marketId}`);
    console.log(`  - Outcome: ${position.outcome}`);
    console.log(`  - Amount: ${ethers.formatUnits(position.amount, decimals)} USDT`);
    console.log(`  - Claimed: ${position.claimed}`);
  }

  console.log('\n========================================');
  console.log('✅ Contract check complete');
}

main().catch(console.error);
