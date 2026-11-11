import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Serif } from "next/font/google";
import "./globals.css";
import "./edit-mode.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import TermsGate from "@/components/legal/TermsGate";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import AudioPlayer from "@/components/music/AudioPlayer";
import { PlayerProvider } from "@/components/music/PlayerProvider";
import EditModeBar from "@/components/site/EditModeBar";
import { SiteSettingsProvider } from "@/components/site/SiteSettingsProvider";
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const sans = Noto_Sans({ variable: "--font-sans-vi", subsets: ["latin", "vietnamese"] });
const serif = Noto_Serif({ variable: "--font-serif-vi", subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: "%s · Phật Tại Tâm" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  appleWebApp: { capable: true, title: "Phật Tại Tâm", statusBarStyle: "black-translucent" },
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0d0b08" },
    { media: "(prefers-color-scheme: light)", color: "#f6f1e7" },
  ],
};

/* Giao diện TỐI là mặc định; chỉ chuyển sang sáng khi người dùng đã chọn "light". */
const themeScript = `try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.remove('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${sans.variable} ${serif.variable} dark h-full antialiased`}>
      <head>
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning className="flex min-h-full flex-col font-sans">
        <AuthProvider>
          <SiteSettingsProvider>
            <PlayerProvider>
              <Header />
              <EditModeBar />
              <main className="safe-x mx-auto w-full max-w-6xl flex-1 pb-36 pt-5 sm:pt-8 md:pb-44">{children}</main>
              <Footer />
              <AudioPlayer />
              <TermsGate />
            </PlayerProvider>
          </SiteSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
