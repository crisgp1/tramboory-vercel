"use client"

import { useSession, signOut } from "next-auth/react"
import { Card, CardBody, CardHeader, Button, Avatar } from "@heroui/react"
import { ArrowRightOnRectangleIcon, UserIcon } from "@heroicons/react/24/outline"
import toast from "react-hot-toast"

export default function Dashboard() {
  const { data: session, status } = useSession()

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/" })
      toast.success("Sesión cerrada exitosamente")
    } catch (error) {
      toast.error("Error al cerrar sesión")
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardBody className="text-center">
            <p>No tienes una sesión activa</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Tramboory Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar
                  icon={<UserIcon className="w-6 h-6" />}
                  size="sm"
                  className="bg-primary text-white"
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session.user?.email}
                  </p>
                </div>
              </div>
              
              <Button
                color="danger"
                variant="light"
                size="sm"
                onPress={handleSignOut}
                startContent={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <Card className="col-span-full">
            <CardHeader>
              <h2 className="text-2xl font-bold">
                ¡Bienvenido, {session.user?.name}!
              </h2>
            </CardHeader>
            <CardBody>
              <p className="text-gray-600 dark:text-gray-400">
                Has iniciado sesión exitosamente en Tramboory. Desde aquí puedes gestionar tu cuenta y acceder a todas las funcionalidades.
              </p>
            </CardBody>
          </Card>

          {/* Stats Cards */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Perfil</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Nombre:</span> {session.user?.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {session.user?.email}
                </p>
                <p className="text-sm">
                  <span className="font-medium">ID:</span> {session.user?.id}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Actividad</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Última conexión: Ahora
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Configuración</h3>
            </CardHeader>
            <CardBody>
              <Button size="sm" variant="bordered" className="w-full">
                Editar Perfil
              </Button>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  )
}