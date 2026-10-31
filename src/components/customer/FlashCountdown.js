'use client'

import { memo, useEffect, useState } from 'react'

// Isolated countdown ticker.
// Keeping the 1-second interval inside this tiny component means only these few
// <span>s re-render every second, instead of the entire (very large) ProductCatalog
// tree. This removes a major source of main-thread work / Total Blocking Time.
const INITIAL = { hours: 4, minutes: 28, seconds: 15 }

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState(INITIAL)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return { hours: 8, minutes: 0, seconds: 0 }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  return timeLeft
}

const pad = (n) => String(n).padStart(2, '0')

// Large digital blocks used in the hero bento promo card
export const BentoCountdown = memo(function BentoCountdown() {
  const timeLeft = useCountdown()
  const blocks = [
    { value: timeLeft.hours, label: 'HRS' },
    { value: timeLeft.minutes, label: 'MIN' },
    { value: timeLeft.seconds, label: 'SEC' },
  ]
  return (
    <div className="flex items-center gap-2 my-2.5" role="timer" aria-label="Flash drop countdown">
      {blocks.map((b, i) => (
        <div key={b.label} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/15 text-center min-w-[38px] shadow-inner">
              <span className="text-sm font-black font-mono text-cyan-300 tracking-wider">{pad(b.value)}</span>
            </div>
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">{b.label}</span>
          </div>
          {i < blocks.length - 1 && <span className="font-black text-violet-300 text-sm mb-2.5">:</span>}
        </div>
      ))}
    </div>
  )
})

// Compact pill used in the Flash Drops section header
export const PillCountdown = memo(function PillCountdown({ label = 'Ends in:' }) {
  const timeLeft = useCountdown()
  return (
    <div className="flex items-center gap-1 text-xs font-extrabold text-slate-700 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-full" role="timer">
      <span className="text-[11px] text-rose-700 font-bold uppercase">{label}</span>
      <span className="font-mono bg-rose-600 text-white px-1.5 py-0.5 rounded text-[11px]">{pad(timeLeft.hours)}</span>
      <span>:</span>
      <span className="font-mono bg-rose-600 text-white px-1.5 py-0.5 rounded text-[11px]">{pad(timeLeft.minutes)}</span>
      <span>:</span>
      <span className="font-mono bg-rose-600 text-white px-1.5 py-0.5 rounded text-[11px]">{pad(timeLeft.seconds)}</span>
    </div>
  )
})

