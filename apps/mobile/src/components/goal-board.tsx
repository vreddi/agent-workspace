/**
 * Goal detail board pieces: a task card with stage-move and detach controls,
 * and the "add existing tasks" multi-select sheet. Board columns are a
 * projection of task.status, so moving a card between stages changes the
 * underlying task status (see convex/goals.ts moveTask).
 */
import type { Id } from '@convex/_generated/dataModel'
import { formatDue } from '@org/app-core'
import { radius, space } from '@org/theme'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { Check, MoreHorizontal } from 'lucide-react-native'
import { useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FooterButton } from '@/components/forms'
import { AppText } from '@/components/ui'
import { useAttachableTasks, type BoardStage } from '@/data/goals-data'
import type { Task } from '@/data/hooks'
import { useTheme } from '@/theme/theme-context'

const STAGES: { stage: BoardStage; label: string }[] = [
  { stage: 'inactive', label: 'To do' },
  { stage: 'active', label: 'In progress' },
  { stage: 'complete', label: 'Done' },
]

/** One task on the goal board: tap to open, ellipsis to move stage / detach. */
export function GoalBoardCard({
  task,
  stage,
  showDivider,
  onMove,
  onDetach,
}: {
  task: Task
  stage: BoardStage
  showDivider: boolean
  onMove: (stage: BoardStage) => void
  onDetach: () => void
}) {
  const { palette } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <View
        style={[
          styles.row,
          showDivider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.divider },
        ]}
      >
        <Pressable style={styles.rowMain} onPress={() => router.push(`/task/${task.id}`)}>
          <AppText style={styles.emoji}>{task.emoji ?? '•'}</AppText>
          <AppText
            variant="body"
            numberOfLines={1}
            color={task.done ? palette.ink3 : palette.ink1}
            style={[styles.title, task.done && styles.titleDone]}
          >
            {task.title}
          </AppText>
          {task.due != null && !task.done ? (
            <AppText variant="meta" color={palette.ink3}>
              {formatDue(task.due)}
            </AppText>
          ) : null}
        </Pressable>
        <Pressable
          hitSlop={8}
          onPress={() => setMenuOpen(true)}
          style={({ pressed }) => [styles.menuButton, pressed && { backgroundColor: palette.hover }]}
        >
          <MoreHorizontal size={18} color={palette.ink3} />
        </Pressable>
      </View>

      <ActionSheet
        open={menuOpen}
        title={task.title}
        onClose={() => setMenuOpen(false)}
        actions={[
          ...STAGES.filter((s) => s.stage !== stage).map((s) => ({
            label: `Move to ${s.label}`,
            onPress: () => onMove(s.stage),
          })),
          { label: 'Remove from goal', destructive: true, onPress: onDetach },
        ]}
      />
    </>
  )
}

interface SheetAction {
  label: string
  destructive?: boolean
  onPress: () => void
}

/** Minimal bottom action sheet (cross-platform; no native ActionSheetIOS). */
function ActionSheet({
  open,
  title,
  actions,
  onClose,
}: {
  open: boolean
  title: string
  actions: SheetAction[]
  onClose: () => void
}) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
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
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: palette.ink4 }]} />
          </View>
          <AppText variant="heading" numberOfLines={1} style={styles.sheetTitle}>
            {title}
          </AppText>
          {actions.map((action, index) => (
            <Pressable
              key={action.label}
              onPress={() => {
                onClose()
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                action.onPress()
              }}
              style={({ pressed }) => [
                styles.actionRow,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.divider },
                { backgroundColor: pressed ? palette.hover : 'transparent' },
              ]}
            >
              <AppText variant="body" color={action.destructive ? palette.overdue : palette.ink1}>
                {action.label}
              </AppText>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

/** Multi-select sheet of open/in-progress unattached tasks to add to a goal. */
export function AttachTasksSheet({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (taskIds: Id<'tasks'>[]) => void
}) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const tasks = useAttachableTasks()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const confirm = () => {
    onConfirm(Array.from(selected) as Id<'tasks'>[])
    setSelected(new Set())
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
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
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: palette.ink4 }]} />
          </View>
          <AppText variant="heading" style={styles.sheetTitle}>
            Add existing tasks
          </AppText>
          {tasks === undefined ? (
            <View style={styles.empty}>
              <AppText variant="label" color={palette.ink3}>
                Loading…
              </AppText>
            </View>
          ) : tasks.length === 0 ? (
            <View style={styles.empty}>
              <AppText variant="label" color={palette.ink3}>
                No unassigned tasks to add. Every open task is already on a goal.
              </AppText>
            </View>
          ) : (
            <ScrollView style={styles.list} bounces={false}>
              {tasks.map((task, index) => {
                const active = selected.has(task.id)
                return (
                  <Pressable
                    key={task.id}
                    onPress={() => toggle(task.id)}
                    style={({ pressed }) => [
                      styles.pickRow,
                      index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.divider },
                      { backgroundColor: pressed ? palette.hover : 'transparent' },
                    ]}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        active
                          ? { backgroundColor: palette.accent, borderColor: palette.accent }
                          : { borderColor: palette.ink4 },
                      ]}
                    >
                      {active ? <Check size={14} color="#ffffff" strokeWidth={3} /> : null}
                    </View>
                    <AppText style={styles.emoji}>{task.emoji ?? '•'}</AppText>
                    <AppText variant="body" numberOfLines={1} style={styles.title}>
                      {task.title}
                    </AppText>
                  </Pressable>
                )
              })}
            </ScrollView>
          )}
          <View style={styles.sheetFooter}>
            <FooterButton
              label={selected.size === 0 ? 'Add tasks' : `Add ${selected.size} task${selected.size === 1 ? '' : 's'}`}
              onPress={confirm}
              disabled={selected.size === 0}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: space.sm,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 14,
    paddingLeft: space.lg,
  },
  emoji: {
    width: 22,
    textAlign: 'center',
    fontSize: 15,
  },
  title: {
    flex: 1,
  },
  titleDone: {
    textDecorationLine: 'line-through',
  },
  menuButton: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
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
  handleWrap: {
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
  },
  sheetTitle: {
    paddingHorizontal: space.xs,
    paddingBottom: space.sm,
  },
  actionRow: {
    paddingVertical: space.md,
    paddingHorizontal: space.xs,
  },
  list: {
    maxHeight: 340,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 12,
    paddingHorizontal: space.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    paddingVertical: space.xl,
    paddingHorizontal: space.xs,
  },
  sheetFooter: {
    paddingTop: space.md,
  },
})
