import type { Meta, StoryObj } from '@storybook/react-vite';

import { SpeechBubble } from './speech-bubble';

const meta: Meta<typeof SpeechBubble> = {
  title: 'World/SpeechBubble',
  component: SpeechBubble,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};
export default meta;

type Story = StoryObj<typeof SpeechBubble>;

export const Exclaim: Story = {
  args: { children: '!' },
};

export const AllEmotes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      {['!', '?', '…', '♪', '♥'].map((emote) => (
        <SpeechBubble key={emote}>{emote}</SpeechBubble>
      ))}
    </div>
  ),
};
