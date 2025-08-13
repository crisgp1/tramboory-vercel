# Auth Components Migration Specification

This document provides detailed specifications for migrating the authentication components from HeroUI to Mantine.

## LogoutButton Component Migration

### Current Implementation Analysis
- **File**: `components/auth/LogoutButton.tsx`
- **Dependencies**: HeroUI Button component
- **Used by**: SimpleHeader, SupplierDashboardUber, and other supplier components

### Migration Specification

#### Props Interface Update
```typescript
// Current HeroUI interface:
interface LogoutButtonProps {
  variant?: "solid" | "bordered" | "light" | "flat" | "faded" | "shadow" | "ghost";
  size?: "sm" | "md" | "lg";
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

// New Mantine interface:
interface LogoutButtonProps {
  variant?: "filled" | "outline" | "subtle" | "light" | "default";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "gray" | "red" | "pink" | "grape" | "violet" | "indigo" | "blue" | "cyan" | "green" | "lime" | "yellow" | "orange" | "teal";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}
```

#### Component Implementation
```typescript
"use client";

import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@mantine/core";
import { ArrowRightEndOnRectangleIcon } from "@heroicons/react/24/outline";

// Map HeroUI variants to Mantine variants
const mapVariantToMantine = (variant: string) => {
  const variantMap: Record<string, string> = {
    'solid': 'filled',
    'bordered': 'outline',
    'light': 'subtle',
    'flat': 'light',
    'faded': 'light',
    'shadow': 'filled',
    'ghost': 'subtle'
  };
  return variantMap[variant] || 'outline';
};

// Map HeroUI colors to Mantine colors
const mapColorToMantine = (color: string) => {
  const colorMap: Record<string, string> = {
    'default': 'gray',
    'primary': 'blue',
    'secondary': 'gray',
    'success': 'green',
    'warning': 'yellow',
    'danger': 'red'
  };
  return colorMap[color] || 'red';
};

export default function LogoutButton({ 
  variant = "outline",
  size = "md",
  color = "red",
  className = "",
  showIcon = true,
  children
}: LogoutButtonProps) {
  return (
    <SignOutButton redirectUrl="/">
      <Button
        variant={mapVariantToMantine(variant)}
        size={size}
        color={mapColorToMantine(color)}
        className={className}
        leftSection={showIcon ? <ArrowRightEndOnRectangleIcon className="w-4 h-4" /> : undefined}
      >
        {children || "Cerrar Sesión"}
      </Button>
    </SignOutButton>
  );
}
```

#### Key Changes
1. Replace `@heroui/react` import with `@mantine/core`
2. Update `startContent` prop to `leftSection`
3. Add variant and color mapping utilities
4. Maintain all existing functionality

## SimpleHeader Component Migration

### Current Implementation Analysis
- **File**: `components/auth/SimpleHeader.tsx`
- **Dependencies**: HeroUI Button, Avatar, Dropdown components
- **Used by**: SupplierDashboardUber and other supplier pages

### Migration Specification

