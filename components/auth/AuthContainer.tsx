"use client"

import { useState } from "react"
import LoginForm from "./LoginForm"
import RegisterForm from "./RegisterForm"
import ForgotPasswordForm from "./ForgotPasswordForm"

type AuthView = "login" | "register" | "forgot-password"

export default function AuthContainer() {
  const [currentView, setCurrentView] = useState<AuthView>("login")

  const switchToLogin = () => setCurrentView("login")
  const switchToRegister = () => setCurrentView("register")
  const switchToForgotPassword = () => setCurrentView("forgot-password")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {currentView === "login" && (
          <LoginForm
            onSwitchToRegister={switchToRegister}
            onSwitchToForgotPassword={switchToForgotPassword}
          />
        )}
        
        {currentView === "register" && (
          <RegisterForm onSwitchToLogin={switchToLogin} />
        )}
        
        {currentView === "forgot-password" && (
          <ForgotPasswordForm onBackToLogin={switchToLogin} />
        )}
      </div>
    </div>
  )
}