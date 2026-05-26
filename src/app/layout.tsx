import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nền tảng pháp lý SME",
  description: "Nền tảng vận hành dịch vụ pháp lý cho SME.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
