/**
 * Native form kit for create/edit screens. All components are controlled —
 * they render the value you pass and call back on change; they hold no domain
 * state of their own (only ephemeral UI state like an open picker sheet).
 *
 * Styling comes straight from @org/theme via useTheme(), matching the app's
 * soft-white cards, chips, and buttons (see src/components/ui.tsx). Rows are
 * meant to sit inside a FormSection, which draws the hairline dividers.
 *
 * Intended shell: a FormScreen inside an expo-router modal (see
 * src/lib/navigation.ts) with FooterButton(s) in the sticky footer.
 */
import { radius, space } from '@org/theme'
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import * as Haptics from 'expo-haptics'
import { Check, ChevronDown, Minus, Plus, X } from 'lucide-react-native'
import { Children, Fragment, useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText, Card, Chip, SectionLabel } from '@/components/ui'
import { Font } from '@/theme/fonts'
import { useTheme } from '@/theme/theme-context'

// ---------------------------------------------------------------------------
// Layout: screen + section
// ---------------------------------------------------------------------------

/**
 * Scrollable form shell for modal screens: app background, safe-area padding,
 * keyboard avoidance, and an optional sticky footer for submit buttons.
 */
export function FormScreen({
  children,
  footer,
  contentStyle,
}: {
  children: ReactNode
  /** Rendered pinned to the bottom, above the keyboard (e.g. FooterButtons). */
  footer?: ReactNode
  contentStyle?: StyleProp<ViewStyle>
}) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: palette.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.formContent,
          { paddingBottom: space.xxxl },
          contentStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: palette.bg,
              borderTopColor: palette.divider,
              paddingBottom: Math.max(insets.bottom, space.md),
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  )
}

/** Grouped card of rows with an optional overline label. */
export function FormSection({
  label,
  children,
  style,
}: {
  label?: string
  children: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const items = Children.toArray(children).filter(Boolean)
  return (
    <View style={style}>
      {label ? <SectionLabel>{label}</SectionLabel> : null}
      <Card>
        {items.map((child, index) => (
          <Fragment key={index}>
            {index > 0 ? <RowDivider /> : null}
            {child}
          </Fragment>
        ))}
      </Card>
    </View>
  )
}

function RowDivider() {
  const { palette } = useTheme()
  return (
    <View style={[styles.rowDivider, { backgroundColor: palette.divider }]} />
  )
}

// ---------------------------------------------------------------------------
// Text fields
// ---------------------------------------------------------------------------

/** Label on the left, single-line input aligned right. */
export function TextFieldRow({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  editable = true,
}: {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  keyboardType?: KeyboardTypeOptions
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  editable?: boolean
}) {
  const { palette } = useTheme()
  return (
    <View style={styles.row}>
      <AppText variant="label" color={palette.ink2}>
        {label}
      </AppText>
      <TextInput
        style={[styles.input, styles.inputInline, { color: palette.ink1 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.ink3}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
      />
    </View>
  )
}

/** Label on top, multi-line input below, full width. */
export function MultilineFieldRow({
  label,
  value,
  onChangeText,
  placeholder,
  minHeight = 88,
}: {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  minHeight?: number
}) {
  const { palette } = useTheme()
  return (
    <View style={styles.stackedRow}>
      <AppText variant="label" color={palette.ink2}>
        {label}
      </AppText>
      <TextInput
        style={[
          styles.input,
          styles.inputMultiline,
          { color: palette.ink1, minHeight },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.ink3}
        multiline
        textAlignVertical="top"
      />
    </View>
  )
}

// ---------------------------------------------------------------------------
// Select (option sheet)
// ---------------------------------------------------------------------------

export interface SelectOption<T extends string | number> {
  label: string
  value: T
  /** Optional leading glyph (e.g. a lucide icon). */
  icon?: ReactNode
  /** Optional leading color dot (e.g. priority hue). */
  color?: string
}

/** Label + current value; taps open a bottom sheet of options with checkmarks. */
export function SelectRow<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
}: {
  label: string
  value: T | null
  options: SelectOption<T>[]
  onChange: (value: T) => void
  placeholder?: string
}) {
  const { palette } = useTheme()
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value) ?? null

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: pressed ? palette.hover : 'transparent' },
        ]}
        onPress={() => setOpen(true)}
      >
        <AppText variant="label" color={palette.ink2}>
          {label}
        </AppText>
        <View style={styles.rowValue}>
          {selected?.color ? (
            <View style={[styles.dot, { backgroundColor: selected.color }]} />
          ) : null}
          {selected?.icon}
          <AppText
            variant="label"
            color={selected ? palette.ink1 : palette.ink3}
          >
            {selected?.label ?? placeholder}
          </AppText>
          <ChevronDown size={16} color={palette.ink3} />
        </View>
      </Pressable>

      <OptionSheet
        title={label}
        open={open}
        onClose={() => setOpen(false)}
        options={options}
        value={value}
        onSelect={(next) => {
          onChange(next)
          setOpen(false)
        }}
      />
    </>
  )
}

