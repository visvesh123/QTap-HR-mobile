import { Text, TextInput, Platform, StyleSheet } from 'react-native';

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

function flattenWeight(style: any): string {
  if (!style) return '400';
  const flat = Array.isArray(style) ? StyleSheet.flatten(style) : style;
  const w = (flat && flat.fontWeight) ? String(flat.fontWeight) : '400';
  return w;
}

let patched = false;

/** Native: patch Text.render to insert correct Sora variant based on fontWeight. */
function applyNativePatch() {
  const patch = (Comp: any) => {
    const originalRender = Comp.render;
    if (!originalRender) return;
    Comp.render = function (...args: any[]) {
      const origin = originalRender.apply(this, args);
      if (!origin) return origin;
      const weight = flattenWeight(origin.props.style);
      const fontFamily = SORA_MAP[weight as keyof typeof SORA_MAP] || 'Sora-Regular';
      return {
        ...origin,
        props: {
          ...origin.props,
          style: [{ fontFamily }, origin.props.style],
        },
      };
    };
  };
  patch(Text as any);
  patch(TextInput as any);
}

/** Web: inject a global stylesheet that maps RN-Web's atomic font-weight classes
 *  to the right Sora variant. This works regardless of how RN-Web hashes its
 *  className/style internals. */
function applyWebStylesheet() {
  if (typeof document === 'undefined') return;
  const id = '__sora_global_css__';
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.appendChild(document.createTextNode(`
    /* Sora — global font family for the entire app.
     * NOTE: do NOT use !important — react-native uses inline style for icon
     * fonts (MaterialCommunityIcons, Ionicons, FontAwesome) and we must not
     * override those. RN-Web normally writes inline style or atomic classes
     * that beat these unscoped selectors. */
    html, body, #root, #__next, #expo-root {
      font-family: 'Sora-Regular', 'Sora', system-ui, -apple-system, BlinkMacSystemFont,
                   'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    body {
      font-family: 'Sora-Regular', 'Sora', system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* RN-Web atomic font-weight classes → correct Sora variant. These
     * selectors are scoped only to weight-class elements so they never touch
     * icon glyphs (which never carry r-fontWeight-*). */
    [class*="r-fontWeight-100"], [class*="r-fontWeight-200"], [class*="r-fontWeight-300"],
    [class*="r-fontWeight-400"], [class*="r-fontWeight-normal"] {
      font-family: 'Sora-Regular', system-ui, sans-serif;
    }
    [class*="r-fontWeight-500"] {
      font-family: 'Sora-Medium', system-ui, sans-serif;
    }
    [class*="r-fontWeight-600"] {
      font-family: 'Sora-SemiBold', system-ui, sans-serif;
    }
    [class*="r-fontWeight-700"], [class*="r-fontWeight-bold"] {
      font-family: 'Sora-Bold', system-ui, sans-serif;
    }
    [class*="r-fontWeight-800"], [class*="r-fontWeight-900"] {
      font-family: 'Sora-ExtraBold', system-ui, sans-serif;
    }

    /* Form inputs explicitly so placeholders/values use Sora. */
    input, textarea, select, button {
      font-family: 'Sora-Regular', system-ui, sans-serif;
    }
  `));
  document.head.appendChild(style);
}

export function applyGlobalFontPatch() {
  if (patched) return;
  patched = true;
  if (Platform.OS === 'web') {
    applyWebStylesheet();
    // IMPORTANT: do NOT run the native Text.render patch on web — it
    // makes every Text/TextInput carry an atomic Sora className that
    // conflicts with icon font atomic classes (MaterialCommunityIcons,
    // Ionicons), causing icons to render as missing-glyph boxes.
    return;
  }
  applyNativePatch();
}
