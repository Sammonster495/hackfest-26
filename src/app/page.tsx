import Link from "next/link";
import { auth } from "~/auth/config";
import Scene from "~/components/landing/Scene";
import { Button } from "~/components/ui/button";

export default async function Home() {
  const session = await auth();

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black">
      {/* 3D Scene Background & Scroll Content */}
      <Scene />

      {/* Fixed UI Overlay (Navbar/Auth) */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-end p-6 bg-linear-to-b from-black/50 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          {session?.user ? (
            <Button
              asChild
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md transition-all"
            >
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button
              asChild
              className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(8,145,178,0.5)] border-none transition-all hover:scale-105"
            >
              <Link href="/dashboard/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
