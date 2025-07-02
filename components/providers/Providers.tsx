"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { HeroUIProvider } from "@heroui/react"
import { Toaster } from "react-hot-toast"
import SignUpRedirectHandler from "@/components/auth/SignUpRedirectHandler"

interface ProvidersProps {
  children: React.ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ClerkProvider>
      <HeroUIProvider>
        <SignUpRedirectHandler />
        {children}
        <Toaster position="top-right" />
      </HeroUIProvider>
    </ClerkProvider>
  )
}