import type { Metadata, Viewport } from "next";
import { Lilita_One, Nunito } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const display = Lilita_One({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FritzSwap – Sticker tauschen",
  description:
    "Fotografiere dein Sammelalbum, lass fehlende & doppelte Sticker automatisch erkennen und tausche per Link mit Freunden.",
};

export const viewport: Viewport = {
  themeColor: "#e30613",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${display.variable} ${bodyFont.variable}`}>
      <body>
        <Providers>
          <div className="app-shell">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
