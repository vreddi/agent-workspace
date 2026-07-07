/**
 * Native UI primitives for the app, styled from @org/theme so mobile and
 * web share one look. This is the React Native counterpart of @org/ui —
 * real views, not shadcn/webviews.
 */
import { fontSize, letterSpacingEm, radius, space, tracking } from '@org/theme'
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import type { ReactNode } from 'react'
import { Font } from '@/theme/fonts'
import { useTheme } from '@/theme/theme-context'

/** Extra scroll padding so content clears the floating native tab bar. */
export const BottomTabInset = Platform.select({ ios: 56, android: 84 }) ?? 0

type TextVariant = 'hero' | 'title' | 'heading' | 'body' | 'label' | 'meta' | 'caption'

const TEXT_VARIANTS: Record<TextVariant, TextStyle> = {
  hero: {
    fontSize: 28,
    fontFamily: Font.extrabold,
    letterSpacing: tracking(28, letterSpacingEm.tightest),
    lineHeight: 34,
  },
  title: {
    fontSize: fontSize.xl,
    fontFamily: Font.extrabold,
    letterSpacing: tracking(fontSize.xl, letterSpacingEm.tightest),
  },
  heading: {
    fontSize: fontSize.lg,
    fontFamily: Font.extrabold,
    letterSpacing: tracking(fontSize.lg, letterSpacingEm.tighter),
  },
  body: {
    fontSize: fontSize.base,
    fontFamily: Font.semibold,
    letterSpacing: tracking(fontSize.base, letterSpacingEm.tight),
  },
  label: {
    fontSize: fontSize.md,
    fontFamily: Font.semibold,
    letterSpacing: tracking(fontSize.md, letterSpacingEm.tight),
  },
  meta: {
    fontSize: fontSize.sm,
    fontFamily: Font.semibold,
  },
  caption: {
    fontSize: fontSize.xs,
    fontFamily: Font.bold,
    letterSpacing: tracking(fontSize.xs, letterSpacingEm.wider),
    textTransform: 'uppercase',
  },
}

export function AppText({
  variant = 'body',
  color,
  style,
  numberOfLines,
  children,
}: {
  variant?: TextVariant
  /** Palette ink level; defaults to ink1 (ink2/ink3 for meta/caption). */
  color?: string
  style?: StyleProp<TextStyle>
  numberOfLines?: number
  children: ReactNode
}) {
  const { palette } = useTheme()
  const fallback =
    variant === 'caption' ? palette.ink3 : variant === 'meta' ? palette.ink2 : palette.ink1
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[TEXT_VARIANTS[variant], { color: color ?? fallback }, style]}
    >
      {children}
    </Text>
  )
}

/** Elevated surface card matching the web `.t-office` chrome. */
export function Card({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const { palette, scheme } = useTheme()
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.divider,
          boxShadow:
            scheme === 'dark'
              ? '0 4px 14px -6px rgba(0, 0, 0, 0.35)'
              : '0 4px 14px -6px rgba(30, 28, 22, 0.07)',
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

/** Uppercase overline used above sections, like the web `.t-palette__label`. */
export function SectionLabel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.sectionLabel, style]}>
      <AppText variant="caption">{children}</AppText>
    </View>
  )
}

/** Selectable filter chip, mirroring the web segmented/chip controls. */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected?: boolean
  onPress?: () => void
}) {
  const { palette } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? palette.accentSoft : palette.chipBg,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <AppText variant="meta" color={selected ? palette.accentInk : palette.ink2}>
        {label}
      </AppText>
    </Pressable>
  )
}

/** Filled accent button (`.t-btn-create`). */
export function AccentButton({
  label,
  onPress,
  style,
}: {
  label: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const { palette } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.accentButton,
        { backgroundColor: palette.accent, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[TEXT_VARIANTS.label, { color: '#ffffff', fontFamily: Font.bold }]}>
        {label}
      </Text>
    </Pressable>
  )
}

/** Squared avatar with initial, like the web brand/agent marks. */
export function AgentAvatar({ color, initial, size = 40 }: { color: string; initial: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: '#ffffff',
          fontFamily: Font.extrabold,
          fontSize: size * 0.45,
        }}
      >
        {initial}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  sectionLabel: {
    paddingHorizontal: space.sm,
    marginBottom: space.sm,
  },
  chip: {
    height: 32,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentButton: {
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
})
