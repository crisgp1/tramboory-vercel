// Tipos para el sistema de castigos/penalizaciones de proveedores

export interface SupplierPenalty {
  _id?: string
  supplierId: string
  supplierName: string
  concept: PenaltyConcept
  severity: PenaltySeverity
  description: string
  penaltyValue: number // Puntos de penalización
  monetaryPenalty?: number // Penalización monetaria opcional
  appliedBy: string // Usuario que aplicó el castigo
  appliedAt: Date
  expiresAt?: Date // Fecha de expiración del castigo
  status: PenaltyStatus
  evidence?: string[] // URLs de evidencia (fotos, documentos)
  notes?: string
}

export enum PenaltyConcept {
  // Entregas y Logística
  LATE_DELIVERY = 'LATE_DELIVERY',
  MISSING_DELIVERY = 'MISSING_DELIVERY',
  INCOMPLETE_DELIVERY = 'INCOMPLETE_DELIVERY',
  WRONG_DELIVERY_ADDRESS = 'WRONG_DELIVERY_ADDRESS',
  DAMAGED_PACKAGING = 'DAMAGED_PACKAGING',
  
  // Calidad del Producto
  QUALITY_ISSUES = 'QUALITY_ISSUES',
  EXPIRED_PRODUCTS = 'EXPIRED_PRODUCTS',
  WRONG_PRODUCTS = 'WRONG_PRODUCTS',
  DEFECTIVE_PRODUCTS = 'DEFECTIVE_PRODUCTS',
  CONTAMINATED_PRODUCTS = 'CONTAMINATED_PRODUCTS',
  
  // Documentación y Procesos
  MISSING_DOCUMENTATION = 'MISSING_DOCUMENTATION',
  INCORRECT_INVOICING = 'INCORRECT_INVOICING',
  PRICING_ERRORS = 'PRICING_ERRORS',
  CERTIFICATE_ISSUES = 'CERTIFICATE_ISSUES',
  
  // Comunicación y Servicio
  POOR_COMMUNICATION = 'POOR_COMMUNICATION',
  UNRESPONSIVE_SERVICE = 'UNRESPONSIVE_SERVICE',
  REPEATED_ERRORS = 'REPEATED_ERRORS',
  POLICY_VIOLATIONS = 'POLICY_VIOLATIONS',
  
  // Cumplimiento y Legales
  REGULATORY_VIOLATIONS = 'REGULATORY_VIOLATIONS',
  CONTRACT_BREACH = 'CONTRACT_BREACH',
  SAFETY_VIOLATIONS = 'SAFETY_VIOLATIONS',
  ENVIRONMENTAL_VIOLATIONS = 'ENVIRONMENTAL_VIOLATIONS',
  
  // Otros
  OTHER = 'OTHER'
}

export enum PenaltySeverity {
  MINOR = 'MINOR',       // 1-5 puntos
  MODERATE = 'MODERATE', // 6-15 puntos
  MAJOR = 'MAJOR',       // 16-30 puntos
  CRITICAL = 'CRITICAL'  // 31+ puntos
}

export enum PenaltyStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  APPEALED = 'APPEALED',
  REVERSED = 'REVERSED'
}

export interface PenaltyConceptConfig {
  concept: PenaltyConcept
  label: string
  description: string
  category: string
  defaultSeverity: PenaltySeverity
  defaultPoints: number
  requiresEvidence: boolean
  color: 'danger' | 'warning' | 'primary' | 'secondary'
  icon: string
}

