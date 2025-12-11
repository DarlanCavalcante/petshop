import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import UserMenu from '@/components/UserMenu';
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Melhor performance de carregamento
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Petshop SaaS - Gestão Completa",
    template: "%s | Petshop SaaS"
  },
  description: "Sistema completo de gestão para petshops com agendamento, vendas, controle de estoque e muito mais.",
  keywords: ["petshop", "gestão", "agendamento", "vendas", "estoque", "saas"],
  authors: [{ name: "Petshop SaaS Team" }],
  creator: "Petshop SaaS",
  publisher: "Petshop SaaS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://petshop.tech10cloud.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://petshop.tech10cloud.com",
    title: "Petshop SaaS - Gestão Completa",
    description: "Sistema completo de gestão para petshops",
    siteName: "Petshop SaaS",
  },
  twitter: {
    card: "summary_large_image",
    title: "Petshop SaaS - Gestão Completa",
    description: "Sistema completo de gestão para petshops",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}
      >
        <header className="w-full flex justify-end items-center px-8 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <UserMenu />
        </header>
        <main className="flex-1">
          {children}
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
