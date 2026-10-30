const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

function slugify(text) {
  if (!text) return 'item';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\u2012\u2013\u2014\u2015]/g, '-')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generate() {
  const baseUrl = 'https://martzona.com';
  const staticUrls = [
    { loc: baseUrl, priority: '1.0', changefreq: 'daily' },
    { loc: `${baseUrl}/customer`, priority: '0.9', changefreq: 'daily' },
    { loc: `${baseUrl}/taxi`, priority: '0.9', changefreq: 'daily' },
    { loc: `${baseUrl}/second-hand`, priority: '0.85', changefreq: 'daily' },
    { loc: `${baseUrl}/business-register`, priority: '0.7', changefreq: 'weekly' },
    { loc: `${baseUrl}/track`, priority: '0.6', changefreq: 'weekly' },
    { loc: `${baseUrl}/login`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${baseUrl}/register`, priority: '0.5', changefreq: 'monthly' },
  ];

  let products = [];
  try {
    products = await prisma.product.findMany({
      where: { status: true },
      select: { proId: true, proName: true, updatedAt: true },
      take: 2000,
    });
  } catch (err) {
    console.warn('Prisma product error:', err.message);
  }

  let secondHandItems = [];
  try {
    secondHandItems = await prisma.secondHandItem.findMany({
      where: { status: 'AVAILABLE' },
      select: { id: true, title: true, updatedAt: true },
      take: 1000,
    });
  } catch (err) {
    console.warn('Prisma secondHandItem error:', err.message);
  }

  const now = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const s of staticUrls) {
    xml += '  <url>\n';
    xml += `    <loc>${s.loc}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>${s.changefreq}</changefreq>\n`;
    xml += `    <priority>${s.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  for (const p of products) {
    const slug = slugify(p.proName);
    const url = `${baseUrl}/product/${slug}-${p.proId}`;
    const lastmod = p.updatedAt ? p.updatedAt.toISOString().split('T')[0] : now;
    xml += '  <url>\n';
    xml += `    <loc>${url}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += '  </url>\n';
  }

  for (const item of secondHandItems) {
    const url = `${baseUrl}/second-hand/${item.id}`;
    const lastmod = item.updatedAt ? item.updatedAt.toISOString().split('T')[0] : now;
    xml += '  <url>\n';
    xml += `    <loc>${url}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.85</priority>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';

  fs.writeFileSync('public/sitemap.xml', xml, 'utf8');
  console.log(`Generated public/sitemap.xml with ${staticUrls.length + products.length + secondHandItems.length} URLs (including ${secondHandItems.length} 2nd hand listings)`);

  const robots = 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /driver/\nDisallow: /vendor/\n\nSitemap: https://martzona.com/sitemap.xml\n';
  fs.writeFileSync('public/robots.txt', robots, 'utf8');
  console.log('Generated public/robots.txt');

  await prisma.$disconnect();
}

generate();
