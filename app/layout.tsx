import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const description = "Mansfield is an early-stage investment firm.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") || host?.startsWith("127.0.0.1")
      ? "http"
      : "https");
  const image = host ? `${protocol}://${host}/og.png` : undefined;

  return {
    title: {
      default: "Mansfield",
      template: "%s — Mansfield",
    },
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Mansfield",
      description,
      images: image ? [{ url: image, alt: "Mansfield" }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: "Mansfield",
      description,
      images: image ? [image] : [],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
