import { 
  createTheme, 
  MantineColorsTuple, 
  Button, 
  Paper, 
  Card,
  Modal,
  TextInput,
  NumberInput,
  Select,
  Checkbox,
  Radio
} from '@mantine/core';

// Custom color palette siguiendo las Laws of UX para consistencia visual
const brandPink: MantineColorsTuple = [
  '#fdf2f8',
  '#fce7f3', 
  '#fbcfe8',
  '#f9a8d4',
  '#f472b6',
  '#ec4899', // Primary brand color
  '#db2777',
  '#be185d',
  '#9d174d',
  '#831843'
];

const brandViolet: MantineColorsTuple = [
  '#f5f3ff',
  '#ede9fe',
  '#ddd6fe', 
  '#c4b5fd',
  '#a78bfa',
  '#8b5cf6', // Secondary brand color
  '#7c3aed',
  '#6d28d9',
  '#5b21b6',
  '#4c1d95'
];

// Tema principal aplicando Aesthetic-Usability Effect y consistencia
export const trambooryTheme = createTheme({
  primaryColor: 'brandPink',
  defaultRadius: 'md',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '2rem', lineHeight: '2.5rem' },
      h2: { fontSize: '1.5rem', lineHeight: '2rem' },
      h3: { fontSize: '1.25rem', lineHeight: '1.75rem' },
      h4: { fontSize: '1.125rem', lineHeight: '1.5rem' }
    }
  },
  
  colors: {
    brandPink,
    brandViolet,
    // Colores semánticos para reducir Cognitive Load
    success: [
      '#f0fdf4',
      '#dcfce7',
      '#bbf7d0',
      '#86efac',
      '#4ade80',
      '#22c55e',
      '#16a34a',
      '#15803d',
      '#166534',
      '#14532d'
    ],
    warning: [
      '#fefce8',
      '#fef3c7',
      '#fde68a',
      '#fcd34d',
      '#fbbf24',
      '#f59e0b',
      '#d97706',
      '#b45309',
      '#92400e',
      '#78350f'
    ],
    danger: [
      '#fef2f2',
      '#fee2e2',
      '#fecaca',
      '#fca5a5',
      '#f87171',
      '#ef4444',
      '#dc2626',
      '#b91c1c',
      '#991b1b',
      '#7f1d1d'
    ]
  },

  // Spacing consistente siguiendo 8pt grid system
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },

  // Breakpoints para responsive design mobile-first
  breakpoints: {
    xs: '36em', // 576px
    sm: '48em', // 768px
    md: '62em', // 992px
    lg: '75em', // 1200px
    xl: '87.5em' // 1400px
  },

  // Component-specific styles para consistencia
  components: {
    Button: Button.extend({
      defaultProps: {
        radius: 'md',
        size: 'md'
      },
      styles: (theme) => ({
        root: {
          fontWeight: 500,
          transition: 'all 150ms ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          }
        }
      })
    }),

    Paper: Paper.extend({
      defaultProps: {
        shadow: 'xs',
        radius: 'md',
        p: 'md'
      },
      styles: {
        root: {
          transition: 'box-shadow 150ms ease',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
          }
        }
      }
    }),

    Card: Card.extend({
      defaultProps: {
        shadow: 'sm',
        radius: 'md',
        withBorder: true,
        padding: 'md'
      },
      styles: (theme) => ({
        root: {
          border: `1px solid ${theme.colors.gray[2]}`,
          transition: 'all 150ms ease',
          '&:hover': {
            borderColor: theme.colors.gray[3],
            boxShadow: theme.shadows.md,
            transform: 'translateY(-1px)'
          }
        }
      })
    }),

    Modal: Modal.extend({
      defaultProps: {
        centered: true,
        overlayProps: { opacity: 0.4, blur: 3 },
        radius: 'md',
        shadow: 'xl'
      }
    }),

    TextInput: TextInput.extend({
      defaultProps: {
        radius: 'md',
        size: 'md'
      },
      styles: (theme) => ({
        input: {
          borderColor: theme.colors.gray[3],
          '&:focus': {
            borderColor: theme.colors.brandPink[5]
          }
        }
      })
    }),

    NumberInput: NumberInput.extend({
      defaultProps: {
        radius: 'md',
        size: 'md'
      },
      styles: (theme) => ({
        input: {
          borderColor: theme.colors.gray[3],
          '&:focus': {
            borderColor: theme.colors.brandPink[5]
          }
        }
      })
    }),

    Select: Select.extend({
      defaultProps: {
        radius: 'md',
        size: 'md'
      },
      styles: (theme) => ({
        input: {
          borderColor: theme.colors.gray[3],
          '&:focus': {
            borderColor: theme.colors.brandPink[5]
          }
        }
      })
    }),

    Checkbox: Checkbox.extend({
      defaultProps: {
        color: 'brandPink',
        radius: 'sm'
      }
    }),

    Radio: Radio.extend({
      defaultProps: {
        color: 'brandPink'
      }
    })
  },

  // Shadows personalizados para depth hierarchy
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  }
});

// Utility functions para consistencia
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'success.6';
    case 'pending': 
      return 'warning.6';
    case 'cancelled':
      return 'danger.6';
    case 'completed':
      return 'brandViolet.6';
    default:
      return 'gray.6';
  }
};

export const getPriorityColor = (priority: 'primary' | 'secondary' | 'neutral') => {
  switch (priority) {
    case 'primary':
      return 'brandPink.6';
    case 'secondary':
      return 'brandViolet.6';
    case 'neutral':
      return 'gray.6';
  }
};

// Responsive breakpoints helper
export const breakpoints = {
  xs: 576,
  sm: 768,
  md: 992,
  lg: 1200,
  xl: 1400
} as const;