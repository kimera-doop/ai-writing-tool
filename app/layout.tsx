import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import { KeysProvider } from "@/components/KeysProvider";
import UnlockModal from "@/components/UnlockModal";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Writing Tool",
  description: "AIライティング＆SNSコンテンツ生成ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geist.variable} md:h-full`}>
      <body className="md:h-full flex antialiased">
        <KeysProvider>
          <Sidebar />
          <main className="flex-1 bg-gray-50 md:overflow-y-auto min-h-screen pt-14 md:pt-0">
            <UnlockModal />
            {children}
          </main>
        </KeysProvider>
      </body>
    </html>
  );
}
