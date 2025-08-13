# Remaining Supplier Components Migration Specification

This document provides migration specifications for all remaining supplier components that need to be converted from HeroUI to Mantine.

## Overview of Components

The following components require migration in dependency order:

1. **SupplierNotificationCenter.tsx** - Notification dropdown component (used by dashboard)
2. **SupplierPenaltyDisplay.tsx** - Penalty information display (used by dashboard)
3. **SupplierOrdersUber.tsx** - Main orders management interface
4. **SupplierOrdersPanel.tsx** - Advanced orders panel
5. **SupplierProductManager.tsx** - Product catalog management
6. **SupplierProductUpload.tsx** - Product upload interface
7. **SupplierProfile.tsx** - Supplier profile management
8. **SupplierMessaging.tsx** - Messaging interface
9. **SupplierNotifications.tsx** - Full notifications page
10. **SupplierStatsDashboard.tsx** - Statistics dashboard
11. **SupplierDashboardClient.tsx** - Alternative dashboard client

## 1. SupplierNotificationCenter Migration

### Current HeroUI Components
- `Dropdown`, `DropdownTrigger`, `DropdownMenu`, `DropdownItem`
- `Button`, `Badge`, `Modal`, `Card`, `Tabs`

### Mantine Replacement Strategy
```typescript
// Replace HeroUI dropdown with Mantine Menu
<Menu shadow="md" width={300}>
  <Menu.Target>
    <ActionIcon variant="subtle" size="lg">
      <IconBell size={20} />
      {unreadCount > 0 && (
        <Indicator 
          size={16} 
          color="red" 
          label={unreadCount} 
          position="top-end"
        />
      )}
    </ActionIcon>
  </Menu.Target>
  <Menu.Dropdown>
    <Menu.Label>Notificaciones</Menu.Label>
    {/* Notification items */}
  </Menu.Dropdown>
</Menu>

// Replace modal with Mantine Modal
<Modal opened={opened} onClose={close} title="Notificaciones" size="lg">
  <Tabs defaultValue="all">
    <Tabs.List>
      <Tabs.Tab value="all">Todas</Tabs.Tab>
      <Tabs.Tab value="unread">Sin leer</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel value="all">
      <Stack gap="md">
        {/* Notification list */}
      </Stack>
    </Tabs.Panel>
  </Tabs>
</Modal>
```

### Key Migration Points
- Replace dropdown structure with Menu component
- Use Indicator for notification badges
- Convert tabs to Mantine Tabs component
- Replace Card with Paper for notification items

## 2. SupplierPenaltyDisplay Migration

### Current HeroUI Components
- `Card`, `CardHeader`, `CardBody`
- `Button`, `Chip`, `Progress`, `Modal`

### Mantine Replacement Strategy
```typescript
// Replace penalty cards
<Paper withBorder p="md" shadow="sm">
  <Group justify="space-between" mb="md">
    <Title order={4}>Penalizaciones</Title>
    <Badge color="red" variant="light">
      {penalties.length} activas
    </Badge>
  </Group>
  
  <Stack gap="sm">
    {penalties.map((penalty) => (
      <Paper key={penalty.id} p="sm" bg="red.0" withBorder>
        <Group justify="space-between">
          <Stack gap={0}>
            <Text fw={500}>{penalty.concept}</Text>
            <Text size="sm" c="dimmed">{penalty.description}</Text>
          </Stack>
          <Badge color="red">{penalty.points} pts</Badge>
        </Group>
      </Paper>
    ))}
  </Stack>
</Paper>
```

### Key Migration Points
- Replace Card structure with Paper
- Use Badge for penalty indicators
- Maintain progress indicators for penalty levels
- Convert modal to Mantine Modal

## 3. SupplierOrdersUber Migration

### Current HeroUI Components
- `Card`, `CardBody`, `Button`, `Chip`, `Input`, `Modal`, `Avatar`

