import { FormData } from '../types';

const STORAGE_KEY = 'tramboory-reservation-form';

export const saveFormDataToStorage = (formData: FormData): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Safely serialize eventDate
    let eventDateString: string | null = null;
    if (formData.eventDate) {
      if (formData.eventDate instanceof Date && !isNaN(formData.eventDate.getTime())) {
        eventDateString = formData.eventDate.toISOString();
      }
    }
    
    const dataToSave = {
      ...formData,
      eventDate: eventDateString,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Error saving form data to storage:', error);
  }
};

export const loadFormDataFromStorage = (): Partial<FormData> | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return null;
    
    const parsed = JSON.parse(savedData);
    const savedTimestamp = new Date(parsed.timestamp);
    const currentTime = new Date();
    const hoursSinceSaved = (currentTime.getTime() - savedTimestamp.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceSaved > 24) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    // Safely deserialize eventDate
    let eventDate: Date | null = null;
    if (parsed.eventDate) {
      try {
        const dateObj = new Date(parsed.eventDate);
        if (!isNaN(dateObj.getTime())) {
          eventDate = dateObj;
        }
      } catch {
        // Invalid date string, keep as null
      }
    }
    
    return {
      ...parsed,
      eventDate: eventDate,
      timestamp: undefined
    };
  } catch (error) {
    console.error('Error loading form data from storage:', error);
    return null;
  }
};

export const clearFormDataFromStorage = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing form data from storage:', error);
  }
};