// Mahindra University · brand tokens (crimson + steel grey on pure white)
import { Platform } from 'react-native';

export const colors = {
  // Primary — crimson red
  primary:      '#DC143C',
  primaryDark:  '#A8102F',
  primaryLight: '#FF2E55',
  primaryBg:    '#FCEEF1',

  // Surfaces
  white:        '#FFFFFF',
  background:   '#FFFFFF', // pure white
  surface:      '#FFFFFF',

  // Steel grey scale (secondary text + borders)
  steel900:     '#1E2A33', // dominant headings
  steel800:     '#2A3A45',
  steel700:     '#3E5260', // body
  steel600:     '#54697A',
  steel500:     '#6E8493', // secondary
  steel400:     '#8C9FAC',
  steel300:     '#B0BFCA', // muted
  steel200:     '#D2DCE2', // border
  steel100:     '#E4EAEE', // divider
  steel50:      '#F2F5F7', // inset bg
  steel25:      '#F7F9FA',

  // Semantic aliases
  text:           '#1E2A33',
  textSecondary:  '#6E8493',
  textMuted:      '#8C9FAC',
  border:         '#E4EAEE',
  borderStrong:   '#D2DCE2',
  divider:        '#EEF2F4',
  ink:            '#1E2A33',

  // Accents (kept for backwards compatibility)
  gold:        '#C99A1F',
  goldLight:   '#FBF1D2',
  shadow:      'rgba(30, 42, 51, 0.08)',

  // Status
  sos:        '#DC2626',
  success:    '#10B981',
  warning:    '#F59E0B',
  info:       '#3B82F6',

  // Claymorphism — subtle on pure white
  clayBg:        '#FFFFFF',
  clayBgSoft:    '#F2F5F7',
  claySurface:   '#FFFFFF',
  clayHighlight: '#FFFFFF',
  clayShadow:    '#CDD7DD',
  clayDark:      '#1E2A33',
  clayMuted:     '#6E8493',

  // Tint surfaces (used for category icons)
  clayPink:      '#FCEEF1',
  clayPeach:     '#FFF1E6',
  clayMint:      '#E6F4EA',
  clayLilac:     '#EFEAFB',
  claySky:       '#E6EFFB',
  clayBlush:     '#FBE9EC',
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const radii = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 24,
  pill: 999,
  clay: 20,     // subtler than the chunky 26
  clayLg: 28,
  clayPill: 999,
};

// Typography — Sora, mapped via global font patch in src/font.ts
export const typo = {
  display: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -1.0,  color: colors.text },
  h1:      { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.6,  color: colors.text },
  h2:      { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4,  color: colors.text },
  h3:      { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.2,  color: colors.text },
  h4:      { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  section: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.4,
             textTransform: 'uppercase' as const, color: colors.textSecondary },
  body:    { fontSize: 15, fontWeight: '400' as const, color: colors.text, lineHeight: 22 },
  bodySemi:{ fontSize: 15, fontWeight: '600' as const, color: colors.text },
  caption: { fontSize: 12, fontWeight: '500' as const, color: colors.textSecondary },
  // Helper font family (use rarely — TextInput needs this explicitly because the
  // global patch doesn't always run before the first render on web).
  fontFamily: 'Sora-Regular',
};

// Basic legacy shadow (kept so existing files don't break)
export const shadow = {
  card: Platform.select({
    web: { boxShadow: '0 2px 10px rgba(30, 42, 51, 0.06)' } as any,
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
  }),
  cardHeavy: Platform.select({
    web: { boxShadow: '0 8px 24px rgba(168, 16, 47, 0.18)' } as any,
    default: {
      shadowColor: colors.primaryDark,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.20,
      shadowRadius: 14,
      elevation: 6,
    },
  }),
};

/* ───────────── Modern subtle Claymorphism shadow recipes ─────────────
 *  All shadows are based on a cool steel-grey to keep depth on pure white.
 *  Highlights are pure white. Result: a quietly elevated, professional look.
 * ─────────────────────────────────────────────────────────────────────*/
export const clay = {
  // Card-level: soft dual shadow + inner top highlight
  surface: Platform.select({
    web: {
      boxShadow:
        '0 1px 2px rgba(30, 42, 51, 0.04), ' +
        '0 6px 16px rgba(110, 132, 147, 0.12), ' +
        '0 12px 28px rgba(110, 132, 147, 0.08), ' +
        'inset 0 1px 0 rgba(255, 255, 255, 0.85)',
    } as any,
    default: {
      shadowColor: '#6E8493',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 14,
      elevation: 4,
    },
  }),

  // Subtle / inline level
  surfaceSoft: Platform.select({
    web: {
      boxShadow:
        '0 1px 1px rgba(30, 42, 51, 0.03), ' +
        '0 3px 8px rgba(110, 132, 147, 0.10)',
    } as any,
    default: {
      shadowColor: '#6E8493',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
  }),

  // Pressed/inset (inputs, segmented controls)
  pressed: Platform.select({
    web: {
      boxShadow:
        'inset 0 2px 4px rgba(110, 132, 147, 0.18), ' +
        'inset 0 -1px 0 rgba(255, 255, 255, 0.7)',
    } as any,
    default: {
      shadowColor: '#6E8493',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 0,
    },
  }),

  // Primary crimson elevation (for CTAs, action surfaces)
  crimson: Platform.select({
    web: {
      boxShadow:
        '0 2px 4px rgba(168, 16, 47, 0.18), ' +
        '0 10px 24px rgba(220, 20, 60, 0.28), ' +
        'inset 0 1px 0 rgba(255, 255, 255, 0.30)',
    } as any,
    default: {
      shadowColor: '#A8102F',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.32,
      shadowRadius: 14,
      elevation: 8,
    },
  }),

  // Floating action / hero (slightly more lift than surface, still subtle)
  hero: Platform.select({
    web: {
      boxShadow:
        '0 2px 6px rgba(30, 42, 51, 0.06), ' +
        '0 18px 40px rgba(110, 132, 147, 0.16), ' +
        'inset 0 1px 0 rgba(255, 255, 255, 0.9)',
    } as any,
    default: {
      shadowColor: '#6E8493',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 22,
      elevation: 6,
    },
  }),
};

// Branding — MUOne lockup (logo + "Connected by One.")
export const BRAND = {
  name: 'MUOne',
  short: 'MU',
  tagline: 'Connected by One.',
  domain: 'mahindrauniversity.edu.in',
  /** Full logo unit: MUone wordmark + caption */
  logo: require('../assets/images/muone-logo.png') as number,
  /** @deprecated Prefer BRAND.logo — kept for any remote/fallback consumers */
  logoUrl: 'https://customer-assets.emergentagent.com/job_campus-hub-453/artifacts/79azl2xu_mu_logo%20%281%29.png',
  poweredBy: 'Q-Tap',
  poweredByLogoUrl: 'https://customer-assets.emergentagent.com/job_campus-hub-453/artifacts/6viavqwc_Q-Tap_logo.jpg',
  poweredByDescription: 'Department of Campus Innovation',
};
