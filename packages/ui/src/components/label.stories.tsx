import { Input } from '@org/ui/components/input'
import { Label } from '@org/ui/components/label'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
  args: {
    children: 'Display name',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 280, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Label>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithInput: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 8 }}>
      <Label htmlFor="name" {...args} />
      <Input id="name" placeholder="Ash Ketchum" />
    </div>
  ),
}
