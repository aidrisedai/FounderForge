import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata = {
  title: "FounderForge — AI Startup Mentor",
  description: "Get a validated startup hypothesis in 5 minutes, then execute with a structured AI mentor journey.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
