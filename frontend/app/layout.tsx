import type { Metadata } from "next";
import Script from "next/script";
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
      <body>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        {children}
      </body>
    </html>
  );
}
