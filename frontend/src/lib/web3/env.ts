/**
 * Web3 environment configuration
 * 
 * All addresses and settings come from environment variables.
 * These must match the deployed contracts on the target chain.
 */

// Default to BSC Testnet
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "97");

export const env = {
  // Chain configuration
  CHAIN_ID,
  CHAIN_NAME: CHAIN_ID === 56 ? "BSC Mainnet" : "BSC Testnet",
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || "https://bsc-testnet.publicnode.com",
  
  // Contract addresses (from deployment)
  ARENA_CORE_ADDRESS: (process.env.NEXT_PUBLIC_ARENA_CORE_ADDRESS || "") as `0x${string}`,
  POSITION_NFT_ADDRESS: (process.env.NEXT_PUBLIC_POSITION_NFT_ADDRESS || "") as `0x${string}`,
  COLLATERAL_ADDRESS: (process.env.NEXT_PUBLIC_COLLATERAL_ADDRESS || "") as `0x${string}`,
  COLLATERAL_TOKEN: (process.env.NEXT_PUBLIC_COLLATERAL_ADDRESS || process.env.NEXT_PUBLIC_STABLE_TOKEN || "") as `0x${string}`,
  
  // Collateral token settings
  COLLATERAL_SYMBOL: process.env.NEXT_PUBLIC_COLLATERAL_SYMBOL || "USDT",
  COLLATERAL_DECIMALS: parseInt(process.env.NEXT_PUBLIC_COLLATERAL_DECIMALS || "18"),
  
  // API URL for backend
  API_URL: process.env.NEXT_PUBLIC_API_URL || "",
  
  // Feature flags
  ONCHAIN_ENABLED: process.env.NEXT_PUBLIC_ONCHAIN_ENABLED === "true",
};

// Validation
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!env.ARENA_CORE_ADDRESS) {
    errors.push("NEXT_PUBLIC_ARENA_CORE_ADDRESS not set");
  }
  if (!env.POSITION_NFT_ADDRESS) {
    errors.push("NEXT_PUBLIC_POSITION_NFT_ADDRESS not set");
  }
  if (!env.COLLATERAL_ADDRESS) {
    errors.push("NEXT_PUBLIC_COLLATERAL_ADDRESS not set");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
