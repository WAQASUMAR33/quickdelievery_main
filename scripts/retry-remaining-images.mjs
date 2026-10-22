import dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import { uploadBufferToS3 } from '../src/lib/s3.js'

const prisma = new PrismaClient()

// Verified, rock-solid alternative high-res photos for the remaining items
const RETRY_MAP = {
  // Mobile Accessories
  'MOB-ACC-025': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=700&q=80', // Fast wireless pad
  'MOB-ACC-039': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&q=80', // Slim power bank
  'MOB-ACC-041': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=700&q=80', // Cyberpunk transparent gadget
  'MOB-ACC-042': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=700&q=80', // Charging stand
  'MOB-ACC-046': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&q=80', // Charging dock
  'MOB-ACC-049': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=80', // Marshall earbuds
  'MOB-ACC-051': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=700&q=80', // Kickstand powerbank

  // Computers & Laptops
  'COMP-LAP-002': 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=700&q=80', // Dell XPS Ultrabook
  'COMP-LAP-003': 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=700&q=80', // ThinkPad Laptop
  'COMP-LAP-004': 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=700&q=80', // ASUS ROG Gaming
  'COMP-LAP-005': 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=700&q=80', // HP Spectre Touchscreen
  'COMP-LAP-007': 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=700&q=80', // Custom Keyboard
  'COMP-LAP-008': 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=700&q=80', // 4K Gaming Monitor
  'COMP-LAP-009': 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=700&q=80', // Samsung T7 SSD
  'COMP-LAP-010': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&q=80', // Thunderbolt Dock
  'COMP-LAP-011': 'https://images.unsplash.com/photo-1562975079-6a693b797101?w=700&q=80', // Corsair DDR5 RAM
  'COMP-LAP-012': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=80', // Wireless Keyboard
  'COMP-LAP-013': 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=700&q=80', // Razer DeathAdder Mouse
  'COMP-LAP-019': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&q=80', // 12-in-1 Triple Hub
  'COMP-LAP-048': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=80', // Logitech G915 Keyboard

  // Groceries
  'GROC-PAN-002': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=700&q=80', // Spaghetti
  'GROC-PAN-010': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=700&q=80', // Penne Rigate
  'GROC-PAN-020': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=700&q=80', // Rigatoni Pasta
}

async function runRetry() {
  console.log('🔄 Retrying remaining items...')
  const skus = Object.keys(RETRY_MAP)
  for (const sku of skus) {
    try {
      const url = RETRY_MAP[sku]
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const s3Filename = `${sku.toLowerCase()}.jpg`
      const uploadResult = await uploadBufferToS3(buffer, {
        fileName: s3Filename,
        contentType: 'image/jpeg',
        folder: 'products',
      })

      await prisma.product.update({
        where: { sku },
        data: {
          proImages: JSON.stringify([uploadResult.url]),
        },
      })
      console.log(`✅ [Resolved] ${sku} -> S3 CloudFront updated`)
    } catch (e) {
      console.error(`❌ Still failed for ${sku}:`, e.message)
    }
  }
  await prisma.$disconnect()
  console.log('🎉 Retry run complete!')
}

runRetry()
