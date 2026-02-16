import { auth } from "~/auth/config";
import AboutScene from "~/components/about/AboutScene";
import AboutSlate from "~/components/about/AboutSlate";
import Footer from "~/components/landing/Footer";
import { Navbar } from "~/components/landing/Navbar";

export default async function AboutPage() {
  const session = await auth();

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden text-white selection:bg-cyan-500/30">
      <AboutScene />

      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar isUnderwater={true} session={session} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="grow pt-32 pb-16 px-4 flex flex-col items-center justify-center">
          <AboutSlate />
        </div>

        <Footer />
      </div>
    </main>
  );
}
