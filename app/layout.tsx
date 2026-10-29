import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Social Agent",
  description: "Your creative workspace for your social presence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
