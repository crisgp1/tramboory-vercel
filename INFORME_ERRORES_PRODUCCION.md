# 📋 INFORME DE ERRORES Y MEJORES PRÁCTICAS - TRAMBOORY

**Fecha:** 2025-07-07  
**Autor:** Claude Code  
**Severidad:** CRÍTICA  
**Impacto:** Fallo total de deployment en producción  

---

## 🚨 RESUMEN EJECUTIVO

Durante el proceso de deployment a Vercel, se encontraron **múltiples errores críticos de TypeScript** que impidieron la compilación exitosa del proyecto. Estos errores se debieron principalmente a:

1. **Actualización de Next.js 14 a 15** sin adaptar el código
2. **Cambios en la API de NextUI** no reflejados en componentes
3. **Falta de validación de tipos** antes del deployment
4. **Ausencia de Suspense boundaries** requeridos en Next.js 15

---

## 🔴 ERRORES CRÍTICOS ENCONTRADOS

### 1. INCOMPATIBILIDAD CON NEXT.JS 15 - Route Handlers

#### ❌ CÓDIGO PROBLEMÁTICO
```typescript
// TODOS los route handlers tenían este patrón obsoleto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Uso directo de params - FALLA EN NEXT.JS 15
  const { id } = params;
  // ...
}
```

#### ✅ SOLUCIÓN IMPLEMENTADA
```typescript
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // params ahora es una Promise que debe ser resuelta
  const params = await context.params;
  const { id } = params;
  // ...
}
```

#### 📊 IMPACTO
- **Archivos afectados:** 15+ route handlers
- **Rutas rotas:** `/api/admin/users/[id]`, `/api/inventory/suppliers/[id]`, etc.
- **Consecuencia:** API completamente no funcional en producción

---

### 2. PROPS OBSOLETAS EN NEXTUI

#### ❌ CÓDIGO PROBLEMÁTICO
```typescript
// SelectItem no acepta prop 'value' en versiones recientes
<SelectItem key="option1" value="option1">
  Opción 1
</SelectItem>
```

#### ✅ SOLUCIÓN IMPLEMENTADA
```typescript
// Solo usar 'key' para el valor
<SelectItem key="option1">
  Opción 1
</SelectItem>
```

#### 📊 IMPACTO
- **Componentes afectados:** 7 formularios
- **Funcionalidad rota:** Selección de opciones en formularios

---

### 3. RENDERIZADO CONDICIONAL EN DROPDOWNS

#### ❌ CÓDIGO PROBLEMÁTICO
```typescript
<DropdownMenu>
  {showHomeLink && (
    <DropdownItem key="home">
      Inicio
    </DropdownItem>
  )}
</DropdownMenu>
```

#### ✅ SOLUCIÓN IMPLEMENTADA
```typescript
<DropdownMenu>
  {showHomeLink ? (
    <DropdownItem key="home">
      Inicio
    </DropdownItem>
  ) : null}
</DropdownMenu>
```

#### 📊 IMPACTO
- **Error TypeScript:** "Type 'false | Element' is not assignable to type 'CollectionElement<object>'"
- **Componentes afectados:** 5 menús dropdown

---

### 4. useSearchParams SIN SUSPENSE BOUNDARY

#### ❌ CÓDIGO PROBLEMÁTICO
```typescript
export default function SignInPage() {
  const searchParams = useSearchParams(); // ERROR EN BUILD
  const redirectUrl = searchParams.get("redirect_url") || "/";
  
  return <SignIn redirectUrl={redirectUrl} />;
}
```

#### ✅ SOLUCIÓN IMPLEMENTADA
```typescript
import { Suspense } from "react";

function SignInComponent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/";
  
  return <SignIn redirectUrl={redirectUrl} />;
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInComponent />
    </Suspense>
  );
}
```

#### 📊 IMPACTO
- **Páginas afectadas:** `/auth/sign-in`, `/auth/sign-up`, `/auth/verify`, `/auth`
- **Error:** "useSearchParams() should be wrapped in a suspense boundary"

---

### 5. TIPOS DE MONGODB CON LEAN()

#### ❌ CÓDIGO PROBLEMÁTICO
```typescript
const suppliers = await Supplier.find().lean();
suppliers.map(s => ({
  id: s._id.toString(), // Error: '_id' is of type 'unknown'
}));
```

#### ✅ SOLUCIÓN IMPLEMENTADA
```typescript
const suppliers = await Supplier.find().lean();
suppliers.map(s => ({
  id: (s._id as any).toString(),
}));
```

---

### 6. IMPORTS DE TIPOS INCORRECTOS

#### ❌ CÓDIGO PROBLEMÁTICO
```typescript
import { IMovementReference, IMovementCost } from '@/types/inventory';
// Error: Module has no exported member
```

#### ✅ SOLUCIÓN IMPLEMENTADA
```typescript
import { IMovementReference, IMovementCost } from '@/types/inventory/index';
```

---

