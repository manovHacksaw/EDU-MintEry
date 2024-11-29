'use client';

import { Inter } from 'next/font/google';
import { Web3Provider } from '@/context/web3-provider';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="bg-gray-100 py-4 text-center">
              © {new Date().getFullYear()} Ticketing NFT Marketplace
            </footer>
          </div>
          <Toaster />
        </Web3Provider>
      </body>
    </html>
  );
}
