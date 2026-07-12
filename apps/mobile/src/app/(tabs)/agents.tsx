import { radius, space } from '@org/theme'
import { StyleSheet, View } from 'react-native'
import { Screen, ScreenHeader, ScreenLoading } from '@/components/screen'
import { AgentAvatar, AppText, Card } from '@/components/ui'
import { useAgentList } from '@/data/hooks'
import { useTheme } from '@/theme/theme-context'

export default function AgentsScreen() {
  const { palette } = useTheme()
  const agents = useAgentList()

  return (
    <Screen>
      <ScreenHeader
        title="Agents"
        meta={agents === undefined ? undefined : `${agents.length}`}
      />

      {agents === undefined ? (
        <ScreenLoading />
      ) : agents.length > 0 ? (
        <Card>
          {agents.map((agent, i) => (
            <View
              key={agent.id}
              style={[
                styles.row,
                i > 0 && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: palette.divider,
                },
              ]}
            >
              <AgentAvatar color={agent.color} initial={agent.name[0] ?? '?'} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.nameRow}>
                  <AppText variant="body">{agent.name}</AppText>
                  <View
                    style={[
                      styles.roleChip,
                      { backgroundColor: palette.chipBg },
                    ]}
                  >
                    <AppText variant="meta" color={palette.ink2}>
                      {agent.model}
                    </AppText>
                  </View>
                </View>
                <AppText variant="meta" color={palette.ink3} numberOfLines={1}>
                  {agent.statusLine}
                </AppText>
              </View>
            </View>
          ))}
        </Card>
      ) : (
        <Card style={{ padding: space.xl }}>
          <AppText variant="label" color={palette.ink3}>
            No agents yet — hire your first one in the web app's village.
          </AppText>
        </Card>
      )}

      <Card style={styles.teaser}>
        <AppText style={styles.teaserEmoji}>🏘️</AppText>
        <AppText variant="heading">The village lives on the web</AppText>
        <AppText
          variant="label"
          color={palette.ink2}
          style={{ textAlign: 'center' }}
        >
          Your agents wander a pixel village, each with its own house. Watch
          them work in the web app — the mobile village view is on the roadmap.
        </AppText>
      </Card>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  roleChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  teaser: {
    alignItems: 'center',
    padding: space.xxl,
    gap: space.sm,
  },
  teaserEmoji: {
    fontSize: 34,
  },
})
