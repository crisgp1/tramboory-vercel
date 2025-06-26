import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AuthContainer from "@/components/auth/AuthContainer"

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return <AuthContainer />
}
