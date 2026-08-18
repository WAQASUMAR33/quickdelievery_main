'use client'

import { useState, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'

import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import PhoneIcon from '@mui/icons-material/Phone'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import PersonIcon from '@mui/icons-material/Person'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'

import { soundAlert } from '@/lib/soundAlert'

const BRAND = '#39772A'

export default function OrderChatDrawer({
  open,
  onClose,
  orderId,
  currentUser, // { id, role, username }
  recipientUser, // { name, phone, role }
}) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const prevMsgCountRef = useRef(0)

  const isCustomer = currentUser?.role === 'CUSTOMER'

  // Quick reply preset chips
  const customerPresets = [
    'Where are you right now?',
    'Please leave it at the door.',
    'Call me when you arrive.',
    'Thank you so much!',
  ]

  const driverPresets = [
    "I'm on my way with your order!",
    'Arriving in about 5 minutes.',
    "I'm at the entrance downstairs.",
    'Please double-check the house number.',
  ]

  const presets = isCustomer ? customerPresets : driverPresets

  // Fetch messages
  const fetchMessages = async () => {
    if (!orderId) return
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`)
      const data = await res.json()
      if (data.success) {
        const newMsgs = data.data || []
        // If new message received from other party, play chime
        if (newMsgs.length > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
          const lastMsg = newMsgs[newMsgs.length - 1]
          if (lastMsg.senderRole !== currentUser?.role) {
            soundAlert.playMessagePop()
          }
        }
        prevMsgCountRef.current = newMsgs.length
        setMessages(newMsgs)
      }
    } catch (e) {
      console.error('Failed to fetch messages:', e)
    }
  }

  // Poll messages every 3 seconds while chat is open
  useEffect(() => {
    if (open && orderId) {
      setLoading(true)
      fetchMessages().finally(() => setLoading(false))
      const interval = setInterval(fetchMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [open, orderId])

  // Scroll to bottom on new message
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  // Send message
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim()
    if (!text || !orderId || !currentUser?.id || sending) return

    setSending(true)
    const optimisticMsg = {
      id: Date.now(),
      orderId,
      senderId: currentUser.id,
      senderRole: currentUser.role || 'CUSTOMER',
      senderName: currentUser.username || (isCustomer ? 'Customer' : 'Driver'),
      message: text,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    }

    setMessages((prev) => [...prev, optimisticMsg])
    if (!textToSend) setInputText('')

    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderRole: currentUser.role || 'CUSTOMER',
          senderName: currentUser.username || (isCustomer ? 'Customer' : 'Driver'),
          message: text,
        }),
      })
      const data = await res.json()
      if (data.success) {
        soundAlert.playMessagePop()
        fetchMessages()
      }
    } catch (e) {
      console.error('Failed to send message:', e)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f8fafc',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          bgcolor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: isCustomer ? BRAND : '#1e40af', width: 44, height: 44 }}>
            {isCustomer ? <TwoWheelerIcon /> : <PersonIcon />}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              {recipientUser?.name || (isCustomer ? 'Assigned Driver' : 'Customer')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e', display: 'inline-block' }} />
              Order #{orderId} • Live Chat
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {recipientUser?.phone && (
            <Tooltip title={`Call ${recipientUser.phone}`}>
              <IconButton
                component="a"
                href={`tel:${recipientUser.phone}`}
                sx={{
                  bgcolor: '#f0fdf4',
                  color: BRAND,
                  '&:hover': { bgcolor: '#dcfce7' },
                }}
              >
                <PhoneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Messages Feed */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {loading && messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={28} sx={{ color: BRAND }} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
            <Typography variant="body2" fontWeight={600}>No messages yet</Typography>
            <Typography variant="caption">Send a quick update or question below.</Typography>
          </Box>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderRole === currentUser?.role || msg.senderId === currentUser?.id
            return (
              <Box
                key={msg.id || idx}
                sx={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    bgcolor: isMe ? BRAND : '#ffffff',
                    color: isMe ? '#ffffff' : '#1e293b',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    border: isMe ? 'none' : '1px solid #e2e8f0',
                  }}
                >
                  <Typography variant="body2" sx={{ wordBreak: 'break-word', fontSize: 14 }}>
                    {msg.message}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4, px: 0.5 }}>
                  <Typography variant="caption" sx={{ fontSize: 10, color: '#94a3b8' }}>
                    {formatTime(msg.createdAt)}
                  </Typography>
                  {isMe && (
                    <DoneAllIcon sx={{ fontSize: 13, color: msg.isRead ? '#38bdf8' : '#94a3b8' }} />
                  )}
                </Box>
              </Box>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Quick Action Chips */}
      <Box sx={{ px: 2, py: 1, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <Stack direction="row" spacing={1}>
          {presets.map((preset, i) => (
            <Chip
              key={i}
              label={preset}
              size="small"
              onClick={() => handleSendMessage(preset)}
              sx={{
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: 12,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#f0fdf4', borderColor: BRAND, color: BRAND },
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Input Form */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault()
          handleSendMessage()
        }}
        sx={{
          p: 2,
          bgcolor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '24px',
              bgcolor: '#f8fafc',
              '&:hover fieldset': { borderColor: BRAND },
              '&.Mui-focused fieldset': { borderColor: BRAND },
            },
          }}
        />
        <IconButton
          type="submit"
          disabled={!inputText.trim() || sending}
          sx={{
            bgcolor: BRAND,
            color: '#fff',
            p: 1.25,
            '&:hover': { bgcolor: '#2e6122' },
            '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' },
          }}
        >
          {sending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <SendIcon fontSize="small" />}
        </IconButton>
      </Box>
    </Drawer>
  )
}
