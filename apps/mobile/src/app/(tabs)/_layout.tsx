import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { Platform } from 'react-native'
import { useTheme } from '@/theme/theme-context'

/**
 * Native bottom tabs (UITabBar / Material bottom navigation — liquid glass
 * on iOS 26). On iOS we leave the background to the system material and
 * only set the tint; Android gets themed surface + indicator colors.
 */
export default function TabsLayout() {
  const { palette } = useTheme()

  return (
    <NativeTabs
      tintColor={palette.accent}
      iconColor={palette.ink3}
      labelStyle={{
        default: { color: palette.ink3 },
        selected: { color: palette.accent },
      }}
      backgroundColor={Platform.OS === 'ios' ? undefined : palette.surface}
      indicatorColor={palette.accentSoft}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/today.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tasks">
        <NativeTabs.Trigger.Label>Tasks</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/tasks.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="goals">
        <NativeTabs.Trigger.Label>Goals</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/goals.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="agents">
        <NativeTabs.Trigger.Label>Agents</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/agents.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/settings.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
