import type { Metadata } from "next";
import { Noto_Sans, Noto_Serif } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PlayerProvider } from "@/components/music/PlayerProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AudioPlayer from "@/components/music/AudioPlayer";
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const sans = Noto_Sans({ variable: "--font-sans-vi", subsets: ["latin", "vietnamese"] });
const serif = Noto_Serif({ variable: "--font-serif-vi", subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: "%s · Phật Tại Tâm" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Phật Tại Tâm",
    locale: "vi_VN",
    url: SITE_URL,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION, images: [DEFAULT_OG_IMAGE] },
};

/* Bật chế độ tối trước khi trang hiển thị để không bị nháy màu */
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <head>
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning className="flex min-h-full flex-col font-sans">
        <AuthProvider>
          <PlayerProvider>
            <Header />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-40 pt-8">{children}</main>
            <Footer />
            <AudioPlayer />
          </PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
