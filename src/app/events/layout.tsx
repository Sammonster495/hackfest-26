import { SessionProvider } from "next-auth/react";

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider basePath="/api/auth/event">
      <div
        className="bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: "url('/images/underwater.png')" }}
      >
        {children}
      </div>
    </SessionProvider>
  );
}
