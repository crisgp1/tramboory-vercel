"use client"

import React from "react"
import { nordicTokens } from "@/components/ui/nordic"
import InventoryAlerts from "./InventoryAlerts"

export default function InventoryAlertsNordic() {
  return (
    <div className="space-y-6">
      {/* Nordic styled wrapper for existing InventoryAlerts */}
      <div 
        className="w-full"
        style={{
          fontFamily: nordicTokens.typography.fontFamily.primary
        }}
      >
        <style jsx global>{`
          /* Override existing component styles with Nordic design */
          .inventory-alerts-container input {
            font-family: ${nordicTokens.typography.fontFamily.primary} !important;
            font-size: ${nordicTokens.typography.fontSize.sm} !important;
            color: ${nordicTokens.colors.text.primary} !important;
          }
          
          .inventory-alerts-container input::placeholder {
            color: ${nordicTokens.colors.text.tertiary} !important;
          }
          
          .inventory-alerts-container button {
            font-family: ${nordicTokens.typography.fontFamily.primary} !important;
            font-weight: ${nordicTokens.typography.fontWeight.medium} !important;
            transition: all ${nordicTokens.transition.normal} !important;
          }
          
          .inventory-alerts-container .card {
            background: ${nordicTokens.colors.background.primary} !important;
            border: 1px solid ${nordicTokens.colors.border.secondary} !important;
            border-radius: ${nordicTokens.radius.lg} !important;
            box-shadow: ${nordicTokens.shadow.sm} !important;
          }
          
          .inventory-alerts-container .alert-card {
            background: ${nordicTokens.colors.background.primary} !important;
            border: 1px solid ${nordicTokens.colors.border.secondary} !important;
            border-radius: ${nordicTokens.radius.md} !important;
            box-shadow: ${nordicTokens.shadow.sm} !important;
            transition: all ${nordicTokens.transition.normal} !important;
          }
          
          .inventory-alerts-container .alert-card:hover {
            border-color: ${nordicTokens.colors.text.secondary}40 !important;
            box-shadow: ${nordicTokens.shadow.md} !important;
            transform: translateY(-1px) !important;
          }
          
          .inventory-alerts-container .text-gray-900 {
            color: ${nordicTokens.colors.text.primary} !important;
          }
          
          .inventory-alerts-container .text-gray-600 {
            color: ${nordicTokens.colors.text.secondary} !important;
          }
          
          .inventory-alerts-container .text-gray-500 {
            color: ${nordicTokens.colors.text.tertiary} !important;
          }
          
          .inventory-alerts-container .bg-gray-50 {
            background-color: ${nordicTokens.colors.background.secondary} !important;
          }
          
          .inventory-alerts-container .bg-gray-100 {
            background-color: ${nordicTokens.colors.background.tertiary} !important;
          }
          
          .inventory-alerts-container .border-gray-200 {
            border-color: ${nordicTokens.colors.border.secondary} !important;
          }
          
          .inventory-alerts-container .border-gray-100 {
            border-color: ${nordicTokens.colors.border.primary} !important;
          }
          
          /* Status colors for alerts */
          .inventory-alerts-container .bg-red-50 {
            background-color: ${nordicTokens.colors.status.error}20 !important;
            border-color: ${nordicTokens.colors.status.error}40 !important;
          }
          
          .inventory-alerts-container .bg-yellow-50 {
            background-color: ${nordicTokens.colors.status.warning}20 !important;
            border-color: ${nordicTokens.colors.status.warning}40 !important;
          }
          
          .inventory-alerts-container .text-red-600 {
            color: ${nordicTokens.colors.status.error} !important;
          }
          
          .inventory-alerts-container .text-yellow-600 {
            color: ${nordicTokens.colors.status.warning} !important;
          }
          
          /* Focus states */
          .inventory-alerts-container input:focus,
          .inventory-alerts-container select:focus,
          .inventory-alerts-container button:focus {
            outline: none !important;
            border-color: ${nordicTokens.colors.border.focus} !important;
            box-shadow: 0 0 0 1px ${nordicTokens.colors.border.focus}20 !important;
          }
          
          /* Hover states */
          .inventory-alerts-container button:hover {
            transform: translateY(-1px) !important;
            box-shadow: ${nordicTokens.shadow.md} !important;
          }
        `}</style>
        
        <div className="inventory-alerts-container">
          <InventoryAlerts />
        </div>
      </div>
    </div>
  )
}