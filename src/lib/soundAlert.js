// src/lib/soundAlert.js
// Web Audio API Synthesizer & Browser Notification Engine (Zero external audio files required)

class SoundAlertManager {
  constructor() {
    this.audioCtx = null
    this.alertInterval = null
  }

  // Initialize or resume Web Audio context on user interaction
  getAudioContext() {
    if (typeof window === 'undefined') return null
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        this.audioCtx = new AudioContext()
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume()
    }
    return this.audioCtx
  }

  /**
   * Plays a loud, pleasant dual-tone chime for incoming orders
   * Frequency sequence: 784Hz (G5) -> 1046Hz (C6) -> 1318Hz (E6)
   */
  playOrderChime() {
    try {
      const ctx = this.getAudioContext()
      if (!ctx) return

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      // Triple tone chime
      osc.frequency.setValueAtTime(784, now)
      osc.frequency.setValueAtTime(1046, now + 0.12)
      osc.frequency.setValueAtTime(1318, now + 0.24)

      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.4, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.65)
    } catch (e) {
      console.warn('Audio playback not permitted yet (user gesture required):', e)
    }
  }

  /**
   * Starts looping the incoming order chime every 1.5 seconds until stopped
   */
  startOrderAlertLoop() {
    this.stopOrderAlertLoop()
    this.playOrderChime()
    this.vibrateDevice([300, 150, 300])
    this.alertInterval = setInterval(() => {
      this.playOrderChime()
      this.vibrateDevice([300, 150, 300])
    }, 1600)
  }

  /**
   * Stops looping the incoming order sound
   */
  stopOrderAlertLoop() {
    if (this.alertInterval) {
      clearInterval(this.alertInterval)
      this.alertInterval = null
    }
  }

  /**
   * Plays a soft bubble pop sound for new chat messages
   */
  playMessagePop() {
    try {
      const ctx = this.getAudioContext()
      if (!ctx) return

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(520, now)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1)

      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.16)
    } catch (e) {
      console.warn('Chat pop audio error:', e)
    }
  }

  /**
   * Triggers hardware vibration on supported mobile browsers
   */
  vibrateDevice(pattern = [200, 100, 200]) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern)
      } catch (e) {}
    }
  }

  /**
   * Request browser push notification permissions
   */
  async requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
    if (Notification.permission === 'granted') return 'granted'
    try {
      const permission = await Notification.requestPermission()
      return permission
    } catch (e) {
      return 'denied'
    }
  }

  /**
   * Show desktop / mobile native notification
   */
  showNotification(title, body, icon = '/favicon.ico') {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon,
          badge: icon,
          vibrate: [200, 100, 200],
        })
      } catch (e) {
        console.warn('Notification display failed:', e)
      }
    }
  }
}

export const soundAlert = new SoundAlertManager()
