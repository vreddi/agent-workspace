import { Separator } from '@org/ui/components/separator'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 280, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Separator>

export default meta

type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <div className="text-sm">
      <div>Profile</div>
      <Separator className="my-3" />
      <div>Account</div>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div style={{ display: 'flex', height: 20, alignItems: 'center', gap: 12 }} className="text-sm">
      <span>Docs</span>
      <Separator orientation="vertical" />
      <span>Source</span>
      <Separator orientation="vertical" />
      <span>About</span>
    </div>
  ),
}
