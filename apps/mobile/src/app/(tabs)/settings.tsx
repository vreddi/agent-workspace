import { useClerk, useUser } from '@clerk/clerk-expo'
import { radius, space } from '@org/theme'
import Constants from 'expo-constants'
import { Image, Pressable, StyleSheet, Switch, View } from 'react-native'
import { Screen, ScreenHeader } from '@/components/screen'
import { AppText, Card, SectionLabel } from '@/components/ui'
import { useLocalPreference } from '@/lib/preferences'
import { useTheme, type ThemePreference } from '@/theme/theme-context'

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

function SettingsRow({
  label,
  detail,
  right,
  divider,
}: {
  label: string
  detail?: string
  right?: React.ReactNode
  divider?: boolean
}) {
  const { palette } = useTheme()
  return (
    <View
      style={[
        styles.row,
        divider && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: palette.divider,
        },
      ]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="body">{label}</AppText>
        {detail ? (
          <AppText variant="meta" color={palette.ink3}>
            {detail}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  )
}

export default function SettingsScreen() {
  const { palette, preference, setPreference } = useTheme()
  const { user } = useUser()
  const { signOut } = useClerk()
  const [reminders, setReminders] = useLocalPreference('reminders', true)

  const fullName =
    user?.fullName ??
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ??
    'You'
  const email = user?.primaryEmailAddress?.emailAddress

  return (
    <Screen>
      <ScreenHeader title="Settings" />

      <View>
        <SectionLabel>Account</SectionLabel>
        <Card>
          <View style={styles.profile}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#18a86b' }]}>
                <AppText variant="heading" color="#ffffff">
                  {(fullName.trim()[0] ?? 'Y').toUpperCase()}
                </AppText>
              </View>
            )}
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="body" numberOfLines={1}>
                {fullName.trim() || email || 'You'}
              </AppText>
              {email ? (
                <AppText variant="meta" color={palette.ink3} numberOfLines={1}>
                  {email}
                </AppText>
              ) : null}
            </View>
          </View>
          <Pressable
            onPress={() => void signOut()}
            style={({ pressed }) => [
              styles.signOut,
              {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: palette.divider,
                backgroundColor: pressed ? palette.hover : 'transparent',
              },
            ]}
          >
            <AppText variant="label" color={palette.overdue}>
              Sign out
            </AppText>
          </Pressable>
        </Card>
      </View>

      <View>
        <SectionLabel>Appearance</SectionLabel>
        <Card>
          <SettingsRow
            label="Theme"
            detail="Follows your device by default"
            right={
              <View
                style={[styles.segment, { backgroundColor: palette.chipBg }]}
              >
                {THEME_OPTIONS.map((option) => {
                  const active = preference === option.value
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setPreference(option.value)}
                      style={[
                        styles.segmentButton,
                        active && { backgroundColor: palette.surface },
                      ]}
                    >
                      <AppText
                        variant="meta"
                        color={active ? palette.ink1 : palette.ink2}
                      >
                        {option.label}
                      </AppText>
                    </Pressable>
                  )
                })}
              </View>
            }
          />
        </Card>
      </View>

      <View>
        <SectionLabel>Notifications</SectionLabel>
        <Card>
          <SettingsRow
            label="Agent reminders"
            detail="Let agents nudge you about due tasks"
            right={
              <Switch
                value={reminders}
                onValueChange={setReminders}
                trackColor={{ true: palette.accent }}
              />
            }
          />
        </Card>
      </View>

      <View>
        <SectionLabel>About</SectionLabel>
        <Card>
          <SettingsRow
            label="Version"
            right={
              <AppText variant="meta" color={palette.ink3}>
                {Constants.expoConfig?.version ?? 'dev'}
              </AppText>
            }
          />
          <SettingsRow
            divider
            label="Agent Workspace"
            detail="Task management with a pixel-village twist"
          />
        </Card>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  signOut: {
    padding: space.lg,
    alignItems: 'center',
  },
  segment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.sm,
    gap: 2,
  },
  segmentButton: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
