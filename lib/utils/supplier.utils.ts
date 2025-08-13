import { SupplierStatus, SupplierType, UnifiedSupplier } from '@/lib/types/supplier.types';

/**
 * Genera un código único para proveedor
 * Formato: SUP-[COMPANY_PREFIX]-[RANDOM] o SUP-[TIMESTAMP]-[RANDOM]
 */
export function generateSupplierCode(companyName?: string): string {
  let prefix: string;
  
  if (companyName) {
    // Usar primeras 3 letras del nombre de empresa (limpio)
    prefix = companyName
      .replace(/[^A-Za-z0-9\s]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '') // Remover espacios
      .slice(0, 3)
      .toUpperCase() || 'SUP';
    
    // Agregar número aleatorio para unicidad
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `SUP-${prefix}${random}`;
  } else {
    // Formato original basado en timestamp
    const timestamp = Date.now().toString().slice(-8); // Últimos 8 dígitos
    const random = Math.random().toString(36).substr(2, 6).toUpperCase(); // 6 caracteres aleatorios
    return `SUP-${timestamp.slice(-5)}${random}`;
  }
}

/**
 * Genera un ID único para proveedor (interno)
 * Formato: supplier_[UUID]
 */
export function generateSupplierId(): string {
  const random = Math.random().toString(36).substr(2, 12);
  return `supplier_${random}`;
}

/**
 * Valida formato de código de proveedor
 */
export function isValidSupplierCode(code: string): boolean {
  const pattern = /^SUP-\d{8}-[A-Z0-9]{6}$/;
  return pattern.test(code);
}

/**
 * Extrae información del código de proveedor
 */
export function parseSupplierCode(code: string): { timestamp: number; random: string } | null {
  if (!isValidSupplierCode(code)) {
    return null;
  }
  
  const parts = code.split('-');
  const timestamp = parseInt(parts[1], 10);
  const random = parts[2];
  
  return { timestamp, random };
}

/**
 * Genera nombre por defecto para proveedor basado en email
 */
