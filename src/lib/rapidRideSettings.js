import { prisma } from '@/lib/prisma'
import {
  DEFAULT_RAPIDRIDE_SETTINGS,
  normalizeRapidRideSettings,
} from '@/lib/rapidRideFormula'

const SETTING_KEY = 'rapidride_driver_settings'

let cachedSettings = null
let cachedAt = 0
const CACHE_TTL_MS = 60 * 1000 // 60 seconds
let tableEnsured = false

export function invalidateRapidRideSettingsCache() {
  cachedSettings = null
  cachedAt = 0
}

async function ensurePlatformSettingsTable() {
  if (tableEnsured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`platform_settings\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`setting_key\` VARCHAR(100) NOT NULL,
      \`setting_value\` LONGTEXT NOT NULL,
      \`updated_by\` VARCHAR(150) NULL,
      \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`platform_settings_setting_key_key\` (\`setting_key\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `)
  tableEnsured = true
}

export async function getRapidRideSettings({ bypassCache = false } = {}) {
  if (!bypassCache && cachedSettings && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedSettings
  }

  try {
    await ensurePlatformSettingsTable()
    const rows = await prisma.$queryRaw`
      SELECT setting_value, updated_at, updated_by
      FROM platform_settings
      WHERE setting_key = ${SETTING_KEY}
      LIMIT 1
    `

    if (Array.isArray(rows) && rows.length > 0 && rows[0]?.setting_value) {
      const parsed = JSON.parse(rows[0].setting_value)
      const normalized = normalizeRapidRideSettings(parsed)
      const result = {
        ...normalized,
        updatedAt: rows[0].updated_at || null,
        updatedBy: rows[0].updated_by || null,
      }
      cachedSettings = result
      cachedAt = Date.now()
      return result
    }
  } catch (err) {
    console.warn('[RapidRideSettings] Falling back to defaults:', err?.message)
  }

  const defaults = {
    ...normalizeRapidRideSettings(DEFAULT_RAPIDRIDE_SETTINGS),
    updatedAt: null,
    updatedBy: null,
  }
  cachedSettings = defaults
  cachedAt = Date.now()
  return defaults
}

export async function saveRapidRideSettings(rawPayload, updatedBy = 'Admin') {
  await ensurePlatformSettingsTable()
  const normalized = normalizeRapidRideSettings(rawPayload)
  const jsonValue = JSON.stringify(normalized)

  await prisma.$executeRaw`
    INSERT INTO platform_settings (setting_key, setting_value, updated_by, created_at, updated_at)
    VALUES (${SETTING_KEY}, ${jsonValue}, ${updatedBy}, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE
      setting_value = VALUES(setting_value),
      updated_by = VALUES(updated_by),
      updated_at = NOW(3)
  `

  invalidateRapidRideSettingsCache()
  return await getRapidRideSettings({ bypassCache: true })
}

