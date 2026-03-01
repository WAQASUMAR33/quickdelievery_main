import { Poppins } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import MaterialUIProvider from "@/providers/MaterialUIProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "react-hot-toast";
import NotificationSystem from "@/components/NotificationSystem";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: "400",
});

export const metadata = {
  title: "Quick Delivery - POS System",
  description: "Modern POS system with delivery management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} font-sans antialiased`}
      >
        <ErrorBoundary>
          <MaterialUIProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  {children}
                  <NotificationSystem />
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: '#fff',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  />
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </MaterialUIProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
