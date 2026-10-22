'use client'

import { useMemo } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { StyledEngineProvider } from '@mui/material/styles'
import { useTheme } from '@/contexts/ThemeContext'

export default function MaterialUIProvider({ children }) {
  const { isDark } = useTheme()

  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode: isDark ? 'dark' : 'light',
        primary: {
          main: '#2563EB',
          light: '#3B82F6',
          dark: '#1D4ED8',
        },
        secondary: {
          main: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706',
        },
        background: {
          default: isDark ? '#080C16' : '#F8FAFC',
          paper: isDark ? '#0F172A' : '#FFFFFF',
        },
        text: {
          primary: isDark ? '#F1F5F9' : '#0F172A',
          secondary: isDark ? '#94A3B8' : '#64748B',
        },
        divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      },
      typography: {
        fontFamily: 'var(--font-jakarta), system-ui, -apple-system, sans-serif',
      },
      shape: {
        borderRadius: 12,
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: isDark ? '#080C16' : '#F8FAFC',
              color: isDark ? '#F1F5F9' : '#0F172A',
              transition: 'background-color 0.25s ease, color 0.25s ease',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              color: isDark ? '#F1F5F9' : '#0F172A',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            },
          },
        },
        MuiMenu: {
          styleOverrides: {
            paper: {
              backgroundImage: 'none',
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
            },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              color: isDark ? '#F1F5F9' : '#0F172A',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 8,
              fontWeight: 600,
            },
          },
        },
      },
    })
  }, [isDark])

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  )
}
