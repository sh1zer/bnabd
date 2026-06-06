import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";

export const metadata: Metadata = {
  title: "Schroniskowo",
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
