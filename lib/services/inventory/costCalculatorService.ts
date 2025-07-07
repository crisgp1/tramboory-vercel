import { IBatch } from '@/types/inventory/index';
import { COST_METHODS } from '@/lib/utils/inventory/constants';

// Interface para resultado de cálculo de costo
export interface CostCalculationResult {
  method: 'FIFO' | 'LIFO' | 'AVERAGE';
  totalCost: number;
  averageCost: number;
  batchesUsed: Array<{
    batchId: string;
    quantity: number;
    costPerUnit: number;
    totalCost: number;
  }>;
  remainingQuantity: number;
}

// Interface para análisis de costos
export interface CostAnalysis {
  currentValue: number;
  projectedValue: number;
  variance: number;
  variancePercentage: number;
  method: string;
  confidence: number;
}

// Interface para proyección de costos
export interface CostProjection {
  period: string;
  projectedCost: number;
  confidence: number;
  factors: string[];
}

export class CostCalculatorService {
  /**
   * Calcula el costo de consumo usando FIFO (First In, First Out)
   */
  static calculateFIFOCost(
    batches: IBatch[],
    quantityToConsume: number
  ): CostCalculationResult {
    const availableBatches = batches
      .filter(batch => batch.status === 'available' && batch.quantity > 0)
      .sort((a, b) => a.receivedDate.getTime() - b.receivedDate.getTime());

    return this.calculateCostByMethod(availableBatches, quantityToConsume, 'FIFO');
  }

  /**
   * Calcula el costo de consumo usando LIFO (Last In, First Out)
   */
  static calculateLIFOCost(
    batches: IBatch[],
    quantityToConsume: number
  ): CostCalculationResult {
    const availableBatches = batches
      .filter(batch => batch.status === 'available' && batch.quantity > 0)
      .sort((a, b) => b.receivedDate.getTime() - a.receivedDate.getTime());

    return this.calculateCostByMethod(availableBatches, quantityToConsume, 'LIFO');
  }

  /**
   * Calcula el costo promedio ponderado
   */
  static calculateAverageCost(batches: IBatch[]): number {
    const availableBatches = batches.filter(
      batch => batch.status === 'available' && batch.quantity > 0
    );

    if (availableBatches.length === 0) return 0;

    const totalValue = availableBatches.reduce(
      (sum, batch) => sum + (batch.quantity * batch.costPerUnit),
      0
    );
    const totalQuantity = availableBatches.reduce(
      (sum, batch) => sum + batch.quantity,
      0
    );

    return totalQuantity > 0 ? totalValue / totalQuantity : 0;
  }

  /**
   * Calcula el costo usando el método especificado
   */
  static calculateCostByMethod(
    sortedBatches: IBatch[],
    quantityToConsume: number,
    method: 'FIFO' | 'LIFO' | 'AVERAGE'
  ): CostCalculationResult {
    if (method === 'AVERAGE') {
      const averageCost = this.calculateAverageCost(sortedBatches);
      return {
        method,
        totalCost: quantityToConsume * averageCost,
        averageCost,
        batchesUsed: [{
          batchId: 'AVERAGE',
          quantity: quantityToConsume,
          costPerUnit: averageCost,
          totalCost: quantityToConsume * averageCost
        }],
        remainingQuantity: 0
      };
    }

    const batchesUsed: Array<{
      batchId: string;
      quantity: number;
      costPerUnit: number;
      totalCost: number;
    }> = [];

    let remainingToConsume = quantityToConsume;
    let totalCost = 0;

    for (const batch of sortedBatches) {
      if (remainingToConsume <= 0) break;

      const quantityFromBatch = Math.min(batch.quantity, remainingToConsume);
      const costFromBatch = quantityFromBatch * batch.costPerUnit;

      batchesUsed.push({
        batchId: batch.batchId,
        quantity: quantityFromBatch,
        costPerUnit: batch.costPerUnit,
        totalCost: costFromBatch
      });

      totalCost += costFromBatch;
      remainingToConsume -= quantityFromBatch;
    }

    const averageCost = quantityToConsume > 0 ? totalCost / (quantityToConsume - remainingToConsume) : 0;

    return {
      method,
      totalCost,
      averageCost,
      batchesUsed,
      remainingQuantity: remainingToConsume
    };
  }

