"use client"

import React from "react"
import { nordicTokens } from "@/components/ui/nordic"
import PurchaseOrderManager from "./PurchaseOrderManager"

export default function PurchaseOrderManagerNordic() {
  return (
    <div className="space-y-6">
      {/* Nordic styled wrapper for existing PurchaseOrderManager */}
      <div 
        className="w-full"
        style={{
          fontFamily: nordicTokens.typography.fontFamily.primary
        }}
      >
        <style jsx global>{`
          /* Override existing component styles with Nordic design */
          .purchase-order-container input {
            font-family: ${nordicTokens.typography.fontFamily.primary} !important;
            font-size: ${nordicTokens.typography.fontSize.sm} !important;
            color: ${nordicTokens.colors.text.primary} !important;
          }
          
          .purchase-order-container input::placeholder {
            color: ${nordicTokens.colors.text.tertiary} !important;
          }
          
          .purchase-order-container button {
            font-family: ${nordicTokens.typography.fontFamily.primary} !important;
            font-weight: ${nordicTokens.typography.fontWeight.medium} !important;
            transition: all ${nordicTokens.transition.normal} !important;
          }
          
          .purchase-order-container .card {
            background: ${nordicTokens.colors.background.primary} !important;
            border: 1px solid ${nordicTokens.colors.border.secondary} !important;
            border-radius: ${nordicTokens.radius.lg} !important;
            box-shadow: ${nordicTokens.shadow.sm} !important;
          }
          
          .purchase-order-container table {
            background: ${nordicTokens.colors.background.primary} !important;
            border: 1px solid ${nordicTokens.colors.border.secondary} !important;
            border-radius: ${nordicTokens.radius.lg} !important;
          }
          
          .purchase-order-container th {
            background: ${nordicTokens.colors.background.secondary} !important;
            color: ${nordicTokens.colors.text.secondary} !important;
            font-weight: ${nordicTokens.typography.fontWeight.semibold} !important;
            text-transform: uppercase !important;
            font-size: ${nordicTokens.typography.fontSize.xs} !important;
            letter-spacing: 0.05em !important;
            border-bottom: 1px solid ${nordicTokens.colors.border.secondary} !important;
          }
          
          .purchase-order-container td {
            color: ${nordicTokens.colors.text.primary} !important;
            font-size: ${nordicTokens.typography.fontSize.sm} !important;
            border-bottom: 1px solid ${nordicTokens.colors.border.secondary} !important;
          }
          
          .purchase-order-container .text-gray-900 {
            color: ${nordicTokens.colors.text.primary} !important;
          }
          
          .purchase-order-container .text-gray-600 {
            color: ${nordicTokens.colors.text.secondary} !important;
          }
          
          .purchase-order-container .text-gray-500 {
            color: ${nordicTokens.colors.text.tertiary} !important;
          }
          
          .purchase-order-container .bg-gray-50 {
            background-color: ${nordicTokens.colors.background.secondary} !important;
          }
          
          .purchase-order-container .bg-gray-100 {
            background-color: ${nordicTokens.colors.background.tertiary} !important;
          }
          
          .purchase-order-container .border-gray-200 {
            border-color: ${nordicTokens.colors.border.secondary} !important;
          }
          
          .purchase-order-container .border-gray-100 {
            border-color: ${nordicTokens.colors.border.primary} !important;
          }
          
          /* Status colors for purchase orders */
          .purchase-order-container .bg-blue-50 {
            background-color: ${nordicTokens.colors.status.active}20 !important;
            border-color: ${nordicTokens.colors.status.active}40 !important;
          }
          
          .purchase-order-container .bg-green-50 {
            background-color: ${nordicTokens.colors.status.active}20 !important;
            border-color: ${nordicTokens.colors.status.active}40 !important;
          }
          
          .purchase-order-container .text-blue-600 {
            color: ${nordicTokens.colors.status.active} !important;
          }
          
          .purchase-order-container .text-green-600 {
            color: ${nordicTokens.colors.status.active} !important;
          }
          
          /* Focus states */
          .purchase-order-container input:focus,
          .purchase-order-container select:focus,
          .purchase-order-container button:focus {
            outline: none !important;
            border-color: ${nordicTokens.colors.border.focus} !important;
            box-shadow: 0 0 0 1px ${nordicTokens.colors.border.focus}20 !important;
          }
          
          /* Hover states */
          .purchase-order-container button:hover {
            transform: translateY(-1px) !important;
            box-shadow: ${nordicTokens.shadow.md} !important;
          }
          
          .purchase-order-container tr:hover {
            background-color: ${nordicTokens.colors.background.secondary}50 !important;
          }
          
          /* Card hover effects */
          .purchase-order-container .card:hover {
            border-color: ${nordicTokens.colors.text.secondary}40 !important;
            box-shadow: ${nordicTokens.shadow.md} !important;
          }
          
          /* Modal styling */
          .purchase-order-container .modal {
            background: ${nordicTokens.colors.background.primary} !important;
            border: 1px solid ${nordicTokens.colors.border.secondary} !important;
            border-radius: ${nordicTokens.radius.lg} !important;
            box-shadow: ${nordicTokens.shadow.lg} !important;
          }
        `}</style>
        
        <div className="purchase-order-container">
          <PurchaseOrderManager />
        </div>
      </div>
    </div>
  )
}