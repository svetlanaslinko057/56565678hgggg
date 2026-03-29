'use client';

import React from 'react';
import { WeeklyPressure } from '@/components/growth/WeeklyPressure';
import { RivalPressure } from '@/components/growth/RivalPressure';
import { WinCardEnhanced } from '@/components/growth/WinCardEnhanced';

export default function GrowthTestPage() {
  const testWallet = "0x1234567890123456789012345678901234567890";
  
  const handleRematch = () => {
    console.log("Rematch clicked!");
  };
  
  const handleShare = () => {
    console.log("Share clicked!");
  };
  
  const handleCopy = () => {
    console.log("Copy clicked!");
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      background: '#0a0a0a',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: 'white', marginBottom: '30px' }}>Growth Loop Components Test</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: 'white', marginBottom: '15px' }}>Weekly Pressure Component</h2>
        <WeeklyPressure 
          wallet={testWallet}
          apiUrl={process.env.NEXT_PUBLIC_API_URL}
        />
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: 'white', marginBottom: '15px' }}>Rival Pressure Component</h2>
        <RivalPressure
          rivalName="CryptoKing"
          yourWins={2}
          rivalWins={5}
          streak={3}
          streakHolder="rival"
          onRematch={handleRematch}
        />
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: 'white', marginBottom: '15px' }}>Win Card Enhanced Component</h2>
        <WinCardEnhanced
          profit={150.75}
          roi={201.5}
          badges={['2x_winner', '3x_winner', 'centurion', 'hot_streak']}
          achievements={['3 win streak!', 'Beat rival CryptoKing']}
          streak={3}
          rivalBeaten="CryptoKing"
          leaderboardPosition={7}
          shareMessage="🎉 +$151 on FOMO Arena!

🔥 3 win streak!
🔥 Beat rival CryptoKing

💰 Predict. Bet. Win.
👉 Join the arena:"
          deepLink="https://t.me/FOMOArenaBot?startapp=ref_12345678"
          onShare={handleShare}
          onCopy={handleCopy}
        />
      </div>
    </div>
  );
}