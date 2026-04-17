import { redirect } from "next/navigation";
import { auth } from "~/auth/config";
import CompassPageClient from "./CompassPage";

export default async function CompassPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/compass");

  return <CompassPageClient />;
}
