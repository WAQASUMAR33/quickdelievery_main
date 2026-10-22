import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
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

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "QuickDelivery — Bespoke Multi-Vendor Marketplace & AI Concierge",
  description: "Explore electronics, laptops, supermarket groceries, and gourmet dining delivered fast.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} font-sans antialiased bg-slate-50 dark:bg-[#080C16] text-slate-900 dark:text-slate-100 transition-colors duration-200`}
      >
        <ErrorBoundary>
          <ThemeProvider>
            <LanguageProvider>
              <MaterialUIProvider>
                <AuthProvider>
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
                </AuthProvider>
              </MaterialUIProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
