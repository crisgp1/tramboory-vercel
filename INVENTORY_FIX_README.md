# Reparación de Problemas de Inventario

Este documento describe los problemas identificados en el sistema de inventario y las soluciones implementadas.

## Problemas Identificados

### 1. Warning de Mongoose - Índices Duplicados
**Error:** `Duplicate schema index on {"batches.batchId":1} found`
**Causa:** Índices duplicados definidos en el modelo Inventory
**Solución:** Eliminado el índice duplicado del modelo

### 2. ParallelSaveError
**Error:** `Can't save() the same doc multiple times in parallel`
**Causa:** Múltiples llamadas a `save()` en el mismo documento dentro de transacciones
**Solución:** Refactorizado para hacer un solo `save()` por transacción

### 3. Transacciones MongoDB Abortadas
**Error:** `Transaction with { txnNumber: X } has been aborted`
**Causa:** Problemas en el manejo de transacciones y sesiones
**Solución:** Mejorado el manejo de transacciones con configuraciones específicas

### 4. Stock Insuficiente con Valores Incorrectos
**Error:** `Stock insuficiente. Disponible: 15, Solicitado: 444`
**Causa:** Problemas en la conversión de unidades y validación de cantidades
**Solución:** Mejorada la lógica de conversión y validación

## Archivos Modificados

### 1. `lib/models/inventory/Inventory.ts`
- ✅ Eliminado índice duplicado `batches.batchId`
- ✅ Modificados métodos para evitar `save()` automático
- ✅ Mejorado manejo de lotes y totales

### 2. `lib/services/inventory/inventoryService.ts`
- ✅ Refactorizado `adjustStock()` para evitar ParallelSaveError
- ✅ Mejorado `transferStock()` con lógica más robusta
- ✅ Agregadas configuraciones de transacción específicas
- ✅ Mejorada conversión de unidades

### 3. `components/inventory/StockModal.tsx`
- ✅ Mejorado manejo de errores en la UI

### 4. `app/api/inventory/stock/adjust/route.ts`
- ✅ Agregado mejor logging de errores

## Scripts de Reparación

### 1. Limpiar Índices Duplicados
```bash
node scripts/fix-inventory-indexes.js
```
Este script:
- Conecta a MongoDB
- Identifica índices duplicados
- Elimina los duplicados manteniendo uno
- Muestra el estado final de los índices

### 2. Reparar Datos de Inventario
```bash
node scripts/repair-inventory-data.js
```
Este script:
- Recalcula totales de inventario basado en lotes
- Limpia lotes con cantidad 0 o negativa
- Repara inconsistencias en los datos
- Muestra estadísticas de movimientos

## Instrucciones de Implementación

### Paso 1: Detener la aplicación
```bash
# Detener el servidor de desarrollo
# Ctrl+C en la terminal donde corre npm run dev
```

### Paso 2: Ejecutar scripts de reparación
```bash
# 1. Limpiar índices duplicados
node scripts/fix-inventory-indexes.js

# 2. Reparar datos inconsistentes
node scripts/repair-inventory-data.js
```

### Paso 3: Reiniciar la aplicación
```bash
npm run dev
```

## Verificación Post-Reparación

### 1. Verificar que no hay warnings de Mongoose
- Los warnings de índices duplicados deben desaparecer
- No debe haber errores de ParallelSaveError

### 2. Probar operaciones de inventario
- ✅ Entrada de stock
- ✅ Salida de stock
- ✅ Transferencias entre ubicaciones
- ✅ Ajustes de inventario

### 3. Verificar datos en la UI
- Los totales de inventario deben ser correctos
- Los movimientos deben registrarse correctamente
- Las alertas deben funcionar apropiadamente

## Monitoreo Continuo

