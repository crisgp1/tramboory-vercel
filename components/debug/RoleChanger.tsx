"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { UserRole } from "@/lib/roles"

const AVAILABLE_ROLES: UserRole[] = ["admin", "gerente", "proveedor", "vendedor", "customer"]

export function RoleChanger() {
  const { user } = useUser()
  const [isChanging, setIsChanging] = useState(false)
  const [message, setMessage] = useState("")

  const currentRole = (user?.publicMetadata?.role as UserRole) || "customer"

  const changeRole = async (newRole: UserRole) => {
    if (!user) return

    setIsChanging(true)
    setMessage("")

    try {
      const response = await fetch(`/api/users/${user.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        setMessage(`✅ Rol cambiado a ${newRole}. Recargando...`)
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        const error = await response.json()
        setMessage(`❌ Error: ${error.message || 'No se pudo cambiar el rol'}`)
      }
    } catch (error) {
      setMessage(`❌ Error de conexión: ${error}`)
    } finally {
      setIsChanging(false)
    }
  }

  if (!user) {
    return <div className="p-4 bg-gray-100 rounded">No hay usuario autenticado</div>
  }

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">🔧 Cambiar Rol de Usuario</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">Usuario: {user.emailAddresses[0]?.emailAddress}</p>
        <p className="text-sm text-gray-600">Rol actual: <span className="font-semibold text-blue-600">{currentRole}</span></p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {AVAILABLE_ROLES.map((role) => (
          <button
            key={role}
            onClick={() => changeRole(role)}
            disabled={isChanging || role === currentRole}
            className={`px-3 py-2 text-sm rounded transition-colors ${
              role === currentRole
                ? "bg-blue-100 text-blue-800 cursor-not-allowed"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            } ${isChanging ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {role}
          </button>
        ))}
      </div>

      {message && (
        <div className={`p-3 rounded text-sm ${
          message.includes("✅") 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}>
          {message}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Nota:</strong> Después de cambiar el rol, la página se recargará automáticamente.</p>
        <p><strong>Pruebas:</strong></p>
        <ul className="list-disc list-inside mt-1">
          <li><strong>admin/gerente/proveedor/vendedor:</strong> Pueden acceder a /dashboard y /reservaciones</li>
          <li><strong>customer:</strong> Solo puede acceder a /reservaciones y /bienvenida</li>
        </ul>
      </div>
    </div>
  )
}