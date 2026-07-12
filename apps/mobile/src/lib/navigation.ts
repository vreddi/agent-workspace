/**
 * Shared expo-router Stack.Screen option presets. Keeping these in one place
 * means the upcoming create/edit form screens present consistently.
 *
 * Usage in a Stack (see src/app/_layout.tsx):
 *
 *   <Stack.Screen name="task/new" options={modalScreenOptions('New task')} />
 *
 * `modalScreenOptions` slides a screen up from the bottom as a dismissable
 * modal — the right container for the form kit in src/components/forms.tsx.
 * On iOS it renders the native card modal; on Android it uses a
 * bottom-slide transition.
 */

interface StackScreenOptions {
  presentation?: 'card' | 'modal' | 'transparentModal' | 'containedModal' | 'fullScreenModal' | 'formSheet'
  animation?: 'default' | 'slide_from_bottom' | 'slide_from_right' | 'fade' | 'none'
  title?: string
  headerShown?: boolean
  gestureEnabled?: boolean
}

/** Standard dismissable modal (slides up), optionally titled. */
export function modalScreenOptions(title?: string): StackScreenOptions {
  return {
    presentation: 'modal',
    animation: 'slide_from_bottom',
    gestureEnabled: true,
    ...(title ? { title } : {}),
  }
}

/**
 * A modal with no header — for forms that render their own title/close in the
 * FormScreen body. Pair with a FooterButton for the primary action.
 */
export function headerlessModalScreenOptions(): StackScreenOptions {
  return {
    presentation: 'modal',
    animation: 'slide_from_bottom',
    headerShown: false,
    gestureEnabled: true,
  }
}
