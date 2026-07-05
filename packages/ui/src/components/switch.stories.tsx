import { Label } from '@org/ui/components/label'
import { Switch } from '@org/ui/components/switch'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Switch>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Checked: Story = {
  args: { defaultChecked: true },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const WithLabel: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Switch id="airplane" {...args} />
      <Label htmlFor="airplane">Airplane mode</Label>
    </div>
  ),
}
