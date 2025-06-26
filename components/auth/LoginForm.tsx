"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Link,
  Divider
} from "@heroui/react"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import toast from "react-hot-toast"

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSwitchToRegister: () => void
  onSwitchToForgotPassword: () => void
}

export default function LoginForm({ 
  onSwitchToRegister, 
  onSwitchToForgotPassword 
}: LoginFormProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const toggleVisibility = () => setIsVisible(!isVisible)

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Credenciales inválidas")
      } else {
        toast.success("¡Bienvenido!")
        router.push("/dashboard")
      }
    } catch (error) {
      toast.error("Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col gap-3 pb-0">
        <h1 className="text-2xl font-bold text-center">Iniciar Sesión</h1>
        <p className="text-small text-default-500 text-center">
          Ingresa tus credenciales para acceder
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
          />
          
          <Input
            {...register("password")}
            label="Contraseña"
            placeholder="Ingresa tu contraseña"
            variant="bordered"
            isInvalid={!!errors.password}
            errorMessage={errors.password?.message}
            endContent={
              <button
                className="focus:outline-none"
                type="button"
                onClick={toggleVisibility}
              >
                {isVisible ? (
                  <EyeSlashIcon className="w-5 h-5 text-default-400" />
                ) : (
                  <EyeIcon className="w-5 h-5 text-default-400" />
                )}
              </button>
            }
            type={isVisible ? "text" : "password"}
          />

          <Button
            type="submit"
            color="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full"
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </form>

        <div className="flex justify-center">
          <Link
            as="button"
            size="sm"
            onPress={onSwitchToForgotPassword}
            className="text-primary"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Divider />

        <div className="text-center">
          <span className="text-small text-default-500">
            ¿No tienes cuenta?{" "}
          </span>
          <Link
            as="button"
            size="sm"
            onPress={onSwitchToRegister}
            className="text-primary"
          >
            Crear cuenta
          </Link>
        </div>
      </CardBody>
    </Card>
  )
}