## 📐 REGLAS DE CODIFICACIÓN PARA PREVENIR ESTOS ERRORES

### 1. CONFIGURACIÓN DE TYPESCRIPT ESTRICTA

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 2. SCRIPTS DE VALIDACIÓN PRE-BUILD

```json
// package.json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "prebuild": "npm run type-check && npm run lint",
    "build": "next build",
    "build:local": "npm run prebuild && npm run build"
  }
}
```

### 3. CONFIGURACIÓN DE ESLINT

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  }
}
```

### 4. GIT HOOKS CON HUSKY

```bash
# Instalar husky
npm install --save-dev husky
npx husky init

# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Checking types..."
npm run type-check || {
  echo "❌ Type check failed. Please fix errors before committing."
  exit 1
}

echo "🧹 Running linter..."
npm run lint || {
  echo "❌ Lint failed. Please fix errors before committing."
  exit 1
}

echo "🏗️ Building project..."
npm run build || {
  echo "❌ Build failed. Please fix errors before committing."
  exit 1
}

echo "✅ All checks passed!"
```

### 5. GITHUB ACTIONS CI/CD

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build
      
      - name: Run tests
        run: npm test
```

---

## 🛡️ MEJORES PRÁCTICAS PARA EVITAR ESTOS PROBLEMAS

### 1. ACTUALIZACIÓN DE DEPENDENCIAS

```bash
# Verificar outdated packages
npm outdated

# Actualizar con precaución
npm update --dry-run
npm update

# Después de actualizar
npm run type-check
npm run build
```

### 2. DOCUMENTACIÓN DE PATRONES

```typescript
// components/PATTERNS.md
/**
 * PATRONES DE COMPONENTES NEXTUI
 * 
 * 1. SelectItem - NO usar prop 'value'
 * 2. DropdownMenu - Usar ternarios, no &&
 * 3. Badge - Usar children, no 'content'
 */

/**
 * PATRONES DE NEXT.JS 15
 * 
 * 1. Route handlers - params es Promise
 * 2. useSearchParams - Requiere Suspense
 * 3. Metadata - Debe ser async
 */
```

### 3. TEMPLATE DE COMPONENTES

```typescript
// templates/NextUIDropdown.template.tsx
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";

export function DropdownTemplate() {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button>Menu</Button>
      </DropdownTrigger>
      <DropdownMenu>
        {/* SIEMPRE usar ternario para condicionales */}
        {condition ? (
          <DropdownItem key="item1">Item 1</DropdownItem>
        ) : null}
        
        {/* NUNCA usar && */}
        {/* {condition && <DropdownItem>Item</DropdownItem>} */}
      </DropdownMenu>
    </Dropdown>
  );
}
```

### 4. CHECKLIST DE DEPLOYMENT

```markdown
# DEPLOYMENT CHECKLIST

## Pre-deployment Local
- [ ] `npm run type-check` - 0 errores
- [ ] `npm run lint` - 0 errores, 0 warnings
- [ ] `npm run build` - Build exitoso
- [ ] Probar rutas críticas en local
- [ ] Verificar variables de entorno

## Pre-deployment Vercel
- [ ] Preview deployment funcional
- [ ] Logs sin errores
- [ ] API routes respondiendo
- [ ] Auth funcionando

## Post-deployment
- [ ] Verificar todas las rutas API
- [ ] Probar flujos críticos
- [ ] Monitorear logs primeras 24h
```

---

## 🔧 CONFIGURACIÓN RECOMENDADA VS CODE

```json
// .vscode/settings.json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## 📊 MÉTRICAS DEL INCIDENTE

### Tiempo de Resolución
- **Inicio del problema:** 16:29:45
- **Resolución completa:** ~17:00:00
- **Tiempo total:** ~30 minutos

### Archivos Modificados
- **Route handlers:** 15 archivos
- **Componentes UI:** 12 archivos  
- **Páginas Auth:** 4 archivos
- **Tipos/Modelos:** 3 archivos
- **Total:** 34+ archivos

### Errores Corregidos
- **TypeScript compilation errors:** 100+
- **Runtime errors:** 4
- **Import errors:** 6

---

## 🎯 ACCIONES INMEDIATAS REQUERIDAS

1. **Implementar pre-commit hooks** - CRÍTICO
2. **Agregar CI/CD pipeline** - CRÍTICO
3. **Documentar patrones de migración** - ALTO
4. **Crear templates de componentes** - MEDIO
5. **Configurar monitoreo de errores** - ALTO

---

## 📝 CONCLUSIONES

Este incidente demostró vulnerabilidades críticas en el proceso de deployment:

1. **Falta de validación pre-deployment**
2. **Ausencia de CI/CD automatizado**
3. **Documentación insuficiente de breaking changes**
4. **No hay type-checking obligatorio**

La implementación de las medidas propuestas en este documento **prevendrá futuros incidentes similares** y mejorará significativamente la calidad y confiabilidad del código.

---

**Generado por Claude Code**  
**Fecha:** 2025-07-07