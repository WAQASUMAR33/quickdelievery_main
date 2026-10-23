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
        borderRadius: 0,
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: isDark ? '#080C16' : '#F8FAFC',
              color: isDark ? '#F1F5F9' : '#0F172A',
              transition: 'background-color 0.25s ease, color 0.25s ease',
            },
            '*, *::before, *::after': {
              borderRadius: '0px !important',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
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
              borderRadius: '0px !important',
              backgroundImage: 'none',
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            },
          },
        },
        MuiMenu: {
          styleOverrides: {
            paper: {
              borderRadius: '0px !important',
              backgroundImage: 'none',
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
            },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
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
              borderRadius: '0px !important',
              fontWeight: 600,
            },
          },
        },
        MuiButtonBase: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: '0px !important',
            },
          },
        },
        MuiDialogTitle: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
            },
          },
        },
        MuiDialogContent: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
            },
          },
        },
        MuiDialogActions: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
            },
            notchedOutline: {
              borderRadius: '0px !important',
            },
          },
        },
        MuiInputBase: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
            },
          },
        },
        MuiFilledInput: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
            },
            label: {
              borderRadius: '0px !important',
            },
          },
        },
        MuiAlert: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
            },
          },
        },
        MuiAccordion: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
              '&:first-of-type': {
                borderRadius: '0px !important',
              },
              '&:last-of-type': {
                borderRadius: '0px !important',
              },
            },
          },
        },
        MuiTabs: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
            },
            indicator: {
              borderRadius: '0px !important',
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
            },
          },
        },
        MuiBadge: {
          styleOverrides: {
            badge: {
              borderRadius: '0px !important',
            },
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              borderRadius: '0px !important',
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              borderRadius: '0px !important',
            },
          },
        },
        MuiPaginationItem: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
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
