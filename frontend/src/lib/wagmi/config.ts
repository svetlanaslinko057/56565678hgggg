'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { 
  metaMaskWallet, 
  walletConnectWallet, 
  trustWallet, 
  okxWallet,
  rainbowWallet,
  coinbaseWallet
} from '@rainbow-me/rainbowkit/wallets';
import { bscTestnet } from 'wagmi/chains';

// WalletConnect Project ID - REQUIRED for WalletConnect
// Get your own at https://cloud.walletconnect.com/
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '68f6a896cceb3826ac6defe3e14e83ec';

export const wagmiConfig = getDefaultConfig({
  appName: 'FOMO Arena',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [bscTestnet],
  ssr: true,
  // WalletConnect FIRST - critical for Telegram WebView
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [
        walletConnectWallet,
        metaMaskWallet,
        trustWallet,
        okxWallet,
      ],
    },
    {
      groupName: 'Other',
      wallets: [
        rainbowWallet,
        coinbaseWallet,
      ],
    },
  ],
});

// Target chain ID
export const TARGET_CHAIN_ID = bscTestnet.id; // 97

// Contract addresses
export const ARENA_CORE_ADDRESS = process.env.NEXT_PUBLIC_ARENA_CORE_ADDRESS || '0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e';
export const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS || '0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948';