function OptionSheet<T extends string | number>({
  title,
  open,
  onClose,
  options,
  value,
  onSelect,
}: {
  title: string
  open: boolean
  onClose: () => void
  options: SelectOption<T>[]
  value: T | null
  onSelect: (value: T) => void
}) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: palette.surface,
              borderColor: palette.divider,
              paddingBottom: Math.max(insets.bottom, space.md),
            },
          ]}
          // Swallow taps so touching the sheet doesn't dismiss it.
          onPress={() => {}}
        >
          <View style={styles.sheetHandleWrap}>
            <View
              style={[styles.sheetHandle, { backgroundColor: palette.ink4 }]}
            />
          </View>
          <AppText variant="heading" style={styles.sheetTitle}>
            {title}
          </AppText>
          <ScrollView style={styles.sheetList} bounces={false}>
            {options.map((option, index) => {
              const active = option.value === value
              return (
                <Pressable
                  key={String(option.value)}
                  onPress={() => onSelect(option.value)}
                  style={({ pressed }) => [
                    styles.optionRow,
                    index > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: palette.divider,
                    },
                    {
                      backgroundColor: pressed ? palette.hover : 'transparent',
                    },
                  ]}
                >
                  {option.color ? (
                    <View
                      style={[styles.dot, { backgroundColor: option.color }]}
                    />
                  ) : null}
                  {option.icon}
                  <AppText
                    variant="body"
                    color={active ? palette.ink1 : palette.ink2}
                    style={styles.flex}
                  >
                    {option.label}
                  </AppText>
                  {active ? <Check size={18} color={palette.accent} /> : null}
                </Pressable>
              )
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Date / time
// ---------------------------------------------------------------------------

/** Label + date (optionally time) value; taps open the platform picker. */
export function DateFieldRow({
  label,
  value,
  onChange,
  mode = 'date',
  placeholder = 'Not set',
  minimumDate,
  maximumDate,
}: {
  label: string
  value: Date | null
  onChange: (value: Date | null) => void
  mode?: 'date' | 'datetime'
  placeholder?: string
  minimumDate?: Date
  maximumDate?: Date
}) {
  const { palette } = useTheme()
  const [iosOpen, setIosOpen] = useState(false)
  const [draft, setDraft] = useState<Date>(value ?? new Date())

  const openPicker = () => {
    if (Platform.OS === 'android') {
      openAndroidPicker({
        value: value ?? new Date(),
        mode,
        minimumDate,
        maximumDate,
        onChange,
      })
      return
    }
    setDraft(value ?? new Date())
    setIosOpen(true)
  }

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: pressed ? palette.hover : 'transparent' },
        ]}
        onPress={openPicker}
      >
        <AppText variant="label" color={palette.ink2}>
          {label}
        </AppText>
        <View style={styles.rowValue}>
          <AppText variant="label" color={value ? palette.ink1 : palette.ink3}>
            {value ? formatValue(value, mode) : placeholder}
          </AppText>
          {value ? (
            <Pressable hitSlop={8} onPress={() => onChange(null)}>
              <X size={16} color={palette.ink3} />
            </Pressable>
          ) : (
            <ChevronDown size={16} color={palette.ink3} />
          )}
        </View>
      </Pressable>

      {/* iOS: inline spinner inside a bottom sheet with Clear / Done. */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={iosOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIosOpen(false)}
        >
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)}>
            <Pressable
              style={[
                styles.sheet,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.divider,
                },
              ]}
              onPress={() => {}}
            >
              <View style={styles.sheetActions}>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    onChange(null)
                    setIosOpen(false)
                  }}
                >
                  <AppText variant="label" color={palette.ink3}>
                    Clear
                  </AppText>
                </Pressable>
                <AppText variant="label">{label}</AppText>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    onChange(draft)
                    setIosOpen(false)
                  }}
                >
                  <AppText variant="label" color={palette.accent}>
                    Done
                  </AppText>
                </Pressable>
              </View>
              <DateTimePicker
                value={draft}
                mode={mode}
                display="spinner"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onChange={(_event: DateTimePickerEvent, date?: Date) => {
                  if (date) setDraft(date)
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
  )
}

/**
 * Android shows pickers imperatively as dialogs. For datetime we chain a date
 * dialog into a time dialog, then emit the combined value.
 */
function openAndroidPicker({
  value,
  mode,
  minimumDate,
  maximumDate,
  onChange,
}: {
  value: Date
  mode: 'date' | 'datetime'
  minimumDate?: Date
  maximumDate?: Date
  onChange: (value: Date | null) => void
}) {
  DateTimePickerAndroid.open({
    value,
    mode: 'date',
    minimumDate,
    maximumDate,
    onChange: (event: DateTimePickerEvent, date?: Date) => {
      if (event.type !== 'set' || !date) return
      if (mode === 'date') {
        onChange(date)
        return
      }
      DateTimePickerAndroid.open({
        value: date,
        mode: 'time',
        onChange: (timeEvent: DateTimePickerEvent, time?: Date) => {
          if (timeEvent.type !== 'set' || !time) return
          const combined = new Date(date)
          combined.setHours(time.getHours(), time.getMinutes(), 0, 0)
          onChange(combined)
        },
      })
    },
  })
}

