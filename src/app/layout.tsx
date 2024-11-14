import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";


export const metadata: Metadata = {
  title: "Chat App",
  description: "A chat app built with Clerk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en">
        <body
          className={`antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