export function generateSupplierNameFromEmail(email: string): string {
  const localPart = email.split('@')[0];
  const words = localPart.split(/[._-]/);
  
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Determina el tipo de proveedor basado en el contexto
 */
export function determineSupplierType(hasUser: boolean, isInvited: boolean): SupplierType {
  if (hasUser || isInvited) {
    return SupplierType.INTERNAL;
  }
  return SupplierType.EXTERNAL;
}

/**
 * Calcula el estado inicial del proveedor
 */
export function calculateInitialStatus(hasUser: boolean, isInvited: boolean): SupplierStatus {
  if (hasUser) {
    return SupplierStatus.ACTIVE;
  }
  if (isInvited) {
    return SupplierStatus.INVITED;
  }
  return SupplierStatus.EXTERNAL;
}

/**
 * Valida transición de estado
 */
export function isValidStatusTransition(from: SupplierStatus, to: SupplierStatus): boolean {
  const validTransitions: Record<SupplierStatus, SupplierStatus[]> = {
    [SupplierStatus.EXTERNAL]: [SupplierStatus.INVITED, SupplierStatus.ACTIVE],
    [SupplierStatus.INVITED]: [SupplierStatus.ACTIVE, SupplierStatus.EXTERNAL, SupplierStatus.SUSPENDED],
    [SupplierStatus.ACTIVE]: [SupplierStatus.INACTIVE, SupplierStatus.SUSPENDED, SupplierStatus.EXTERNAL],
    [SupplierStatus.INACTIVE]: [SupplierStatus.ACTIVE, SupplierStatus.SUSPENDED],
    [SupplierStatus.SUSPENDED]: [SupplierStatus.ACTIVE, SupplierStatus.INACTIVE]
  };
  
  return validTransitions[from]?.includes(to) || false;
}

/**
 * Calcula calificación general del proveedor
 */
export function calculateOverallRating(
  quality: number, 
  reliability: number, 
  pricing: number
): number {
  // Peso: Calidad 40%, Confiabilidad 35%, Precio 25%
  const weighted = (quality * 0.4) + (reliability * 0.35) + (pricing * 0.25);
  return Math.round(weighted * 10) / 10; // Redondear a 1 decimal
}

/**
 * Formatea información de proveedor para display
 */
export function formatSupplierDisplay(supplier: UnifiedSupplier): {
  displayName: string;
  statusLabel: string;
  statusColor: string;
  typeLabel: string;
  contactInfo: string;
} {
  const displayName = supplier.business_name || supplier.name;
  
  const statusLabels: Record<SupplierStatus, string> = {
    [SupplierStatus.EXTERNAL]: 'Solo Registros',
    [SupplierStatus.INVITED]: 'Invitado',
    [SupplierStatus.ACTIVE]: 'Activo',
    [SupplierStatus.INACTIVE]: 'Inactivo',
    [SupplierStatus.SUSPENDED]: 'Suspendido'
  };
  
  const statusColors: Record<SupplierStatus, string> = {
    [SupplierStatus.EXTERNAL]: 'gray',
    [SupplierStatus.INVITED]: 'yellow',
    [SupplierStatus.ACTIVE]: 'green',
    [SupplierStatus.INACTIVE]: 'orange',
    [SupplierStatus.SUSPENDED]: 'red'
  };
  
  const typeLabels: Record<SupplierType, string> = {
    [SupplierType.INTERNAL]: 'Con Portal',
    [SupplierType.EXTERNAL]: 'Solo Datos',
    [SupplierType.HYBRID]: 'Híbrido'
  };
  
  const contactInfo = supplier.user_email || supplier.contact_email || supplier.contact_phone || 'Sin contacto';
  
  return {
    displayName,
    statusLabel: statusLabels[supplier.status],
    statusColor: statusColors[supplier.status],
    typeLabel: typeLabels[supplier.type],
    contactInfo
  };
}

/**
 * Verifica si un proveedor necesita completar su perfil
 */
export function needsProfileCompletion(supplier: UnifiedSupplier): boolean {
  const requiredFields = [
    supplier.contact_email,
    supplier.contact_phone,
    supplier.contact_person
  ];
  
  return requiredFields.some(field => !field || field.trim() === '');
}

/**
 * Calcula días desde la invitación
 */
export function getDaysSinceInvitation(invitationDate: string): number {
  const now = new Date();
  const invited = new Date(invitationDate);
  const diffTime = Math.abs(now.getTime() - invited.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica si la invitación ha expirado
 */
export function isInvitationExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
}

/**
 * Filtra proveedores según criterios
 */
export function filterSuppliers(
  suppliers: UnifiedSupplier[], 
  filters: {
    search?: string;
    status?: SupplierStatus[];
    type?: SupplierType[];
    hasUser?: boolean;
    minRating?: number;
  }
): UnifiedSupplier[] {
  return suppliers.filter(supplier => {
    // Búsqueda por texto
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableFields = [
        supplier.name,
        supplier.business_name,
        supplier.code,
        supplier.contact_email,
        supplier.user_email
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (!searchableFields.includes(searchTerm)) {
        return false;
      }
    }
    
    // Filtro por estado
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(supplier.status)) {
        return false;
      }
    }
    
    // Filtro por tipo
    if (filters.type && filters.type.length > 0) {
      if (!filters.type.includes(supplier.type)) {
        return false;
      }
    }
    
    // Filtro por usuario
    if (filters.hasUser !== undefined) {
      const hasUser = Boolean(supplier.user_id);
      if (filters.hasUser !== hasUser) {
        return false;
      }
    }
    
    // Filtro por calificación mínima
    if (filters.minRating) {
      const overallRating = calculateOverallRating(
        supplier.rating_quality,
        supplier.rating_reliability,
        supplier.rating_pricing
      );
      if (overallRating < filters.minRating) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Ordena proveedores según criterio
 */
export function sortSuppliers(
  suppliers: UnifiedSupplier[],
  sortBy: 'name' | 'status' | 'type' | 'rating' | 'created_at',
  direction: 'asc' | 'desc' = 'asc'
): UnifiedSupplier[] {
  return [...suppliers].sort((a, b) => {
    let compareValue = 0;
    
    switch (sortBy) {
      case 'name':
        compareValue = a.name.localeCompare(b.name);
        break;
      case 'status':
        compareValue = a.status.localeCompare(b.status);
        break;
      case 'type':
        compareValue = a.type.localeCompare(b.type);
        break;
      case 'rating':
        const ratingA = calculateOverallRating(a.rating_quality, a.rating_reliability, a.rating_pricing);
        const ratingB = calculateOverallRating(b.rating_quality, b.rating_reliability, b.rating_pricing);
        compareValue = ratingA - ratingB;
        break;
      case 'created_at':
        compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
    }
    
    return direction === 'asc' ? compareValue : -compareValue;
  });
}