import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";

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
    <html lang="pl" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var t = localStorage.getItem('bnabd_theme');
            var s = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            if ((t || s) === 'dark') document.documentElement.classList.add('dark');
          })();
        `}} />
      </head>
      <body>
        <ThemeProvider>
          <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