function formatValue(date: Date, mode: 'date' | 'datetime'): string {
  const day = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  if (mode === 'date') return day
  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${day}, ${time}`
}

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

/** Numeric value with -/+ steppers. Haptic tick on each press. */
export function StepperRow({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  unit,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  /** Suffix after the number, e.g. "min" or "days". */
  unit?: string
}) {
  const { palette } = useTheme()
  const clamp = (next: number) => Math.min(max, Math.max(min, next))
  const bump = (delta: number) => {
    const next = clamp(value + delta)
    if (next === value) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange(next)
  }
  const atMin = value <= min
  const atMax = value >= max

  return (
    <View style={styles.row}>
      <AppText variant="label" color={palette.ink2}>
        {label}
      </AppText>
      <View style={styles.stepper}>
        <StepperButton
          icon={<Minus size={16} color={atMin ? palette.ink4 : palette.ink1} />}
          disabled={atMin}
          onPress={() => bump(-step)}
        />
        <AppText variant="label" style={styles.stepperValue}>
          {unit ? `${value} ${unit}` : String(value)}
        </AppText>
        <StepperButton
          icon={<Plus size={16} color={atMax ? palette.ink4 : palette.ink1} />}
          disabled={atMax}
          onPress={() => bump(step)}
        />
      </View>
    </View>
  )
}

function StepperButton({
  icon,
  disabled,
  onPress,
}: {
  icon: ReactNode
  disabled?: boolean
  onPress: () => void
}) {
  const { palette } = useTheme()
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stepperButton,
        { backgroundColor: palette.chipBg, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      {icon}
    </Pressable>
  )
}

// ---------------------------------------------------------------------------
// Checkbox
// ---------------------------------------------------------------------------

/** Single boolean row with a tappable checkbox and optional helper line. */
export function CheckboxRow({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
  /** Optional secondary line under the label. */
  hint?: string
}) {
  const { palette } = useTheme()
  const toggle = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange(!value)
  }
  return (
    <Pressable
      style={styles.row}
      onPress={toggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
    >
      <View style={styles.flex}>
        <AppText variant="label" color={palette.ink2}>
          {label}
        </AppText>
        {hint ? (
          <AppText variant="meta" color={palette.ink3}>
            {hint}
          </AppText>
        ) : null}
      </View>
      <View
        style={[
          styles.checkboxBox,
          {
            borderColor: value ? palette.accent : palette.ink4,
            backgroundColor: value ? palette.accent : 'transparent',
          },
        ]}
      >
        {value ? <Check size={14} color={palette.surface} /> : null}
      </View>
    </Pressable>
  )
}

// ---------------------------------------------------------------------------
// Chip group
// ---------------------------------------------------------------------------

export interface ChipOption<T extends string | number> {
  label: string
  value: T
}

/** Horizontal single-select chip row for enums (priority, status, ...). */
export function ChipRowGroup<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string
  value: T | null
  options: ChipOption<T>[]
  onChange: (value: T) => void
}) {
  const { palette } = useTheme()
  return (
    <View style={styles.stackedRow}>
      {label ? (
        <AppText variant="label" color={palette.ink2}>
          {label}
        </AppText>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        keyboardShouldPersistTaps="handled"
      >
        {options.map((option) => (
          <Chip
            key={String(option.value)}
            label={option.label}
            selected={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Show a native destructive-confirm alert. Runs `onConfirm` only if the user
 * taps the destructive action.
 */
export function confirmDestructive({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
}: {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
}) {
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ])
}

/** Full-width footer action button with a haptic on press. */
export function FooterButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: {
  label: string
  onPress: () => void
  variant?: 'primary' | 'destructive'
  disabled?: boolean
  loading?: boolean
}) {
  const { palette } = useTheme()
  const background =
    variant === 'destructive' ? palette.overdue : palette.accent
  const blocked = disabled || loading
  return (
    <Pressable
      disabled={blocked}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        onPress()
      }}
      style={({ pressed }) => [
        styles.footerButton,
        {
          backgroundColor: background,
          opacity: blocked ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text style={styles.footerButtonLabel as StyleProp<TextStyle>}>
          {label}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  formContent: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    gap: space.lg,
  },
  footer: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingHorizontal: space.lg,
    minHeight: 52,
    paddingVertical: space.sm,
  },
  stackedRow: {
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
  },
  rowValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    flexShrink: 1,
  },
  input: {
    fontSize: 15,
    fontFamily: Font.semibold,
  },
  inputInline: {
    flex: 1,
    textAlign: 'right',
  },
  inputMultiline: {
    textAlign: 'left',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space.sm,
    paddingHorizontal: space.lg,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
  },
  sheetTitle: {
    paddingHorizontal: space.xs,
    paddingBottom: space.sm,
  },
  sheetList: {
    maxHeight: 360,
  },
  sheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    paddingHorizontal: space.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.xs,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  stepperValue: {
    minWidth: 56,
    textAlign: 'center',
  },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    gap: space.sm,
    paddingVertical: 2,
  },
  footerButton: {
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonLabel: {
    color: '#ffffff',
    fontFamily: Font.bold,
    fontSize: 15,
  },
})
