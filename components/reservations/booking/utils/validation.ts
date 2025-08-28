import { FormData, ValidationResult, StepType } from '../types';

export const validateStep = (step: StepType, formData: FormData): ValidationResult => {
  const errors: string[] = [];
  
  switch (step) {
    case 'basic':
      if (!formData.childName.trim()) {
        errors.push('El nombre del niño es requerido');
      }
      if (!formData.childAge) {
        errors.push('La edad del niño es requerida');
      } else {
        const age = parseInt(formData.childAge);
        if (isNaN(age) || age < 1 || age > 18) {
          errors.push('La edad debe estar entre 1 y 18 años');
        }
      }
      if (!formData.customerPhone.trim()) {
        errors.push('El teléfono de contacto es requerido');
      } else if (!validatePhone(formData.customerPhone)) {
        errors.push('El formato del teléfono no es válido');
      }
      break;
      
    case 'datetime':
      if (!formData.eventDate) {
        errors.push('La fecha del evento es requerida');
      }
      if (!formData.eventTime) {
        errors.push('La hora del evento es requerida');
      }
      break;
      
    case 'package':
      if (!formData.packageId) {
        errors.push('Debes seleccionar un paquete');
      }
      
      const adultCount = parseInt(formData.adultCount) || 0;
      const kidsCount = parseInt(formData.kidsCount) || 0;
      const totalGuests = adultCount + kidsCount;
      
      if (formData.adultCount === '' && formData.kidsCount === '') {
        errors.push('Debes especificar el número de invitados');
      } else if (totalGuests === 0) {
        errors.push('Debe haber al menos un invitado');
      } else if (adultCount < 0 || kidsCount < 0) {
        errors.push('El número de invitados no puede ser negativo');
      }
      break;
      
    case 'payment':
      if (!formData.paymentMethod) {
        errors.push('Debes seleccionar un método de pago');
      }
      if (!formData.termsAccepted) {
        errors.push('Debes aceptar los términos y condiciones');
      }
      break;
      
    case 'food':
    case 'extras':
    case 'confirmation':
      // Estos pasos son opcionales o no requieren validación
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(phone) && cleanedPhone.length >= 10;
};

export const validateCouponCode = (code: string): boolean => {
  // Implementar lógica real de validación de cupones
  return code.length >= 4 && /^[A-Z0-9]+$/i.test(code);
};