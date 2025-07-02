import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import ClientReservationManager from "@/components/reservations/client/ClientReservationManager"

export default async function ReservationsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  return <ClientReservationManager />
}