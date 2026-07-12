import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import {
  ACTION_CATEGORY,
  ALL_ACTIONS,
  SpriteActor,
  availableActions,
  type ActionName,
  type SpriteSheet,
} from '@worldkit/sprite-actor'
import {
  DudeMonsterSheet,
  OwletMonsterSheet,
  PinkMonsterSheet,
} from '@worldkit/sprite-actor/examples'

const SHEETS: Record<string, SpriteSheet> = {
  'Pink Monster': PinkMonsterSheet,
  'Owlet Monster': OwletMonsterSheet,
  'Dude Monster': DudeMonsterSheet,
}

const meta: Meta<typeof SpriteActor> = {
  title: 'World/SpriteActor',
  component: SpriteActor,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
}
export default meta

type Story = StoryObj<typeof SpriteActor>

/** Big interactive playground — pick any action from any category. */
export const Playground: Story = {
  args: {
    sheet: PinkMonsterSheet,
    action: 'idle',
    facing: 'right',
    scale: 4,
    paused: false,
  },
  argTypes: {
    sheet: {
      control: 'select',
      options: Object.keys(SHEETS),
      mapping: SHEETS,
    },
    action: {
      control: 'select',
      options: ALL_ACTIONS as unknown as ActionName[],
    },
    facing: { control: 'radio', options: ['right', 'left'] },
    scale: { control: { type: 'range', min: 1, max: 10, step: 1 } },
    fps: { control: { type: 'range', min: 1, max: 24, step: 1 } },
    paused: { control: 'boolean' },
    pixelated: { control: 'boolean' },
  },
}

/** Every action this character actually has, side-by-side. */
export const AllActions_PinkMonster: Story = {
  name: 'All Actions / Pink Monster',
  render: () => <ActionGrid sheet={PinkMonsterSheet} />,
}

export const AllActions_OwletMonster: Story = {
  name: 'All Actions / Owlet Monster',
  render: () => <ActionGrid sheet={OwletMonsterSheet} />,
}

export const AllActions_DudeMonster: Story = {
  name: 'All Actions / Dude Monster',
  render: () => <ActionGrid sheet={DudeMonsterSheet} />,
}

/** The three example characters playing the same action together. */
export const CharacterRoster: Story = {
  name: 'Character Roster',
  render: () => {
    const [action, setAction] = React.useState<ActionName>('idle')
    const supported = Array.from(
      new Set([
        ...availableActions(PinkMonsterSheet),
        ...availableActions(OwletMonsterSheet),
        ...availableActions(DudeMonsterSheet),
      ]),
    )
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={{ fontFamily: 'system-ui', fontSize: 14 }}>
          Action:&nbsp;
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as ActionName)}
          >
            {supported.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end' }}>
          {Object.values(SHEETS).map((sheet) => (
            <CharacterCard key={sheet.name} sheet={sheet} action={action} />
          ))}
        </div>
      </div>
    )
  },
}

/**
 * Demonstrates "blank" actions: a sparse sheet has only `idle` and `walk`.
 * Asking for `attack1`/`death`/etc. quietly falls back to the fallback action.
 */
export const SparseSheet: Story = {
  name: 'Sparse Sheet (blank-action fallback)',
  render: () => {
    const sparse: SpriteSheet = {
      name: 'Sparse Pink',
      frameWidth: PinkMonsterSheet.frameWidth,
      frameHeight: PinkMonsterSheet.frameHeight,
      fps: PinkMonsterSheet.fps,
      actions: {
        idle: PinkMonsterSheet.actions.idle,
        walk: PinkMonsterSheet.actions.walk,
      },
    }
    const tryActions: ActionName[] = [
      'idle',
      'walk',
      'attack1',
      'cast',
      'dance',
      'fish',
      'death',
    ]
    const [action, setAction] = React.useState<ActionName>('attack1')
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p
          style={{
            fontFamily: 'system-ui',
            fontSize: 13,
            color: '#555',
            maxWidth: 420,
          }}
        >
          This sheet only defines <code>idle</code> and <code>walk</code>.
          Asking for any other action falls back to <code>idle</code> — no
          crash, no missing texture. Watch the badge below the sprite.
        </p>
        <label style={{ fontFamily: 'system-ui', fontSize: 14 }}>
          Requested:&nbsp;
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as ActionName)}
          >
            {tryActions.map((a) => (
              <option key={a} value={a}>
                {a}
                {sparse.actions[a] ? '' : ' (blank → fallback)'}
              </option>
            ))}
          </select>
        </label>
        <SpriteActor sheet={sparse} action={action} scale={4} />
        <span style={{ fontFamily: 'system-ui', fontSize: 12, color: '#888' }}>
          {sparse.actions[action]
            ? `Playing ${action}`
            : `${action} is blank → playing idle`}
        </span>
      </div>
    )
  },
}

/** Catalog view: shows the full action union grouped by category. */
export const ActionCatalog: Story = {
  name: 'Action Catalog',
  render: () => {
    const grouped = React.useMemo(() => {
      const buckets: Record<string, ActionName[]> = {}
      for (const a of ALL_ACTIONS) {
        const cat = ACTION_CATEGORY[a]
        ;(buckets[cat] ??= []).push(a)
      }
      return buckets
    }, [])
    return (
      <div
        style={{
          display: 'grid',
          gap: 16,
          maxWidth: 520,
          fontFamily: 'system-ui',
        }}
      >
        <p style={{ fontSize: 13, color: '#555' }}>
          The component understands {ALL_ACTIONS.length} named actions out of
          the box. Provide a strip for any subset; the rest are blank.
        </p>
        {Object.entries(grouped).map(([cat, items]) => (
          <section key={cat}>
            <h4
              style={{
                margin: '0 0 4px',
                textTransform: 'capitalize',
                fontSize: 13,
              }}
            >
              {cat} ({items.length})
            </h4>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
                fontSize: 12,
              }}
            >
              {items.map((a) => (
                <code
                  key={a}
                  style={{
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: '#eee',
                  }}
                >
                  {a}
                </code>
              ))}
            </div>
          </section>
        ))}
      </div>
    )
  },
}

function ActionGrid({ sheet }: { sheet: SpriteSheet }) {
  const actions = availableActions(sheet)
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, auto)',
        gap: 24,
        fontFamily: 'system-ui',
        fontSize: 12,
      }}
    >
      {actions.map((a) => (
        <div
          key={a}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <SpriteActor sheet={sheet} action={a} scale={4} />
          <code>{a}</code>
        </div>
      ))}
    </div>
  )
}

function CharacterCard({
  sheet,
  action,
}: {
  sheet: SpriteSheet
  action: ActionName
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'system-ui',
        fontSize: 12,
      }}
    >
      <SpriteActor sheet={sheet} action={action} scale={4} />
      <strong>{sheet.name}</strong>
    </div>
  )
}
