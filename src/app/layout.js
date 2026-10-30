import "./globals.css";
import Script from "next/script";
import AuthProvider from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import MaterialUIProvider from "@/providers/MaterialUIProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "react-hot-toast";
import NotificationSystem from "@/components/NotificationSystem";
import WhatsAppWidget from "@/components/customer/WhatsAppWidget";
import AIAssistantWidget from "@/components/customer/AIAssistantWidget";

import { RealtimeProvider } from "@/contexts/RealtimeContext";

export const metadata = {
  title: "MARTZONA — Bespoke Multi-Vendor Marketplace & AI Concierge",
  description: "Explore electronics, laptops, supermarket groceries, and gourmet dining delivered fast on MARTZONA.",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/icon-192.png',
  },
};

export default function RootLayout({ children }) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-MFG72CD5';
  const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-7D49W9L31L';

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="font-sans antialiased bg-slate-50 dark:bg-[#080C16] text-slate-900 dark:text-slate-100 transition-colors duration-200"
      >
        {/* Google Tag Manager (noscript fallback) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* Google Tag Manager */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
          }}
        />

        {/* Google tag (gtag.js) - Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics-gtag"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        <ErrorBoundary>
          <ThemeProvider>
            <LanguageProvider>
              <MaterialUIProvider>
                <AuthProvider>
                  <RealtimeProvider>
                    <CartProvider>
                      <WishlistProvider>
                        {children}
                        <WhatsAppWidget />
                        <AIAssistantWidget />
                        <NotificationSystem />
                        <Toaster
                          position="top-right"
                          toastOptions={{
                            duration: 4000,
                            style: {
                              background: 'rgba(10, 15, 29, 0.92)',
                              color: '#fff',
                              backdropFilter: 'blur(12px)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '16px',
                            },
                          }}
                        />
                      </WishlistProvider>
                    </CartProvider>
                  </RealtimeProvider>
                </AuthProvider>
              </MaterialUIProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
