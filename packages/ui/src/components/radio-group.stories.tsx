import { Label } from '@org/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@org/ui/components/radio-group'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 280, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RadioGroup>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="light">
      {(['light', 'dark', 'system'] as const).map((value) => (
        <div key={value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RadioGroupItem id={`theme-${value}`} value={value} />
          <Label htmlFor={`theme-${value}`} style={{ textTransform: 'capitalize' }}>
            {value}
          </Label>
        </div>
      ))}
    </RadioGroup>
  ),
}