  /**
   * Compara costos entre diferentes métodos
   */
  static compareCostMethods(
    batches: IBatch[],
    quantityToConsume: number
  ): {
    FIFO: CostCalculationResult;
    LIFO: CostCalculationResult;
    AVERAGE: CostCalculationResult;
    recommendation: 'FIFO' | 'LIFO' | 'AVERAGE';
    savings: number;
  } {
    const fifoResult = this.calculateFIFOCost(batches, quantityToConsume);
    const lifoResult = this.calculateLIFOCost(batches, quantityToConsume);
    const averageResult = this.calculateCostByMethod(batches, quantityToConsume, 'AVERAGE');

    const costs = {
      FIFO: fifoResult.totalCost,
      LIFO: lifoResult.totalCost,
      AVERAGE: averageResult.totalCost
    };

    // Encontrar el método más económico
    const minCost = Math.min(...Object.values(costs));
    const maxCost = Math.max(...Object.values(costs));
    const recommendation = Object.keys(costs).find(
      key => costs[key as keyof typeof costs] === minCost
    ) as 'FIFO' | 'LIFO' | 'AVERAGE';

    return {
      FIFO: fifoResult,
      LIFO: lifoResult,
      AVERAGE: averageResult,
      recommendation,
      savings: maxCost - minCost
    };
  }

