"use client"

import React from "react"
import { nordicTokens } from "@/components/ui/nordic"
import InventoryReports from "./InventoryReports"

export default function InventoryReportsNordic() {
  return (
    <div className="space-y-6">
      {/* Nordic styled wrapper for existing InventoryReports */}
      <div 
        className="w-full"
        style={{
          fontFamily: nordicTokens.typography.fontFamily.primary
        }}
      >
        <style jsx global>{`
          /* Override existing component styles with Nordic design */
          .inventory-reports-container input {
            font-family: ${nordicTokens.typography.fontFamily.primary} !important;
            font-size: ${nordicTokens.typography.fontSize.sm} !important;
            color: ${nordicTokens.colors.text.primary} !important;
          }
          
          .inventory-reports-container input::placeholder {
            color: ${nordicTokens.colors.text.tertiary} !important;
          }
          
          .inventory-reports-container button {
            font-family: ${nordicTokens.typography.fontFamily.primary} !important;
            font-weight: ${nordicTokens.typography.fontWeight.medium} !important;
            transition: all ${nordicTokens.transition.normal} !important;
          }
          
          .inventory-reports-container .card {
            background: ${nordicTokens.colors.background.primary} !important;
            border: 1px solid ${nordicTokens.colors.border.secondary} !important;
            border-radius: ${nordicTokens.radius.lg} !important;
            box-shadow: ${nordicTokens.shadow.sm} !important;
          }
          
          .inventory-reports-container .text-gray-900 {
            color: ${nordicTokens.colors.text.primary} !important;
          }
          
          .inventory-reports-container .text-gray-600 {
            color: ${nordicTokens.colors.text.secondary} !important;
          }
          
          .inventory-reports-container .text-gray-500 {
            color: ${nordicTokens.colors.text.tertiary} !important;
          }
          
          .inventory-reports-container .bg-gray-50 {
            background-color: ${nordicTokens.colors.background.secondary} !important;
          }
          
          .inventory-reports-container .bg-gray-100 {
            background-color: ${nordicTokens.colors.background.tertiary} !important;
          }
          
          .inventory-reports-container .border-gray-200 {
            border-color: ${nordicTokens.colors.border.secondary} !important;
          }
          
          .inventory-reports-container .border-gray-100 {
            border-color: ${nordicTokens.colors.border.primary} !important;
          }
          
          /* Focus states */
          .inventory-reports-container input:focus,
          .inventory-reports-container select:focus,
          .inventory-reports-container button:focus {
            outline: none !important;
            border-color: ${nordicTokens.colors.border.focus} !important;
            box-shadow: 0 0 0 1px ${nordicTokens.colors.border.focus}20 !important;
          }
          
          /* Hover states */
          .inventory-reports-container button:hover {
            transform: translateY(-1px) !important;
            box-shadow: ${nordicTokens.shadow.md} !important;
          }
          
          /* Card hover effects */
          .inventory-reports-container .card:hover {
            border-color: ${nordicTokens.colors.text.secondary}40 !important;
            box-shadow: ${nordicTokens.shadow.md} !important;
          }
          
          /* Chart styling */
          .inventory-reports-container .chart-container {
            background: ${nordicTokens.colors.background.primary} !important;
            border: 1px solid ${nordicTokens.colors.border.secondary} !important;
            border-radius: ${nordicTokens.radius.lg} !important;
            box-shadow: ${nordicTokens.shadow.sm} !important;
          }
        `}</style>
        
        <div className="inventory-reports-container">
          <InventoryReports />
        </div>
      </div>
    </div>
  )
}