// Uber Nordic Design Tokens
// Based on Uber's design principles with Nordic minimalism

export const nordicTokens = {
  // Colors - Muted Nordic palette
  colors: {
    // Background colors
    background: {
      primary: '#FFFFFF',
      secondary: '#FAFBFC', 
      tertiary: '#F5F6F7',
      overlay: '#000000/4', // 4% black overlay
    },
    
    // Text colors  
    text: {
      primary: '#1A1B1F',     // Near black
      secondary: '#5A5D66',   // Medium gray
      tertiary: '#9CA0A6',    // Light gray
      disabled: '#D1D4D9',    // Very light gray
    },
    
    // Border colors
    border: {
      primary: '#E5E7EB',     // Light gray
      secondary: '#F3F4F6',   // Very light gray
      focus: '#2563EB',       // Blue focus
      error: '#DC2626',       // Red error
    },
    
    // Action colors
    action: {
      primary: '#1A1B1F',     // Near black
      secondary: '#5A5D66',   // Medium gray
      success: '#059669',     // Green
      warning: '#D97706',     // Orange  
      danger: '#DC2626',      // Red
    },
    
    // Status colors (muted)
    status: {
      active: '#10B981',      // Soft green
      inactive: '#9CA3AF',    // Gray
      warning: '#F59E0B',     // Amber
      error: '#EF4444',       // Red
    }
  },
  
  // Spacing - 4px base unit
  spacing: {
    xs: '4px',    // 0.25rem
    sm: '8px',    // 0.5rem  
    md: '12px',   // 0.75rem
    lg: '16px',   // 1rem
    xl: '20px',   // 1.25rem
    '2xl': '24px', // 1.5rem
    '3xl': '32px', // 2rem
    '4xl': '40px', // 2.5rem
    '5xl': '48px', // 3rem
    '6xl': '64px', // 4rem
  },
  
  // Typography
  typography: {
    fontFamily: {
      primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    },
    fontSize: {
      xs: '12px',   // 0.75rem
      sm: '14px',   // 0.875rem
      base: '16px', // 1rem
      lg: '18px',   // 1.125rem
      xl: '20px',   // 1.25rem
      '2xl': '24px', // 1.5rem
      '3xl': '30px', // 1.875rem
      '4xl': '36px', // 2.25rem
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    }
  },
  
  // Border radius
  radius: {
    none: '0px',
    sm: '4px',
    md: '8px', 
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  
  // Shadows - Subtle Nordic style
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  // Animation timing
  transition: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  }
} as const;

// CSS Custom Properties Generator
export const generateCSSVariables = () => {
  const variables: Record<string, string> = {};
  
  const flatten = (obj: any, prefix = '') => {
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}-${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        flatten(value, newKey);
      } else {
        variables[`--nordic-${newKey}`] = value;
      }
    });
  };
  
  flatten(nordicTokens);
  return variables;
};

// Type-safe token access
export type NordicTokens = typeof nordicTokens;