import type { Metadata } from 'next'
import './globals.css'
import { Outfit } from "next/font/google";
import { cn } from "@/lib/utils";

const outfit = Outfit({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Sign in | Digital Payment',
  description: 'Sign in to manage your digital payments.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en' className={cn("font-sans", outfit.variable)}>
      <body>{children}</body>
    </html>
  )
}