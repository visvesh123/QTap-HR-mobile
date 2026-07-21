import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, clay, radii, shadow, spacing, typo } from '../theme';

export type AppAlertVariant = 'warning' | 'error' | 'info' | 'success';

export type AppAlertConfig = {
  title: string;
  message: string;
  variant?: AppAlertVariant;
  confirmLabel?: string;
  onConfirm?: () => void;
};

const VARIANT_META: Record<
  AppAlertVariant,
  { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; bg: string }
> = {
  warning: { icon: 'alert-circle-outline', color: '#D97706', bg: '#FEF3C7' },
  error: { icon: 'close-circle-outline', color: colors.primary, bg: colors.clayPink },
  info: { icon: 'information-outline', color: colors.info, bg: colors.claySky },
  success: { icon: 'check-circle-outline', color: colors.success, bg: colors.clayMint },
};

let presentAlert: ((config: AppAlertConfig) => void) | null = null;

/** Show a styled in-app alert (falls back to no-op if provider is not mounted). */
export function showAppAlert(config: AppAlertConfig) {
  presentAlert?.(config);
}

function AppAlertModal({
  config,
  onClose,
}: {
  config: AppAlertConfig;
  onClose: () => void;
}) {
  const variant = config.variant ?? 'info';
  const meta = VARIANT_META[variant];
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.96, duration: 120, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        config.onConfirm?.();
        onClose();
      }
    });
  }, [config, onClose, opacity, scale]);

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss}>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityRole="button" />
        <Animated.View style={[styles.card, clay.surface as any, { transform: [{ scale }] }]}>
          <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
            <MaterialCommunityIcons name={meta.icon} size={34} color={meta.color} />
          </View>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.message}>{config.message}</Text>
          <TouchableOpacity activeOpacity={0.88} onPress={dismiss} style={styles.btnWrap}>
            <LinearGradient
              colors={[colors.primaryDark, colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>{config.confirmLabel ?? 'Got it'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AppAlertConfig | null>(null);

  useEffect(() => {
    presentAlert = (config) => setAlert(config);
    return () => {
      presentAlert = null;
    };
  }, []);

  return (
    <>
      {children}
      {alert ? (
        <AppAlertModal config={alert} onClose={() => setAlert(null)} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 42, 51, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: radii.clayLg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: 'center',
    ...shadow.cardHeavy,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typo.h3,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typo.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  btnWrap: {
    width: '100%',
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  btn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
