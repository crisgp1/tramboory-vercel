# Control de Acceso Basado en Roles (RBAC)

## Resumen de Implementación

Se ha implementado un sistema completo de control de acceso basado en roles para garantizar que los usuarios solo puedan acceder a las funcionalidades apropiadas según su rol.

## Roles Disponibles

- **customer**: Usuario cliente básico
- **admin**: Administrador con acceso completo
- **gerente**: Gestor de ventas y reportes
- **proveedor**: Gestión de productos e inventario
- **vendedor**: Gestión de ventas y clientes

## Validaciones Implementadas

### 1. Middleware de Autenticación
- **Archivo**: `middleware.ts`
- **Funcionalidad**: Redirecciona automáticamente a usuarios `customer` que intenten acceder a `/dashboard` hacia `/reservaciones`

### 2. Validación en Páginas
- **Dashboard** (`app/dashboard/page.tsx`): Solo permite acceso a roles no-customer
- **Reservaciones** (`app/reservaciones/page.tsx`): Acceso libre para usuarios autenticados

### 3. Navegación Adaptiva
- **Navbar** (`components/navigation/Navbar.tsx`):
  - Muestra "Dashboard" solo para roles administrativos
  - Adapta texto de "Reservas" vs "Mis Celebraciones" según el rol
  - Incluye chip visual del rol del usuario

### 4. Dashboard Filtrado
- **Dashboard** (`components/dashboard/Dashboard.tsx`):
  - **Analytics**: Solo admin y gerente
  - **Reservas**: Todos los roles
  - **Finanzas**: Solo admin y gerente
  - **Configuración**: Solo admin
  - **Inventario**: Admin, gerente y proveedor

### 5. Componentes Administrativos
- **ConfigurationManager**: Solo admin puede acceder
- **RoleManager**: Solo admin y gerente pueden gestionar roles

## Flujo de Acceso por Rol

### Usuario Customer
- ✅ Puede acceder a `/reservaciones`
- ✅ Puede ver y crear sus propias reservas
- ❌ **NO** puede acceder a `/dashboard`
- ❌ **NO** puede ver configuración del sistema
- ❌ **NO** puede gestionar otros usuarios

### Usuario Admin
- ✅ Acceso completo a `/dashboard`
- ✅ Todas las secciones: Analytics, Reservas, Finanzas, Configuración, Inventario
- ✅ Puede gestionar roles de usuarios
- ✅ Puede acceder a `/reservaciones`

### Usuario Gerente
- ✅ Acceso a `/dashboard`
- ✅ Secciones: Analytics, Reservas, Finanzas, Inventario
- ❌ **NO** puede acceder a Configuración
- ✅ Puede gestionar roles de vendedores y customers
- ✅ Puede acceder a `/reservaciones`

### Usuario Proveedor/Vendedor
- ✅ Acceso a `/dashboard`
- ✅ Secciones: Reservas, Inventario (proveedor)
- ❌ **NO** puede acceder a Analytics, Finanzas, Configuración
- ❌ **NO** puede gestionar roles
- ✅ Puede acceder a `/reservaciones`

## Seguridad Implementada

1. **Validación en el Servidor**: Middleware y páginas verifican roles
2. **Validación en el Cliente**: Componentes verifican permisos antes de renderizar
3. **Redirección Automática**: Los usuarios son dirigidos a la sección apropiada
4. **UI Adaptiva**: La interfaz se adapta según los permisos del usuario

## Archivos Modificados

1. `middleware.ts` - Control de acceso a rutas
2. `app/dashboard/page.tsx` - Validación de roles en dashboard
3. `components/dashboard/Dashboard.tsx` - Filtrado de menú por rol
4. `components/navigation/Navbar.tsx` - Navegación adaptiva
5. `components/admin/ConfigurationManager.tsx` - Restricción a admin
6. `hooks/useRole.ts` - Hook para gestión de roles (existente)
7. `lib/roles.ts` - Definición de roles y permisos (existente)

## Características de Seguridad

- ✅ **Validación en servidor y cliente**
- ✅ **Redirección automática para usuarios no autorizados**
- ✅ **UI que se adapta según permisos**
- ✅ **Componentes protegidos**
- ✅ **Middleware que intercepta rutas**
- ✅ **Gestión centralizada de roles y permisos**
