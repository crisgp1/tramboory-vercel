/**
 * Migration utilities for HeroUI to Mantine component migration
 * This file contains utility functions to map HeroUI props to Mantine equivalents
 */

/**
 * Maps HeroUI colors to Mantine colors
 */
export const mapHeroUIColorToMantine = (heroUIColor: string): string => {
  const colorMap: Record<string, string> = {
    'primary': 'blue',
    'secondary': 'gray',
    'success': 'green',
    'warning': 'yellow',
    'danger': 'red',
    'default': 'gray'
  };
  return colorMap[heroUIColor] || 'blue';
};

/**
 * Maps HeroUI button variants to Mantine button variants
 */
export const mapHeroUIVariantToMantine = (heroUIVariant: string): string => {
  const variantMap: Record<string, string> = {
    'solid': 'filled',
    'bordered': 'outline',
    'light': 'subtle',
    'flat': 'light',
    'faded': 'light',
    'shadow': 'filled',
    'ghost': 'subtle'
  };
  return variantMap[heroUIVariant] || 'filled';
};

/**
 * Maps HeroUI sizes to Mantine sizes (both libraries use similar conventions)
 */
export const mapHeroUISize = (heroUISize: string): string => {
  const validSizes = ['xs', 'sm', 'md', 'lg', 'xl'];
  return validSizes.includes(heroUISize) ? heroUISize : 'md';
};

/**
 * Maps HeroUI chip/badge colors to Mantine badge colors
 */
export const mapHeroUIChipColorToMantine = (heroUIColor: string): string => {
  const colorMap: Record<string, string> = {
    'primary': 'blue',
    'secondary': 'gray',
    'success': 'green',
    'warning': 'yellow',
    'danger': 'red',
    'default': 'gray'
  };
  return colorMap[heroUIColor] || 'gray';
};

/**
 * Maps HeroUI chip/badge variants to Mantine badge variants
 */
export const mapHeroUIChipVariantToMantine = (heroUIVariant: string): string => {
  const variantMap: Record<string, string> = {
    'solid': 'filled',
    'bordered': 'outline',
    'light': 'light',
    'flat': 'light',
    'faded': 'light',
    'shadow': 'filled',
    'dot': 'dot'
  };
  return variantMap[heroUIVariant] || 'light';
};

/**
 * Common responsive breakpoints mapping
 */
export const responsiveBreakpoints = {
  xs: 'xs',
  sm: 'sm', 
  md: 'md',
  lg: 'lg',
  xl: 'xl'
} as const;

/**
 * Utility to convert HeroUI className responsive patterns to Mantine responsive props
 */
export const convertResponsiveProps = (baseValue: any, smValue?: any, mdValue?: any, lgValue?: any, xlValue?: any) => {
  const responsiveObj: any = { base: baseValue };
  
  if (smValue !== undefined) responsiveObj.sm = smValue;
  if (mdValue !== undefined) responsiveObj.md = mdValue;
  if (lgValue !== undefined) responsiveObj.lg = lgValue;
  if (xlValue !== undefined) responsiveObj.xl = xlValue;
  
  return responsiveObj;
};

/**
 * Maps common HeroUI progress colors to Mantine progress colors
 */
export const mapProgressColor = (heroUIColor: string): string => {
  const colorMap: Record<string, string> = {
    'primary': 'blue',
    'secondary': 'gray',
    'success': 'green',
    'warning': 'yellow',
    'danger': 'red',
    'default': 'blue'
  };
  return colorMap[heroUIColor] || 'blue';
};

/**
 * Event handler conversion utilities
 */
export const eventHandlerMap = {
  onPress: 'onClick',
  onValueChange: 'onChange',
  onSelectionChange: 'onChange'
} as const;

/**
 * Convert HeroUI event handlers to Mantine equivalents
 */
export const convertEventHandler = (heroUIEvent: string): string => {
  return eventHandlerMap[heroUIEvent as keyof typeof eventHandlerMap] || heroUIEvent;
};

/**
 * Utility to merge className with Mantine props
 */
export const mergeClassNameWithProps = (className?: string, mantineProps?: Record<string, any>) => {
  return {
    ...mantineProps,
    className: className ? `${mantineProps?.className || ''} ${className}`.trim() : mantineProps?.className
  };
};

/**
 * Common spacing values used in the project
 */
export const spacing = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl'
} as const;

/**
 * Convert Tailwind spacing to Mantine spacing
 */
export const convertTailwindSpacing = (tailwindClass: string): string => {
  const spacingMap: Record<string, string> = {
    'gap-1': 'xs',
    'gap-2': 'xs',
    'gap-3': 'sm',
    'gap-4': 'md',
    'gap-6': 'lg',
    'gap-8': 'xl',
    'space-y-1': 'xs',
    'space-y-2': 'xs', 
    'space-y-3': 'sm',
    'space-y-4': 'md',
    'space-y-6': 'lg',
    'space-y-8': 'xl'
  };
  
  return spacingMap[tailwindClass] || 'md';
};

/**
 * Type definitions for better TypeScript support
 */
export type HeroUIColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default';
export type MantineColor = 'blue' | 'gray' | 'green' | 'yellow' | 'red' | 'cyan' | 'pink' | 'grape' | 'violet' | 'indigo' | 'lime' | 'orange' | 'teal';
export type HeroUIVariant = 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'ghost';
export type MantineVariant = 'filled' | 'outline' | 'subtle' | 'light' | 'default';
export type CommonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Component migration helpers
 */
export const migrationHelpers = {
  /**
   * Convert HeroUI Card props to Mantine Paper props
   */
  convertCardProps: (heroUIProps: any) => {
    return {
      withBorder: heroUIProps.bordered !== false,
      shadow: heroUIProps.shadow ? 'sm' : undefined,
      p: heroUIProps.padding || 'md',
      ...mergeClassNameWithProps(heroUIProps.className)
    };
  },

  /**
   * Convert HeroUI Button props to Mantine Button props  
   */
  convertButtonProps: (heroUIProps: any) => {
    return {
      variant: mapHeroUIVariantToMantine(heroUIProps.variant || 'solid'),
      color: mapHeroUIColorToMantine(heroUIProps.color || 'primary'),
      size: mapHeroUISize(heroUIProps.size || 'md'),
      leftSection: heroUIProps.startContent,
      rightSection: heroUIProps.endContent,
      loading: heroUIProps.isLoading,
      disabled: heroUIProps.isDisabled,
      ...mergeClassNameWithProps(heroUIProps.className)
    };
  },

  /**
   * Convert HeroUI Chip props to Mantine Badge props
   */
  convertChipProps: (heroUIProps: any) => {
    return {
      variant: mapHeroUIChipVariantToMantine(heroUIProps.variant || 'light'),
      color: mapHeroUIChipColorToMantine(heroUIProps.color || 'default'),
      size: mapHeroUISize(heroUIProps.size || 'sm'),
      ...mergeClassNameWithProps(heroUIProps.className)
    };
  }
};