import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata = {
  title: "FounderForge — AI Startup Mentor",
  description: "From idea to revenue in 6 steps with your AI mentor.",
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
