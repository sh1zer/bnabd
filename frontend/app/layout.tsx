import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SchroniskoHub",
  description: "System rezerwacji miejsc w schroniskach turystycznych"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
