"use client";

import { Stack, Text, Badge, Group } from "@mantine/core";
import { UnifiedSupplier, SupplierStatus, SupplierType } from "@/lib/types/supplier.types";
import { formatSupplierDisplay } from "@/lib/utils/supplier.utils";

interface SupplierInfoProps {
  supplier: UnifiedSupplier | null;
  className?: string;
}

// Single Responsibility - Only displays supplier information
export default function SupplierInfo({ supplier, className }: SupplierInfoProps) {
  if (!supplier) {
    return (
      <div className={className}>
        <Stack gap="xs" p="md">
          <Text size="sm" c="dimmed">No hay información de proveedor</Text>
        </Stack>
      </div>
    );
  }

  const supplierDisplay = formatSupplierDisplay(supplier);

  return (
    <div className={className}>
      <Stack gap="xs" p="md">
        <Text fw={500} size="sm">{supplierDisplay.displayName}</Text>
        <Text size="xs" c="dimmed">{supplierDisplay.contactInfo}</Text>
        <Group gap="xs">
          <Badge
            size="sm"
            color={supplierDisplay.statusColor}
            variant="light"
          >
            {supplierDisplay.statusLabel}
          </Badge>
          <Badge size="sm" color="gray" variant="outline">
            {supplierDisplay.typeLabel}
          </Badge>
        </Group>
        {supplier.code && (
          <Text size="xs" c="dimmed" fw={500}>
            Código: {supplier.code}
          </Text>
        )}
      </Stack>
    </div>
  );
}