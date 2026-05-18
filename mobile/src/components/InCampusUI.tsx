import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const colors = {
  primary: '#16B978',
  primaryDeep: '#0F9963',
  primarySoft: '#E6F7EF',
  primaryGhost: '#F1FBF6',
  sky: '#4DA3FF',
  skyDeep: '#1E63C8',
  skySoft: '#E8F2FF',
  coral: '#FF6B5F',
  coralDeep: '#C0382E',
  coralSoft: '#FFE9E6',
  yellow: '#FFD166',
  yellowSoft: '#FFF5DB',
  bg: '#F7F8FA',
  card: '#FFFFFF',
  text: '#1F2933',
  text2: '#667085',
  text3: '#98A0AB',
  border: '#E5E7EB',
  borderSoft: '#EEF0F3',
  danger: '#E5484D',
  dangerSoft: '#FDECEC',
};

export const metrics = {
  screenX: 16,
  radius: 18,
  smallRadius: 12,
  stickyMinHeight: 92,
};

const CATEGORY_STYLE: Record<string, { bg: string; fg: string; dot: string }> = {
  Lunch: { bg: '#FFF5DB', fg: '#9A6B00', dot: '#FFD166' },
  Study: { bg: '#E8F2FF', fg: '#1E63C8', dot: '#4DA3FF' },
  'Language Exchange': { bg: '#FFE9E6', fg: '#C0382E', dot: '#FF6B5F' },
  Sports: { bg: '#E6F7EF', fg: '#0F7E54', dot: '#16B978' },
  Sport: { bg: '#E6F7EF', fg: '#0F7E54', dot: '#16B978' },
  Social: { bg: '#F1EBFF', fg: '#5B3FBF', dot: '#9D88F0' },
  Coffee: { bg: '#FFEFE2', fg: '#A4501B', dot: '#FF9E5C' },
};

export function categoryStyle(label?: string) {
  return CATEGORY_STYLE[label ?? ''] ?? { bg: '#EEF0F3', fg: '#37414D', dot: '#667085' };
}

export function CategoryPill({ label, compact = false }: { label: string; compact?: boolean }) {
  const style = categoryStyle(label);
  return (
    <View style={[uiStyles.pill, { backgroundColor: style.bg }, compact && uiStyles.pillCompact]}>
      <View style={[uiStyles.pillDot, { backgroundColor: style.dot }]} />
      <Text style={[uiStyles.pillText, { color: style.fg }]} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export function ModeBadge({ mode }: { mode: 'open' | 'approval_based' }) {
  const isOpen = mode === 'open';
  return (
    <View style={[uiStyles.badge, { backgroundColor: isOpen ? colors.primarySoft : colors.skySoft }]}>
      <Text style={[uiStyles.badgeText, { color: isOpen ? colors.primaryDeep : colors.skyDeep }]}>
        {isOpen ? 'Open' : 'Approval'}
      </Text>
    </View>
  );
}

export function StatusBadge({ status }: { status?: 'open' | 'full' | 'completed' | 'cancelled' }) {
  if (!status || status === 'open') {
    return null;
  }

  const config =
    status === 'full'
      ? { bg: '#FFE2B8', fg: '#7A4A00', label: 'Full' }
      : status === 'cancelled'
        ? { bg: colors.dangerSoft, fg: colors.danger, label: 'Cancelled' }
        : { bg: '#EEF0F3', fg: colors.text2, label: 'Completed' };

  return (
    <View style={[uiStyles.badge, { backgroundColor: config.bg }]}>
      <Text style={[uiStyles.badgeText, { color: config.fg }]}>{config.label}</Text>
    </View>
  );
}

export function SectionCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[uiStyles.card, style]}>{children}</View>;
}

export function InlineBanner({
  tone = 'warning',
  text,
  actionLabel,
  onAction,
}: {
  tone?: 'warning' | 'error' | 'success';
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const palette =
    tone === 'success'
      ? { bg: colors.primaryGhost, border: colors.primarySoft, text: colors.primaryDeep }
      : tone === 'error'
        ? { bg: colors.dangerSoft, border: '#F8C9CB', text: colors.danger }
        : { bg: colors.yellowSoft, border: '#F3D99B', text: '#8A5B00' };

  return (
    <View style={[uiStyles.banner, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={[uiStyles.bannerIcon, { color: palette.text }]}>!</Text>
      <Text style={[uiStyles.bannerText, { color: palette.text }]}>{text}</Text>
      {actionLabel && onAction ? (
        <Pressable style={uiStyles.bannerButton} onPress={onAction}>
          <Text style={uiStyles.bannerButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SkeletonBlock({
  width = '100%',
  height,
  radius = 10,
  style,
}: {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 760,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 760,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: '#E9EDF2',
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  tone = 'green',
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'green' | 'blue' | 'muted' | 'danger';
  style?: StyleProp<ViewStyle>;
}) {
  const backgroundColor =
    tone === 'blue'
      ? colors.sky
      : tone === 'danger'
        ? colors.danger
        : tone === 'muted'
          ? '#D9DEE6'
          : colors.primary;

  return (
    <Pressable
      style={({ pressed }) => [
        uiStyles.primaryButton,
        { backgroundColor, opacity: disabled ? 0.68 : pressed ? 0.86 : 1 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Text style={uiStyles.primaryButtonText}>{loading ? `${label}...` : label}</Text>
    </Pressable>
  );
}

export function BottomSheet({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={uiStyles.scrim} onPress={onClose} />
      <View style={[uiStyles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={uiStyles.sheetHandle} />
        <View style={uiStyles.sheetHeader}>
          <Text style={uiStyles.sheetTitle}>{title}</Text>
          <Pressable style={uiStyles.sheetClose} onPress={onClose}>
            <Text style={uiStyles.sheetCloseText}>x</Text>
          </Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <Text style={uiStyles.fieldError}>{message}</Text>;
}

export function ProgressStrip({ current, max }: { current: number; max: number }) {
  const total = Math.min(Math.max(max, 1), 8);
  const filled = Math.min(current, total);
  return (
    <View style={uiStyles.progressStrip}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            uiStyles.progressDot,
            index < filled ? uiStyles.progressDotFilled : uiStyles.progressDotEmpty,
          ]}
        />
      ))}
    </View>
  );
}

export function TinyIcon({ label, color = colors.text2 }: { label: string; color?: string }) {
  return (
    <View style={[uiStyles.tinyIcon, { borderColor: color }]}>
      <Text style={[uiStyles.tinyIconText, { color }]}>{label}</Text>
    </View>
  );
}

const uiStyles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  pillCompact: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  pillText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: metrics.radius,
    shadowColor: '#101828',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  bannerButton: {
    borderRadius: 10,
    backgroundColor: colors.text,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  bannerButtonText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '800',
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '900',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31,41,51,0.38)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '82%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseText: {
    color: colors.text2,
    fontSize: 17,
    fontWeight: '900',
  },
  fieldError: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  progressStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  progressDotFilled: {
    backgroundColor: colors.primary,
  },
  progressDotEmpty: {
    backgroundColor: colors.border,
  },
  tinyIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tinyIconText: {
    fontSize: 9,
    fontWeight: '900',
  },
});