### Mantine Replacement Strategy
```typescript
// Replace order cards with Paper
<Stack gap="md">
  {filteredOrders.map((order) => (
    <Paper key={order.id} p="md" withBorder shadow="sm" 
      style={{ cursor: 'pointer' }}
      onClick={() => setSelectedOrder(order)}>
      <Group justify="space-between" mb="sm">
        <Group>
          <Badge color={getStatusColor(order.status)}>
            {getStatusLabel(order.status)}
          </Badge>
          <Text fw={500}>#{order.purchaseOrderId}</Text>
        </Group>
        <Text size="sm" c="dimmed">
          {formatTimeAgo(order.createdAt)}
        </Text>
      </Group>
      
      <Text mb="sm">{order.items.length} productos</Text>
      <Text size="lg" fw={700}>
        {formatCurrency(order.total)}
      </Text>
    </Paper>
  ))}
</Stack>

// Replace filters section
<Paper p="md" mb="md" withBorder>
  <Group align="end">
    <TextInput
      label="Buscar órdenes"
      placeholder="ID de orden, proveedor..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.currentTarget.value)}
      style={{ flex: 1 }}
    />
    <Select
      label="Estado"
      data={statusOptions}
      value={statusFilter}
      onChange={setStatusFilter}
    />
    <Button onClick={clearFilters} variant="light">
      Limpiar
    </Button>
  </Group>
</Paper>
```

### Key Migration Points
- Replace Cards with Paper components
- Convert Input to TextInput
- Replace Dropdown with Select
- Update modal structure for order details

## 4. SupplierProductManager Migration

### Current HeroUI Components
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- `Button`, `Input`, `Select`, `Modal`, `Chip`, `Switch`

### Mantine Replacement Strategy
```typescript
// Replace HeroUI Table with Mantine Table
<Table striped highlightOnHover>
  <Table.Thead>
    <Table.Tr>
      <Table.Th>Producto</Table.Th>
      <Table.Th>Precio</Table.Th>
      <Table.Th>Stock</Table.Th>
      <Table.Th>Estado</Table.Th>
      <Table.Th>Acciones</Table.Th>
    </Table.Tr>
  </Table.Thead>
  <Table.Tbody>
    {products.map((product) => (
      <Table.Tr key={product._id}>
        <Table.Td>
          <Group gap="sm">
            <Avatar src={product.imageUrl} size="sm" />
            <Stack gap={0}>
              <Text fw={500}>{product.name}</Text>
              <Text size="sm" c="dimmed">{product.code}</Text>
            </Stack>
          </Group>
        </Table.Td>
        <Table.Td>
          <Text>{formatCurrency(product.unitPrice)}</Text>
        </Table.Td>
        <Table.Td>
          <Text>{product.currentStock}</Text>
        </Table.Td>
        <Table.Td>
          <Badge color={product.isActive ? 'green' : 'gray'}>
            {product.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Group gap="xs">
            <ActionIcon variant="subtle" onClick={() => handleView(product)}>
              <IconEye size={16} />
            </ActionIcon>
            <ActionIcon variant="subtle" onClick={() => handleEdit(product)}>
              <IconEdit size={16} />
            </ActionIcon>
          </Group>
        </Table.Td>
      </Table.Tr>
    ))}
  </Table.Tbody>
</Table>
```

### Key Migration Points
- Replace HeroUI Table structure with Mantine nested Table components
- Convert form inputs to Mantine equivalents
- Replace Switch with Mantine Switch
- Update modal structure for product management

## 5. SupplierProductUpload Migration

### Current HeroUI Components
- `Modal`, `Button`, `Input`, `Textarea`, `Select`, `Progress`

### Mantine Replacement Strategy
```typescript
// Replace upload modal
<Modal opened={opened} onClose={close} title="Subir Producto" size="lg">
  <Stepper active={currentStep} onStepClick={setCurrentStep}>
    <Stepper.Step label="Información básica">
      <Stack gap="md">
        <TextInput
          label="Nombre del producto"
          placeholder="Ingresa el nombre"
          {...form.getInputProps('name')}
        />
        <Textarea
          label="Descripción"
          placeholder="Describe el producto"
          {...form.getInputProps('description')}
        />
        <Select
          label="Categoría"
          data={categories}
          {...form.getInputProps('category')}
        />
      </Stack>
    </Stepper.Step>
    
    <Stepper.Step label="Precios y stock">
      <SimpleGrid cols={2} spacing="md">
        <NumberInput
          label="Precio unitario"
          placeholder="0.00"
          {...form.getInputProps('unitPrice')}
        />
        <NumberInput
          label="Stock mínimo"
          placeholder="0"
          {...form.getInputProps('minStock')}
        />
      </SimpleGrid>
    </Stepper.Step>
    
    <Stepper.Step label="Imágenes">
      <Dropzone
        onDrop={handleDrop}
        accept={IMAGE_MIME_TYPE}
        maxSize={5 * 1024 ** 2}
      >
        <Text ta="center">Arrastra imágenes aquí o haz clic para seleccionar</Text>
      </Dropzone>
    </Stepper.Step>
  </Stepper>
  
  <Group justify="flex-end" mt="xl">
    <Button variant="outline" onClick={close}>
      Cancelar
    </Button>
    <Button onClick={handleNext} loading={loading}>
      {currentStep === 2 ? 'Crear Producto' : 'Siguiente'}
    </Button>
  </Group>
</Modal>
```

