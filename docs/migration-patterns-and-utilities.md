# Migration Patterns and Utilities

This document outlines the shared patterns and utilities to be created during the HeroUI to Mantine migration process.

## Migration Utility Functions

### Color Mapping Utility
Create a utility function to map HeroUI colors to Mantine colors:

```typescript
// lib/migration-utils.ts
export const mapHeroUIColorToMantine = (heroUIColor: string) => {
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
```

### Variant Mapping Utility
Create a utility to map HeroUI button variants to Mantine:

```typescript
export const mapHeroUIVariantToMantine = (heroUIVariant: string) => {
  const variantMap: Record<string, string> = {
    'solid': 'filled',
    'bordered': 'outline',
    'light': 'subtle',
    'flat': 'light',
    'ghost': 'subtle'
  };
  return variantMap[heroUIVariant] || 'filled';
};
```

### Size Mapping Utility
Create a utility for consistent size mapping:

```typescript
export const mapHeroUISize = (heroUISize: string) => {
  // Both libraries use similar conventions, so direct mapping
  const validSizes = ['xs', 'sm', 'md', 'lg', 'xl'];
  return validSizes.includes(heroUISize) ? heroUISize : 'md';
};
```

## Common Component Patterns

### Card Pattern
Create a consistent pattern for converting HeroUI Card to Mantine Paper:

```typescript
// Replace this HeroUI pattern:
<Card className="border border-gray-200">
  <CardBody className="p-4">
    {children}
  </CardBody>
</Card>

// With this Mantine pattern:
<Paper withBorder p="md" shadow="sm">
  {children}
</Paper>
```

### Button Pattern
Standardize button conversion:

```typescript
// Replace this HeroUI pattern:
<Button 
  color="primary" 
  variant="solid" 
  size="sm"
  onPress={handleClick}
>
  Click me
</Button>

// With this Mantine pattern:
<Button 
  color="blue" 
  variant="filled" 
  size="sm"
  onClick={handleClick}
>
  Click me
</Button>
```

### Modal Pattern
Standardize modal conversion:

```typescript
// Replace this HeroUI pattern:
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalContent>
    {(onClose) => (
      <>
        <ModalHeader className="flex flex-col gap-1">
          <h2>Title</h2>
        </ModalHeader>
        <ModalBody>
          {content}
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose}>Close</Button>
        </ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>

// With this Mantine pattern:
<Modal opened={opened} onClose={close} title="Title">
  {content}
  <Group justify="flex-end" mt="md">
    <Button onClick={close}>Close</Button>
  </Group>
</Modal>
```

## Layout Conversion Patterns

### Grid Systems
Replace Tailwind CSS grid with Mantine components:

```typescript
// Replace:
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

// With:
<SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md">
```

### Flexbox Layouts
Replace Tailwind flex classes with Mantine Group/Stack:

```typescript
// Replace:
<div className="flex items-center justify-between gap-2">

// With:
<Group justify="space-between" align="center" gap="xs">

// Replace:
<div className="space-y-4">

// With:
<Stack gap="md">
```

## Theme Integration Patterns

### CSS Custom Properties Replacement
Replace CSS custom properties with Mantine theme:

```typescript
// Replace:
style={{ backgroundColor: 'var(--primary)' }}

// With:
bg="blue.6" // or use theme colors
```

### Color Usage Patterns
Standardize color usage across components:

```typescript
// For primary actions
color="blue"

// For success states  
color="green"

// For warning states
color="yellow"

// For danger/error states
color="red"

// For neutral/secondary
color="gray"
```

## Component-Specific Patterns

### Table Conversion
Convert HeroUI tables to Mantine structure:

```typescript
// Replace HeroUI pattern:
<Table>
  <TableHeader>
    <TableColumn>Name</TableColumn>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John</TableCell>
    </TableRow>
  </TableBody>
</Table>

// With Mantine pattern:
<Table>
  <Table.Thead>
    <Table.Tr>
      <Table.Th>Name</Table.Th>
    </Table.Tr>
  </Table.Thead>
  <Table.Tbody>
    <Table.Tr>
      <Table.Td>John</Table.Td>
    </Table.Tr>
  </Table.Tbody>
</Table>
```

### Dropdown/Menu Conversion
Convert dropdowns to Mantine Menu:

