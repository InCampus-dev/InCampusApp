import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
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
      {loading ? <ActivityIndicator color={colors.card} size="small" style={{ marginRight: 8 }} /> : null}
      <Text style={uiStyles.primaryButtonText}>{label}</Text>
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


export function ScreenShell({
  children,
  padded = true,
  style,
}: {
  children: React.ReactNode;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        shellStyles.screen,
        padded && {
          paddingTop: Math.max(insets.top, 18) + 12,
          paddingBottom: Math.max(insets.bottom, 14),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function TopBar({
  title,
  onBack,
  rightLabel,
  onRight,
}: {
  title?: string;
  onBack?: () => void;
  rightLabel?: string;
  onRight?: () => void;
}) {
  return (
    <View style={shellStyles.topBar}>
      <Pressable style={shellStyles.topBarSide} onPress={onBack} disabled={!onBack}>
        {onBack ? <Text style={shellStyles.backGlyph}>{'<'}</Text> : null}
      </Pressable>
      <Text style={shellStyles.topBarTitle} numberOfLines={1}>
        {title ?? ''}
      </Text>
      <Pressable style={shellStyles.topBarRight} onPress={onRight} disabled={!rightLabel}>
        {rightLabel ? <Text style={shellStyles.topBarRightText}>{rightLabel}</Text> : null}
      </Pressable>
    </View>
  );
}

export function BrandHeader() {
  return (
    <View style={shellStyles.brandHeader}>
      <View style={shellStyles.brandMark}>
        <Text style={shellStyles.brandMarkText}>In</Text>
      </View>
      <Text style={shellStyles.brandText}>
        <Text style={{ color: colors.sky }}>In</Text>Campus
      </Text>
    </View>
  );
}

export function TitleBlock({
  title,
  subtitle,
  center,
}: {
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <View style={[shellStyles.titleBlock, center && shellStyles.centeredText]}>
      <Text style={shellStyles.titleText}>{title}</Text>
      {subtitle ? <Text style={shellStyles.subtitleText}>{subtitle}</Text> : null}
    </View>
  );
}

export function TextField({
  label,
  error,
  helper,
  containerStyle,
  right,
  inputStyle,
  ...props
}: TextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: StyleProp<ViewStyle>;
  right?: React.ReactNode;
  inputStyle?: TextInputProps['style'];
}) {
  return (
    <View style={[shellStyles.fieldWrap, containerStyle]}>
      {label ? <Text style={shellStyles.fieldLabel}>{label}</Text> : null}
      <View style={[shellStyles.inputFrame, error && shellStyles.inputFrameError]}>
        <TextInput
          placeholderTextColor={colors.text3}
          style={[shellStyles.input, inputStyle]}
          {...props}
        />
        {right}
      </View>
      {error ? <FieldError message={error} /> : helper ? <Text style={shellStyles.helperText}>{helper}</Text> : null}
    </View>
  );
}

export function PasswordField({
  visible,
  onToggleVisible,
  ...props
}: TextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
  visible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <TextField
      {...props}
      secureTextEntry={!visible}
      right={
        <Pressable style={shellStyles.eyeButton} onPress={onToggleVisible}>
          <Text style={shellStyles.eyeText}>{visible ? 'Hide' : 'Show'}</Text>
        </Pressable>
      }
    />
  );
}

export function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <View style={shellStyles.stepRow}>
      <StepDot active={step === 1} done={step > 1} label="Register" number="1" />
      <View style={[shellStyles.stepLine, step > 1 && shellStyles.stepLineDone]} />
      <StepDot active={step === 2} label="Verify" number="2" />
    </View>
  );
}