#### Component Implementation
```typescript
"use client";

import { useUser } from "@clerk/nextjs";
import { Button, Avatar, Menu, Group, Text, Loader, Paper } from "@mantine/core";
import { UserIcon, HomeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

interface SimpleHeaderProps {
  title?: string;
  showHomeLink?: boolean;
  className?: string;
}

export default function SimpleHeader({ 
  title = "Tramboory",
  showHomeLink = true,
  className = ""
}: SimpleHeaderProps) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <Paper component="header" shadow="sm" p="md" className={className} withBorder>
        <Group justify="space-between" maw="7xl" mx="auto">
          <Text size="xl" fw={700}>{title}</Text>
          <Loader size="sm" />
        </Group>
      </Paper>
    );
  }

  return (
    <Paper component="header" shadow="sm" p="md" className={className} withBorder>
      <Group justify="space-between" maw="7xl" mx="auto">
        {/* Title/Logo */}
        <Group gap="md">
          {showHomeLink && (
            <Button
              component={Link}
              href="/"
              variant="subtle"
              size="sm"
              leftSection={<HomeIcon className="w-4 h-4" />}
              color="gray"
            >
              Inicio
            </Button>
          )}
          <Text size="xl" fw={700}>{title}</Text>
        </Group>

        {/* User Menu */}
        <Group gap="sm">
          {user ? (
            <>
              {/* Desktop View */}
              <Group gap="sm" visibleFrom="md">
                <div style={{ textAlign: 'right' }}>
                  <Text size="sm" fw={500}>
                    {user.firstName} {user.lastName}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {user.primaryEmailAddress?.emailAddress}
                  </Text>
                </div>
                <Avatar
                  src={user.imageUrl}
                  name={user.firstName || "Usuario"}
                  size="sm"
                />
                <LogoutButton size="sm" />
              </Group>

              {/* Mobile View */}
              <Group hiddenFrom="md">
                <Menu shadow="md" width={250}>
                  <Menu.Target>
                    <Avatar
                      src={user.imageUrl}
                      name={user.firstName || "Usuario"}
                      size="sm"
                      style={{ cursor: 'pointer' }}
                    />
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item>
                      <div>
                        <Text fw={500}>{user.firstName} {user.lastName}</Text>
                        <Text size="xs" c="dimmed">
                          {user.primaryEmailAddress?.emailAddress}
                        </Text>
                      </div>
                    </Menu.Item>
                    {showHomeLink && (
                      <Menu.Item
                        leftSection={<HomeIcon className="w-4 h-4" />}
                        onClick={() => window.location.href = "/"}
                      >
                        Inicio
                      </Menu.Item>
                    )}
                    <Menu.Item color="red">
                      <LogoutButton 
                        variant="subtle" 
                        color="red" 
                        size="sm"
                        className="w-full"
                      />
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </>
          ) : (
            <Button component={Link} href="/sign-in" color="blue" size="sm">
              Iniciar Sesión
            </Button>
          )}
        </Group>
      </Group>
    </Paper>
  );
}
```

#### Key Changes
1. Replace HeroUI components with Mantine equivalents:
   - `Dropdown` → `Menu`
   - `DropdownTrigger` → `Menu.Target`
   - `DropdownMenu` → `Menu.Dropdown`
   - `DropdownItem` → `Menu.Item`
   - Custom header styling → `Paper` component

2. Layout updates:
   - Replace CSS classes with Mantine props
   - Use `Group` for horizontal layouts
   - Use `Text` component for typography
   - Use `visibleFrom` and `hiddenFrom` for responsive design

3. Event handling:
   - Update `onPress` to `onClick`
   - Maintain existing navigation logic

## Migration Validation Checklist

### LogoutButton Component
- [ ] Replace HeroUI Button import with Mantine Button
- [ ] Update `startContent` to `leftSection`
- [ ] Add variant mapping utility
- [ ] Add color mapping utility
- [ ] Test all variant combinations
- [ ] Verify icon positioning
- [ ] Test responsive behavior

### SimpleHeader Component
- [ ] Replace HeroUI imports with Mantine imports
- [ ] Convert Dropdown to Menu structure
- [ ] Replace CSS classes with Mantine props
- [ ] Update responsive design approach
- [ ] Test mobile dropdown functionality
- [ ] Verify avatar display
- [ ] Test loading state
- [ ] Validate navigation links

## Testing Requirements

### Visual Testing
- [ ] Compare side-by-side with original design
- [ ] Test on mobile devices
- [ ] Test on tablet devices
- [ ] Test on desktop
- [ ] Verify color schemes match

### Functional Testing
- [ ] Test logout functionality
- [ ] Test navigation links
- [ ] Test responsive menu toggle
- [ ] Test user avatar display
- [ ] Test loading states
- [ ] Test with and without user authentication

### Accessibility Testing
- [ ] Verify keyboard navigation
- [ ] Check ARIA labels
- [ ] Test with screen readers
- [ ] Verify focus management

## Dependencies Impact

### Components that use LogoutButton:
- SimpleHeader
- SupplierDashboardUber
- Mobile navigation menus

### Components that use SimpleHeader:
- SupplierDashboardUber (fallback when no data)
- Other supplier pages
- General layout components

## Implementation Notes

1. **Backwards Compatibility**: The migrated components should maintain the same props interface to minimize breaking changes.

2. **Styling Consistency**: Use Mantine's theme system to ensure consistent styling across all components.

3. **Performance**: Mantine components should provide better performance due to optimized rendering.

4. **Bundle Size**: Verify that the migration doesn't significantly increase bundle size.

5. **Theme Integration**: Ensure components work correctly with both light and dark themes if applicable.

This specification should guide the implementation of the auth component migration while maintaining functionality and improving the overall user experience.