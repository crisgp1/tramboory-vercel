import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { HomePage } from "@/components/home/HomePage"

export default async function Home() {
  const { userId } = await auth()

  if (userId) {
    redirect("/dashboard")
  }

  return <HomePage />
}
