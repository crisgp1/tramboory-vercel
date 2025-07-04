import { UNIT_CONVERSIONS, COMMON_UNITS } from '@/lib/utils/inventory/constants';
import { IUnits, IAlternativeUnit } from '@/types/inventory/index';

// Interface para resultado de conversión
export interface ConversionResult {
  success: boolean;
  convertedValue: number;
  fromUnit: string;
  toUnit: string;
  conversionFactor: number;
  error?: string;
}

// Interface para ruta de conversión
export interface ConversionPath {
  fromUnit: string;
  toUnit: string;
  factor: number;
  steps: Array<{
    from: string;
    to: string;
    factor: number;
    type: string;
  }>;
}

// Cache para conversiones frecuentes
const conversionCache = new Map<string, number>();

export class UnitConverterService {
  /**
   * Convierte una cantidad de una unidad a otra
   */
  static convert(
    value: number,
    fromUnit: string,
    toUnit: string,
    productUnits?: IUnits,
    allowNegative: boolean = false
  ): ConversionResult {
    try {
      // Validar entrada
      if (!this.isValidValue(value, allowNegative)) {
        console.error(`❌ UnitConverter: Valor inválido - value: ${value}, type: ${typeof value}`);
        return {
          success: false,
          convertedValue: 0,
          fromUnit,
          toUnit,
          conversionFactor: 0,
          error: `Valor inválido para conversión: ${value} (tipo: ${typeof value})`
        };
      }

      // Si las unidades son iguales, no hay conversión
      if (fromUnit === toUnit) {
        return {
          success: true,
          convertedValue: value,
          fromUnit,
          toUnit,
          conversionFactor: 1
        };
      }

      // Buscar factor de conversión
      const conversionFactor = this.getConversionFactor(fromUnit, toUnit, productUnits);
      
      if (conversionFactor === null) {
        console.error(`❌ UnitConverter: No se encontró conversión - fromUnit: ${fromUnit}, toUnit: ${toUnit}, productUnits:`, productUnits);
        return {
          success: false,
          convertedValue: 0,
          fromUnit,
          toUnit,
          conversionFactor: 0,
          error: `No se encontró conversión de ${fromUnit} a ${toUnit}`
        };
      }

      const convertedValue = value * conversionFactor;

      return {
        success: true,
        convertedValue: this.roundToDecimals(convertedValue, 6),
        fromUnit,
        toUnit,
        conversionFactor
      };

    } catch (error) {
      return {
        success: false,
        convertedValue: 0,
        fromUnit,
        toUnit,
        conversionFactor: 0,
        error: `Error en conversión: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Obtiene el factor de conversión entre dos unidades
   */
  static getConversionFactor(
    fromUnit: string,
    toUnit: string,
    productUnits?: IUnits
  ): number | null {
    // Verificar cache
    const cacheKey = `${fromUnit}_to_${toUnit}`;
    if (conversionCache.has(cacheKey)) {
      return conversionCache.get(cacheKey)!;
    }

    let factor: number | null = null;

    // 1. Buscar en unidades del producto específico
    if (productUnits) {
      factor = this.getProductSpecificFactor(fromUnit, toUnit, productUnits);
      if (factor !== null) {
        conversionCache.set(cacheKey, factor);
        return factor;
      }
    }

    // 2. Buscar en conversiones estándar
    factor = this.getStandardConversionFactor(fromUnit, toUnit);
    if (factor !== null) {
      conversionCache.set(cacheKey, factor);
      return factor;
    }

    // 3. Buscar conversión indirecta
    factor = this.findIndirectConversion(fromUnit, toUnit, productUnits);
    if (factor !== null) {
      conversionCache.set(cacheKey, factor);
      return factor;
    }

    return null;
  }

  /**
   * Busca factor de conversión específico del producto
   */
  private static getProductSpecificFactor(
    fromUnit: string,
    toUnit: string,
    productUnits: IUnits
  ): number | null {
    const allUnits = [productUnits.base, ...productUnits.alternatives];

    // Buscar unidad de origen
    const fromUnitData = allUnits.find(unit => unit.code === fromUnit);
    const toUnitData = allUnits.find(unit => unit.code === toUnit);

    if (!fromUnitData || !toUnitData) {
      return null;
    }

    // Si ambas son alternativas, usar sus factores de conversión
    if (fromUnit !== productUnits.base.code && toUnit !== productUnits.base.code) {
      const fromAlt = productUnits.alternatives.find((alt: IAlternativeUnit) => alt.code === fromUnit) as IAlternativeUnit;
      const toAlt = productUnits.alternatives.find((alt: IAlternativeUnit) => alt.code === toUnit) as IAlternativeUnit;
      
      if (fromAlt && toAlt) {
        // Convertir a unidad base y luego a unidad destino
        return fromAlt.conversionFactor / toAlt.conversionFactor;
      }
    }

    // Si una es base y otra alternativa
    if (fromUnit === productUnits.base.code) {
      const toAlt = productUnits.alternatives.find((alt: IAlternativeUnit) => alt.code === toUnit) as IAlternativeUnit;
      return toAlt ? 1 / toAlt.conversionFactor : null;
    }

    if (toUnit === productUnits.base.code) {
      const fromAlt = productUnits.alternatives.find((alt: IAlternativeUnit) => alt.code === fromUnit) as IAlternativeUnit;
      return fromAlt ? fromAlt.conversionFactor : null;
    }

    return null;
  }

  /**
   * Busca factor de conversión en conversiones estándar
   */
  private static getStandardConversionFactor(fromUnit: string, toUnit: string): number | null {
    // Conversiones directas
    const directKey = `${fromUnit}_to_${toUnit}`;
    
    // Buscar en conversiones de volumen
    if (UNIT_CONVERSIONS.VOLUME[directKey as keyof typeof UNIT_CONVERSIONS.VOLUME]) {
      return UNIT_CONVERSIONS.VOLUME[directKey as keyof typeof UNIT_CONVERSIONS.VOLUME];
    }

    // Buscar en conversiones de peso
    if (UNIT_CONVERSIONS.WEIGHT[directKey as keyof typeof UNIT_CONVERSIONS.WEIGHT]) {
      return UNIT_CONVERSIONS.WEIGHT[directKey as keyof typeof UNIT_CONVERSIONS.WEIGHT];
    }

    // Conversiones inversas
    const inverseKey = `${toUnit}_to_${fromUnit}`;
    
    if (UNIT_CONVERSIONS.VOLUME[inverseKey as keyof typeof UNIT_CONVERSIONS.VOLUME]) {
      return 1 / UNIT_CONVERSIONS.VOLUME[inverseKey as keyof typeof UNIT_CONVERSIONS.VOLUME];
    }

    if (UNIT_CONVERSIONS.WEIGHT[inverseKey as keyof typeof UNIT_CONVERSIONS.WEIGHT]) {
      return 1 / UNIT_CONVERSIONS.WEIGHT[inverseKey as keyof typeof UNIT_CONVERSIONS.WEIGHT];
    }

    return null;
  }

  /**
   * Busca conversión indirecta a través de unidades intermedias
   */
  private static findIndirectConversion(
    fromUnit: string,
    toUnit: string,
    productUnits?: IUnits
  ): number | null {
    // Implementar algoritmo de búsqueda de ruta más corta
    // Por simplicidad, intentamos conversiones comunes como intermediarias

    const intermediateUnits = ['ml', 'l', 'g', 'kg', 'unit'];

    for (const intermediate of intermediateUnits) {
      if (intermediate === fromUnit || intermediate === toUnit) continue;

      const factor1 = this.getConversionFactor(fromUnit, intermediate, productUnits);
      const factor2 = this.getConversionFactor(intermediate, toUnit, productUnits);

      if (factor1 !== null && factor2 !== null) {
        return factor1 * factor2;
      }
    }

    return null;
  }

  /**
   * Sugiere la mejor unidad para mostrar una cantidad
   */
  static suggestBestUnit(
    value: number,
    currentUnit: string,
    availableUnits: string[],
    productUnits?: IUnits
  ): { unit: string; value: number } {
    let bestUnit = currentUnit;
    let bestValue = value;
    let bestScore = this.calculateDisplayScore(value, currentUnit);

    for (const unit of availableUnits) {
      if (unit === currentUnit) continue;

      const conversion = this.convert(value, currentUnit, unit, productUnits);
      if (conversion.success) {
        const score = this.calculateDisplayScore(conversion.convertedValue, unit);
        if (score > bestScore) {
          bestScore = score;
          bestUnit = unit;
          bestValue = conversion.convertedValue;
        }
      }
    }

    return { unit: bestUnit, value: bestValue };
  }

  /**
   * Calcula un score para determinar qué tan buena es una unidad para mostrar
   */
  private static calculateDisplayScore(value: number, unit: string): number {
    // Preferir valores entre 1 y 1000
    let score = 0;

    if (value >= 1 && value <= 1000) {
      score += 100;
    } else if (value >= 0.1 && value < 1) {
      score += 50;
    } else if (value > 1000 && value <= 10000) {
      score += 30;
    } else {
      score += 10;
    }

    // Preferir unidades más comunes
    const commonUnits = ['unit', 'kg', 'l', 'ml', 'g'];
    if (commonUnits.includes(unit)) {
      score += 20;
    }

    // Penalizar decimales muy largos
    const decimalPlaces = this.countDecimalPlaces(value);
    if (decimalPlaces > 3) {
      score -= decimalPlaces * 5;
    }

    return score;
  }

  /**
   * Valida que todas las unidades de un producto sean coherentes
   */
  static validateProductUnits(productUnits: IUnits): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Verificar que no haya códigos duplicados
    const allCodes = [productUnits.base.code, ...productUnits.alternatives.map((alt: IAlternativeUnit) => alt.code)];
    const uniqueCodes = new Set(allCodes);
    
    if (uniqueCodes.size !== allCodes.length) {
      errors.push('Códigos de unidad duplicados');
    }

    // Verificar que las conversiones sean válidas
    for (const alt of productUnits.alternatives) {
      if (alt.conversionFactor <= 0) {
        errors.push(`Factor de conversión inválido para ${alt.code}`);
      }

      // Verificar conversión circular
      const testConversion = this.convert(1, productUnits.base.code, alt.code, productUnits);
      if (!testConversion.success) {
        errors.push(`No se puede convertir de ${productUnits.base.code} a ${alt.code}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtiene todas las conversiones posibles para una unidad
   */
  static getAvailableConversions(
    fromUnit: string,
    productUnits?: IUnits
  ): Array<{ toUnit: string; factor: number; category: string }> {
    const conversions: Array<{ toUnit: string; factor: number; category: string }> = [];

    // Conversiones del producto específico
    if (productUnits) {
      const allUnits = [productUnits.base, ...productUnits.alternatives];
      
      for (const unit of allUnits) {
        if (unit.code !== fromUnit) {
          const factor = this.getConversionFactor(fromUnit, unit.code, productUnits);
          if (factor !== null) {
            conversions.push({
              toUnit: unit.code,
              factor,
              category: 'product'
            });
          }
        }
      }
    }

    // Conversiones estándar
    const standardUnits = [
      ...Object.values(COMMON_UNITS.VOLUME),
      ...Object.values(COMMON_UNITS.WEIGHT),
      ...Object.values(COMMON_UNITS.PIECE)
    ];

    for (const unit of standardUnits) {
      if ((unit as any).code !== fromUnit) {
        const factor = this.getStandardConversionFactor(fromUnit, (unit as any).code);
        if (factor !== null) {
          conversions.push({
            toUnit: (unit as any).code,
            factor,
            category: (unit as any).category
          });
        }
      }
    }

    return conversions;
  }

  /**
   * Convierte múltiples valores manteniendo proporciones
   */
  static convertBatch(
    values: Array<{ value: number; fromUnit: string }>,
    toUnit: string,
    productUnits?: IUnits
  ): Array<ConversionResult> {
    return values.map(item => 
      this.convert(item.value, item.fromUnit, toUnit, productUnits)
    );
  }

  /**
   * Calcula el factor de conversión inverso
   */
  static getInverseFactor(factor: number): number {
    return factor !== 0 ? 1 / factor : 0;
  }

  /**
   * Utilidades privadas
   */
  private static isValidValue(value: number, allowNegative: boolean = false): boolean {
    // Verificar que sea un número válido
    if (typeof value !== 'number') {
      console.error(`❌ UnitConverter: Valor no es número - value: ${value}, type: ${typeof value}`);
      return false;
    }
    
    if (isNaN(value)) {
      console.error(`❌ UnitConverter: Valor es NaN - value: ${value}`);
      return false;
    }
    
    if (!isFinite(value)) {
      console.error(`❌ UnitConverter: Valor no es finito - value: ${value}`);
      return false;
    }
    
    if (value < 0 && !allowNegative) {
      console.error(`❌ UnitConverter: Valor es negativo - value: ${value}`);
      return false;
    }
    
    return true;
  }

  private static roundToDecimals(num: number, decimals: number): number {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  private static countDecimalPlaces(value: number): number {
    if (Math.floor(value) === value) return 0;
    const str = value.toString();
    if (str.indexOf('.') !== -1 && str.indexOf('e-') === -1) {
      return str.split('.')[1].length;
    } else if (str.indexOf('e-') !== -1) {
      const parts = str.split('e-');
      return parseInt(parts[1], 10);
    }
    return 0;
  }

  /**
   * Limpia el cache de conversiones
   */
  static clearCache(): void {
    conversionCache.clear();
  }

  /**
   * Obtiene estadísticas del cache
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: conversionCache.size,
      keys: Array.from(conversionCache.keys())
    };
  }

  /**
   * Formatea una cantidad con su unidad
   */
  static formatQuantity(
    value: number,
    unit: string,
    decimals: number = 2,
    locale: string = 'es-MX'
  ): string {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });

    return `${formatter.format(value)} ${unit}`;
  }

  /**
   * Parsea una cantidad con unidad desde string
   */
  static parseQuantityString(quantityString: string): { value: number; unit: string } | null {
    const regex = /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/;
    const match = quantityString.trim().match(regex);
    
    if (match) {
      return {
        value: parseFloat(match[1]),
        unit: match[2].toLowerCase()
      };
    }
    
    return null;
  }
}

export default UnitConverterService;