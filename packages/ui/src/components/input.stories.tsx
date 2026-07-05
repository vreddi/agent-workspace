import { Input } from '@org/ui/components/input'
import { Label } from '@org/ui/components/label'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number'],
    },
  },
  args: {
    placeholder: 'Type something…',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 280, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Password: Story = {
  args: { type: 'password', placeholder: '••••••••' },
}

export const Disabled: Story = {
  args: { disabled: true, value: 'Read only' },
}

export const WithLabel: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 8 }}>
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" {...args} />
    </div>
  ),
}
