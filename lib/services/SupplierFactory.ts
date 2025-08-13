import { SupabaseInventoryService } from '@/lib/supabase/inventory';
import {
  UnifiedSupplier,
  CreateSupplierData,
  UpdateSupplierData,
  SupplierStatus,
  SupplierType,
  SupplierOperationResult,
  SupplierInvitationData,
  InvitationStatus
} from '@/lib/types/supplier.types';
import {
  generateSupplierCode,
  generateSupplierId,
  generateSupplierNameFromEmail,
  determineSupplierType,
  calculateInitialStatus,
  calculateOverallRating,
  isValidStatusTransition
} from '@/lib/utils/supplier.utils';

/**
 * Factory para manejo centralizado de proveedores unificados
 * Elimina la duplicidad entre sistema de usuarios y proveedores de inventario
 *
 * NOTA: Este servicio es SERVER-ONLY, no usar en componentes cliente
 */
export class SupplierFactory {
  
  /**
   * Crea un proveedor externo (solo para órdenes, sin acceso al portal)
   */
  static async createExternalSupplier(
    data: CreateSupplierData,
    createdBy: string
  ): Promise<SupplierOperationResult> {
    try {
      const supplierCode = data.code || generateSupplierCode();
      
      const supplierData = {
        supplier_id: supplierCode,
        name: data.name,
        code: supplierCode,
        business_name: data.business_name,
        description: data.description,
        
        // Estados
        status: SupplierStatus.EXTERNAL,
        type: SupplierType.EXTERNAL,
        is_active: true,
        is_preferred: false,
        
        // Sin usuario vinculado
        user_id: undefined,
        
        // Información de contacto
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        contact_address: data.contact_address,
        contact_person: data.contact_person,
        
        // Términos comerciales con defaults
        payment_credit_days: data.payment_credit_days || 30,
        payment_method: data.payment_method || 'transfer',
        payment_currency: data.payment_currency || 'MXN',
        payment_discount_terms: data.payment_discount_terms,
        
        // Información de entrega
        delivery_lead_time_days: data.delivery_lead_time_days || 7,
        delivery_minimum_order: data.delivery_minimum_order,
        delivery_zones: data.delivery_zones || [],
        
        // Calificaciones iniciales
        rating_quality: data.rating_quality || 3,
        rating_reliability: data.rating_reliability || 3,
        rating_pricing: data.rating_pricing || 3,
        
        // Metadatos
        created_by: createdBy,
        updated_by: createdBy
      };

      const newSupplier = await SupabaseInventoryService.createSupplier(supplierData);
      
      return {
        success: true,
        supplier: newSupplier as UnifiedSupplier,
        message: `Proveedor externo ${newSupplier.name} creado exitosamente`
      };
    } catch (error) {
      console.error('Error creating external supplier:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al crear proveedor externo'
      };
    }
  }

