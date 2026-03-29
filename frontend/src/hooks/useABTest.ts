'use client';

import { useState, useEffect, useCallback } from 'react';

interface ABVariant {
  variantId: string;
  config: Record<string, any>;
}

interface ABConfig {
  [testId: string]: ABVariant;
}

/**
 * Hook for A/B testing
 * 
 * Usage:
 * const { getVariant, trackEvent, isLoading } = useABTest(userId);
 * const fomoConfig = getVariant('fomo_message_v1');
 * 
 * // Track conversion
 * trackEvent('bet_placed', 50);
 */
export function useABTest(userId: string | undefined) {
  const [variants, setVariants] = useState<ABConfig>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchVariants = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/api/ab/user/${userId}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          setVariants(data.data);
        }
      } catch (e) {
        console.error('Failed to fetch A/B variants:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVariants();
  }, [userId]);

  /**
   * Get variant config for a specific test
   */
  const getVariant = useCallback((testId: string): Record<string, any> | null => {
    return variants[testId]?.config || null;
  }, [variants]);

  /**
   * Get variant ID for a specific test
   */
  const getVariantId = useCallback((testId: string): string | null => {
    return variants[testId]?.variantId || null;
  }, [variants]);

  /**
   * Check if user is in specific variant
   */
  const isInVariant = useCallback((testId: string, variantId: string): boolean => {
    return variants[testId]?.variantId === variantId;
  }, [variants]);

  /**
   * Track conversion event
   */
  const trackEvent = useCallback(async (action: string, value?: number) => {
    if (!userId) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      await fetch(`${apiUrl}/api/ab/track-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, value }),
      });
    } catch (e) {
      console.error('Failed to track A/B event:', e);
    }
  }, [userId]);

  return {
    variants,
    getVariant,
    getVariantId,
    isInVariant,
    trackEvent,
    isLoading,
  };
}

export default useABTest;
