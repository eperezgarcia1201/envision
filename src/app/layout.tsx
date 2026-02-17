import type { Metadata } from "next";
import { Lora, Manrope } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
});

const displayFont = Lora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://envisionmaintenence.example"),
  title: {
    default: "Envision Maintenence | Los Angeles Property Operations",
    template: "%s | Envision Maintenence",
  },
  description:
    "Professional maintenance and construction services in Los Angeles with a scalable platform roadmap for APIs, SDKs, and mobile applications.",
  keywords: [
    "Los Angeles maintenance services",
    "property turnover",
    "commercial cleaning",
    "maintenance operations platform",
    "field service API",
  ],
  openGraph: {
    title: "Envision Maintenence",
    description:
      "Reliable, trustworthy, and confidential maintenance services with future-ready platform architecture.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <div className="app-shell">
          <SiteHeader />
          <main className="page-main">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
