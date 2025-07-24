import { useState, useEffect } from 'react'

interface InventoryStats {
  totalProducts: number
  lowStockItems: number
  totalValue: number
  suppliersCount: number
  loading: boolean
  error: string | null
}

export function useInventoryStats(): InventoryStats {
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    lowStockItems: 0,
    totalValue: 0,
    suppliersCount: 0,
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }))
        
        // Fetch inventory data from new Supabase API
        const inventoryResponse = await fetch('/api/inventory')

        if (!inventoryResponse.ok) {
          throw new Error('Failed to fetch inventory data')
        }

        const inventoryData = await inventoryResponse.json()

        if (!inventoryData.success) {
          throw new Error(inventoryData.error || 'Failed to fetch inventory data')
        }

        const { stats: inventoryStats, lowStockProducts } = inventoryData.data

        // Fetch suppliers count
        const suppliersResponse = await fetch('/api/inventory/suppliers')
        let suppliersCount = 0
        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json()
          suppliersCount = suppliersData.suppliers?.length || 0
        }

        setStats({
          totalProducts: inventoryStats.totalProducts || 0,
          lowStockItems: inventoryStats.lowStockProducts || 0,
          totalValue: inventoryStats.totalValue || 0,
          suppliersCount,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Error fetching inventory stats:', error)
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }))
      }
    }

    fetchStats()
  }, [])

  return stats
}