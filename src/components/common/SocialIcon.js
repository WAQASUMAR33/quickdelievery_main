'use client'

import React from 'react'
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Globe, MessageCircle } from 'lucide-react'

// Custom SVGs for platforms not in lucide-react or requiring exact branding
export const SOCIAL_PRESETS = [
  { id: 'facebook', label: 'Facebook', color: '#1877F2', bgColor: '#1877F215', defaultUrl: 'https://facebook.com/' },
  { id: 'instagram', label: 'Instagram', color: '#E4405F', bgColor: '#E4405F15', defaultUrl: 'https://instagram.com/' },
  { id: 'twitter', label: 'X (Twitter)', color: '#0f172a', bgColor: '#0f172a15', defaultUrl: 'https://x.com/' },
  { id: 'youtube', label: 'YouTube', color: '#FF0000', bgColor: '#FF000015', defaultUrl: 'https://youtube.com/' },
  { id: 'tiktok', label: 'TikTok', color: '#000000', bgColor: '#00000015', defaultUrl: 'https://tiktok.com/@' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', bgColor: '#0A66C215', defaultUrl: 'https://linkedin.com/company/' },
  { id: 'whatsapp', label: 'WhatsApp', color: '#25D366', bgColor: '#25D36615', defaultUrl: 'https://wa.me/' },
  { id: 'telegram', label: 'Telegram', color: '#229ED9', bgColor: '#229ED915', defaultUrl: 'https://t.me/' },
  { id: 'discord', label: 'Discord', color: '#5865F2', bgColor: '#5865F215', defaultUrl: 'https://discord.gg/' },
  { id: 'pinterest', label: 'Pinterest', color: '#BD081C', bgColor: '#BD081C15', defaultUrl: 'https://pinterest.com/' },
  { id: 'reddit', label: 'Reddit', color: '#FF4500', bgColor: '#FF450015', defaultUrl: 'https://reddit.com/r/' },
  { id: 'snapchat', label: 'Snapchat', color: '#FFFC00', bgColor: '#FFFC0025', defaultUrl: 'https://snapchat.com/add/' },
  { id: 'globe', label: 'Website / Other', color: '#4F46E5', bgColor: '#4F46E515', defaultUrl: 'https://' },
]

export default function SocialIcon({ icon, className = 'w-4 h-4', size = 16, style = {} }) {
  if (!icon) return <Globe className={className} style={{ width: size, height: size, ...style }} />

  const key = String(icon).toLowerCase().trim()

  // Custom Image URL / Uploaded Asset
  if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('/') || key.startsWith('data:image/')) {
    return (
      <img
        src={icon}
        alt="Social icon"
        className={`${className} object-contain`}
        style={{ width: size, height: size, ...style }}
      />
    )
  }

  switch (key) {
    case 'facebook':
      return <Facebook className={className} style={{ width: size, height: size, ...style }} />
    case 'instagram':
      return <Instagram className={className} style={{ width: size, height: size, ...style }} />
    case 'twitter':
    case 'x':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          style={{ width: size, height: size, ...style }}
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'youtube':
      return <Youtube className={className} style={{ width: size, height: size, ...style }} />
    case 'linkedin':
      return <Linkedin className={className} style={{ width: size, height: size, ...style }} />
    case 'tiktok':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          style={{ width: size, height: size, ...style }}
        >
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01v8.44c0 1.94-.48 3.95-1.64 5.48-1.55 2.05-4.09 3.12-6.62 2.89-2.58-.2-4.9-1.74-6-4.04-1.12-2.32-.97-5.18.39-7.37 1.34-2.15 3.73-3.46 6.27-3.37.28.01.56.03.84.08v4.14c-.65-.18-1.34-.23-2.01-.13-1.16.16-2.23.89-2.73 1.95-.53 1.11-.42 2.47.28 3.47.7 1 1.92 1.58 3.14 1.48 1.35-.11 2.54-.99 2.94-2.28.21-.66.24-1.36.24-2.05V.02z" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          style={{ width: size, height: size, ...style }}
        >
          <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.201.3-.778.98-.954 1.18-.176.2-.352.226-.653.075-.301-.15-1.272-.469-2.423-1.496-.895-.799-1.5-1.786-1.676-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.352.452-.527.15-.175.201-.301.301-.502.101-.2.05-.377-.025-.527-.075-.15-.678-1.633-.929-2.238-.244-.59-.493-.51-.678-.519-.175-.009-.377-.01-.578-.01-.201 0-.527.075-.804.377-.276.301-1.054 1.03-1.054 2.511 0 1.481 1.079 2.911 1.23 3.112.15.201 2.124 3.243 5.145 4.548.719.311 1.28.497 1.718.636.722.23 1.378.197 1.897.12.578-.087 1.78-.727 2.031-1.43.251-.703.251-1.305.176-1.43-.075-.125-.276-.201-.577-.351zM12.05 21.785h-.002a9.87 9.87 0 01-5.032-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.267c0-5.445 4.43-9.875 9.877-9.875 2.639 0 5.12 1.028 6.985 2.894a9.82 9.82 0 012.89 6.983c-.001 5.447-4.432 9.877-9.866 9.877zM20.52 3.48A11.934 11.934 0 0012.05 0C5.495 0 .16 5.335.157 11.892a11.86 11.86 0 001.815 6.326L0 24l5.918-1.552a11.86 11.86 0 005.932 1.579h.005c6.554 0 11.89-5.336 11.894-11.893 0-3.176-1.237-6.162-3.229-8.654z" />
        </svg>
      )
    case 'telegram':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          style={{ width: size, height: size, ...style }}
        >
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      )
    case 'discord':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          style={{ width: size, height: size, ...style }}
        >
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      )
    case 'pinterest':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          style={{ width: size, height: size, ...style }}
        >
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.332 1.357-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.97 0z" />
        </svg>
      )
    case 'reddit':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          style={{ width: size, height: size, ...style }}
        >
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.56 12 8 12.56 8 13.25c0 .69.56 1.25 1.25 1.25.69 0 1.25-.56 1.25-1.25 0-.69-.56-1.25-1.25-1.25zm5.5 0c-.69 0-1.25.56-1.25 1.25 0 .69.56 1.25 1.25 1.25.69 0 1.25-.56 1.25-1.25 0-.69-.56-1.25-1.25-1.25zm-5.464 3.99a.327.327 0 0 0-.231.096.35.35 0 0 0 0 .49c.928.928 2.664.928 3.592 0a.35.35 0 0 0 0-.49.327.327 0 0 0-.462 0c-.672.672-1.998.672-2.67 0a.327.327 0 0 0-.229-.096z" />
        </svg>
      )
    default:
      return <Globe className={className} style={{ width: size, height: size, ...style }} />
  }
}

