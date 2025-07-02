import RoleDiagnostic from '@/components/debug/RoleDiagnostic'
import { RoleChanger } from '@/components/debug/RoleChanger'

export default function DebugRolesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🔧 Debug de Roles y Middleware</h1>
        
        <RoleChanger />
        
        <RoleDiagnostic />
      </div>
    </div>
  )
}