const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://martzona.com'

export const metadata = {
  title: 'Martzona Pre-Loved & 2nd Hand Marketplace Pakistan | Buy & Sell Used Goods',
  description: 'Buy and sell used smartphones, laptops, electronics, vehicles, bikes, and furniture directly with fellow Pakistani customers. 0% commission, live negotiation, and instant WhatsApp chat.',
  alternates: {
    canonical: `${BASE_URL}/second-hand`,
  },
  openGraph: {
    title: 'Martzona Pre-Loved & 2nd Hand Marketplace Pakistan',
    description: 'Buy and sell used smartphones, laptops, electronics, vehicles, and furniture directly with verified sellers.',
    url: `${BASE_URL}/second-hand`,
    siteName: 'Martzona Pakistan',
    images: [{ url: `${BASE_URL}/images/martzona_logo_transparent.png`, width: 800, height: 600, alt: 'Martzona 2nd Hand Marketplace' }],
    locale: 'en_PK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Martzona Pre-Loved & 2nd Hand Marketplace Pakistan',
    description: 'Buy and sell used smartphones, laptops, electronics, vehicles, and furniture directly with verified sellers.',
    images: [`${BASE_URL}/images/martzona_logo_transparent.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function SecondHandLayout({ children }) {
  return children
}
