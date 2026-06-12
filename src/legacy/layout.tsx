import type { Metadata } from "next";
import "./globals.css";
import AntdProvider from "@/app/providers/antd-provider";
import ReactQueryProvider from "@/app/providers/ReactQueryProvider";

export const metadata: Metadata = {
  title: "Nen tang phap ly SME",
  description: "Nen tang van hanh dich vu phap ly cho SME.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <AntdProvider>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </AntdProvider>
      </body>
    </html>
  );
}
