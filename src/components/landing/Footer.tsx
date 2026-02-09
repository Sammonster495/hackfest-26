import { Instagram, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const social = [
  {
    link: "https://www.instagram.com/hackfest.dev",
    icon: (
      <Instagram className="text-cyan-400 hover:text-cyan-300 w-6 h-6 transition-colors" />
    ),
    name: "Instagram",
  },
  {
    link: "mailto:admin@hackfest.dev",
    icon: (
      <Mail className="text-cyan-400 hover:text-cyan-300 w-6 h-6 transition-colors" />
    ),
    name: "E-mail",
  },
  {
    link: "https://discord.gg/d9hQV8Hcv6",
    // TODO[RAHUL]: Add Discord icon and link update
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 512"
        className="text-cyan-400 hover:text-cyan-300 w-6 h-6 fill-current transition-colors"
        aria-label="Discord"
      >
        <title>Discord</title>
        <path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.135a1.814,1.814,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.814,1.814,0,0,1,1.924.233c2.944,2.418,6.027,4.855,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.856,167.451,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z" />
      </svg>
    ),
    name: "Discord",
  },
];

const Footer = () => {
  return (
    <footer className="w-full flex-col border-t border-cyan-900/30 bg-black/90 px-4 backdrop-blur-md relative z-20">
      <div className="flex h-full flex-col items-center justify-evenly space-y-12 p-4 py-8 lg:flex-row relative">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-linear-to-r from-transparent via-cyan-500/50 to-transparent blur-sm" />

        <div className="flex flex-col items-center gap-8 z-10">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex flex-row items-center justify-center gap-6">
              <Image
                src="/logo.png"
                priority
                alt="Logo - Hackfest"
                width={95}
                height={50}
                className=""
              />
              <Link href="https://www.finiteloop.co.in/" target="_blank">
                <Image
                  src="/logos/flc_logo_crop.png"
                  priority
                  alt="Logo - Finite Loop Club"
                  width={75}
                  height={50}
                  className="opacity-80 hover:opacity-100 transition-opacity"
                />
              </Link>
            </div>
            <Link href="https://nmamit.nitte.edu.in/" target="_blank">
              <Image
                src="/logos/NMAMITLogo.png"
                priority
                alt="Logo - NMAMIT"
                width={180}
                height={100}
                className="opacity-80 hover:opacity-100 transition-opacity"
              />
            </Link>
          </div>
          <div className="flex flex-col items-center gap-4 md:gap-4">
            <p className="text-base font-normal text-cyan-100/70">
              Connect with us:
            </p>
            <ul className="flex gap-6 md:gap-6">
              {social.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.link}
                    className="text-2xl text-cyan-200 transition hover:text-cyan-400 hover:scale-110 block"
                    target="_blank"
                  >
                    {link.icon}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center gap-8 z-10">
          <div className="flex flex-col items-center justify-center gap-10 md:flex-row">
            <div className="overflow-hidden rounded-lg border border-cyan-800/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <iframe
                title="Maps"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3884.6730533394866!2d74.93141407492217!3d13.183002587152156!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbb56415ad85e5b%3A0x10b77ac6f6afc7fa!2sN.M.A.M.%20Institute%20of%20Technology!5e0!3m2!1sen!2sin!4v1705002903689!5m2!1sen!2sin"
                width="250"
                height="180"
                style={{ border: 0 }}
                className="filter grayscale hover:grayscale-0 transition-all duration-500"
                aria-hidden="false"
              ></iframe>
            </div>
            <div className="flex flex-col gap-2 text-center text-cyan-100/80">
              <h1 className="text-lg font-semibold text-cyan-400">
                NMAM Institute of Technology, Nitte
              </h1>
              <p className="text-sm opacity-70">
                Karkala, Udupi District, Karnataka
              </p>
            </div>
          </div>
          <p className="text-center text-base font-normal text-cyan-100/60">
            Interested to sponsor? Let us know{" "}
            <Link
              href="mailto:sponsor@hackfest.dev"
              className="text-cyan-400 underline hover:text-cyan-300 transition-colors"
            >
              sponsor@hackfest.dev
            </Link>
          </p>
        </div>
      </div>
      <div className="w-full border-t border-cyan-900/30 py-5 text-center font-normal text-sm text-cyan-100/30">
        <p>2026 &copy; Hackfest | All rights reserved</p>
      </div>
    </footer>
  );
};

export default Footer;
