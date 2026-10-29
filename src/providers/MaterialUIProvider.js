'use client'

import { useMemo } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { StyledEngineProvider } from '@mui/material/styles'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'

export default function MaterialUIProvider({ children }) {
  const { isDark } = useTheme()
  const { isRTL } = useLanguage()

  const theme = useMemo(() => {
    return createTheme({
      direction: isRTL ? 'rtl' : 'ltr',
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
          disabled: isDark ? '#64748B' : '#94A3B8',
        },
        divider: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        action: {
          hover: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          selected: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          disabled: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.3)',
          disabledBackground: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
        },
        ...(isDark && {
          grey: {
            50: '#131C31',
            100: '#1E293B',
            200: '#334155',
            300: '#475569',
            400: '#64748B',
            500: '#94A3B8',
            600: '#CBD5E1',
            700: '#E2E8F0',
            800: '#F1F5F9',
            900: '#F8FAFC',
            A100: '#1E293B',
            A200: '#334155',
            A400: '#64748B',
            A700: '#CBD5E1',
          },
        }),
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
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
              backgroundImage: 'none',
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              color: isDark ? '#F1F5F9' : '#0F172A',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          },
        },
        MuiTableContainer: {
          styleOverrides: {
            root: {
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          },
        },
        MuiTableHead: {
          styleOverrides: {
            root: {
              backgroundColor: isDark ? '#131C31' : '#F8FAFC',
              '& .MuiTableCell-head': {
                color: isDark ? '#CBD5E1' : '#475569',
                fontWeight: 700,
                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            },
          },
        },
        MuiTableRow: {
          styleOverrides: {
            root: {
              '&.MuiTableRow-hover:hover': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
              },
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              color: isDark ? '#E2E8F0' : '#0F172A',
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            },
          },
        },
        MuiMenu: {
          styleOverrides: {
            paper: {
              borderRadius: '0px !important',
              backgroundImage: 'none',
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
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
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              color: isDark ? '#F1F5F9' : '#0F172A',
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
              color: isDark ? '#F1F5F9' : '#0F172A',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.2)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)',
              },
              '&.Mui-disabled': {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                },
              },
            },
            notchedOutline: {
              borderRadius: '0px !important',
            },
            input: {
              color: isDark ? '#F1F5F9' : '#0F172A',
              '&.Mui-disabled': {
                WebkitTextFillColor: isDark ? '#CBD5E1' : '#334155',
                color: isDark ? '#CBD5E1' : '#334155',
              },
            },
          },
        },
        MuiInputLabel: {
          styleOverrides: {
            root: {
              color: isDark ? '#94A3B8' : '#64748B',
              '&.Mui-disabled': {
                color: isDark ? '#94A3B8' : '#64748B',
              },
            },
          },
        },
        MuiInputBase: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
              color: isDark ? '#F1F5F9' : '#0F172A',
            },
            input: {
              color: isDark ? '#F1F5F9' : '#0F172A',
              '&.Mui-disabled': {
                WebkitTextFillColor: isDark ? '#CBD5E1' : '#334155',
              },
            },
          },
        },
        MuiSelect: {
          styleOverrides: {
            icon: {
              color: isDark ? '#94A3B8' : '#64748B',
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
              color: isDark ? '#94A3B8' : '#64748B',
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
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              color: isDark ? '#F1F5F9' : '#0F172A',
            },
          },
        },
        MuiDataGrid: {
          styleOverrides: {
            root: {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              color: isDark ? '#E2E8F0' : '#0F172A',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: isDark ? '#131C31' : '#F8FAFC',
                color: isDark ? '#CBD5E1' : '#475569',
                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
              '& .MuiDataGrid-cell': {
                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            },
          },
        },
        MuiToggleButton: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
              color: isDark ? '#94A3B8' : '#64748B',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
              '&.Mui-selected': {
                color: isDark ? '#F8FAFC' : '#0F172A',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
              },
            },
          },
        },
        MuiTablePagination: {
          styleOverrides: {
            root: {
              color: isDark ? '#CBD5E1' : '#475569',
            },
            selectIcon: {
              color: isDark ? '#94A3B8' : '#64748B',
            },
          },
        },
        MuiPaginationItem: {
          styleOverrides: {
            root: {
              borderRadius: '0px !important',
              color: isDark ? '#E2E8F0' : '#0F172A',
            },
          },
        },
      },
    })
  }, [isDark, isRTL])

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  )
}
