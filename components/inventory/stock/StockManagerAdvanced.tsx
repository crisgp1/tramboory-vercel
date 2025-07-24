"use client"

import React from "react"
import { NordicCard, nordicTokens } from "@/components/ui/nordic"
import StockManager from "./StockManager"

export default function StockManagerNordic() {
  return (
    <div className="space-y-6">
      {/* Nordic styled wrapper for existing StockManager */}
      <div 
        className="w-full"
        style={{
          fontFamily: nordicTokens.typography.fontFamily.primary
        }}
      >
        <style jsx global>{`
          /* Override existing component styles with Nordic design */
          .stock-manager-container input {
            font-family: ${nordicTokens.typography.fontFamily.primary} !important;
            font-size: ${nordicTokens.typography.fontSize.sm} !important;
            color: ${nordicTokens.colors.text.primary} !important;
          }
          
          .stock-manager-container input::placeholder {
            color: ${nordicTokens.colors.text.tertiary} !important;
          }
          
          .stock-manager-container button {
            font-family: ${nordicTokens.typography.fontFamily.primary} !important;
            font-weight: ${nordicTokens.typography.fontWeight.medium} !important;
            transition: all ${nordicTokens.transition.normal} !important;
          }
          
          .stock-manager-container .card {
            background: ${nordicTokens.colors.background.primary} !important;
            border: 1px solid ${nordicTokens.colors.border.secondary} !important;
            border-radius: ${nordicTokens.radius.lg} !important;
            box-shadow: ${nordicTokens.shadow.sm} !important;
          }
          
          .stock-manager-container .text-gray-900 {
            color: ${nordicTokens.colors.text.primary} !important;
          }
          
          .stock-manager-container .text-gray-600 {
            color: ${nordicTokens.colors.text.secondary} !important;
          }
          
          .stock-manager-container .text-gray-500 {
            color: ${nordicTokens.colors.text.tertiary} !important;
          }
          
          .stock-manager-container .bg-gray-50 {
            background-color: ${nordicTokens.colors.background.secondary} !important;
          }
          
          .stock-manager-container .bg-gray-100 {
            background-color: ${nordicTokens.colors.background.tertiary} !important;
          }
          
          .stock-manager-container .border-gray-200 {
            border-color: ${nordicTokens.colors.border.secondary} !important;
          }
          
          .stock-manager-container .border-gray-100 {
            border-color: ${nordicTokens.colors.border.primary} !important;
          }
          
          /* Focus states */
          .stock-manager-container input:focus,
          .stock-manager-container select:focus,
          .stock-manager-container button:focus {
            outline: none !important;
            border-color: ${nordicTokens.colors.border.focus} !important;
            box-shadow: 0 0 0 1px ${nordicTokens.colors.border.focus}20 !important;
          }
          
          /* Hover states */
          .stock-manager-container button:hover {
            transform: translateY(-1px) !important;
            box-shadow: ${nordicTokens.shadow.md} !important;
          }
          
          /* Card hover effects */
          .stock-manager-container .card:hover {
            border-color: ${nordicTokens.colors.text.secondary}40 !important;
            box-shadow: ${nordicTokens.shadow.md} !important;
          }
        `}</style>
        
        <div className="stock-manager-container">
          <StockManager />
        </div>
      </div>
    </div>
  )
}