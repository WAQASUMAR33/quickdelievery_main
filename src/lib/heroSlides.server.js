// Server-only module (imports Prisma) — do not import from client components.
import { prisma } from '@/lib/prisma'

const SLIDE_SELECT = {
  id: true,
  badge: true,
  title: true,
  subtitle: true,
  ctaText: true,
  ctaLink: true,
  discount: true,
  deptId: true,
  bgGradient: true,
  accentColor: true,
  image: true,
}

// Fetch active hero slides on the server so the first slide (the mobile LCP
// element) is present in the initial HTML with a <link rel="preload">.
// Never throws: falls back to [] (client then uses DEFAULT_HERO_SLIDES).
export async function getActiveHeroSlides(timeoutMs = 4000) {
  try {
    const query = prisma.heroSlide.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
      select: SLIDE_SELECT,
    })
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs))
    const slides = await Promise.race([query, timeout])
    return Array.isArray(slides) ? JSON.parse(JSON.stringify(slides)) : []
  } catch (e) {
    console.warn('[heroSlides] SSR fetch failed, using client defaults:', e?.message)
    return []
  }
}
