"use client";

import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@mantine/core";
import { ArrowRightEndOnRectangleIcon } from "@heroicons/react/24/outline";
import { mapHeroUIVariantToMantine, mapHeroUIColorToMantine, mapHeroUISize } from "@/lib/migration-utils";

interface LogoutButtonProps {
  variant?: "solid" | "bordered" | "light" | "flat" | "faded" | "shadow" | "ghost";
  size?: "sm" | "md" | "lg";
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export default function LogoutButton({ 
  variant = "bordered",
  size = "md",
  color = "danger",
  className = "",
  showIcon = true,
  children
}: LogoutButtonProps) {
  return (
    <SignOutButton redirectUrl="/">
      <Button
        variant={mapHeroUIVariantToMantine(variant)}
        size={mapHeroUISize(size)}
        color={mapHeroUIColorToMantine(color)}
        className={className}
        leftSection={showIcon ? <ArrowRightEndOnRectangleIcon className="w-4 h-4" /> : undefined}
      >
        {children || "Cerrar Sesión"}
      </Button>
    </SignOutButton>
  );
}