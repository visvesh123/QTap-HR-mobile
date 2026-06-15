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

function flattenWeight(style: any): string | undefined {
  if (!style) return undefined;
  const flat = Array.isArray(style) ? StyleSheet.flatten(style) : style;
  const w = (flat && flat.fontWeight) ? String(flat.fontWeight) : '400';
  return w;
}

let patched = false;
export function applyGlobalFontPatch() {
  if (patched) return;
  patched = true;

  const patch = (Comp: any) => {
    const originalRender = Comp.render;
    if (!originalRender) return;
    Comp.render = function (...args: any[]) {
      const origin = originalRender.apply(this, args);
      if (!origin) return origin;
      const weight = flattenWeight(origin.props.style);
      const fontFamily = SORA_MAP[weight as keyof typeof SORA_MAP] || 'Sora-Regular';
      // Prepend our base style so explicit styles still win for everything else
      const baseStyle: any = { fontFamily };
      // On web we keep numeric weight (browsers ignore it on custom fonts anyway).
      return {
        ...origin,
        props: {
          ...origin.props,
          style: [baseStyle, origin.props.style],
        },
      };
    };
  };

  patch(Text as any);
  patch(TextInput as any);

  // Also set default style for any direct usage that bypasses render
  const defText: any = (Text as any).defaultProps || {};
  (Text as any).defaultProps = {
    ...defText,
    style: [{ fontFamily: 'Sora-Regular' }, defText.style],
  };
  const defInp: any = (TextInput as any).defaultProps || {};
  (TextInput as any).defaultProps = {
    ...defInp,
    style: [{ fontFamily: 'Sora-Regular' }, defInp.style],
  };
}
