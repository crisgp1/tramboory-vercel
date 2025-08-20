"use client"

import { useState } from "react"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Card,
  TextInput,
  Button,
  Anchor,
  Divider
} from "@mantine/core"
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
  const { isLoaded, signIn, setActive } = useSignIn()
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
    if (!isLoaded) return

    setIsLoading(true)
    
    try {
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        toast.success("¡Bienvenido!")
        router.push("/dashboard")
      } else {
        toast.error("Error al iniciar sesión")
      }
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || "Credenciales inválidas")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <Card.Section className="flex flex-col gap-3 pb-0">
        <h1 className="text-2xl font-bold text-center">Iniciar Sesión</h1>
        <p className="text-small text-default-500 text-center">
          Ingresa tus credenciales para acceder
        </p>
      </Card.Section>
      
      <Card.Section className="gap-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <TextInput
            {...register("email")}
            type="email"
            label="Email"
            placeholder="tu@email.com"
            error={errors.email?.message}
          />
          
          <TextInput
            {...register("password")}
            label="Contraseña"
            placeholder="Ingresa tu contraseña"
            error={errors.password?.message}
            rightSection={
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
            color="blue"
            size="lg"
            loading={isLoading}
            className="w-full"
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </form>

        <div className="flex justify-center">
          <Anchor
            component="button"
            size="sm"
            onClick={onSwitchToForgotPassword}
            className="text-primary"
          >
            ¿Olvidaste tu contraseña?
          </Anchor>
        </div>

        <Divider />

        <div className="text-center">
          <span className="text-small text-default-500">
            ¿No tienes cuenta?{" "}
          </span>
          <Anchor
            component="button"
            size="sm"
            onClick={onSwitchToRegister}
            className="text-primary"
          >
            Crear cuenta
          </Anchor>
        </div>
      </Card.Section>
    </Card>
  )
}