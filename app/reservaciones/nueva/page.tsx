import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import ClientNewReservationPageAnimated from "@/components/reservations/client/ClientNewReservationPageAnimated"

export default async function NewReservationPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  return <ClientNewReservationPageAnimated />
}