### Key Migration Points
- Replace modal structure with Mantine Modal
- Use Stepper component for multi-step form
- Replace form inputs with Mantine form components
- Use Dropzone for file upload

## 6. SupplierProfile Migration

### Current HeroUI Components
- `Tabs`, `Tab`, `Card`, `Input`, `Switch`, `Button`, `Chip`

### Mantine Replacement Strategy
```typescript
// Replace tabs structure
<Tabs defaultValue="info">
  <Tabs.List>
    <Tabs.Tab value="info" leftSection={<IconUser size={16} />}>
      Información Básica
    </Tabs.Tab>
    <Tabs.Tab value="contact" leftSection={<IconPhone size={16} />}>
      Contacto
    </Tabs.Tab>
    <Tabs.Tab value="business" leftSection={<IconBuilding size={16} />}>
      Términos Comerciales
    </Tabs.Tab>
  </Tabs.List>

  <Tabs.Panel value="info" pt="md">
    <Paper p="lg" withBorder>
      <Stack gap="md">
        <TextInput
          label="Nombre de la empresa"
          value={supplier.name}
          onChange={(e) => setSupplier({...supplier, name: e.currentTarget.value})}
          disabled={!editMode}
        />
        <Textarea
          label="Descripción"
          value={supplier.description}
          onChange={(e) => setSupplier({...supplier, description: e.currentTarget.value})}
          disabled={!editMode}
        />
        <Switch
          label="Empresa activa"
          checked={supplier.isActive}
          onChange={(e) => setSupplier({...supplier, isActive: e.currentTarget.checked})}
          disabled={!editMode}
        />
      </Stack>
    </Paper>
  </Tabs.Panel>
</Tabs>
```

### Key Migration Points
- Replace Tab structure with Mantine Tabs
- Convert form inputs to Mantine components
- Replace cards with Paper
- Maintain edit mode functionality

## 7. SupplierMessaging Migration

### Current HeroUI Components
- `Modal`, `Input`, `Textarea`, `Button`, `Avatar`, `Card`

### Mantine Replacement Strategy
```typescript
// Replace messaging interface
<Paper h="600px" withBorder>
  <Group h="100%" align="stretch" gap={0}>
    {/* Conversations List */}
    <Paper w="300px" p="md" style={{ borderRight: '1px solid var(--mantine-color-gray-3)' }}>
      <TextInput
        placeholder="Buscar conversaciones..."
        leftSection={<IconSearch size={16} />}
        mb="md"
      />
      <Stack gap="xs">
        {conversations.map((conversation) => (
          <Paper
            key={conversation.id}
            p="sm"
            style={{ 
              cursor: 'pointer',
              backgroundColor: selectedConversation?.id === conversation.id ? 'var(--mantine-color-blue-0)' : 'transparent'
            }}
            onClick={() => setSelectedConversation(conversation)}
          >
            <Group gap="sm">
              <Avatar size="sm" name={conversation.participantName} />
              <Stack gap={0} style={{ flex: 1 }}>
                <Text fw={500} size="sm">{conversation.participantName}</Text>
                <Text size="xs" c="dimmed" truncate>
                  {conversation.lastMessage?.content}
                </Text>
              </Stack>
              {conversation.unreadCount > 0 && (
                <Badge size="sm" color="blue">{conversation.unreadCount}</Badge>
              )}
            </Group>
          </Paper>
        ))}
      </Stack>
    </Paper>

    {/* Messages Area */}
    <Stack style={{ flex: 1 }} gap={0}>
      {/* Header */}
      <Paper p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Group>
          <Avatar size="sm" name={selectedConversation?.participantName} />
          <Text fw={500}>{selectedConversation?.participantName}</Text>
        </Group>
      </Paper>

      {/* Messages */}
      <ScrollArea style={{ flex: 1 }} p="md">
        <Stack gap="md">
          {messages.map((message) => (
            <Group
              key={message.id}
              align="start"
              justify={message.senderRole === 'supplier' ? 'flex-end' : 'flex-start'}
            >
              <Paper
                p="sm"
                bg={message.senderRole === 'supplier' ? 'blue.0' : 'gray.0'}
                maw="70%"
              >
                <Text size="sm">{message.content}</Text>
                <Text size="xs" c="dimmed" mt="xs">
                  {formatTime(message.createdAt)}
                </Text>
              </Paper>
            </Group>
          ))}
        </Stack>
      </ScrollArea>

      {/* Input */}
      <Paper p="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
        <Group align="end" gap="sm">
          <Textarea
            placeholder="Escribe tu mensaje..."
            autosize
            minRows={1}
            maxRows={3}
            style={{ flex: 1 }}
            value={newMessage}
            onChange={(e) => setNewMessage(e.currentTarget.value)}
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
            Enviar
          </Button>
        </Group>
      </Paper>
    </Stack>
  </Group>
</Paper>
```

