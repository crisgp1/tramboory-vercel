// Enums para estados de proveedor
export enum SupplierStatus {
  EXTERNAL = 'external',      // Solo registro, sin acceso al portal
  INVITED = 'invited',        // Invitado pero no registrado
  ACTIVE = 'active',          // Con acceso completo al portal
  INACTIVE = 'inactive',      // Temporalmente desactivado
  SUSPENDED = 'suspended'     // Suspendido por incumplimiento
}

export enum SupplierType {
  INTERNAL = 'internal',      // Proveedor interno con acceso al portal
  EXTERNAL = 'external',      // Proveedor externo solo para órdenes
  HYBRID = 'hybrid'          // Puede ser ambos según necesidad
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked'
}

// Interfaces para datos de proveedor unificado
export interface UnifiedSupplier {
  id: string;
  supplier_id: string;
  code: string;
  name: string;
  business_name?: string;
  description?: string;
  
  // Estados
  status: SupplierStatus;
  type: SupplierType;
  is_active: boolean;
  is_preferred: boolean;
  
  // Vinculación con usuario
  user_id?: string;
  user_email?: string;
  user_name?: string;
  
  // Información de contacto
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  contact_person?: string;
  
  // Términos comerciales
  payment_credit_days: number;
  payment_method: 'cash' | 'credit' | 'transfer' | 'check';
  payment_currency: string;
  payment_discount_terms?: string;
  
  // Información de entrega
  delivery_lead_time_days: number;
  delivery_minimum_order?: number;
  delivery_zones: string[];
  
  // Calificaciones
  rating_quality: number;
  rating_reliability: number;
  rating_pricing: number;
  overall_rating?: number;
  
  // Metadatos
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  
  // Invitación (si aplica)
  invitation_status?: InvitationStatus;
  invitation_sent_at?: string;
  invitation_expires_at?: string;
}

// Datos para crear proveedor
export interface CreateSupplierData {
  name: string;
  code?: string;
  business_name?: string;
  description?: string;
  type: SupplierType;
  
  // Usuario asociado (opcional)
  user_id?: string;
  user_email?: string;
  
  // Información de contacto
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  contact_person?: string;
  
  // Términos comerciales (con valores por defecto)
  payment_credit_days?: number;
  payment_method?: 'cash' | 'credit' | 'transfer' | 'check';
  payment_currency?: string;
  payment_discount_terms?: string;
  
  // Información de entrega
  delivery_lead_time_days?: number;
  delivery_minimum_order?: number;
  delivery_zones?: string[];
  
  // Calificaciones iniciales
  rating_quality?: number;
  rating_reliability?: number;
  rating_pricing?: number;
}

// Datos para actualizar proveedor
export interface UpdateSupplierData {
  name?: string;
  business_name?: string;
  description?: string;
  status?: SupplierStatus;
  type?: SupplierType;
  is_active?: boolean;
  is_preferred?: boolean;
  
  // Información de contacto
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  contact_person?: string;
  
  // Términos comerciales
  payment_credit_days?: number;
  payment_method?: 'cash' | 'credit' | 'transfer' | 'check';
  payment_currency?: string;
  payment_discount_terms?: string;
  
  // Información de entrega
  delivery_lead_time_days?: number;
  delivery_minimum_order?: number;
  delivery_zones?: string[];
  
  // Calificaciones
  rating_quality?: number;
  rating_reliability?: number;
  rating_pricing?: number;
  
  // Usuario vinculado
  user_id?: string;
  
  // Invitación
  invitation_status?: InvitationStatus;
  invitation_sent_at?: string;
  invitation_expires_at?: string;
  
  // Metadatos
  updated_by?: string;
  updated_at?: string;
}

// Resultado de operaciones con proveedor
export interface SupplierOperationResult {
  success: boolean;
  supplier?: UnifiedSupplier;
  error?: string;
  message?: string;
}

// Datos para invitación de proveedor
export interface SupplierInvitationData {
  email: string;
  role: 'proveedor';
  supplier_name?: string;
  supplier_code?: string;
  expires_in_days?: number;
  redirect_url?: string;
  metadata?: {
    department?: string;
    notes?: string;
    supplier_type?: SupplierType;
    auto_create_supplier?: boolean;
  };
}

// Filtros para búsqueda de proveedores
export interface SupplierFilters {
  status?: SupplierStatus[];
  type?: SupplierType[];
  is_active?: boolean;
  has_user?: boolean;
  search?: string;
  rating_min?: number;
  created_after?: string;
  created_before?: string;
}

// Estadísticas de proveedor
export interface SupplierStats {
  total_suppliers: number;
  by_status: Record<SupplierStatus, number>;
  by_type: Record<SupplierType, number>;
  with_portal_access: number;
  without_portal_access: number;
  average_rating: number;
  pending_invitations: number;
}

// Respuesta de la API para listado de proveedores
export interface SuppliersResponse {
  success: boolean;
  suppliers: UnifiedSupplier[];
  total: number;
  stats?: SupplierStats;
  filters_applied?: SupplierFilters;
}