"use client";

import { useUser } from "@clerk/nextjs";
import { Button, Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
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
      <header className={`bg-white shadow-sm border-b border-gray-200 px-4 py-3 ${className}`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </header>
    );
  }

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Title/Logo */}
        <div className="flex items-center gap-4">
          {showHomeLink && (
            <Link href="/">
              <Button
                variant="light"
                size="sm"
                startContent={<HomeIcon className="w-4 h-4" />}
                className="text-gray-600 hover:text-gray-900"
              >
                Inicio
              </Button>
            </Link>
          )}
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Desktop View */}
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-600">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
                <Avatar
                  src={user.imageUrl}
                  name={user.firstName || "Usuario"}
                  size="sm"
                />
                <LogoutButton size="sm" />
              </div>

              {/* Mobile View */}
              <div className="md:hidden">
                <Dropdown>
                  <DropdownTrigger>
                    <Avatar
                      src={user.imageUrl}
                      name={user.firstName || "Usuario"}
                      size="sm"
                      className="cursor-pointer"
                    />
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Menú de usuario">
                    <DropdownItem key="profile" className="h-14 gap-2">
                      <p className="font-semibold">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-600">{user.primaryEmailAddress?.emailAddress}</p>
                    </DropdownItem>
                    {showHomeLink ? (
                      <DropdownItem 
                        key="home" 
                        startContent={<HomeIcon className="w-4 h-4" />}
                        onPress={() => window.location.href = "/"}
                      >
                        Inicio
                      </DropdownItem>
                    ) : null}
                    <DropdownItem key="logout" color="danger" className="text-danger">
                      <LogoutButton 
                        variant="light" 
                        color="danger" 
                        size="sm"
                        className="w-full justify-start p-0"
                      />
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </>
          ) : (
            <Link href="/sign-in">
              <Button color="primary" size="sm">
                Iniciar Sesión
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}