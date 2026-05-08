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

// Branding
export const BRAND = {
  name: 'Mahindra University',
  short: 'MU',
  tagline: 'Rise. Lead. Inspire.',
  domain: 'mahindrauniversity.edu.in',
};
