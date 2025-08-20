import { useState, useEffect } from 'react';

export function usePendingProducts() {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPendingCount = async () => {
    try {
      const response = await fetch('/api/inventory/products?approvalStatus=pending&limit=1000');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPendingCount(data.products?.length || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching pending products count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCount();
    
    // Refetch every 30 seconds to keep count updated
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    pendingCount,
    loading,
    refresh: fetchPendingCount
  };
}