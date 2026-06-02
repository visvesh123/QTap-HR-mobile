import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient as SLG, Stop, Path, Rect, Line, Text as SvgText, Circle, G } from 'react-native-svg';
import { colors } from '../theme';

export function TrendChart({ data, height = 220 }: { data: { label: string; present: number; absent: number; total: number }[]; height?: number }) {
  const padL = 36, padR = 12, padT = 12, padB = 28;
  const W = 760;
  const H = height;
  const maxY = Math.max(10, ...data.map((d) => d.total || d.present + d.absent));
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const step = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((d, i) => [padL + i * step, padT + (1 - d.present / maxY) * innerH] as [number, number]);
  const lineD = points.length
    ? points.reduce((acc, p, i) => acc + (i === 0 ? `M${p[0]},${p[1]}` : ` L${p[0]},${p[1]}`), '')
    : '';
  const areaD = lineD ? `${lineD} L${padL + (data.length - 1) * step},${padT + innerH} L${padL},${padT + innerH} Z` : '';

  // Y ticks
  const ticks = [0, 0.5, 1];
  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <Defs>
          <SLG id="area" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity={0.35} />
            <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
          </SLG>
        </Defs>
        {ticks.map((t, i) => {
          const y = padT + t * innerH;
          return (
            <G key={i}>
              <Line x1={padL} y1={y} x2={W - padR} y2={y} stroke={colors.border} strokeDasharray="4 4" />
              <SvgText x={padL - 8} y={y + 4} fontSize="10" fill={colors.textMuted} textAnchor="end">
                {Math.round(maxY * (1 - t))}
              </SvgText>
            </G>
          );
        })}
        {areaD ? <Path d={areaD} fill="url(#area)" /> : null}
        {lineD ? <Path d={lineD} fill="none" stroke={colors.primary} strokeWidth={2.5} strokeLinejoin="round" /> : null}
        {points.map((p, i) => (
          <Circle key={i} cx={p[0]} cy={p[1]} r={4} fill={colors.white} stroke={colors.primary} strokeWidth={2} />
        ))}
        {data.map((d, i) => (
          <SvgText
            key={d.label + i}
            x={padL + i * step}
            y={H - padB + 18}
            fontSize="10"
            fill={colors.textSecondary}
            textAnchor="middle"
          >
            {d.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

export function BarChartH({ data, height }: { data: { label: string; value: number; color?: string }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={{ gap: 10 }}>
      {data.map((d, i) => (
        <View key={i} style={{ gap: 4 }}>
          <View style={s.row}>
            <Text style={s.label} numberOfLines={1}>{d.label}</Text>
            <Text style={s.value}>{d.value}%</Text>
          </View>
          <View style={s.track}>
            <View style={[s.fill, { width: `${(d.value / max) * 100}%`, backgroundColor: d.color || colors.primary }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 12, color: colors.text, fontWeight: '600', flex: 1 },
  value: { fontSize: 12, color: colors.textSecondary, fontWeight: '700' },
  track: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
