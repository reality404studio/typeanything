import type { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "deep-work-typing-ko.reality404studio.chatgpt.site";
  const protocol =
    headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og-draw-three.jpg`;

  return {
    title: "Deep Work / Three.js — 타이핑으로 3D 그림 그리기",
    description:
      "아무 키나 누르면 빛과 입체 도형이 공간에 쌓여 하나의 3D 조형물이 완성되는 Three.js 드로잉 페이지입니다.",
    openGraph: {
      title: "TYPE INTO SPACE",
      description: "타이핑할수록 공간에 조형물이 쌓입니다.",
      images: [{ url: imageUrl, width: 1731, height: 909, alt: "Deep Work Three.js" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "TYPE INTO SPACE",
      description: "타이핑할수록 공간에 조형물이 쌓입니다.",
      images: [imageUrl],
    },
  };
}

export default function DrawLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
