import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deep Work — 아무거나 타이핑하세요",
  description:
    "아무 키나 눌러 생각이 문장으로 완성되는 집중형 타이핑 인터페이스입니다.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="size-medium">{children}</body>
    </html>
  );
}
