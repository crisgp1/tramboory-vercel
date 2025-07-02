"use client"

import { SignIn, SignUp } from "@clerk/nextjs"
import { useState } from "react"
import { Button } from "@heroui/react"

type AuthView = "signin" | "signup"

export default function AuthContainer() {
  const [currentView, setCurrentView] = useState<AuthView>("signin")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center gap-2">
          <Button
            color={currentView === "signin" ? "primary" : "default"}
            variant={currentView === "signin" ? "solid" : "bordered"}
            onPress={() => setCurrentView("signin")}
          >
            Iniciar Sesión
          </Button>
          <Button
            color={currentView === "signup" ? "primary" : "default"}
            variant={currentView === "signup" ? "solid" : "bordered"}
            onPress={() => setCurrentView("signup")}
          >
            Crear Cuenta
          </Button>
        </div>

        {currentView === "signin" && (
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: "bg-primary hover:bg-primary/90",
                card: "shadow-lg",
                headerTitle: "text-2xl font-bold",
                headerSubtitle: "text-default-500",
                socialButtonsBlockButton: "border-default-200 hover:bg-default-50",
                formFieldInput: "border-default-200 focus:border-primary",
                footerActionLink: "text-primary hover:text-primary/80"
              }
            }}
            routing="hash"
            signUpUrl="#/signup"
            afterSignInUrl="/reservaciones"
            redirectUrl="/reservaciones"
            forceRedirectUrl="/reservaciones"
          />
        )}

        {currentView === "signup" && (
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary: "bg-primary hover:bg-primary/90",
                card: "shadow-lg",
                headerTitle: "text-2xl font-bold",
                headerSubtitle: "text-default-500",
                socialButtonsBlockButton: "border-default-200 hover:bg-default-50",
                formFieldInput: "border-default-200 focus:border-primary",
                footerActionLink: "text-primary hover:text-primary/80"
              }
            }}
            routing="hash"
            signInUrl="#/signin"
            afterSignUpUrl="/bienvenida"
            redirectUrl="/bienvenida"
            forceRedirectUrl="/bienvenida"
          />
        )}
      </div>
    </div>
  )
}