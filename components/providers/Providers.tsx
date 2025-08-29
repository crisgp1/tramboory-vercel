"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { esMX } from "@clerk/localizations"
import { MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import { ModalsProvider } from "@mantine/modals"
import { Toaster } from "react-hot-toast"
import SignUpRedirectHandler from "@/components/auth/SignUpRedirectHandler"

interface ProvidersProps {
  children: React.ReactNode
}

// Personalización de la localización para corregir errores tipográficos
const customLocalization = {
  ...esMX,
  signUp: {
    ...esMX.signUp,
    start: {
      ...esMX.signUp?.start,
      actionLink: "Iniciar sesión"
    }
  },
  signIn: {
    ...esMX.signIn,
    start: {
      ...esMX.signIn?.start,
      actionLink: "Registrarse"
    }
  }
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ClerkProvider localization={customLocalization}>
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