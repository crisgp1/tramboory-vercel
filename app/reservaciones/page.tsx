import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import ReservationManager from "@/components/reservations/client/ReservationManager"

export default async function ReservationsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  return <ReservationManager />
}