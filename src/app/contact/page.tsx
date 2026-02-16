import { auth } from "~/auth/config";
import ContactScene from "~/components/contact/ContactScene";
import OrganizerRing from "~/components/contact/OrganizerRing";
import Footer from "~/components/landing/Footer";
import { Navbar } from "~/components/landing/Navbar";

export default async function ContactPage() {
  const session = await auth();

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden text-white selection:bg-cyan-500/30">
      <ContactScene />

      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar isUnderwater={true} session={session} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="grow pt-42 pb-16 px-4 flex flex-col items-center">
          <section className="text-center mb-8">
            <h1 className="text-5xl md:text-7xl font-pirate text-cyan-200 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] mb-6">
              Contact the Crew
            </h1>
            <p className="text-xl text-cyan-100/80 max-w-2xl mx-auto font-crimson">
              Lost at sea? Need a map? The captains are here to guide you
              through the storm.
            </p>
          </section>

          <OrganizerRing />
        </div>

        <Footer />
      </div>
    </main>
  );
}