```typescript
// Replace HeroUI pattern:
<Dropdown>
  <DropdownTrigger>
    <Button>Options</Button>
  </DropdownTrigger>
  <DropdownMenu>
    <DropdownItem>Edit</DropdownItem>
    <DropdownItem>Delete</DropdownItem>
  </DropdownMenu>
</Dropdown>

// With Mantine pattern:
<Menu>
  <Menu.Target>
    <Button>Options</Button>
  </Menu.Target>
  <Menu.Dropdown>
    <Menu.Item>Edit</Menu.Item>
    <Menu.Item>Delete</Menu.Item>
  </Menu.Dropdown>
</Menu>
```

## Form Patterns

### Input Field Conversion
Standardize form field conversion:

```typescript
// Replace HeroUI pattern:
<Input 
  label="Email"
  placeholder="Enter email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// With Mantine pattern:
<TextInput
  label="Email"
  placeholder="Enter email"
  value={email}
  onChange={(e) => setEmail(e.currentTarget.value)}
/>
```

### Form Validation Integration
Maintain form validation patterns:

```typescript
// Keep react-hook-form integration but update components:
<TextInput
  {...register('email')}
  label="Email"
  error={errors.email?.message}
/>
```

## State Management Patterns

### useDisclosure Hook
Both libraries have similar hooks, update import:

```typescript
// Replace:
import { useDisclosure } from "@heroui/react";

// With:
import { useDisclosure } from "@mantine/hooks";
```

### Modal State Management
Maintain consistent modal state patterns:

```typescript
const { opened, open, close } = useDisclosure(false);
```

## Styling Migration Patterns

### Responsive Design
Convert Tailwind responsive classes to Mantine props:

```typescript
// Replace Tailwind:
className="text-sm md:text-base lg:text-lg"

// With Mantine responsive props or custom styling:
size={{ base: 'sm', md: 'md', lg: 'lg' }}
```

### Custom Styling
Maintain custom styles using Mantine's styling approach:

```typescript
// Use Mantine's sx prop for custom styling:
sx={(theme) => ({
  backgroundColor: theme.colors.blue[0],
  '&:hover': {
    backgroundColor: theme.colors.blue[1],
  },
})}
```

## Icon Integration

### Heroicons with Mantine
Keep existing Heroicons but consider Tabler icons for consistency:

```typescript
// Current approach (keep):
import { ChevronRightIcon } from "@heroicons/react/24/outline";

// Or consider Tabler icons:
import { IconChevronRight } from "@tabler/icons-react";
```

## Migration Checklist Template

For each component migration, follow this checklist:

1. **Import Updates**
   - [ ] Replace HeroUI imports with Mantine imports
   - [ ] Update hook imports (@mantine/hooks)

2. **Component Structure**
   - [ ] Replace component names
   - [ ] Update nested component structure (Card → Paper, etc.)
   - [ ] Convert render prop patterns to standard patterns

3. **Props Migration**
   - [ ] Update color props (primary → blue)
   - [ ] Update variant props (solid → filled)
   - [ ] Update event handlers (onPress → onClick)
   - [ ] Replace className with Mantine props where possible

4. **Layout Updates**
   - [ ] Replace Tailwind grid with SimpleGrid
   - [ ] Replace flex classes with Group/Stack
   - [ ] Update spacing classes with gap props

5. **Styling Updates**
   - [ ] Replace CSS custom properties with theme colors
   - [ ] Update responsive classes
   - [ ] Maintain visual consistency

6. **Testing**
   - [ ] Verify functionality works
   - [ ] Check responsive behavior
   - [ ] Validate accessibility

## File Creation Requirements

Create the following files during implementation:

1. `lib/migration-utils.ts` - Utility functions for migration
2. `lib/theme-overrides.ts` - Custom theme configurations
3. `components/shared/MantineCard.tsx` - Standardized card component
4. `components/shared/MantineModal.tsx` - Standardized modal wrapper
5. `components/shared/MantineTable.tsx` - Standardized table component

## Notes for Implementation

1. **Gradual Migration**: Migrate components in dependency order to avoid breaking changes
2. **Visual Consistency**: Maintain the same visual appearance during migration
3. **Performance**: Mantine components should improve performance over HeroUI
4. **Accessibility**: Ensure ARIA attributes and keyboard navigation work correctly
5. **Testing**: Test each migrated component thoroughly before proceeding to the next

This documentation should guide the systematic migration while maintaining code quality and consistency.