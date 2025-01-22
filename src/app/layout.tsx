import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ConfigureAmplifyClientSide } from "@/src/components/ConfigureAmplify";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personal RAG Chat",
  description: "Personal RAG Chat System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfigureAmplifyClientSide />
        {children}
      </body>
    </html>
  );
}
