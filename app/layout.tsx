import "./globals.css";
import { Inter, Fraunces, Caveat } from "next/font/google";
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth';
import LayoutWrapper from '@/components/LayoutWrapper';
import { defaultSEO, generateOrganizationJsonLd } from '@/lib/seo'
import { Providers } from '@/components/providers'
import SessionProvider from '@/components/SessionProvider'

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-serif" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });

export const metadata = defaultSEO;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${inter.variable} ${fraunces.variable} ${caveat.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="google-site-verification" content="fQTMXr77-Oc4xTGcVYlXmrHcXHuKyEOhJfHrWkiXEE0" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateOrganizationJsonLd()),
          }}
        />
      </head>
      <body>
        <SessionProvider>
          <Providers>
            <AuthProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </AuthProvider>
          </Providers>
        </SessionProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}