### Key Migration Points
- Replace modal with full Paper layout
- Use ScrollArea for messages
- Replace Input/Textarea with Mantine equivalents
- Maintain real-time messaging functionality

## 8. SupplierNotifications Migration

### Current HeroUI Components
- `Card`, `Tabs`, `Button`, `Chip`, `Pagination`

### Mantine Replacement Strategy
```typescript
// Replace notifications page
<Stack gap="md">
  <Group justify="space-between">
    <Title order={2}>Notificaciones</Title>
    <Group>
      <Button onClick={markAllAsRead} variant="light" disabled={unreadCount === 0}>
        Marcar todas como leídas
      </Button>
      <Button onClick={refresh} variant="outline">
        Actualizar
      </Button>
    </Group>
  </Group>

  <Tabs defaultValue="all">
    <Tabs.List>
      <Tabs.Tab value="all">
        Todas ({notifications.length})
      </Tabs.Tab>
      <Tabs.Tab value="unread">
        Sin leer ({unreadCount})
      </Tabs.Tab>
      <Tabs.Tab value="orders">Órdenes</Tabs.Tab>
      <Tabs.Tab value="products">Productos</Tabs.Tab>
      <Tabs.Tab value="system">Sistema</Tabs.Tab>
    </Tabs.List>

    <Tabs.Panel value="all">
      <Stack gap="sm">
        {notifications.map((notification) => (
          <Paper
            key={notification.id}
            p="md"
            withBorder
            bg={notification.isRead ? 'white' : 'blue.0'}
          >
            <Group justify="space-between">
              <Group align="start">
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '50%', 
                  backgroundColor: getNotificationColor(notification.type), 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  {getNotificationIcon(notification.type)}
                </div>
                <Stack gap={0} style={{ flex: 1 }}>
                  <Text fw={500}>{notification.title}</Text>
                  <Text size="sm" c="dimmed">{notification.message}</Text>
                  <Text size="xs" c="dimmed" mt="xs">
                    {formatTimeAgo(notification.createdAt)}
                  </Text>
                </Stack>
              </Group>
              <Menu>
                <Menu.Target>
                  <ActionIcon variant="subtle">
                    <IconDotsVertical size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {!notification.isRead && (
                    <Menu.Item onClick={() => markAsRead(notification.id)}>
                      Marcar como leída
                    </Menu.Item>
                  )}
                  <Menu.Item color="red" onClick={() => deleteNotification(notification.id)}>
                    Eliminar
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Paper>
        ))}
      </Stack>
    </Tabs.Panel>
  </Tabs>

  <Group justify="center" mt="md">
    <Pagination
      value={currentPage}
      onChange={setCurrentPage}
      total={totalPages}
    />
  </Group>
</Stack>
```

### Key Migration Points
- Replace Card structure with Paper
- Convert tabs to Mantine Tabs
- Use Menu for notification actions
- Maintain pagination functionality

## 9. SupplierStatsDashboard Migration

### Current HeroUI Components
- `Card`, `Tabs`, `Button`, `Select`, `Progress`