  /**
   * Crea un proveedor para un usuario (método principal usado en invitaciones)
   * Auto-detección de si debe ser externo o con portal
   */
  static async createSupplierForUser(
    userData: { id: string; email: string; firstName?: string; lastName?: string },
    businessName?: string
  ): Promise<any> {
    try {
      const supplierCode = generateSupplierCode(businessName || userData.email);
      const supplierName = businessName || generateSupplierNameFromEmail(userData.email);
      
      return {
        supplier_id: supplierCode,
        name: supplierName,
        business_name: businessName || supplierName,
        code: supplierCode,
        user_id: userData.id,
        contact_email: userData.email,
        status: SupplierStatus.INVITED,
        type: SupplierType.EXTERNAL,
        is_active: true,
        is_auto_created: true, // Important flag for auto-creation
        
        // Default values
        payment_credit_days: 30,
        payment_method: 'transfer' as const,
        payment_currency: 'MXN',
        delivery_lead_time_days: 7,
        delivery_zones: [],
        rating_quality: 3,
        rating_reliability: 3,
        rating_pricing: 3,
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating supplier for user:', error);
      throw error;
    }
  }

  /**
   * Genera código de proveedor (método estático para compatibilidad)
   */
  static generateSupplierCode(companyName?: string): string {
    return generateSupplierCode(companyName);
  }

  /**
   * Crea un proveedor con acceso al portal (vinculado a usuario)
   * Se usa cuando se envía una invitación con rol 'proveedor'
   */
  static async createPortalSupplier(
    invitationData: SupplierInvitationData,
    invitedByUserId: string,
    targetUserId?: string
  ): Promise<SupplierOperationResult> {
    try {
      const supplierCode = invitationData.supplier_code || generateSupplierCode();
      const supplierName = invitationData.supplier_name || generateSupplierNameFromEmail(invitationData.email);
      
      const supplierData = {
        supplier_id: supplierCode,
        name: supplierName,
        code: supplierCode,
        description: `Proveedor creado desde invitación para ${invitationData.email}`,
        
        // Estados para proveedor invitado
        status: targetUserId ? SupplierStatus.ACTIVE : SupplierStatus.INVITED,
        type: SupplierType.INTERNAL,
        is_active: true,
        is_preferred: false,
        
        // Usuario vinculado
        user_id: targetUserId,
        
        // Información de contacto desde invitación
        contact_email: invitationData.email,
        
        // Términos comerciales por defecto
        payment_credit_days: 30,
        payment_method: 'transfer' as const,
        payment_currency: 'MXN',
        
        // Información de entrega por defecto
        delivery_lead_time_days: 7,
        delivery_zones: [],
        
        // Calificaciones iniciales
        rating_quality: 3,
        rating_reliability: 3,
        rating_pricing: 3,
        
        // Metadatos de invitación
        invitation_status: InvitationStatus.PENDING,
        invitation_sent_at: new Date().toISOString(),
        invitation_expires_at: invitationData.expires_in_days 
          ? new Date(Date.now() + (invitationData.expires_in_days * 24 * 60 * 60 * 1000)).toISOString()
          : new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(), // Default 30 días
        
        // Metadatos
        created_by: invitedByUserId,
        updated_by: invitedByUserId
      };

      const newSupplier = await SupabaseInventoryService.createSupplier(supplierData);
      
      return {
        success: true,
        supplier: newSupplier as UnifiedSupplier,
        message: `Proveedor con portal ${newSupplier.name} creado para ${invitationData.email}`
      };
    } catch (error) {
      console.error('Error creating portal supplier:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al crear proveedor con portal'
      };
    }
  }

  /**
   * Actualiza el estado de un proveedor cuando acepta una invitación
   */
  static async activateSupplierFromInvitation(
    supplierCode: string,
    userId: string,
    userEmail: string
  ): Promise<SupplierOperationResult> {
    try {
      const supplier = await SupabaseInventoryService.getSupplierBySupplierCode(supplierCode);
      if (!supplier) {
        return {
          success: false,
          error: 'Proveedor no encontrado'
        };
      }

      // Verificar que puede hacer la transición
      if (!isValidStatusTransition(supplier.status as SupplierStatus, SupplierStatus.ACTIVE)) {
        return {
          success: false,
          error: `No se puede activar proveedor desde estado ${supplier.status}`
        };
      }

      const updateData: UpdateSupplierData = {
        status: SupplierStatus.ACTIVE,
        user_id: userId,
        contact_email: userEmail,
        invitation_status: InvitationStatus.ACCEPTED
      };

      const updatedSupplier = await SupabaseInventoryService.updateSupplier(supplier.id, updateData);
      
      return {
        success: true,
        supplier: updatedSupplier as UnifiedSupplier,
        message: `Proveedor ${updatedSupplier.name} activado exitosamente`
      };
    } catch (error) {
      console.error('Error activating supplier from invitation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al activar proveedor'
      };
    }
  }

  /**
   * Convierte un proveedor externo a proveedor con portal
   */
  static async promoteToPortalAccess(
    supplierCode: string,
    userEmail: string,
    promotedBy: string,
    sendInvitation: boolean = true
  ): Promise<SupplierOperationResult> {
    try {
      const supplier = await SupabaseInventoryService.getSupplierBySupplierCode(supplierCode);
      if (!supplier) {
        return {
          success: false,
          error: 'Proveedor no encontrado'
        };
      }

      if (supplier.status !== SupplierStatus.EXTERNAL) {
        return {
          success: false,
          error: 'Solo se pueden promover proveedores externos'
        };
      }

      const updateData: UpdateSupplierData = {
        status: SupplierStatus.INVITED,
        type: SupplierType.INTERNAL,
        contact_email: userEmail,
        invitation_status: InvitationStatus.PENDING,
        invitation_sent_at: new Date().toISOString(),
        invitation_expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString()
      };

      const updatedSupplier = await SupabaseInventoryService.updateSupplier(supplier.id, updateData);
      
      // TODO: Aquí se enviaría la invitación por email si sendInvitation es true
      
      return {
        success: true,
        supplier: updatedSupplier as UnifiedSupplier,
        message: `Proveedor ${updatedSupplier.name} promovido a acceso portal`
      };
    } catch (error) {
      console.error('Error promoting supplier to portal access:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al promover proveedor'
      };
    }
  }

  // NOTA: Métodos de lectura movidos al SupabaseInventoryService para evitar problemas de server/client
  // Usar directamente: SupabaseInventoryService.getAllSuppliersUnified() desde endpoints API

  /**
   * Actualiza un proveedor validando transiciones de estado
   */
  static async updateSupplier(
    supplierCode: string,
    updateData: UpdateSupplierData,
    updatedBy: string
  ): Promise<SupplierOperationResult> {
    try {
      const supplier = await SupabaseInventoryService.getSupplierBySupplierCode(supplierCode);
      if (!supplier) {
        return {
          success: false,
          error: 'Proveedor no encontrado'
        };
      }

      // Validar transición de estado si se está cambiando
      if (updateData.status && updateData.status !== supplier.status) {
        if (!isValidStatusTransition(supplier.status as SupplierStatus, updateData.status)) {
          return {
            success: false,
            error: `Transición de estado inválida: ${supplier.status} -> ${updateData.status}`
          };
        }
      }

      // Agregar metadatos de actualización
      const finalUpdateData = {
        ...updateData,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      };

      const updatedSupplier = await SupabaseInventoryService.updateSupplier(supplier.id, finalUpdateData);
      
      return {
        success: true,
        supplier: updatedSupplier as UnifiedSupplier,
        message: `Proveedor ${updatedSupplier.name} actualizado exitosamente`
      };
    } catch (error) {
      console.error('Error updating supplier:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar proveedor'
      };
    }
  }

  // Método de enriquecimiento movido al SupabaseInventoryService

  /**
   * Busca proveedores que necesiten migración (sin estados definidos)
   */
  static async findSuppliersNeedingMigration(): Promise<any[]> {
    try {
      const suppliers = await SupabaseInventoryService.getAllSuppliers(false);
      
      return suppliers.filter(supplier => 
        !supplier.status || 
        !supplier.type || 
        (supplier.user_id && supplier.status === SupplierStatus.EXTERNAL)
      );
    } catch (error) {
      console.error('Error finding suppliers needing migration:', error);
      return [];
    }
  }

  /**
   * Migra un proveedor existente al nuevo sistema
   */
  static async migrateSupplier(
    supplierCode: string,
    migratedBy: string
  ): Promise<SupplierOperationResult> {
    try {
      const supplier = await SupabaseInventoryService.getSupplierBySupplierCode(supplierCode);
      if (!supplier) {
        return {
          success: false,
          error: 'Proveedor no encontrado'
        };
      }

      const hasUser = Boolean(supplier.user_id);
      const newStatus = calculateInitialStatus(hasUser, false);
      const newType = determineSupplierType(hasUser, false);

      const updateData: UpdateSupplierData = {
        status: newStatus,
        type: newType,
        updated_by: migratedBy
      };

      const updatedSupplier = await SupabaseInventoryService.updateSupplier(supplier.id, updateData);
      
      return {
        success: true,
        supplier: updatedSupplier as UnifiedSupplier,
        message: `Proveedor ${updatedSupplier.name} migrado al nuevo sistema`
      };
    } catch (error) {
      console.error('Error migrating supplier:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al migrar proveedor'
      };
    }
  }
}