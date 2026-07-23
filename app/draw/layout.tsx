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
  const imageUrl = `${protocol}://${host}/og-draw.jpg`;

  return {
    title: "Deep Work / Draw — 타이핑으로 그림 그리기",
    description:
      "아무 키나 누르면 빛과 선, 도형이 쌓여 하나의 추상화가 완성되는 인터랙티브 드로잉 페이지입니다.",
    openGraph: {
      title: "TYPE THE UNSEEN",
      description: "아무렇게나 타이핑하면 그림이 시작됩니다.",
      images: [{ url: imageUrl, width: 1731, height: 909, alt: "Deep Work Draw" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "TYPE THE UNSEEN",
      description: "아무렇게나 타이핑하면 그림이 시작됩니다.",
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
