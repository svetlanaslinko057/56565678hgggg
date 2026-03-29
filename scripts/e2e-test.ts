/**
 * FOMO Arena E2E Test Script
 * Phase 3: Real Contract Interaction
 */

import { ethers } from 'ethers';

// Contract addresses
const MARKET_CONTRACT = '0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e';
const STABLE_TOKEN = '0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948';

// BSC Testnet RPC
const RPC_URL = 'https://bsc-testnet.publicnode.com';

// Seed phrase
const MNEMONIC = 'weekend stairs steel access vicious rose leisure guitar come toilet vehicle face';

// Contract ABIs (from predictionMarket.ts)
const MARKET_ABI = [
  'function owner() view returns (address)',
  'function admins(address) view returns (bool)',
  'function resolvers(address) view returns (bool)',
  'function nextMarketId() view returns (uint256)',
  'function minBet() view returns (uint256)',
  'function claimFeeBps() view returns (uint256)',
  'function stableTokenDecimals() view returns (uint8)',
  'function createMarket(uint256 endTime, string question, string[] labels) returns (uint256 marketId)',
  'function placeBet(uint256 marketId, uint8 outcome, uint256 amount) returns (uint256 tokenId)',
  'function getMarket(uint256 marketId) view returns (tuple(uint256 id, uint8 status, uint256 endTime, string question, uint8 outcomeCount, uint8 resolvedOutcome, uint256 totalStaked, uint256 totalWinningStaked, bool exists))',
  'event MarketCreated(uint256 indexed marketId, uint256 endTime, string question, uint8 outcomeCount)',
  'event BetPlaced(uint256 indexed marketId, uint256 indexed tokenId, address indexed user, uint8 outcome, uint256 amount)',
];

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

async function main() {
  console.log('========================================');
  console.log('🚀 FOMO Arena E2E Test - Phase 3');
  console.log('========================================\n');

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = ethers.HDNodeWallet.fromMnemonic(
    ethers.Mnemonic.fromPhrase(MNEMONIC)
  ).connect(provider);

  console.log('📍 Wallet Address:', wallet.address);

  // Check balances
  const bnbBalance = await provider.getBalance(wallet.address);
  console.log('💰 tBNB Balance:', ethers.formatEther(bnbBalance), 'tBNB');

  // Setup contracts
  const marketContract = new ethers.Contract(MARKET_CONTRACT, MARKET_ABI, wallet);
  const stableToken = new ethers.Contract(STABLE_TOKEN, ERC20_ABI, wallet);

  // Check USDT balance
  const usdtBalance = await stableToken.balanceOf(wallet.address);
  const decimals = await stableToken.decimals();
  const symbol = await stableToken.symbol();
  console.log('💵 USDT Balance:', ethers.formatUnits(usdtBalance, decimals), symbol);

  // Check roles
  const owner = await marketContract.owner();
  const isOwner = owner.toLowerCase() === wallet.address.toLowerCase();
  const isAdmin = await marketContract.admins(wallet.address);
  console.log('👑 Contract Owner:', owner);
  console.log('👑 Is Owner:', isOwner);
  console.log('🔧 Is Admin:', isAdmin);

  // Get config
  const minBet = await marketContract.minBet();
  const feeBps = await marketContract.claimFeeBps();
  const nextMarketId = await marketContract.nextMarketId();
  
  console.log('\n📋 Contract Config:');
  console.log('  - Min Bet:', ethers.formatUnits(minBet, decimals), symbol);
  console.log('  - Fee:', Number(feeBps) / 100, '%');
  console.log('  - Next Market ID:', nextMarketId.toString());

  // Check allowance
  const currentAllowance = await stableToken.allowance(wallet.address, MARKET_CONTRACT);
  console.log('  - Current Allowance:', ethers.formatUnits(currentAllowance, decimals), symbol);

  console.log('\n========================================');
  console.log('✅ Wallet setup complete');
  console.log('========================================\n');

  // Check if we have enough balance
  if (bnbBalance < ethers.parseEther('0.001')) {
    console.log('❌ Not enough tBNB for gas. Need at least 0.001 tBNB');
    console.log('   Get tBNB from faucet: https://www.bnbchain.org/en/testnet-faucet');
    return;
  }

  if (usdtBalance < ethers.parseUnits('10', decimals)) {
    console.log('❌ Not enough USDT. Need at least 10 USDT for min bet');
    return;
  }

  if (!isOwner && !isAdmin) {
    console.log('❌ Wallet is not Owner or Admin. Cannot create markets.');
    return;
  }

  // STEP 1: Create Market
  console.log('📝 STEP 1: Creating Market...');
  
  const endTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
  const question = 'Will BTC reach $100k by end of 2026?';
  const labels = ['YES', 'NO'];

  try {
    const createTx = await marketContract.createMarket(endTime, question, labels);
    console.log('  TX Hash:', createTx.hash);
    
    const receipt = await createTx.wait();
    console.log('  TX Confirmed! Block:', receipt.blockNumber);
    
    // Get market ID from event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = marketContract.interface.parseLog(log);
        return parsed?.name === 'MarketCreated';
      } catch { return false; }
    });

    if (event) {
      const parsed = marketContract.interface.parseLog(event);
      const marketId = parsed?.args[0];
      console.log('  ✅ Market Created! ID:', marketId.toString());
      
      // STEP 2: Approve USDT
      console.log('\n📝 STEP 2: Approving USDT...');
      const approveAmount = ethers.parseUnits('100', decimals);
      const approveTx = await stableToken.approve(MARKET_CONTRACT, approveAmount);
      console.log('  TX Hash:', approveTx.hash);
      await approveTx.wait();
      console.log('  ✅ Approved 100 USDT');

      // STEP 3: Place Bet
      console.log('\n📝 STEP 3: Placing Bet...');
      const betAmount = ethers.parseUnits('10', decimals); // 10 USDT
      const outcome = 0; // YES
      
      const betTx = await marketContract.placeBet(marketId, outcome, betAmount);
      console.log('  TX Hash:', betTx.hash);
      
      const betReceipt = await betTx.wait();
      console.log('  TX Confirmed! Block:', betReceipt.blockNumber);
      
      // Get token ID from event
      const betEvent = betReceipt.logs.find((log: any) => {
        try {
          const parsed = marketContract.interface.parseLog(log);
          return parsed?.name === 'BetPlaced';
        } catch { return false; }
      });

      if (betEvent) {
        const betParsed = marketContract.interface.parseLog(betEvent);
        console.log('  ✅ Bet Placed!');
        console.log('    - Token ID:', betParsed?.args[1].toString());
        console.log('    - Outcome:', betParsed?.args[3] === 0n ? 'YES' : 'NO');
        console.log('    - Amount:', ethers.formatUnits(betParsed?.args[4], decimals), symbol);
      }

      console.log('\n========================================');
      console.log('🎉 E2E TEST COMPLETE!');
      console.log('========================================');
      console.log('\nResults:');
      console.log('  - Market ID:', marketId.toString());
      console.log('  - Create TX:', createTx.hash);
      console.log('  - Bet TX:', betTx.hash);
      console.log('\nNext: Check indexer picked up the events');
      console.log('  curl /api/onchain/markets');
      console.log('  curl /api/onchain/positions?owner=' + wallet.address);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.data) {
      console.error('  Data:', error.data);
    }
  }
}

main().catch(console.error);
