import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import ClientNewReservationPage from "@/components/reservations/client/ClientNewReservationPage"

export default async function NewReservationPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  return <ClientNewReservationPage />
}