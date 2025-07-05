"use client";

import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@heroui/react";
import { ArrowRightEndOnRectangleIcon } from "@heroicons/react/24/outline";

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
        variant={variant}
        size={size}
        color={color}
        className={className}
        startContent={showIcon ? <ArrowRightEndOnRectangleIcon className="w-4 h-4" /> : undefined}
      >
        {children || "Cerrar Sesión"}
      </Button>
    </SignOutButton>
  );
}