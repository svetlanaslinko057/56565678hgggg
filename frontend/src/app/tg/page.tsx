'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TgPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to arena by default
    router.replace('/tg/arena');
  }, [router]);

  return null;
}
