"use client"

import { useState } from "react"
import { useSignUp } from "@clerk/nextjs"
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

const registerSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirma tu contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSwitchToLogin: () => void
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isConfirmVisible, setIsConfirmVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState("")
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const toggleVisibility = () => setIsVisible(!isVisible)
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible)

  const onSubmit = async (data: RegisterFormData) => {
    if (!isLoaded) return

    setIsLoading(true)
    
    try {
      await signUp.create({
        firstName: data.firstName,
        lastName: data.lastName,
        emailAddress: data.email,
        password: data.password,
      })

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setPendingVerification(true)
      toast.success("¡Revisa tu email para verificar tu cuenta!")
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || "Error al crear la cuenta")
    } finally {
      setIsLoading(false)
    }
  }

  const onPressVerify = async () => {
    if (!isLoaded) return

    setIsLoading(true)
    
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (completeSignUp.status !== "complete") {
        toast.error("Error en la verificación")
        return
      }

      await setActive({ session: completeSignUp.createdSessionId })
      toast.success("¡Cuenta creada exitosamente!")
      router.push("/dashboard")
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || "Código de verificación inválido")
    } finally {
      setIsLoading(false)
    }
  }

  if (pendingVerification) {
    return (
      <Card className="w-full max-w-md">
        <Card.Section className="flex flex-col gap-3 pb-0">
          <h1 className="text-2xl font-bold text-center">Verificar Email</h1>
          <p className="text-small text-default-500 text-center">
            Ingresa el código que enviamos a tu email
          </p>
        </Card.Section>
        
        <Card.Section className="gap-4">
          <TextInput
            value={code}
            label="Código de verificación"
            placeholder="Ingresa el código de 6 dígitos"
            onChange={(e) => setCode(e.target.value)}
          />
          
          <Button
            onClick={onPressVerify}
            color="blue"
            size="lg"
            loading={isLoading}
            className="w-full"
          >
            {isLoading ? "Verificando..." : "Verificar Email"}
          </Button>

          <div className="text-center">
            <Anchor
              component="button"
              size="sm"
              onClick={() => setPendingVerification(false)}
              className="text-default-500"
            >
              Volver atrás
            </Anchor>
          </div>
        </Card.Section>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <Card.Section className="flex flex-col gap-3 pb-0">
        <h1 className="text-2xl font-bold text-center">Crear Cuenta</h1>
        <p className="text-small text-default-500 text-center">
          Completa los datos para registrarte
        </p>
      </Card.Section>
      
      <Card.Section className="gap-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <TextInput
              {...register("firstName")}
              type="text"
              label="Nombre"
              placeholder="Tu nombre"
              error={errors.firstName?.message}
            />
            
            <TextInput
              {...register("lastName")}
              type="text"
              label="Apellido"
              placeholder="Tu apellido"
              error={errors.lastName?.message}
            />
          </div>

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
            placeholder="Mínimo 6 caracteres"
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

          <TextInput
            {...register("confirmPassword")}
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            error={errors.confirmPassword?.message}
            rightSection={
              <button
                className="focus:outline-none"
                type="button"
                onClick={toggleConfirmVisibility}
              >
                {isConfirmVisible ? (
                  <EyeSlashIcon className="w-5 h-5 text-default-400" />
                ) : (
                  <EyeIcon className="w-5 h-5 text-default-400" />
                )}
              </button>
            }
            type={isConfirmVisible ? "text" : "password"}
          />

          <Button
            type="submit"
            color="blue"
            size="lg"
            loading={isLoading}
            className="w-full"
          >
            {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
          </Button>
        </form>

        <Divider />

        <div className="text-center">
          <span className="text-small text-default-500">
            ¿Ya tienes cuenta?{" "}
          </span>
          <Anchor
            component="button"
            size="sm"
            onClick={onSwitchToLogin}
            className="text-primary"
          >
            Iniciar sesión
          </Anchor>
        </div>
      </Card.Section>
    </Card>
  )
}