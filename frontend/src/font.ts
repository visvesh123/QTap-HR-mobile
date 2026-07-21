import { Text, TextInput, Platform, StyleSheet } from 'react-native';

// expo-asset is a transitive Expo dependency; keep a soft import for web font URIs.
const Asset: { fromModule: (mod: number) => { uri: string } } = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-asset').Asset;
  } catch {
    return { fromModule: () => ({ uri: '' }) };
  }
})();

const SORA_MAP: Record<string, string> = {
  '300': 'Sora-Regular',
  '400': 'Sora-Regular',
  '500': 'Sora-Medium',
  '600': 'Sora-SemiBold',
  '700': 'Sora-Bold',
  '800': 'Sora-ExtraBold',
  '900': 'Sora-ExtraBold',
  normal: 'Sora-Regular',
  bold: 'Sora-Bold',
};

let patched = false;

/** Patch Text.render to insert correct Sora variant based on fontWeight.
 *  Works on both native and web. Any Text/TextInput that ALREADY declares a
 *  fontFamily (e.g. icon glyphs from @expo/vector-icons use 'ionicons' /
 *  'material-community') is left untouched so icons never break. */
function applyNativePatch() {
  const patch = (Comp: any) => {
    const originalRender = Comp.render;
    if (!originalRender) return;
    Comp.render = function (...args: any[]) {
      const origin = originalRender.apply(this, args);
      if (!origin) return origin;
      const flat = StyleSheet.flatten(origin.props.style) || {};
      // Skip icon fonts / anything that already picked a family.
      if ((flat as any).fontFamily) return origin;
      const weight = String((flat as any).fontWeight || '400');
      const fontFamily = SORA_MAP[weight as keyof typeof SORA_MAP] || 'Sora-Regular';
      // IMPORTANT (iOS): each Sora weight is a SEPARATE font family. If we keep
      // the numeric fontWeight alongside a named variant (e.g. 'Sora-ExtraBold'
      // + fontWeight 800), iOS tries to find a *bolder* face of that variant,
      // fails, and silently falls back to the system font. So we DROP
      // fontWeight and let the family name carry the weight.
      const { fontWeight: _omitWeight, ...rest } = flat as any;
      return {
        ...origin,
        props: {
          ...origin.props,
          // Single object (not an array): RN-Web throws on array styles reaching
          // nested text <span>s.
          style: { ...rest, fontFamily },
        },
      };
    };
  };
  patch(Text as any);
  patch(TextInput as any);
}

/** Web: register a single 'Sora' family with weight-mapped @font-face rules,
 *  then apply it to every RN-Web text element EXCEPT icon glyphs (which carry
 *  an inline font-family). The numeric font-weight RN-Web emits selects the
 *  matching Sora variant automatically. */
const SORA_WEB_FILES: { weight: number; mod: number }[] = [
  { weight: 400, mod: require('../assets/fonts/Sora-Regular.ttf') },
  { weight: 500, mod: require('../assets/fonts/Sora-Medium.ttf') },
  { weight: 600, mod: require('../assets/fonts/Sora-SemiBold.ttf') },
  { weight: 700, mod: require('../assets/fonts/Sora-Bold.ttf') },
  { weight: 800, mod: require('../assets/fonts/Sora-ExtraBold.ttf') },
];

function applyWebStylesheet() {
  if (typeof document === 'undefined') return;
  const id = '__sora_global_css__';
  if (document.getElementById(id)) return;

  const faces = SORA_WEB_FILES.map(({ weight, mod }) => {
    let uri = '';
    try { uri = Asset.fromModule(mod).uri; } catch { /* noop */ }
    if (!uri) return '';
    return `@font-face{font-family:'Sora';font-style:normal;font-weight:${weight};font-display:swap;src:url(${uri}) format('truetype');}`;
  }).filter(Boolean).join('\n');

  const style = document.createElement('style');
  style.id = id;
  style.appendChild(document.createTextNode(`
    ${faces}

    html, body, #root, #__next, #expo-root {
      font-family: 'Sora', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Apply Sora to every RN-Web text element EXCEPT icon glyphs. Icon fonts
     * (ionicons / material-community / FontAwesome…) set font-family inline,
     * so :not([style*="font-family"]) reliably excludes them. The two attribute
     * selectors give specificity (0,2,0), beating RN-Web's base text class. */
    [class*="css-text-"]:not([style*="font-family"]) {
      font-family: 'Sora', system-ui, -apple-system, sans-serif;
    }

    input, textarea, select, button {
      font-family: 'Sora', system-ui, sans-serif;
    }
  `));
  document.head.appendChild(style);
}

export function applyGlobalFontPatch() {
  if (patched) return;
  patched = true;
  if (Platform.OS === 'web') {
    // Web: pure CSS approach (no render patch — that crashes nested text spans).
    applyWebStylesheet();
    return;
  }
  // Native: patch Text.render to inject the right Sora variant by weight.
  applyNativePatch();
}
