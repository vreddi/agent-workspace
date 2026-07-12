import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { env } from '@/env'
import { modalScreenOptions } from '@/lib/navigation'
import { Font } from '@/theme/fonts'
import { AppThemeProvider, useTheme } from '@/theme/theme-context'

SplashScreen.preventAutoHideAsync()

const convex = new ConvexReactClient(env.convexUrl, {
  unsavedChangesWarning: false,
})

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  })

  if (!fontsLoaded) return null

  // Session tokens are cached in the platform keychain/keystore via
  // expo-secure-store — never in plain AsyncStorage. Only the publishable
  // key (public by design) is baked into the bundle; see src/env.ts.
  return (
    <ClerkProvider
      publishableKey={env.clerkPublishableKey}
      tokenCache={tokenCache}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AppThemeProvider>
          <RootNavigator />
        </AppThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

/**
 * Wires the @org/theme palette into React Navigation so native chrome
 * (headers, back gestures, transitions) matches the app theme, and gates
 * the app behind Clerk: signed out, only /sign-in exists.
 */
function RootNavigator() {
  const { palette, scheme } = useTheme()
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (isLoaded) SplashScreen.hideAsync()
  }, [isLoaded])

  if (!isLoaded) return null

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.accent,
      background: palette.bg,
      card: palette.surface,
      text: palette.ink1,
      border: palette.divider,
      notification: palette.overdue,
    },
  }

  return (
    <ThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.bg },
          headerShadowVisible: false,
          headerTintColor: palette.accent,
          headerTitleStyle: { fontFamily: Font.bold, color: palette.ink1 },
        }}
      >
        <Stack.Protected guard={isSignedIn === true}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="task/[id]" options={{ title: 'Task' }} />
          <Stack.Screen
            name="task/new"
            options={modalScreenOptions('New task')}
          />
          <Stack.Screen
            name="task/[id]/edit"
            options={modalScreenOptions('Edit task')}
          />
          <Stack.Screen name="goal/[id]" options={{ title: 'Goal' }} />
          {/*
            The goals agent registers its own create/edit modals in-route via
            per-screen <Stack.Screen options>; keep this list focused on the
            top-level task routes.
          */}
        </Stack.Protected>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}
