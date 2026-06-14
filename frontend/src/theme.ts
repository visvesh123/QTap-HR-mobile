// Mahindra University brand tokens — primary crimson red #e31837
export const colors = {
  primary: '#E31837',
  primaryDark: '#B71429',
  primaryLight: '#FF3D5A',
  primaryBg: '#FEE7EB',
  white: '#FFFFFF',
  gold: '#D4A017',
  goldLight: '#FEF3C7',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E5E7EB',
  sos: '#DC2626',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  shadow: 'rgba(227, 24, 55, 0.12)',

  // Claymorphism palette
  clayBg:        '#F2EDE7',  // warm pale neutral page background
  clayBgSoft:    '#EEE7DF',
  claySurface:   '#FFFFFF',  // chunky card body
  clayHighlight: '#FFFFFF',  // simulated top-left light
  clayShadow:    '#C4B7A6',  // simulated bottom-right shadow tone
  clayDark:      '#3A2F2A',
  clayMuted:     '#8A7B6F',
  clayPink:      '#FFD0D6',
  clayPeach:     '#FFE4D2',
  clayMint:      '#D8F1E1',
  clayLilac:     '#E2D6FF',
  claySky:       '#D8E8FF',
  clayBlush:     '#FCEBE8',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
  // Clay-specific generous radii
  clay: 26,
  clayLg: 32,
  clayPill: 999,
};

export const typo = {
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5 },
  h3: { fontSize: 20, fontWeight: '600' as const },
  h4: { fontSize: 18, fontWeight: '600' as const },
  section: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodySemi: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeavy: {
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
};

// Claymorphism shadow recipes — soft & chunky, multi-layered on web
import { Platform } from 'react-native';

export const clay = {
  surface: Platform.select({
    web: {
      // Outer soft shadow + subtle inset highlight (bottom-right dark, top-left light)
      boxShadow:
        '10px 10px 24px rgba(196, 183, 166, 0.55), ' +
        '-8px -8px 20px rgba(255, 255, 255, 0.85), ' +
        'inset 1px 1px 2px rgba(255, 255, 255, 0.55), ' +
        'inset -1px -1px 2px rgba(196, 183, 166, 0.22)',
    } as any,
    default: {
      shadowColor: '#8C7565',
      shadowOffset: { width: 8, height: 10 },
      shadowOpacity: 0.28,
      shadowRadius: 18,
      elevation: 8,
    },
  }),
  surfaceSoft: Platform.select({
    web: {
      boxShadow:
        '6px 6px 14px rgba(196, 183, 166, 0.40), ' +
        '-4px -4px 12px rgba(255, 255, 255, 0.85)',
    } as any,
    default: {
      shadowColor: '#8C7565',
      shadowOffset: { width: 4, height: 6 },
      shadowOpacity: 0.20,
      shadowRadius: 12,
      elevation: 4,
    },
  }),
  pressed: Platform.select({
    web: {
      boxShadow:
        'inset 5px 5px 12px rgba(196, 183, 166, 0.55), ' +
        'inset -5px -5px 12px rgba(255, 255, 255, 0.85)',
    } as any,
    default: {
      shadowColor: '#8C7565',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.10,
      shadowRadius: 4,
      elevation: 1,
    },
  }),
  crimson: Platform.select({
    web: {
      boxShadow:
        '8px 10px 22px rgba(227, 24, 55, 0.30), ' +
        '-4px -4px 14px rgba(255, 255, 255, 0.65), ' +
        'inset 1px 1px 2px rgba(255, 255, 255, 0.30), ' +
        'inset -1px -1px 2px rgba(0, 0, 0, 0.15)',
    } as any,
    default: {
      shadowColor: colors.primaryDark,
      shadowOffset: { width: 4, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 8,
    },
  }),
};

// Branding
export const BRAND = {
  name: 'Mahindra University',
  short: 'MU',
  tagline: 'Rise. Lead. Inspire.',
  domain: 'mahindrauniversity.edu.in',
  logoUrl: 'https://customer-assets.emergentagent.com/job_campus-hub-453/artifacts/79azl2xu_mu_logo%20%281%29.png',
  poweredBy: 'Q-Tap',
  poweredByLogoUrl: 'https://customer-assets.emergentagent.com/job_campus-hub-453/artifacts/6viavqwc_Q-Tap_logo.jpg',
  poweredByDescription: 'Department of Campus Innovation',
};
