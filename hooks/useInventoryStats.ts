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
        
        // Fetch multiple endpoints in parallel
        const [summaryResponse, suppliersResponse] = await Promise.all([
          fetch('/api/inventory/reports?type=summary'),
          fetch('/api/inventory/suppliers')
        ])

        if (!summaryResponse.ok) {
          throw new Error('Failed to fetch inventory summary')
        }

        if (!suppliersResponse.ok) {
          throw new Error('Failed to fetch suppliers data')
        }

        const summaryData = await summaryResponse.json()
        const suppliersData = await suppliersResponse.json()

        setStats({
          totalProducts: summaryData.summary?.totalProducts || 0,
          lowStockItems: summaryData.summary?.lowStockItems || 0,
          totalValue: summaryData.summary?.totalValue || 0,
          suppliersCount: suppliersData.pagination?.total || 0,
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