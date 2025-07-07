import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import ClientReservationManagerClean from "@/components/reservations/client/ClientReservationManagerClean"

export default async function ReservationsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  return <ClientReservationManagerClean />
}