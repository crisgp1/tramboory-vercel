"use client"

import React from "react"
import { NordicCard, nordicTokens } from "@/components/ui/nordic"
import SupplierManager from "./SupplierManager"

export default function SupplierManagerNordic() {
  return (
    <div className="space-y-6">
      {/* Nordic styled wrapper for existing SupplierManager */}
      <div 
        className="w-full"
        style={{
          fontFamily: nordicTokens.typography.fontFamily.primary
        }}
      >
        <style jsx global>{`
          /* Override existing component styles with Nordic design */
          .supplier-manager-container input {
            font-family: ${nordicTokens.typography.fontFamily.primary} !important;
            font-size: ${nordicTokens.typography.fontSize.sm} !important;
            color: ${nordicTokens.colors.text.primary} !important;
          }
          
          .supplier-manager-container input::placeholder {
            color: ${nordicTokens.colors.text.tertiary} !important;
          }
          
          .supplier-manager-container button {
            font-family: ${nordicTokens.typography.fontFamily.primary} !important;
            font-weight: ${nordicTokens.typography.fontWeight.medium} !important;
            transition: all ${nordicTokens.transition.normal} !important;
          }
          
          .supplier-manager-container .card {
            background: ${nordicTokens.colors.background.primary} !important;
            border: 1px solid ${nordicTokens.colors.border.secondary} !important;
            border-radius: ${nordicTokens.radius.lg} !important;
            box-shadow: ${nordicTokens.shadow.sm} !important;
          }
          
          .supplier-manager-container table {
            background: ${nordicTokens.colors.background.primary} !important;
            border: 1px solid ${nordicTokens.colors.border.secondary} !important;
            border-radius: ${nordicTokens.radius.lg} !important;
          }
          
          .supplier-manager-container th {
            background: ${nordicTokens.colors.background.secondary} !important;
            color: ${nordicTokens.colors.text.secondary} !important;
            font-weight: ${nordicTokens.typography.fontWeight.semibold} !important;
            text-transform: uppercase !important;
            font-size: ${nordicTokens.typography.fontSize.xs} !important;
            letter-spacing: 0.05em !important;
            border-bottom: 1px solid ${nordicTokens.colors.border.secondary} !important;
          }
          
          .supplier-manager-container td {
            color: ${nordicTokens.colors.text.primary} !important;
            font-size: ${nordicTokens.typography.fontSize.sm} !important;
            border-bottom: 1px solid ${nordicTokens.colors.border.secondary} !important;
          }
          
          .supplier-manager-container .text-gray-900 {
            color: ${nordicTokens.colors.text.primary} !important;
          }
          
          .supplier-manager-container .text-gray-600 {
            color: ${nordicTokens.colors.text.secondary} !important;
          }
          
          .supplier-manager-container .text-gray-500 {
            color: ${nordicTokens.colors.text.tertiary} !important;
          }
          
          .supplier-manager-container .bg-gray-50 {
            background-color: ${nordicTokens.colors.background.secondary} !important;
          }
          
          .supplier-manager-container .bg-gray-100 {
            background-color: ${nordicTokens.colors.background.tertiary} !important;
          }
          
          .supplier-manager-container .border-gray-200 {
            border-color: ${nordicTokens.colors.border.secondary} !important;
          }
          
          .supplier-manager-container .border-gray-100 {
            border-color: ${nordicTokens.colors.border.primary} !important;
          }
          
          /* Focus states */
          .supplier-manager-container input:focus,
          .supplier-manager-container select:focus,
          .supplier-manager-container button:focus {
            outline: none !important;
            border-color: ${nordicTokens.colors.border.focus} !important;
            box-shadow: 0 0 0 1px ${nordicTokens.colors.border.focus}20 !important;
          }
          
          /* Hover states */
          .supplier-manager-container button:hover {
            transform: translateY(-1px) !important;
            box-shadow: ${nordicTokens.shadow.md} !important;
          }
          
          .supplier-manager-container tr:hover {
            background-color: ${nordicTokens.colors.background.secondary}50 !important;
          }
          
          /* Card hover effects */
          .supplier-manager-container .card:hover {
            border-color: ${nordicTokens.colors.text.secondary}40 !important;
            box-shadow: ${nordicTokens.shadow.md} !important;
          }
          
          /* Modal styling */
          .supplier-manager-container .modal {
            background: ${nordicTokens.colors.background.primary} !important;
            border: 1px solid ${nordicTokens.colors.border.secondary} !important;
            border-radius: ${nordicTokens.radius.lg} !important;
            box-shadow: ${nordicTokens.shadow.lg} !important;
          }
          
          /* Chip components */
          .supplier-manager-container .chip {
            font-size: ${nordicTokens.typography.fontSize.xs} !important;
            font-weight: ${nordicTokens.typography.fontWeight.medium} !important;
            border-radius: ${nordicTokens.radius.sm} !important;
          }
        `}</style>
        
        <div className="supplier-manager-container">
          <SupplierManager />
        </div>
      </div>
    </div>
  )
}