import { useSignIn, useSignUp, useSSO } from '@clerk/clerk-expo'
import { radius, space } from '@org/theme'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { House } from 'lucide-react-native'
import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AccentButton, AppText } from '@/components/ui'
import { useTheme } from '@/theme/theme-context'

// Completes pending browser-based SSO redirects (no-op on native cold start).
WebBrowser.maybeCompleteAuthSession()

type ClerkErrorLike = { errors?: { code?: string; longMessage?: string; message?: string }[] }

function clerkErrorMessage(err: unknown, fallback: string): string {
  const first = (err as ClerkErrorLike).errors?.[0]
  return first?.longMessage ?? first?.message ?? fallback
}

/**
 * Native sign-in matching the Clerk instance's enabled strategies:
 * email code (OTP) as the form flow, plus Google / Apple SSO. Sign-up is
 * folded in — an unknown email transparently becomes a sign-up + verify.
 */
export default function SignInScreen() {
  const { palette, scheme } = useTheme()
  const insets = useSafeAreaInsets()
  const { signIn, setActive, isLoaded } = useSignIn()
  const { signUp, setActive: setActiveFromSignUp } = useSignUp()
  const { startSSOFlow } = useSSO()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  // 'email' = collecting the address; 'code' = a code is in their inbox.
  const [stage, setStage] = useState<'email' | 'code'>('email')
  // Whether the code belongs to a sign-in or a fresh sign-up.
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isLoaded) return null

  const sendCode = async () => {
    const address = email.trim().toLowerCase()
    if (!address) return
    setBusy(true)
    setError(null)
    try {
      const attempt = await signIn.create({ identifier: address })
      const factor = attempt.supportedFirstFactors?.find(
        (f) => f.strategy === 'email_code',
      )
      if (!factor || !('emailAddressId' in factor)) {
        throw new Error('Email code sign-in is not available for this account')
      }
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: factor.emailAddressId,
      })
      setMode('sign-in')
      setStage('code')
    } catch (err) {
      if ((err as ClerkErrorLike).errors?.[0]?.code === 'form_identifier_not_found') {
        // New account: same UX, but through the sign-up object.
        try {
          await signUp!.create({ emailAddress: address })
          await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' })
          setMode('sign-up')
          setStage('code')
        } catch (signUpErr) {
          setError(clerkErrorMessage(signUpErr, 'Could not create an account'))
        }
      } else {
        setError(clerkErrorMessage(err, 'Could not send a code'))
      }
    } finally {
      setBusy(false)
    }
  }

  const verifyCode = async () => {
    if (!code.trim()) return
    setBusy(true)
    setError(null)
    try {
      if (mode === 'sign-in') {
        const result = await signIn.attemptFirstFactor({
          strategy: 'email_code',
          code: code.trim(),
        })
        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId })
          return
        }
      } else {
        const result = await signUp!.attemptEmailAddressVerification({ code: code.trim() })
        if (result.status === 'complete') {
          await setActiveFromSignUp!({ session: result.createdSessionId })
          return
        }
      }
      setError('That code did not work — try again')
    } catch (err) {
      setError(clerkErrorMessage(err, 'That code did not work — try again'))
    } finally {
      setBusy(false)
    }
  }

  const signInWithSSO = async (strategy: 'oauth_google' | 'oauth_apple') => {
    setBusy(true)
    setError(null)
    try {
      const { createdSessionId, setActive: setActiveFromSSO } = await startSSOFlow({
        strategy,
        redirectUrl: AuthSession.makeRedirectUri(),
      })
      if (createdSessionId && setActiveFromSSO) {
        await setActiveFromSSO({ session: createdSessionId })
      }
    } catch (err) {
      setError(clerkErrorMessage(err, 'Sign-in was cancelled or failed'))
    } finally {
      setBusy(false)
    }
  }

  const inputStyle = [
    styles.input,
    {
      backgroundColor: palette.surface,
      borderColor: palette.divider,
      color: palette.ink1,
    },
  ]

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: palette.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 72, paddingBottom: insets.bottom + space.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <View style={[styles.brandMark, { backgroundColor: palette.accent }]}>
            <House size={26} color="#ffffff" strokeWidth={2.2} />
          </View>
          <AppText variant="hero" style={{ textAlign: 'center' }}>
            Agent Workspace
          </AppText>
          <AppText variant="label" color={palette.ink2} style={{ textAlign: 'center' }}>
            Your tasks, goals and agents — same account as the web app.
          </AppText>
        </View>

        {stage === 'email' ? (
          <View style={styles.form}>
            <Pressable
              disabled={busy}
              onPress={() => signInWithSSO('oauth_google')}
              style={({ pressed }) => [
                styles.ssoButton,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.divider,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <AppText variant="label">Continue with Google</AppText>
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={() => signInWithSSO('oauth_apple')}
              style={({ pressed }) => [
                styles.ssoButton,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.divider,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <AppText variant="label">Continue with Apple</AppText>
            </Pressable>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: palette.divider }]} />
              <AppText variant="meta" color={palette.ink3}>
                or
              </AppText>
              <View style={[styles.dividerLine, { backgroundColor: palette.divider }]} />
            </View>

            <TextInput
              style={inputStyle}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={palette.ink3}
              autoCapitalize="none"
              autoComplete="email"
              inputMode="email"
              keyboardAppearance={scheme}
              editable={!busy}
              onSubmitEditing={sendCode}
              returnKeyType="go"
            />
            <AccentButton label="Continue with email" onPress={sendCode} />
          </View>
        ) : (
          <View style={styles.form}>
            <AppText variant="label" color={palette.ink2} style={{ textAlign: 'center' }}>
              We emailed a code to {email.trim().toLowerCase()}
            </AppText>
            <TextInput
              style={[...inputStyle, styles.codeInput]}
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor={palette.ink3}
              inputMode="numeric"
              autoComplete="one-time-code"
              keyboardAppearance={scheme}
              editable={!busy}
              onSubmitEditing={verifyCode}
              returnKeyType="go"
              autoFocus
            />
            <AccentButton label="Verify" onPress={verifyCode} />
            <Pressable
              disabled={busy}
              onPress={() => {
                setStage('email')
                setCode('')
                setError(null)
              }}
              style={styles.backLink}
            >
              <AppText variant="meta" color={palette.accentInk}>
                Use a different email
              </AppText>
            </Pressable>
          </View>
        )}

        {busy && <ActivityIndicator color={palette.accent} />}
        {error && (
          <View style={[styles.error, { backgroundColor: palette.overdueSoft }]}>
            <AppText variant="meta" color={palette.overdue}>
              {error}
            </AppText>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: space.xxl,
    gap: space.xxl,
  },
  brand: {
    alignItems: 'center',
    gap: space.md,
  },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  form: {
    gap: space.md,
  },
  ssoButton: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.xs,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    fontSize: 15,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 6,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  error: {
    padding: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
})
