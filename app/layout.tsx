import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FritzSwap – Sticker tauschen",
  description:
    "Fotografiere dein Sammelalbum, lass fehlende & doppelte Sticker automatisch erkennen und tausche per Link mit Freunden.",
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
