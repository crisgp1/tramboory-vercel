# HeroUI to Mantine Migration Guide

This guide provides mapping between HeroUI and Mantine components used in the Tramboory supplier dashboard migration.

## Component Mappings

### Layout & Structure
| HeroUI | Mantine | Notes |
|--------|---------|-------|
| `Card` | `Paper` | Use `Paper` with `withBorder` and `shadow` props |
| `CardBody` | Content wrapper | Use `Box` or direct content inside `Paper` |
| `CardHeader` | `Paper` section | Use `Paper` with separate styling or `Group` |
| `CardFooter` | `Paper` section | Use `Group` or `Stack` for footer content |

### Interactive Components
| HeroUI | Mantine | Notes |
|--------|---------|-------|
| `Button` | `Button` | Direct replacement, similar API |
| `Chip` | `Badge` | Use `Badge` component |
| `Input` | `TextInput` | Direct replacement |
| `Textarea` | `Textarea` | Direct replacement |
| `Select` | `Select` | Direct replacement |
| `Switch` | `Switch` | Direct replacement |
| `Progress` | `Progress` | Direct replacement |

### Data Display
| HeroUI | Mantine | Notes |
|--------|---------|-------|
| `Avatar` | `Avatar` | Direct replacement |
| `Table` | `Table` | Direct replacement with `Table.Thead`, `Table.Tbody`, etc. |
| `TableHeader` | `Table.Thead` | Mantine uses nested structure |
| `TableBody` | `Table.Tbody` | Mantine uses nested structure |
| `TableRow` | `Table.Tr` | Mantine uses nested structure |
| `TableCell` | `Table.Td` | Mantine uses nested structure |
| `Pagination` | `Pagination` | Direct replacement |

### Overlays
| HeroUI | Mantine | Notes |
|--------|---------|-------|
| `Modal` | `Modal` | Direct replacement |
| `ModalContent` | `Modal` wrapper | Use `Modal.Root`, `Modal.Content` |
| `ModalHeader` | `Modal.Header` | Direct replacement |
| `ModalBody` | `Modal.Body` | Direct replacement |
| `ModalFooter` | `Modal.Footer` | Use `Group` in footer area |
| `Dropdown` | `Menu` | Use `Menu` component |
| `DropdownTrigger` | `Menu.Target` | Mantine uses nested structure |
| `DropdownMenu` | `Menu.Dropdown` | Mantine uses nested structure |
| `DropdownItem` | `Menu.Item` | Mantine uses nested structure |

### Navigation & Tabs
| HeroUI | Mantine | Notes |
|--------|---------|-------|
| `Tabs` | `Tabs` | Direct replacement |
| `Tab` | `Tabs.Tab` | Mantine uses nested structure |

### Feedback
| HeroUI | Mantine | Notes |
|--------|---------|-------|
| `Spinner` | `Loader` | Direct replacement |
| `Alert` | `Alert` | Direct replacement |

### Utilities
| HeroUI | Mantine | Notes |
|--------|---------|-------|
| `useDisclosure` | `useDisclosure` | Available in `@mantine/hooks` |

## Property Mappings

### Button Variants
| HeroUI | Mantine |
|--------|---------|
| `variant="solid"` | `variant="filled"` |
| `variant="bordered"` | `variant="outline"` |
| `variant="light"` | `variant="subtle"` |
| `variant="flat"` | `variant="light"` |
| `variant="ghost"` | `variant="subtle"` |

### Color Properties
| HeroUI | Mantine |
|--------|---------|
| `color="primary"` | `color="blue"` |
| `color="secondary"` | `color="gray"` |
| `color="success"` | `color="green"` |
| `color="warning"` | `color="yellow"` |
| `color="danger"` | `color="red"` |

### Size Properties
Both libraries use similar size conventions: `xs`, `sm`, `md`, `lg`, `xl`

## Layout Patterns

### HeroUI Card Pattern
```tsx
<Card className="border border-gray-200">
  <CardBody className="p-4">
    <div className="flex justify-between items-center">
      {/* Content */}
    </div>
  </CardBody>
</Card>
```

### Mantine Paper Pattern
```tsx
<Paper withBorder p="md" shadow="sm">
  <Group justify="space-between" align="center">
    {/* Content */}
  </Group>
</Paper>
```

### HeroUI Modal Pattern
```tsx
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalContent>
    {(onClose) => (
      <>
        <ModalHeader>Title</ModalHeader>
        <ModalBody>{/* Content */}</ModalBody>
        <ModalFooter>{/* Actions */}</ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>
```

### Mantine Modal Pattern
```tsx
<Modal opened={opened} onClose={close} title="Title">
  {/* Content */}
  <Group justify="flex-end" mt="md">
    {/* Actions */}
  </Group>
</Modal>
```

## Migration Checklist

### Component Updates
- [ ] Replace HeroUI imports with Mantine imports
- [ ] Update component names and structure
- [ ] Replace `className` with Mantine props where applicable
- [ ] Update event handlers (`onPress` → `onClick`, etc.)

### Styling Updates
- [ ] Replace custom CSS classes with Mantine props
- [ ] Update color scheme to match Mantine colors
- [ ] Review responsive classes and replace with Mantine responsive props

### Hook Updates
- [ ] Replace HeroUI hooks with Mantine equivalents
- [ ] Update `useDisclosure` import from `@mantine/hooks`

## Common Patterns

### Grid Layouts
Use Mantine's `SimpleGrid` or CSS Grid with `Grid` component:
```tsx
// Replace this:
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

// With this:
<SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md">
```

### Spacing and Layout
Use Mantine's `Stack` and `Group` for layout:
```tsx
// Replace this:
<div className="space-y-4">

// With this:
<Stack gap="md">

// Replace this:
<div className="flex items-center gap-2">

// With this:
<Group align="center" gap="xs">
```

### Conditional Styling
Use Mantine's conditional props:
```tsx
// Replace this:
<Button className={isActive ? 'bg-blue-500' : 'bg-gray-200'}>

// With this:
<Button variant={isActive ? 'filled' : 'outline'} color={isActive ? 'blue' : 'gray'}>
```

## Notes

1. **CSS Custom Properties**: The current implementation uses CSS custom properties like `var(--primary)`. These should be replaced with Mantine's theme system.

2. **Icon Libraries**: The project uses Heroicons. These can remain the same but consider Tabler Icons for consistency with Mantine.

3. **Form Handling**: If using HeroUI's form components, migrate to Mantine's form system or continue using react-hook-form with Mantine inputs.

4. **Animations**: Mantine has built-in animations that can replace custom CSS transitions.

5. **Responsive Design**: Use Mantine's responsive props instead of Tailwind responsive classes where possible.