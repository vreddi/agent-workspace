import { space } from '@org/theme'
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ReactNode } from 'react'
import { AppText, BottomTabInset } from '@/components/ui'
import { useTheme } from '@/theme/theme-context'

/**
 * Scrollable tab screen: app background, safe-area top padding, and bottom
 * padding so content clears the floating native tab bar.
 */
export function Screen({
  children,
  style,
}: {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            // On web NativeTabs renders as a top bar with no safe-area
            // inset, so give content room to clear it.
            paddingTop:
              insets.top + (Platform.OS === 'web' ? 72 : 0) + space.md,
            paddingBottom: BottomTabInset + space.xxxl,
          },
          style,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  )
}

/** Centered spinner for screens waiting on their first Convex snapshot. */
export function ScreenLoading() {
  const { palette } = useTheme()
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={palette.accent} />
    </View>
  )
}

/** Screen title row: big heading + optional count, like the web `.t-page-head`. */
export function ScreenHeader({
  title,
  meta,
}: {
  title: string
  meta?: string
}) {
  const { palette } = useTheme()
  return (
    <View style={styles.header}>
      <AppText variant="title">{title}</AppText>
      {meta ? (
        <AppText variant="meta" color={palette.ink3}>
          {meta}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.lg,
    gap: space.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.md,
    paddingHorizontal: space.sm,
    paddingTop: space.sm,
    paddingBottom: space.xs,
  },
  loading: {
    paddingVertical: space.xxxl,
    alignItems: 'center',
  },
})
