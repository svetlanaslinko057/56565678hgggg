'use client';

import { PredictionDetails } from '@/components/arena/prediction-details';
import { useParams } from 'next/navigation';

export default function MarketPage() {
  const params = useParams();
  const marketId = params.marketId as string;

  if (!marketId) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#738094' }}>
        Market ID not found
      </div>
    );
  }

  return <PredictionDetails predictionId={marketId} />;
}
