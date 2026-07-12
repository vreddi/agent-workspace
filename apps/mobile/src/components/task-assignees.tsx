/**
 * Assignee list + management sheet for a task detail screen. Shows tone-tinted
 * avatars for everyone on the task; the creator can open a search sheet to add
 * or remove people (applied through api.taskAssignments.setAssignees).
 */
import type { Id } from '@convex/_generated/dataModel'
import type { TaskAssignee } from '@convex/tasks'
import { radius, space } from '@org/theme'
import {
  initialsFromName,
  TONE_STYLES,
  toneFor,
  type Tone,
} from '@org/app-core'
import * as Haptics from 'expo-haptics'
import { Check, Search, UserPlus, X } from 'lucide-react-native'
import { useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText, Card, SectionLabel } from '@/components/ui'
import { useSetAssignees, useUserSearch } from '@/data/tasks-data'
import { Font } from '@/theme/fonts'
import { useTheme } from '@/theme/theme-context'

// The shared TONE_STYLES uses CSS gradients (web only); on native we render a
// flat fill per tone. Values are the darker stop of each web gradient.
const TONE_SOLID: Record<Tone, string> = {
  sand: '#f6a86b',
  sage: '#7cc78a',
  clay: '#f08f70',
  fog: '#7ea2f5',
  rose: '#f48cb5',
  slate: '#9a9dc7',
  graphite: '#3a3d4a',
}

function Avatar({
  userId,
  name,
  size = 34,
}: {
  userId: string
  name: string
  size?: number
}) {
  const tone = toneFor(userId)
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        backgroundColor: TONE_SOLID[tone],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText
        variant="meta"
        color={TONE_STYLES[tone].fg}
        style={{ fontFamily: Font.extrabold, fontSize: size * 0.4 }}
      >
        {initialsFromName(name)}
      </AppText>
    </View>
  )
}

type Selected = { userId: Id<'users'>; name: string; email: string }

export function TaskAssigneesSection({
  taskId,
  assignees,
  viewerId,
  viewerIsCreator,
}: {
  taskId: Id<'tasks'>
  assignees: TaskAssignee[]
  viewerId: Id<'users'>
  viewerIsCreator: boolean
}) {
  const { palette } = useTheme()
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <View>
      <SectionLabel>Assignees</SectionLabel>
      <Card>
        {assignees.map((a, i) => {
          const label = a.name.trim() || a.email
          return (
            <View
              key={a.userId}
              style={[
                styles.personRow,
                i > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: palette.divider,
                },
              ]}
            >
              <Avatar userId={a.userId} name={label} />
              <View style={styles.personText}>
                <AppText variant="label" numberOfLines={1}>
                  {label}
                </AppText>
                <AppText variant="meta" color={palette.ink3} numberOfLines={1}>
                  {a.userId === viewerId ? 'You' : a.email}
                </AppText>
              </View>
            </View>
          )
        })}
        {viewerIsCreator ? (
          <Pressable
            onPress={() => setSheetOpen(true)}
            style={({ pressed }) => [
              styles.manageRow,
              {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: palette.divider,
                backgroundColor: pressed ? palette.hover : 'transparent',
              },
            ]}
          >
            <UserPlus size={18} color={palette.accent} />
            <AppText variant="label" color={palette.accent}>
              Manage assignees
            </AppText>
          </Pressable>
        ) : null}
      </Card>

      {viewerIsCreator ? (
        <ManageSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          taskId={taskId}
          initial={assignees.map((a) => ({
            userId: a.userId,
            name: a.name.trim() || a.email,
            email: a.email,
          }))}
        />
      ) : null}
    </View>
  )
}

