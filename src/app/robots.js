export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://martzona.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/driver/',
          '/vendor/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
