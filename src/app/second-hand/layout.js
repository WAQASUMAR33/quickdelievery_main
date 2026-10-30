const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://martzona.com'

export const metadata = {
  title: 'Martzona Pre-Loved & 2nd Hand Marketplace Pakistan | Buy & Sell Used Goods',
  description: 'Buy and sell used smartphones, laptops, electronics, vehicles, bikes, and furniture directly with fellow Pakistani customers. 0% commission, live negotiation, and instant WhatsApp chat.',
  keywords: [
    '2nd hand pakistan',
    'used mobile phones lahore',
    'used laptops karachi',
    'second hand cars islamabad',
    'used bikes rawalpindi',
    'olx pakistan alternative',
    'pre-loved marketplace',
    'buy sell used goods pakistan',
    'martzona marketplace',
  ],
  alternates: {
    canonical: `${BASE_URL}/second-hand`,
  },
  openGraph: {
    title: 'Martzona Pre-Loved & 2nd Hand Marketplace Pakistan',
    description: 'Buy and sell used smartphones, laptops, electronics, vehicles, and furniture directly with verified sellers. 0% commission, direct WhatsApp chat, and real-time negotiation.',
    url: `${BASE_URL}/second-hand`,
    siteName: 'Martzona Pakistan',
    images: [
      {
        url: `${BASE_URL}/images/martzona_logo_transparent.png`,
        width: 800,
        height: 600,
        alt: 'Martzona Pre-Loved & 2nd Hand Marketplace',
      },
    ],
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
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const marketplaceJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'MARTZONA Pakistan',
      description: 'Online Multi-Vendor Marketplace, Taxi Ride & 2nd Hand Classifieds in Pakistan',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${BASE_URL}/second-hand?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'CollectionPage',
      '@id': `${BASE_URL}/second-hand/#collection`,
      url: `${BASE_URL}/second-hand`,
      name: 'Martzona Pre-Loved & 2nd Hand Marketplace Pakistan',
      description: 'Buy and sell authentic pre-owned smartphones, tech gadgets, laptops, vehicles, and furniture directly with verified Pakistani sellers.',
      isPartOf: {
        '@id': `${BASE_URL}/#website`,
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: BASE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: '2nd Hand Marketplace',
            item: `${BASE_URL}/second-hand`,
          },
        ],
      },
    },
  ],
}

export default function SecondHandLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(marketplaceJsonLd) }}
      />
      {children}
    </>
  )
}