export const PENALTY_CONCEPTS: PenaltyConceptConfig[] = [
  // Entregas y Logística
  {
    concept: PenaltyConcept.LATE_DELIVERY,
    label: 'Envíos Tardíos',
    description: 'Entrega fuera del tiempo acordado',
    category: 'Logística',
    defaultSeverity: PenaltySeverity.MODERATE,
    defaultPoints: 8,
    requiresEvidence: false,
    color: 'warning',
    icon: 'ClockIcon'
  },
  {
    concept: PenaltyConcept.MISSING_DELIVERY,
    label: 'Entrega Faltante',
    description: 'No se realizó la entrega programada',
    category: 'Logística',
    defaultSeverity: PenaltySeverity.MAJOR,
    defaultPoints: 20,
    requiresEvidence: true,
    color: 'danger',
    icon: 'ExclamationTriangleIcon'
  },
  {
    concept: PenaltyConcept.INCOMPLETE_DELIVERY,
    label: 'Entrega Incompleta',
    description: 'Faltaron productos en la entrega',
    category: 'Logística',
    defaultSeverity: PenaltySeverity.MODERATE,
    defaultPoints: 12,
    requiresEvidence: true,
    color: 'warning',
    icon: 'ArchiveBoxIcon'
  },
  {
    concept: PenaltyConcept.DAMAGED_PACKAGING,
    label: 'Empaque Dañado',
    description: 'Productos llegaron con empaque deteriorado',
    category: 'Logística',
    defaultSeverity: PenaltySeverity.MINOR,
    defaultPoints: 5,
    requiresEvidence: true,
    color: 'warning',
    icon: 'ExclamationCircleIcon'
  },
  
  // Calidad del Producto
  {
    concept: PenaltyConcept.QUALITY_ISSUES,
    label: 'Problemas de Calidad',
    description: 'Productos no cumplen estándares de calidad',
    category: 'Calidad',
    defaultSeverity: PenaltySeverity.MAJOR,
    defaultPoints: 25,
    requiresEvidence: true,
    color: 'danger',
    icon: 'ShieldExclamationIcon'
  },
  {
    concept: PenaltyConcept.EXPIRED_PRODUCTS,
    label: 'Productos Vencidos',
    description: 'Entrega de productos caducados o próximos a vencer',
    category: 'Calidad',
    defaultSeverity: PenaltySeverity.CRITICAL,
    defaultPoints: 35,
    requiresEvidence: true,
    color: 'danger',
    icon: 'CalendarDaysIcon'
  },
  {
    concept: PenaltyConcept.WRONG_PRODUCTS,
    label: 'Productos Incorrectos',
    description: 'Entrega de productos diferentes a los solicitados',
    category: 'Calidad',
    defaultSeverity: PenaltySeverity.MODERATE,
    defaultPoints: 10,
    requiresEvidence: true,
    color: 'warning',
    icon: 'XCircleIcon'
  },
  {
    concept: PenaltyConcept.CONTAMINATED_PRODUCTS,
    label: 'Productos Contaminados',
    description: 'Productos con contaminación o problemas sanitarios',
    category: 'Calidad',
    defaultSeverity: PenaltySeverity.CRITICAL,
    defaultPoints: 40,
    requiresEvidence: true,
    color: 'danger',
    icon: 'ExclamationTriangleIcon'
  },
  
  // Documentación y Procesos
  {
    concept: PenaltyConcept.MISSING_DOCUMENTATION,
    label: 'Documentación Faltante',
    description: 'No proporcionó documentos requeridos',
    category: 'Documentación',
    defaultSeverity: PenaltySeverity.MINOR,
    defaultPoints: 6,
    requiresEvidence: false,
    color: 'primary',
    icon: 'DocumentMagnifyingGlassIcon'
  },
  {
    concept: PenaltyConcept.INCORRECT_INVOICING,
    label: 'Facturación Incorrecta',
    description: 'Errores en facturas o precios',
    category: 'Documentación',
    defaultSeverity: PenaltySeverity.MODERATE,
    defaultPoints: 8,
    requiresEvidence: true,
    color: 'warning',
    icon: 'CalculatorIcon'
  },
  {
    concept: PenaltyConcept.CERTIFICATE_ISSUES,
    label: 'Problemas de Certificación',
    description: 'Certificados vencidos o no válidos',
    category: 'Documentación',
    defaultSeverity: PenaltySeverity.MAJOR,
    defaultPoints: 18,
    requiresEvidence: true,
    color: 'danger',
    icon: 'ShieldCheckIcon'
  },
  
  // Comunicación y Servicio
  {
    concept: PenaltyConcept.POOR_COMMUNICATION,
    label: 'Comunicación Deficiente',
    description: 'Falta de comunicación o respuestas tardías',
    category: 'Servicio',
    defaultSeverity: PenaltySeverity.MINOR,
    defaultPoints: 4,
    requiresEvidence: false,
    color: 'primary',
    icon: 'ChatBubbleLeftRightIcon'
  },
  {
    concept: PenaltyConcept.UNRESPONSIVE_SERVICE,
    label: 'Servicio No Responsivo',
    description: 'No responde a solicitudes o reclamos',
    category: 'Servicio',
    defaultSeverity: PenaltySeverity.MODERATE,
    defaultPoints: 12,
    requiresEvidence: false,
    color: 'warning',
    icon: 'PhoneIcon'
  },
  {
    concept: PenaltyConcept.REPEATED_ERRORS,
    label: 'Errores Continuos',
    description: 'Repetición de errores previamente reportados',
    category: 'Servicio',
    defaultSeverity: PenaltySeverity.MAJOR,
    defaultPoints: 22,
    requiresEvidence: true,
    color: 'danger',
    icon: 'ArrowPathIcon'
  },
  
  // Cumplimiento
  {
    concept: PenaltyConcept.CONTRACT_BREACH,
    label: 'Incumplimiento de Contrato',
    description: 'Violación de términos contractuales',
    category: 'Cumplimiento',
    defaultSeverity: PenaltySeverity.CRITICAL,
    defaultPoints: 45,
    requiresEvidence: true,
    color: 'danger',
    icon: 'DocumentTextIcon'
  },
  {
    concept: PenaltyConcept.SAFETY_VIOLATIONS,
    label: 'Violaciones de Seguridad',
    description: 'Incumplimiento de normas de seguridad',
    category: 'Cumplimiento',
    defaultSeverity: PenaltySeverity.CRITICAL,
    defaultPoints: 50,
    requiresEvidence: true,
    color: 'danger',
    icon: 'ShieldExclamationIcon'
  },
  
  // Otros
  {
    concept: PenaltyConcept.OTHER,
    label: 'Otros Motivos',
    description: 'Otros motivos no especificados',
    category: 'Otros',
    defaultSeverity: PenaltySeverity.MINOR,
    defaultPoints: 5,
    requiresEvidence: true,
    color: 'secondary',
    icon: 'EllipsisHorizontalIcon'
  }
]

export const SEVERITY_CONFIG = {
  [PenaltySeverity.MINOR]: {
    label: 'Menor',
    color: 'primary' as const,
    pointRange: '1-5 puntos',
    description: 'Infracciones menores que no afectan significativamente las operaciones'
  },
  [PenaltySeverity.MODERATE]: {
    label: 'Moderado',
    color: 'warning' as const,
    pointRange: '6-15 puntos',
    description: 'Problemas que requieren atención y seguimiento'
  },
  [PenaltySeverity.MAJOR]: {
    label: 'Mayor',
    color: 'danger' as const,
    pointRange: '16-30 puntos',
    description: 'Problemas serios que afectan las operaciones'
  },
  [PenaltySeverity.CRITICAL]: {
    label: 'Crítico',
    color: 'danger' as const,
    pointRange: '31+ puntos',
    description: 'Violaciones graves que ponen en riesgo la relación comercial'
  }
}

export interface PenaltyHistory {
  supplierId: string
  totalPenalties: number
  totalPoints: number
  activePenalties: number
  lastPenaltyDate?: Date
  penaltiesByCategory: Record<string, number>
  penaltiesBySeverity: Record<PenaltySeverity, number>
}