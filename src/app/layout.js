import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata = {
  title: "FounderForge — Build Something the World Needs",
  description: "Structured startup guidance, a real founder community, and 90 days to your first customer.",
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