  /**
   * Calcula el valor del inventario actual
   */
  static calculateInventoryValue(
    batches: IBatch[],
    method: 'FIFO' | 'LIFO' | 'AVERAGE' = 'AVERAGE'
  ): {
    totalValue: number;
    totalQuantity: number;
    averageCostPerUnit: number;
    batchBreakdown: Array<{
      batchId: string;
      quantity: number;
      costPerUnit: number;
      totalValue: number;
      ageInDays: number;
    }>;
  } {
    const availableBatches = batches.filter(
      batch => batch.status === 'available' && batch.quantity > 0
    );

    const batchBreakdown = availableBatches.map(batch => {
      const ageInDays = Math.floor(
        (Date.now() - batch.receivedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        batchId: batch.batchId,
        quantity: batch.quantity,
        costPerUnit: batch.costPerUnit,
        totalValue: batch.quantity * batch.costPerUnit,
        ageInDays
      };
    });

    const totalValue = batchBreakdown.reduce((sum, batch) => sum + batch.totalValue, 0);
    const totalQuantity = batchBreakdown.reduce((sum, batch) => sum + batch.quantity, 0);
    const averageCostPerUnit = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    return {
      totalValue,
      totalQuantity,
      averageCostPerUnit,
      batchBreakdown
    };
  }

  /**
   * Proyecta costos futuros basado en tendencias históricas
   */
  static projectFutureCosts(
    historicalCosts: Array<{ date: Date; cost: number }>,
    periodsAhead: number = 3
  ): CostProjection[] {
    if (historicalCosts.length < 2) {
      return [];
    }

    // Ordenar por fecha
    const sortedCosts = historicalCosts.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Calcular tendencia lineal simple
    const trend = this.calculateLinearTrend(sortedCosts);
    const projections: CostProjection[] = [];

    for (let i = 1; i <= periodsAhead; i++) {
      const projectedCost = trend.slope * (sortedCosts.length + i) + trend.intercept;
      const confidence = Math.max(0.1, 1 - (i * 0.2)); // Confianza decrece con el tiempo

      projections.push({
        period: `Período ${i}`,
        projectedCost: Math.max(0, projectedCost),
        confidence,
        factors: this.identifyTrendFactors(trend)
      });
    }

    return projections;
  }

  /**
   * Analiza la varianza de costos
   */
  static analyzeCostVariance(
    actualCosts: number[],
    projectedCosts: number[]
  ): CostAnalysis {
    if (actualCosts.length === 0 || projectedCosts.length === 0) {
      return {
        currentValue: 0,
        projectedValue: 0,
        variance: 0,
        variancePercentage: 0,
        method: 'INSUFFICIENT_DATA',
        confidence: 0
      };
    }

    const currentValue = actualCosts[actualCosts.length - 1];
    const projectedValue = projectedCosts[projectedCosts.length - 1];
    const variance = projectedValue - currentValue;
    const variancePercentage = currentValue !== 0 ? (variance / currentValue) * 100 : 0;

    // Calcular confianza basada en la consistencia histórica
    const confidence = this.calculateConfidence(actualCosts, projectedCosts);

    return {
      currentValue,
      projectedValue,
      variance,
      variancePercentage,
      method: 'LINEAR_REGRESSION',
      confidence
    };
  }

  /**
   * Optimiza el método de costeo para un producto específico
   */
  static optimizeCostingMethod(
    batches: IBatch[],
    consumptionPattern: Array<{ date: Date; quantity: number }>,
    businessObjective: 'minimize_cost' | 'tax_optimization' | 'cash_flow'
  ): {
    recommendedMethod: 'FIFO' | 'LIFO' | 'AVERAGE';
    reasoning: string[];
    expectedSavings: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  } {
    const reasoning: string[] = [];
    let recommendedMethod: 'FIFO' | 'LIFO' | 'AVERAGE' = 'AVERAGE';
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';

    // Analizar volatilidad de precios
    const priceVolatility = this.calculatePriceVolatility(batches);
    
    // Analizar patrón de rotación
    const rotationSpeed = this.calculateRotationSpeed(batches, consumptionPattern);

    switch (businessObjective) {
      case 'minimize_cost':
        if (priceVolatility > 0.2) {
          recommendedMethod = 'FIFO';
          reasoning.push('Alta volatilidad de precios favorece FIFO');
          riskLevel = 'HIGH';
        } else {
          recommendedMethod = 'AVERAGE';
          reasoning.push('Baja volatilidad permite usar promedio ponderado');
          riskLevel = 'LOW';
        }
        break;

      case 'tax_optimization':
        recommendedMethod = 'LIFO';
        reasoning.push('LIFO puede reducir utilidades gravables en períodos inflacionarios');
        riskLevel = 'MEDIUM';
        break;

      case 'cash_flow':
        if (rotationSpeed > 12) { // Rotación rápida
          recommendedMethod = 'FIFO';
          reasoning.push('Rotación rápida favorece FIFO para mejor flujo de caja');
          riskLevel = 'LOW';
        } else {
          recommendedMethod = 'AVERAGE';
          reasoning.push('Rotación lenta permite usar promedio para estabilidad');
          riskLevel = 'MEDIUM';
        }
        break;
    }

    // Calcular ahorros esperados
    const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
    const comparison = this.compareCostMethods(batches, totalQuantity * 0.1); // 10% del inventario
    const expectedSavings = comparison.savings;

    return {
      recommendedMethod,
      reasoning,
      expectedSavings,
      riskLevel
    };
  }

  /**
   * Calcula métricas de rendimiento de inventario
   */
  static calculateInventoryMetrics(
    batches: IBatch[],
    salesData: Array<{ date: Date; quantity: number; revenue: number }>
  ): {
    turnoverRatio: number;
    daysInInventory: number;
    grossMargin: number;
    inventoryAccuracy: number;
    obsolescenceRisk: number;
  } {
    const inventoryValue = this.calculateInventoryValue(batches);
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.revenue, 0);
    const totalCostOfSales = salesData.reduce((sum, sale) => {
      const costCalc = this.calculateFIFOCost(batches, sale.quantity);
      return sum + costCalc.totalCost;
    }, 0);

    const turnoverRatio = inventoryValue.totalValue > 0 ? totalCostOfSales / inventoryValue.totalValue : 0;
    const daysInInventory = turnoverRatio > 0 ? 365 / turnoverRatio : 365;
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCostOfSales) / totalRevenue) * 100 : 0;

    // Calcular riesgo de obsolescencia basado en la edad de los lotes
    const avgAge = inventoryValue.batchBreakdown.reduce(
      (sum, batch) => sum + (batch.ageInDays * batch.quantity), 0
    ) / inventoryValue.totalQuantity;
    const obsolescenceRisk = Math.min(100, (avgAge / 365) * 100);

    return {
      turnoverRatio,
      daysInInventory,
      grossMargin,
      inventoryAccuracy: 95, // Placeholder - se calcularía con datos reales
      obsolescenceRisk
    };
  }

  /**
   * Métodos auxiliares privados
   */
  private static calculateLinearTrend(data: Array<{ date: Date; cost: number }>) {
    const n = data.length;
    const sumX = data.reduce((sum, _, index) => sum + index, 0);
    const sumY = data.reduce((sum, item) => sum + item.cost, 0);
    const sumXY = data.reduce((sum, item, index) => sum + (index * item.cost), 0);
    const sumXX = data.reduce((sum, _, index) => sum + (index * index), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  private static identifyTrendFactors(trend: { slope: number; intercept: number }): string[] {
    const factors: string[] = [];
    
    if (trend.slope > 0.1) {
      factors.push('Tendencia alcista en costos');
    } else if (trend.slope < -0.1) {
      factors.push('Tendencia bajista en costos');
    } else {
      factors.push('Costos estables');
    }

    return factors;
  }

  private static calculateConfidence(actual: number[], projected: number[]): number {
    if (actual.length < 2 || projected.length < 2) return 0.5;

    const errors = actual.slice(0, projected.length).map((actual, i) => 
      Math.abs(actual - projected[i]) / actual
    );
    const avgError = errors.reduce((sum, error) => sum + error, 0) / errors.length;
    
    return Math.max(0.1, 1 - avgError);
  }

  private static calculatePriceVolatility(batches: IBatch[]): number {
    if (batches.length < 2) return 0;

    const costs = batches.map(batch => batch.costPerUnit);
    const avgCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
    const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - avgCost, 2), 0) / costs.length;
    
    return Math.sqrt(variance) / avgCost;
  }

  private static calculateRotationSpeed(
    batches: IBatch[],
    consumption: Array<{ date: Date; quantity: number }>
  ): number {
    const totalInventory = batches.reduce((sum, batch) => sum + batch.quantity, 0);
    const annualConsumption = consumption.reduce((sum, item) => sum + item.quantity, 0);
    
    return totalInventory > 0 ? annualConsumption / totalInventory : 0;
  }
}

export default CostCalculatorService;