import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});
import AuthProvider from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import MaterialUIProvider from "@/providers/MaterialUIProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import NotificationSystem from "@/components/NotificationSystem";

import FloatingWidgets from "@/components/customer/FloatingWidgets";

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
    <html lang="en" className={plusJakartaSans.variable} suppressHydrationWarning>
      <head>
        {/* Google tag (gtag.js) + Google Tag Manager
            The dataLayer/gtag config stays inline in <head> (so the tag is detected),
            but the heavy third-party scripts (~480 KB) are injected only after the
            page has finished loading and the browser is idle. This keeps them off
            the critical path and out of Total Blocking Time on mobile. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');
window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
(function(){
  var loaded = false;
  function inject(src){var s=document.createElement('script');s.async=true;s.src=src;document.head.appendChild(s);}
  function loadTags(){
    if (loaded) return; loaded = true;
    inject('https://www.googletagmanager.com/gtag/js?id=${gaId}');
    inject('https://www.googletagmanager.com/gtm.js?id=${gtmId}');
  }
  function schedule(){
    if ('requestIdleCallback' in window) requestIdleCallback(loadTags, { timeout: 4000 });
    else setTimeout(loadTags, 2000);
  }
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
  ['pointerdown','keydown','touchstart','scroll'].forEach(function(e){
    window.addEventListener(e, loadTags, { once: true, passive: true });
  });
})();`,
          }}
        />
      </head>
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
        <ErrorBoundary>
          <ThemeProvider>
            <LanguageProvider>
              <MaterialUIProvider>
                <AuthProvider>
                  <RealtimeProvider>
                    <CartProvider>
                      <WishlistProvider>
                        {children}
                        <FloatingWidgets />
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
