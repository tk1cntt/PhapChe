import type { Metadata } from "next";
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/lib/react-query';
import { ErrorBoundaryWrapper } from '@/components/shared/ui/ErrorBoundary';
import { ThemeProvider } from '@/components/shared/ui/ThemeProvider';
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "GitNexus Legal",
  description: "Nền tảng pháp lý cho SME",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={cn("font-sans", geist.variable)}>
      <body>
        <ThemeProvider>
        <ErrorBoundaryWrapper>
            <QueryProvider>
              {children}
              <Toaster position="top-right" />
            </QueryProvider>
        </ErrorBoundaryWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
