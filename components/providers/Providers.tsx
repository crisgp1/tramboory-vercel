"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import { ModalsProvider } from "@mantine/modals"
import { Toaster } from "react-hot-toast"
import SignUpRedirectHandler from "@/components/auth/SignUpRedirectHandler"

interface ProvidersProps {
  children: React.ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ClerkProvider>
      <MantineProvider>
        <ModalsProvider>
          <SignUpRedirectHandler />
          {children}
          <Notifications position="top-right" />
          <Toaster position="top-right" />
        </ModalsProvider>
      </MantineProvider>
    </ClerkProvider>
  )
}