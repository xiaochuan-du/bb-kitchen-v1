import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Guest Kitchen",
  description: "Curated menu experiences for hosting with care",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