### Mantine Replacement Strategy
```typescript
// Replace stats dashboard
<Stack gap="lg">
  <Group justify="space-between">
    <Title order={2}>Estadísticas</Title>
    <Select
      data={[
        { value: '7d', label: 'Últimos 7 días' },
        { value: '30d', label: 'Últimos 30 días' },
        { value: '90d', label: 'Últimos 90 días' },
      ]}
      value={timeRange}
      onChange={setTimeRange}
    />
  </Group>

  <Tabs defaultValue="overview">
    <Tabs.List>
      <Tabs.Tab value="overview">Vista General</Tabs.Tab>
      <Tabs.Tab value="orders">Órdenes</Tabs.Tab>
      <Tabs.Tab value="products">Productos</Tabs.Tab>
      <Tabs.Tab value="performance">Rendimiento</Tabs.Tab>
    </Tabs.List>

    <Tabs.Panel value="overview">
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
        <Paper p="md" withBorder style={{ background: 'linear-gradient(135deg, var(--mantine-color-green-0), var(--mantine-color-green-1))' }}>
          <Stack gap="xs">
            <Group justify="space-between">
              <IconCurrencyDollar size={32} className="text-green-600" />
              <Badge color="green" variant="light">+12.5%</Badge>
            </Group>
            <Text size="xl" fw={700}>$45,680</Text>
            <Text size="sm" c="dimmed">Ingresos totales</Text>
          </Stack>
        </Paper>

        <Paper p="md" withBorder style={{ background: 'linear-gradient(135deg, var(--mantine-color-blue-0), var(--mantine-color-blue-1))' }}>
          <Stack gap="xs">
            <Group justify="space-between">
              <IconShoppingCart size={32} className="text-blue-600" />
              <Text size="xl" fw={700} c="blue.6">124</Text>
            </Group>
            <Text size="lg" fw={600}>Órdenes completadas</Text>
            <Text size="sm" c="dimmed">Este mes</Text>
          </Stack>
        </Paper>

        <Paper p="md" withBorder style={{ background: 'linear-gradient(135deg, var(--mantine-color-violet-0), var(--mantine-color-violet-1))' }}>
          <Stack gap="xs">
            <Group justify="space-between">
              <IconPackage size={32} className="text-violet-600" />
              <Progress value={85} size="sm" color="violet" w={60} />
            </Group>
            <Text size="xl" fw={700}>85%</Text>
            <Text size="sm" c="dimmed">Productos activos</Text>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Tabs.Panel>
  </Tabs>
</Stack>
```

### Key Migration Points
- Replace Cards with Paper components with gradient backgrounds
- Convert tabs structure
- Use SimpleGrid for responsive layout
- Maintain chart integrations (Chart.js compatible)

## Implementation Priority and Dependencies

### Phase 1 (High Priority - Dashboard Dependencies)
1. **SupplierNotificationCenter** - Required by SupplierDashboardUber
2. **SupplierPenaltyDisplay** - Required by SupplierDashboardUber

### Phase 2 (Core Functionality)
3. **SupplierOrdersUber** - Main orders interface
4. **SupplierProductManager** - Product management
5. **SupplierProfile** - Profile management

### Phase 3 (Extended Features)  
6. **SupplierOrdersPanel** - Advanced orders panel
7. **SupplierProductUpload** - Product upload
8. **SupplierMessaging** - Communication features

### Phase 4 (Supporting Features)
9. **SupplierNotifications** - Full notifications page
10. **SupplierStatsDashboard** - Analytics
11. **SupplierDashboardClient** - Alternative dashboard

## Common Migration Patterns Across All Components

### 1. Layout Structure
- Replace CSS grid/flexbox classes with Mantine components (`SimpleGrid`, `Group`, `Stack`)
- Use Paper instead of Card for containers
- Implement consistent spacing using Mantine props

### 2. Form Elements
- Replace Input with TextInput
- Replace Textarea with Textarea  
- Replace Select with Select
- Use form libraries compatible with Mantine (react-hook-form)

### 3. Data Display
- Replace HeroUI Table with Mantine Table structure
- Use Badge instead of Chip
- Replace custom chips with Mantine Badge variants

### 4. Interactive Elements
- Replace Dropdown with Menu
- Replace Modal structure with Mantine Modal
- Use ActionIcon for icon buttons

### 5. Responsive Design
- Replace Tailwind responsive classes with Mantine responsive props
- Use `visibleFrom` and `hiddenFrom` for conditional rendering
- Implement consistent breakpoints

## Testing Strategy for Each Component

### Functional Testing
- [ ] All CRUD operations work correctly
- [ ] Form validation maintains functionality
- [ ] Search and filtering work properly
- [ ] Pagination works correctly
- [ ] Modal interactions function properly

### Visual Testing
- [ ] Components match original design
- [ ] Responsive behavior is maintained
- [ ] Color schemes are consistent
- [ ] Typography scales correctly
- [ ] Spacing and alignment are preserved

### Performance Testing
- [ ] Component loading times are equal or better
- [ ] Large data sets render efficiently
- [ ] Memory usage is optimized
- [ ] Animations are smooth

This comprehensive specification should guide the migration of all remaining supplier components while maintaining functionality, improving performance, and ensuring design consistency.