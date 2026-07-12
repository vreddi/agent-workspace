import { Checkbox } from '@org/ui/components/checkbox'
import { Label } from '@org/ui/components/label'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Checkbox>

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
      <Checkbox id="early" {...args} />
      <Label htmlFor="early">OK to finish before the target date</Label>
    </div>
  ),
}
