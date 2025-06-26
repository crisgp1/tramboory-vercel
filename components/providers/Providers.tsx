"use client"

import { SessionProvider } from "next-auth/react"
import { HeroUIProvider } from "@heroui/react"
import { Toaster } from "react-hot-toast"

interface ProvidersProps {
  children: React.ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <HeroUIProvider>
      <SessionProvider>
        {children}
        <Toaster position="top-right" />
      </SessionProvider>
    </HeroUIProvider>
  )
}