function StepDot({
  active,
  done,
  number,
  label,
}: {
  active?: boolean;
  done?: boolean;
  number: string;
  label: string;
}) {
  return (
    <View style={shellStyles.stepItem}>
      <View style={[shellStyles.stepCircle, (active || done) && shellStyles.stepCircleActive]}>
        <Text style={[shellStyles.stepNumber, (active || done) && shellStyles.stepNumberActive]}>
          {done ? 'OK' : number}
        </Text>
      </View>
      <Text style={[shellStyles.stepLabel, active && shellStyles.stepLabelActive]}>{label}</Text>
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  tone = 'green',
  compact,
  disabled,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'green' | 'blue' | 'coral' | 'yellow' | 'muted';
  compact?: boolean;
  disabled?: boolean;
}) {
  const palette = chipTone(tone);
  return (
    <Pressable
      style={[
        shellStyles.chip,
        compact && shellStyles.chipCompact,
        { borderColor: selected ? palette.fg : colors.border, backgroundColor: selected ? palette.bg : colors.card },
        disabled && shellStyles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {selected ? <Text style={[shellStyles.chipCheck, { color: palette.fg }]}>OK</Text> : null}
      <Text style={[shellStyles.chipText, { color: selected ? palette.fg : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function chipTone(tone: 'green' | 'blue' | 'coral' | 'yellow' | 'muted') {
  switch (tone) {
    case 'blue':
      return { bg: colors.skySoft, fg: colors.sky };
    case 'coral':
      return { bg: colors.coralSoft, fg: colors.coral };
    case 'yellow':
      return { bg: colors.yellowSoft, fg: '#8A5B00' };
    case 'muted':
      return { bg: colors.borderSoft, fg: colors.text2 };
    case 'green':
    default:
      return { bg: colors.primarySoft, fg: colors.primary };
  }
}

export function EmptyState({
  icon = 'i',
  title,
  text,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: {
  icon?: string;
  title: string;
  text?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
}) {
  return (
    <View style={shellStyles.emptyCard}>
      <View style={shellStyles.emptyIcon}>
        <Text style={shellStyles.emptyIconText}>{icon}</Text>
      </View>
      <Text style={shellStyles.emptyTitle}>{title}</Text>
      {text ? <Text style={shellStyles.emptyText}>{text}</Text> : null}
      {primaryLabel ? (
        <PrimaryButton label={primaryLabel} onPress={onPrimary} style={shellStyles.emptyPrimary} />
      ) : null}
      {secondaryLabel ? (
        <Pressable style={shellStyles.emptySecondary} onPress={onSecondary}>
          <Text style={shellStyles.emptySecondaryText}>{secondaryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function BottomActionBar({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[shellStyles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>{children}</View>;
}

export function InlineSpinnerButton({
  label,
  loadingLabel,
  loading,
  onPress,
  tone = 'green',
  disabled,
}: {
  label: string;
  loadingLabel?: string;
  loading?: boolean;
  onPress?: () => void;
  tone?: 'green' | 'blue' | 'muted' | 'danger';
  disabled?: boolean;
}) {
  return (
    <PrimaryButton
      label={loading ? (loadingLabel ?? label) : label}
      loading={loading}
      onPress={onPress}
      disabled={disabled}
      tone={tone}
    />
  );
}

export function BottomTabBar({
  active,
  onFeed,
  onCreate,
  onAlerts,
  onMine,
}: {
  active: 'feed' | 'create' | 'alerts' | 'mine';
  onFeed?: () => void;
  onCreate?: () => void;
  onAlerts?: () => void;
  onMine?: () => void;
}) {
  const items = [
    { key: 'feed' as const, label: 'Feed', icon: '≡', onPress: onFeed },
    { key: 'create' as const, label: 'Create', icon: '+', onPress: onCreate },
    { key: 'alerts' as const, label: 'Alerts', icon: '!', onPress: onAlerts },
    { key: 'mine' as const, label: 'Mine', icon: 'o', onPress: onMine },
  ];
  const insets = useSafeAreaInsets();
  return (
    <View style={[shellStyles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {items.map((item) => {
        const selected = active === item.key;
        return (
          <Pressable key={item.key} style={shellStyles.tabItem} onPress={item.onPress}>
            <Text style={[shellStyles.tabIcon, selected && shellStyles.tabActive]}>{item.icon}</Text>
            <Text style={[shellStyles.tabLabel, selected && shellStyles.tabActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function LoadingRows({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, index) => (
        <SectionCard key={index} style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <SkeletonBlock width={42} height={42} radius={12} />
            <View style={{ flex: 1, gap: 9 }}>
              <SkeletonBlock width="68%" height={14} radius={4} />
              <SkeletonBlock width="92%" height={11} radius={4} />
              <SkeletonBlock width="52%" height={11} radius={4} />
            </View>
          </View>
        </SectionCard>
      ))}
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


const shellStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  topBarSide: {
    width: 52,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backGlyph: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  topBarTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  topBarRight: {
    width: 72,
    minHeight: 42,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 8,
  },
  topBarRightText: {
    color: colors.text2,
    fontSize: 14,
    fontWeight: '800',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 22,
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  brandMarkText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '900',
  },
  brandText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  titleBlock: {
    marginBottom: 22,
  },
  centeredText: {
    alignItems: 'center',
  },
  titleText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 33,
  },
  subtitleText: {
    color: colors.text2,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: 8,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  inputFrame: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  inputFrameError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 12,
  },
  helperText: {
    color: colors.text2,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  eyeButton: {
    paddingLeft: 10,
    paddingVertical: 8,
  },
  eyeText: {
    color: colors.sky,
    fontSize: 12,
    fontWeight: '900',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  stepNumber: {
    color: colors.text2,
    fontSize: 10,
    fontWeight: '900',
  },
  stepNumberActive: {
    color: colors.card,
  },
  stepLabel: {
    color: colors.text2,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  stepLabelActive: {
    color: colors.text,
  },
  stepLine: {
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.border,
  },
  stepLineDone: {
    backgroundColor: colors.primary,
  },
  chip: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipCompact: {
    minHeight: 34,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  chipCheck: {
    fontSize: 9,
    fontWeight: '900',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.58,
  },
  emptyCard: {
    borderRadius: metrics.radius,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 22,
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIconText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.text2,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 7,
  },
  emptyPrimary: {
    alignSelf: 'stretch',
    marginTop: 18,
  },
  emptySecondary: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  emptySecondaryText: {
    color: colors.text2,
    fontSize: 14,
    fontWeight: '900',
  },
  bottomBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    paddingHorizontal: 16,
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 14,
    elevation: 5,
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    gap: 2,
    minWidth: 64,
  },
  tabIcon: {
    color: colors.text3,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22,
  },
  tabLabel: {
    color: colors.text3,
    fontSize: 10,
    fontWeight: '900',
  },
  tabActive: {
    color: colors.primary,
  },
});

