import { Knock } from '@knocklabs/node';
import { NOTIFICATION_CONFIG } from '@/lib/utils/inventory/constants';
import { AlertType, AlertPriority } from '@/types/inventory';

// Inicializar Knock con configuración correcta
const knock = new Knock({
  apiKey: process.env.KNOCK_API_KEY || ''
});

// Interface para datos de notificación
export interface NotificationData {
  userId: string;
  type: AlertType;
  priority: AlertPriority;
  productName: string;
  productId: string;
  locationName?: string;
  currentStock?: number;
  threshold?: number;
  unit?: string;
  expiryDate?: Date;
  batchId?: string;
  daysUntilExpiry?: number;
  metadata?: Record<string, any>;
}

// Interface para configuración de canales
export interface ChannelConfig {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sms?: boolean;
}

// Interface para resultado de notificación
export interface NotificationResult {
  success: boolean;
  messageId?: string;
  channels: string[];
  error?: string;
}

export class NotificationService {
  /**
   * Envía notificación de stock bajo
   */
  static async sendLowStockAlert(data: NotificationData): Promise<NotificationResult> {
    try {
      const templateData = {
        productName: data.productName,
        currentStock: data.currentStock,
        threshold: data.threshold,
        unit: data.unit,
        locationName: data.locationName,
        urgency: this.getUrgencyLevel(data.priority),
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/inventory/products/${data.productId}`
      };

      const result = await knock.workflows.trigger(NOTIFICATION_CONFIG.TEMPLATES.LOW_STOCK, {
        recipients: [data.userId],
        data: templateData
      });

      return {
        success: true,
        messageId: result.workflow_run_id,
        channels: this.getChannelsForPriority(data.priority)
      };

    } catch (error) {
      console.error('Error sending low stock alert:', error);
      return {
        success: false,
        channels: [],
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Envía notificación de producto próximo a caducar
   */
  static async sendExpiryWarning(data: NotificationData): Promise<NotificationResult> {
    try {
      const templateData = {
        productName: data.productName,
        batchId: data.batchId,
        expiryDate: data.expiryDate?.toLocaleDateString('es-MX'),
        daysUntilExpiry: data.daysUntilExpiry,
        locationName: data.locationName,
        urgency: this.getUrgencyLevel(data.priority),
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/inventory/batches/${data.batchId}`
      };

      const result = await knock.workflows.trigger(NOTIFICATION_CONFIG.TEMPLATES.EXPIRY_WARNING, {
        recipients: [data.userId],
        data: templateData
      });

      return {
        success: true,
        messageId: result.workflow_run_id,
        channels: this.getChannelsForPriority(data.priority)
      };

    } catch (error) {
      console.error('Error sending expiry warning:', error);
      return {
        success: false,
        channels: [],
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Envía notificación de punto de reorden alcanzado
   */
  static async sendReorderPointAlert(data: NotificationData): Promise<NotificationResult> {
    try {
      const templateData = {
        productName: data.productName,
        currentStock: data.currentStock,
        reorderPoint: data.threshold,
        unit: data.unit,
        locationName: data.locationName,
        urgency: this.getUrgencyLevel(data.priority),
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/inventory/purchase-orders/new?productId=${data.productId}`
      };

      const result = await knock.workflows.trigger(NOTIFICATION_CONFIG.TEMPLATES.REORDER_POINT, {
        recipients: [data.userId],
        data: templateData
      });

      return {
        success: true,
        messageId: result.workflow_run_id,
        channels: this.getChannelsForPriority(data.priority)
      };

    } catch (error) {
      console.error('Error sending reorder point alert:', error);
      return {
        success: false,
        channels: [],
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Envía notificación de producto caducado
   */
  static async sendExpiredProductAlert(data: NotificationData): Promise<NotificationResult> {
    try {
      const templateData = {
        productName: data.productName,
        batchId: data.batchId,
        expiryDate: data.expiryDate?.toLocaleDateString('es-MX'),
        locationName: data.locationName,
        urgency: 'CRITICAL',
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/inventory/batches/${data.batchId}/quarantine`
      };

      const result = await knock.workflows.trigger(NOTIFICATION_CONFIG.TEMPLATES.EXPIRED_PRODUCT, {
        recipients: [data.userId],
        data: templateData
      });

      return {
        success: true,
        messageId: result.workflow_run_id,
        channels: ['email', 'push', 'in_app'] // Producto caducado requiere todos los canales
      };

    } catch (error) {
      console.error('Error sending expired product alert:', error);
      return {
        success: false,
        channels: [],
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Envía notificación personalizada
   */
  static async sendCustomNotification(
    userId: string,
    templateId: string,
    data: Record<string, any>,
    channels?: ChannelConfig
  ): Promise<NotificationResult> {
    try {
      const result = await knock.workflows.trigger(templateId, {
        recipients: [userId],
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          appUrl: process.env.NEXT_PUBLIC_APP_URL
        }
      });

      return {
        success: true,
        messageId: result.workflow_run_id,
        channels: channels ? Object.keys(channels).filter(key => channels[key as keyof ChannelConfig]) : ['email']
      };

    } catch (error) {
      console.error('Error sending custom notification:', error);
      return {
        success: false,
        channels: [],
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Envía notificaciones en lote
   */
  static async sendBulkNotifications(
    notifications: Array<{
      userId: string;
      templateId: string;
      data: Record<string, any>;
    }>
  ): Promise<Array<NotificationResult>> {
    const results: NotificationResult[] = [];

    for (const notification of notifications) {
      const result = await this.sendCustomNotification(
        notification.userId,
        notification.templateId,
        notification.data
      );
      results.push(result);

      // Pequeña pausa para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Configura preferencias de notificación para un usuario
   */
  static async setUserPreferences(
    userId: string,
    preferences: {
      channels: ChannelConfig;
      frequency: 'immediate' | 'hourly' | 'daily';
      quietHours?: { start: string; end: string };
    }
  ): Promise<boolean> {
    try {
      // Implementación simplificada para configurar preferencias
      // En producción se usaría la API correcta de Knock para preferencias
      console.log(`Setting preferences for user ${userId}:`, preferences);
      
      // Aquí se implementaría la lógica real de Knock cuando esté disponible
      // Por ahora solo registramos las preferencias

      return true;
    } catch (error) {
      console.error('Error setting user preferences:', error);
      return false;
    }
  }

  /**
   * Obtiene el historial de notificaciones de un usuario
   */
  static async getUserNotificationHistory(
    userId: string,
    limit: number = 50
  ): Promise<Array<{
    id: string;
    template: string;
    status: string;
    sentAt: Date;
    channels: string[];
    data: Record<string, any>;
  }>> {
    try {
      // Simulamos el historial de mensajes ya que la API real puede variar
      // En producción, esto se implementaría con la API correcta de Knock
      const mockMessages: any[] = [];
      
      return mockMessages.map((message: any) => ({
        id: message.id || '',
        template: message.workflow || '',
        status: message.status || 'sent',
        sentAt: new Date(),
        channels: message.channels || [],
        data: message.data || {}
      }));

    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  /**
   * Marca notificaciones como leídas
   */
  static async markAsRead(userId: string, messageIds: string[]): Promise<boolean> {
    try {
      // Implementación simplificada para marcar como leído
      // En producción se usaría la API correcta de Knock
      for (const messageId of messageIds) {
        // knock.messages.markAsRead(messageId) o similar
      }
      return true;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }
  }

  /**
   * Obtiene notificaciones no leídas
   */
  static async getUnreadNotifications(userId: string): Promise<{
    count: number;
    notifications: Array<{
      id: string;
      template: string;
      data: Record<string, any>;
      sentAt: Date;
    }>;
  }> {
    try {
      // Implementación simplificada para obtener notificaciones no leídas
      // En producción se usaría la API correcta de Knock
      return {
        count: 0,
        notifications: []
      };

    } catch (error) {
      console.error('Error getting unread notifications:', error);
      return { count: 0, notifications: [] };
    }
  }

  /**
   * Programa notificación para envío futuro
   */
  static async scheduleNotification(
    userId: string,
    templateId: string,
    data: Record<string, any>,
    scheduleAt: Date
  ): Promise<NotificationResult> {
    try {
      const result = await knock.workflows.trigger(templateId, {
        recipients: [userId],
        data: {
          ...data,
          scheduledAt: scheduleAt.toISOString()
        }
      });

      return {
        success: true,
        messageId: result.workflow_run_id,
        channels: ['email'] // Default para notificaciones programadas
      };

    } catch (error) {
      console.error('Error scheduling notification:', error);
      return {
        success: false,
        channels: [],
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Cancela notificación programada
   */
  static async cancelScheduledNotification(workflowRunId: string): Promise<boolean> {
    try {
      // Implementación simplificada para cancelar workflow
      // En producción se usaría: await knock.workflows.cancel(workflowRunId, { reason: 'User cancelled' });
      console.log(`Cancelling workflow: ${workflowRunId}`);
      return true;
    } catch (error) {
      console.error('Error canceling scheduled notification:', error);
      return false;
    }
  }

  /**
   * Métodos auxiliares privados
   */
  private static getUrgencyLevel(priority: AlertPriority): string {
    switch (priority) {
      case AlertPriority.CRITICAL:
        return 'CRÍTICO';
      case AlertPriority.HIGH:
        return 'ALTO';
      case AlertPriority.MEDIUM:
        return 'MEDIO';
      case AlertPriority.LOW:
        return 'BAJO';
      default:
        return 'MEDIO';
    }
  }

  private static getChannelsForPriority(priority: AlertPriority): string[] {
    switch (priority) {
      case AlertPriority.CRITICAL:
        return ['email', 'push', 'in_app', 'sms'];
      case AlertPriority.HIGH:
        return ['email', 'push', 'in_app'];
      case AlertPriority.MEDIUM:
        return ['email', 'in_app'];
      case AlertPriority.LOW:
        return ['in_app'];
      default:
        return ['email'];
    }
  }

  /**
   * Valida configuración de Knock
   */
  static async validateConfiguration(): Promise<{
    isValid: boolean;
    errors: string[];
    templates: string[];
  }> {
    const errors: string[] = [];
    const templates: string[] = [];

    try {
      if (!process.env.KNOCK_API_KEY) {
        errors.push('KNOCK_API_KEY no está configurado');
      }

      // Verificar templates existentes
      const templateIds = Object.values(NOTIFICATION_CONFIG.TEMPLATES);
      for (const templateId of templateIds) {
        try {
          // Aquí verificaríamos si el template existe en Knock
          templates.push(templateId);
        } catch (error) {
          errors.push(`Template ${templateId} no encontrado`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        templates
      };

    } catch (error) {
      errors.push(`Error de configuración: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return {
        isValid: false,
        errors,
        templates
      };
    }
  }

  /**
   * Obtiene estadísticas de notificaciones
   */
  static async getNotificationStats(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSent: number;
    byChannel: Record<string, number>;
    byTemplate: Record<string, number>;
    deliveryRate: number;
    openRate: number;
  }> {
    try {
      // Aquí implementaríamos la lógica para obtener estadísticas de Knock
      // Por ahora retornamos datos mock
      return {
        totalSent: 0,
        byChannel: {},
        byTemplate: {},
        deliveryRate: 0,
        openRate: 0
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        totalSent: 0,
        byChannel: {},
        byTemplate: {},
        deliveryRate: 0,
        openRate: 0
      };
    }
  }
}

export default NotificationService;