'use client';

import { PredictionDetails } from '@/components/arena/prediction-details';
import { useParams } from 'next/navigation';

export default function ArenaDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  
  return <PredictionDetails predictionId={id || '1'} />;
}
