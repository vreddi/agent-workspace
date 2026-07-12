import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { PinkMonsterSheet } from '@worldkit/sprite-actor/examples'
import { DialogueBox } from './dialogue-box'

const meta: Meta<typeof DialogueBox> = {
  title: 'World/DialogueBox',
  component: DialogueBox,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof DialogueBox>

export const WithSpeaker: Story = {
  args: {
    speaker: 'Poppy',
    portrait: PinkMonsterSheet.portrait,
    text: "Hi hi! I'm POPPY! I keep every task in tidy little piles...",
    speed: 45,
  },
}

export const Narration: Story = {
  args: {
    text: 'The village is quiet today. A gentle breeze rolls off the pond.',
    speed: 45,
  },
}

/** Multi-line conversation: click the box (or press Enter) to advance. */
export const Conversation: Story = {
  render: () => {
    const lines = [
      'Hoo... a well-planned day starts the night before, you know.',
      'I reviewed your calendar while you slept. Strictly professional.',
      'Deadlines are just birds that have not landed yet. I watch them.',
    ]
    const [index, setIndex] = React.useState(0)
    return (
      <DialogueBox
        speaker="Hoot"
        text={lines[index % lines.length]!}
        onAdvance={() => setIndex((value) => value + 1)}
      />
    )
  },
}
