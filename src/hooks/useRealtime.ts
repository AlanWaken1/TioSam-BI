'use client';

import { useEffect, useState } from 'react';
import { setupRealtimeSubscription } from '@/lib/supabase/client';

export function useRealtime<T>(
  tableName: string,
  initialData: T[],
  fetchData: () => Promise<T[]>
) {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Configurar suscripción realtime
    const unsubscribe = setupRealtimeSubscription(tableName, async (payload) => {
      console.log(`Change detected in ${tableName}:`, payload);
      
      // Refetch data cuando hay cambios
      setIsLoading(true);
      try {
        const newData = await fetchData();
        setData(newData);
      } catch (error) {
        console.error('Error fetching updated data:', error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [tableName, fetchData]);

  return { data, setData, isLoading };
}