function ManageSheet({
  open,
  onClose,
  taskId,
  initial,
}: {
  open: boolean
  onClose: () => void
  taskId: Id<'tasks'>
  initial: Selected[]
}) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const setAssignees = useSetAssignees()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Selected[]>(initial)
  const [saving, setSaving] = useState(false)
  const results = useUserSearch(query)

  // Re-seed the selection each time the sheet opens.
  const [wasOpen, setWasOpen] = useState(false)
  if (open && !wasOpen) {
    setWasOpen(true)
    setSelected(initial)
    setQuery('')
  }
  if (!open && wasOpen) setWasOpen(false)

  const toggle = (item: Selected) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelected((prev) =>
      prev.some((s) => s.userId === item.userId)
        ? prev.filter((s) => s.userId !== item.userId)
        : prev.length >= 10
          ? prev
          : [...prev, item],
    )
  }

  const apply = () => {
    if (saving || selected.length === 0) return
    setSaving(true)
    setAssignees(
      taskId,
      selected.map((s) => s.userId),
    )
      .then(() => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setSaving(false)
        onClose()
      })
      .catch(() => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        setSaving(false)
      })
  }

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
          onPress={() => {}}
        >
          <View style={styles.sheetHandleWrap}>
            <View
              style={[styles.sheetHandle, { backgroundColor: palette.ink4 }]}
            />
          </View>
          <AppText variant="heading" style={styles.sheetTitle}>
            Assignees
          </AppText>

          {selected.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              keyboardShouldPersistTaps="handled"
            >
              {selected.map((s) => (
                <Pressable
                  key={s.userId}
                  onPress={() => toggle(s)}
                  style={[
                    styles.selChip,
                    { backgroundColor: palette.accentSoft },
                  ]}
                >
                  <AppText variant="meta" color={palette.accentInk}>
                    {s.name}
                  </AppText>
                  <X size={13} color={palette.accentInk} />
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <AppText variant="meta" color={palette.overdue} style={styles.warn}>
              A task needs at least one assignee.
            </AppText>
          )}

          <View style={[styles.searchBox, { backgroundColor: palette.chipBg }]}>
            <Search size={16} color={palette.ink3} />
            <TextInput
              style={[styles.searchInput, { color: palette.ink1 }]}
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or email"
              placeholderTextColor={palette.ink3}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <ScrollView
            style={styles.results}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {query.trim() === '' ? (
              <AppText variant="meta" color={palette.ink3} style={styles.hint}>
                Start typing to find people to share this task with.
              </AppText>
            ) : results === undefined ? (
              <AppText variant="meta" color={palette.ink3} style={styles.hint}>
                Searching…
              </AppText>
            ) : results.length === 0 ? (
              <AppText variant="meta" color={palette.ink3} style={styles.hint}>
                No matches.
              </AppText>
            ) : (
              results.map((r, i) => {
                const active = selected.some((s) => s.userId === r.userId)
                const label = r.name.trim() || r.email
                return (
                  <Pressable
                    key={r.userId}
                    onPress={() =>
                      toggle({ userId: r.userId, name: label, email: r.email })
                    }
                    style={({ pressed }) => [
                      styles.resultRow,
                      i > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: palette.divider,
                      },
                      {
                        backgroundColor: pressed
                          ? palette.hover
                          : 'transparent',
                      },
                    ]}
                  >
                    <Avatar userId={r.userId} name={label} size={30} />
                    <View style={styles.personText}>
                      <AppText variant="label" numberOfLines={1}>
                        {label}
                        {r.isYou ? ' (You)' : ''}
                      </AppText>
                      <AppText
                        variant="meta"
                        color={palette.ink3}
                        numberOfLines={1}
                      >
                        {r.email}
                      </AppText>
                    </View>
                    {active ? <Check size={18} color={palette.accent} /> : null}
                  </Pressable>
                )
              })
            )}
          </ScrollView>

          <Pressable
            disabled={saving || selected.length === 0}
            onPress={apply}
            style={({ pressed }) => [
              styles.applyBtn,
              {
                backgroundColor: palette.accent,
                opacity:
                  saving || selected.length === 0 ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <AppText
              variant="label"
              color="#ffffff"
              style={{ fontFamily: Font.bold }}
            >
              {saving ? 'Saving…' : 'Save'}
            </AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: 12,
  },
  personText: {
    flex: 1,
    gap: 2,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
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
  chipRow: {
    gap: space.sm,
    paddingVertical: 2,
    paddingHorizontal: space.xs,
  },
  selChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: radius.pill,
  },
  warn: {
    paddingHorizontal: space.xs,
    paddingVertical: space.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    height: 44,
    marginTop: space.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Font.semibold,
  },
  results: {
    maxHeight: 280,
    marginTop: space.sm,
  },
  hint: {
    paddingVertical: space.lg,
    paddingHorizontal: space.xs,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 10,
    paddingHorizontal: space.xs,
  },
  applyBtn: {
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.md,
  },
})
