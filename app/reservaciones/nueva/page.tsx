import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import NewReservationForm from "@/components/reservations/client/NewReservationForm"

export default async function NewReservationPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  return <NewReservationForm />
}