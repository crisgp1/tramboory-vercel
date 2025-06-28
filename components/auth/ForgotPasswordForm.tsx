"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button
} from "@heroui/react"
import { ArrowLeftIcon } from "@heroicons/react/24/outline"
import toast from "react-hot-toast"

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

interface ForgotPasswordFormProps {
  onBackToLogin: () => void
}

export default function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { signOut } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    
    try {
      // Con Clerk, el reset de contraseña se maneja desde su dashboard
      // Por ahora, simulamos el envío
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsSubmitted(true)
      toast.success("Revisa tu email para el enlace de recuperación")
    } catch (error) {
      toast.error("Error al procesar la solicitud")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-3 pb-0">
          <h1 className="text-2xl font-bold text-center">Email Enviado</h1>
        </CardHeader>
        
        <CardBody className="gap-4 text-center">
          <div className="flex flex-col gap-4">
            <p className="text-default-600">
              Hemos enviado un enlace de recuperación a:
            </p>
            <p className="font-semibold text-primary">
              {getValues("email")}
            </p>
            <p className="text-small text-default-500">
              Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
            </p>
          </div>

          <Button
            color="primary"
            variant="light"
            onPress={onBackToLogin}
            startContent={<ArrowLeftIcon className="w-4 h-4" />}
          >
            Volver al inicio de sesión
          </Button>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col gap-3 pb-0">
        <h1 className="text-2xl font-bold text-center">Recuperar Contraseña</h1>
        <p className="text-small text-default-500 text-center">
          Ingresa tu email para recibir un enlace de recuperación
        </p>
      </CardHeader>
      
      <CardBody className="gap-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            {...register("email")}
            type="email"
            label="Email"
            placeholder="tu@email.com"
            variant="bordered"
            isInvalid={!!errors.email}
            errorMessage={errors.email?.message}
            description="Te enviaremos un enlace para restablecer tu contraseña"
          />

          <Button
            type="submit"
            color="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full"
          >
            {isLoading ? "Enviando..." : "Enviar Enlace"}
          </Button>
        </form>

        <div className="flex justify-center">
          <Button
            variant="light"
            size="sm"
            onPress={onBackToLogin}
            className="text-default-500"
            startContent={<ArrowLeftIcon className="w-4 h-4" />}
          >
            Volver al inicio de sesión
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}